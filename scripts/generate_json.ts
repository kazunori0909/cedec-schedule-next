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
import { allHtmlPath, dayHtmlPath, liveHtmlPath, outputDir } from "./lib/paths";
import type { RawSession } from "./lib/session";
import { buildYoutubeMap, findYoutubeUrl } from "./lib/youtube";
import { parseFormat2018 } from "./parsers/format_2018";
import { parseFormat2019 } from "./parsers/format_2019";
import { parseFormat2020 } from "./parsers/format_2020";
import { parseFormat2023 } from "./parsers/format_2023";
import { parseFormat2024 } from "./parsers/format_2024";
import { parseFormat2025Json } from "./parsers/format_2025_json";
import { parseFormatBefore2017 } from "./parsers/format_before2017";
import { loadTimetableSource } from "./lib/timetable_source";
import { getDomain, findYearSetting } from "../src/lib/cedec";

type FormatName =
  | "format_before2017"
  | "format_2018"
  | "format_2019"
  | "format_2020"
  | "format_2023"
  | "format_2024";

interface YearConfig {
  // format を指定した年度は旧 HTML 方式（描画済みHTMLを cheerio で解析）。
  // 省略した年度は JSON 方式（公式 session/timetable.json 直読み・2025〜 の標準）。
  format?: FormatName;
  split_files?: boolean;
  live?: string;
}

interface ParseContext {
  day?: number;
  year: string;
}

// JSON 方式（format 省略）を標準とし、format を持つ年度のみ旧 HTML 方式で処理する。
// live など毎年変わりうる設定は JSON 方式の年度でも引き続きここで指定する。
// prettier-ignore
const YEAR_CONFIGS: Record<string, YearConfig> = {
  "2026": {}, // JSON方式（live URL公開後は { live: "timetable/free_lives/" } を追記）
  "2025": { live: "timetable/free_lives/" }, // JSON方式（Epic部屋の表示は SCHEDULE_SETTING.room_overrides で対応）
  "2024": { format: "format_2024" },
  "2023": { format: "format_2023" },
  "2022": { format: "format_2020" },
  "2021": { format: "format_2020" },
  "2020": { format: "format_2020" },
  "2019": { format: "format_2019" },
  "2018": { format: "format_2018" },
  "2017": { format: "format_before2017", split_files: true },
  "2016": { format: "format_before2017", split_files: true },
  "2015": { format: "format_before2017", split_files: true },
  "2014": { format: "format_before2017", split_files: true },
  "2013": { format: "format_before2017", split_files: true },
  "2012": { format: "format_before2017", split_files: true },
  "2011": { format: "format_before2017", split_files: true },
};

function loadHtml(path: string): cheerio.CheerioAPI {
  const html = readFileSync(path, "utf8");
  return cheerio.load(html);
}

function parseByFormat($: cheerio.CheerioAPI, format: FormatName, ctx: ParseContext): RawSession[] {
  switch (format) {
    case "format_2024":
      return parseFormat2024($);
    case "format_2023":
      return parseFormat2023($);
    case "format_2020":
      return parseFormat2020($);
    case "format_2019":
      return parseFormat2019($);
    case "format_2018":
      return parseFormat2018($);
    case "format_before2017":
      return parseFormatBefore2017($, ctx.day ?? 1, ctx.year);
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

function generateJson(year: string, sessions: RawSession[], fetched?: string): string {
  const { first_date } = findYearSetting(year);
  // PHP の `'year' => $year` は数値変換されてJSONに出るため、ここでも数値化する
  const data: Record<string, unknown> = {
    year: parseInt(year, 10),
    first_date,
    generated: new Date().toISOString(),
    // JSON 方式の年度はデータ取得日時を記録する（フロントの「取得日時」表示に使用）
    ...(fetched ? { fetched } : {}),
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
          title: s.title,
          speakers: s.speakers,
          detail_url: s.detail_url,
        };
        if (subCategory.length > 0) entry.sub_category = subCategory;
        if (s.live !== null && s.live !== undefined) entry.live = s.live;
        if (s.youtube !== null && s.youtube !== undefined) entry.youtube = s.youtube;
        return entry;
      }),
  };

  return JSON.stringify(data);
}

async function processYear(year: string, config: YearConfig, fetchRemote: boolean): Promise<void> {
  const { first_date } = findYearSetting(year);

  let sessions: RawSession[] = [];
  let fetched: string | undefined;

  if (config.format === undefined) {
    // JSON 方式（標準）: 公式 session/timetable.json を直読みする
    console.log(`[INFO] ${year} 処理開始 (source=json)`);
    const source = await loadTimetableSource(year, fetchRemote);
    const { room_overrides } = findYearSetting(year);
    sessions = parseFormat2025Json(
      source.timetable,
      source.cancel,
      year,
      first_date,
      room_overrides
    );
    fetched = source.fetchedAt;
  } else if (config.split_files) {
    console.log(`[INFO] ${year} 処理開始 (format=${config.format})`);
    for (let day = 1; day <= 3; day++) {
      const path = dayHtmlPath(year, day);
      if (!existsSync(path)) {
        console.log(`[SKIP] ${year} Day${day}: ${path} が見つかりません`);
        continue;
      }
      const $ = loadHtml(path);
      sessions = sessions.concat(parseByFormat($, config.format, { day, year }));
    }
  } else {
    console.log(`[INFO] ${year} 処理開始 (format=${config.format})`);
    const path = allHtmlPath(year);
    if (!existsSync(path)) {
      console.log(`[SKIP] ${year}: ${path} が見つかりません`);
      return;
    }
    const $ = loadHtml(path);
    sessions = parseByFormat($, config.format, { year });
  }

  let liveMap = new Map<string, string>();
  if (config.live) {
    liveMap = await fetchLiveSessions(
      getDomain(year) + config.live,
      first_date,
      liveHtmlPath(year)
    );
    console.log(`[INFO] LIVE配信URL: ${liveMap.size} 件取得`);
  }

  const youtubeMap = buildYoutubeMap(year);
  const eventOver = isEventOver(parseInt(year, 10), first_date);
  if (eventOver) console.log("[INFO] 会期終了後モード: liveパラメータを処理します");

  const processed = postprocessSessions(sessions, liveMap, youtubeMap, eventOver);
  const jsonContent = generateJson(year, processed, fetched);

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
  const args = process.argv.slice(2);
  // --no-fetch: ネットワーク取得をスキップし web_data_original のキャッシュのみ使用（JSON方式）
  const fetchRemote = !args.includes("--no-fetch");
  const target = args.find((a) => !a.startsWith("--"));

  let configs = YEAR_CONFIGS;
  if (target) {
    if (!YEAR_CONFIGS[target]) {
      console.error(`[ERROR] 年度 '${target}' は未定義です`);
      process.exit(1);
    }
    configs = { [target]: YEAR_CONFIGS[target] };
  }

  for (const [year, config] of Object.entries(configs)) {
    await processYear(year, config, fetchRemote);
  }
}

main().catch((err) => {
  console.error("[ERROR]", err);
  process.exit(1);
});
