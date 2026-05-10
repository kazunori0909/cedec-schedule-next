/**
 * generate_json.ts
 *
 * web_data_original/{year}/ の HTMLを年度別フォーマットで解析し、
 * next-app/public/web_data/{year}/schedule.json に共通フォーマット JSON を出力する。
 *
 * 使用方法:
 *   npm run generate:json          # 全年度処理
 *   npm run generate:json 2025     # 指定年度のみ
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import * as cheerio from "cheerio";
import { abbreviateCompany, isEventOver, normalizeWhitespace } from "./lib/helpers";
import { fetchLiveSessions } from "./lib/live";
import { customHtmlPath, dayHtmlPath, liveHtmlPath, outputDir } from "./lib/paths";
import type { RawSession } from "./lib/session";
import { buildYoutubeMap, findYoutubeUrl } from "./lib/youtube";
import { parseFormat2020 } from "./parsers/format_2020";
import { parseFormat2023 } from "./parsers/format_2023";
import { parseFormat2024 } from "./parsers/format_2024";
import { parseFormat2025 } from "./parsers/format_2025";

type FormatName = "format_2020" | "format_2023" | "format_2024" | "format_2025";

interface YearConfig {
  first_date: string;
  domain: string;
  format: FormatName;
  split_files?: boolean;
  live?: string;
}

const YEAR_CONFIGS: Record<string, YearConfig> = {
  "2020": { first_date: "0902", domain: "https://cedec.cesa.or.jp/2020/", format: "format_2020" },
  "2021": { first_date: "0824", domain: "https://cedec.cesa.or.jp/2021/", format: "format_2020" },
  "2022": { first_date: "0823", domain: "https://cedec.cesa.or.jp/2022/", format: "format_2020" },
  "2023": { first_date: "0823", domain: "https://cedec.cesa.or.jp/2023/", format: "format_2023" },
  "2024": { first_date: "0821", domain: "https://cedec.cesa.or.jp/2024/", format: "format_2024" },
  "2025": {
    first_date: "0722",
    domain: "https://cedec.cesa.or.jp/2025/",
    format: "format_2025",
    split_files: true,
    live: "https://cedec.cesa.or.jp/2025/timetable/free_lives/",
  },
};

function loadHtml(path: string): cheerio.CheerioAPI {
  const html = readFileSync(path, "utf8");
  return cheerio.load(html);
}

function parseByFormat($: cheerio.CheerioAPI, format: FormatName, day?: number): RawSession[] {
  switch (format) {
    case "format_2020":
      return parseFormat2020($);
    case "format_2023":
      return parseFormat2023($);
    case "format_2024":
      return parseFormat2024($);
    case "format_2025":
      return parseFormat2025($, day);
  }
}

/** データ取得後・保存前に全セッションへ適用する加工処理 */
function postprocessSessions(
  sessions: RawSession[],
  liveMap: Map<string, string>,
  youtubeMap: Map<string, string>,
  eventOver: boolean
): RawSession[] {
  for (const s of sessions) {
    s.title = normalizeWhitespace(s.title);
    for (const sp of s.speakers) {
      // 「\n     」のような、不要な文字列が混入することがあるので、削除
      sp.name = normalizeWhitespace(sp.name.replace(/　/g, " "));
      // 会社名が長くなるので略語対応
      sp.company = abbreviateCompany(sp.company);
    }

    let live: string | null = liveMap.get(s.session_id) ?? null;
    let youtube: string | null = findYoutubeUrl(s.title, youtubeMap);

    if (eventOver && live !== null) {
      if (youtube === null) {
        // 基調講演・CEDEC Awards等はYouTubeへ再投稿されないため live URL を永続化する
        // 通常セッションはYouTube動画がない場合、live URLを破棄する
        const isArchiveSession =
          s.category === "基調講演" || s.title.toUpperCase().includes("CEDEC AWARDS");
        if (isArchiveSession) {
          youtube = live;
        }
      }
      // 会期後はliveパラメータを削除
      live = null;
    }

    s.live = live;
    s.youtube = youtube;
  }
  return sessions;
}

function generateJson(year: string, config: YearConfig, sessions: RawSession[]): string {
  // PHP の `'year' => $year` は数値変換されてJSONに出るため、ここでも数値化する
  const data = {
    year: parseInt(year, 10),
    first_date: config.first_date,
    domain: config.domain,
    generated: new Date().toISOString(),
    sessions: sessions
      .filter((s) => s.title !== "")
      .map((s) => {
        const subCategory = s.sub_category
          .split(",")
          .map((x) => x.trim())
          .filter((x) => x !== "");

        const entry: Record<string, unknown> = {
          id: s.session_id,
          day: String(s.day),
          room: s.room_no,
          start: s.start,
          end: s.end,
          category: s.category,
          data_filter: s.data_filter,
          title: s.title,
          speakers: s.speakers,
          detail_url: s.detail_url,
        };
        if (subCategory.length > 0) entry.sub_category = subCategory;
        if (s.cancelled) entry.cancelled = true;
        if (s.live !== null && s.live !== undefined) entry.live = s.live;
        if (s.youtube !== null && s.youtube !== undefined) entry.youtube = s.youtube;
        return entry;
      }),
  };

  return JSON.stringify(data, null, 4);
}

async function processYear(year: string, config: YearConfig): Promise<void> {
  console.log(`[INFO] ${year} 処理開始 (format=${config.format})`);

  let sessions: RawSession[] = [];

  if (config.split_files) {
    for (let day = 1; day <= 3; day++) {
      const path = dayHtmlPath(year, day);
      if (!existsSync(path)) {
        console.log(`[SKIP] ${year} Day${day}: ${path} が見つかりません`);
        continue;
      }
      const $ = loadHtml(path);
      sessions = sessions.concat(parseByFormat($, config.format, day));
    }
  } else {
    const path = customHtmlPath(year);
    if (!existsSync(path)) {
      console.log(`[SKIP] ${year}: ${path} が見つかりません`);
      return;
    }
    const $ = loadHtml(path);
    sessions = parseByFormat($, config.format);
  }

  let liveMap = new Map<string, string>();
  if (config.live) {
    liveMap = await fetchLiveSessions(config.live, config.first_date, liveHtmlPath(year));
    console.log(`[INFO] LIVE配信URL: ${liveMap.size} 件取得`);
  }

  const youtubeMap = buildYoutubeMap(year);
  const eventOver = isEventOver(parseInt(year, 10), config.first_date);
  if (eventOver) console.log("[INFO] 会期終了後モード: liveパラメータを処理します");

  const processed = postprocessSessions(sessions, liveMap, youtubeMap, eventOver);
  const jsonContent = generateJson(year, config, processed);

  const dir = outputDir(year);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const outputPath = `${dir}/schedule.json`;
  if (!existsSync(dirname(outputPath))) mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, jsonContent);
  // 出力件数は title が空でないものをカウント（PHPと一致）
  const writtenCount = processed.filter((s) => s.title !== "").length;
  console.log(`[OK]   ${outputPath} に ${writtenCount} 件を出力`);
}

async function main(): Promise<void> {
  const target = process.argv[2];
  let configs = YEAR_CONFIGS;
  if (target) {
    if (!YEAR_CONFIGS[target]) {
      console.error(`[ERROR] 年度 '${target}' は未定義です`);
      process.exit(1);
    }
    configs = { [target]: YEAR_CONFIGS[target] };
  }

  for (const [year, config] of Object.entries(configs)) {
    await processYear(year, config);
  }
}

main().catch((err) => {
  console.error("[ERROR]", err);
  process.exit(1);
});
