import type { CheerioAPI } from "cheerio";
import type { Speaker } from "../../src/types/schedule";
import { buildSession, type RawSession } from "../lib/session";
import { isCancelled as titleIsCancelled } from "../lib/helpers";

/**
 * 2016/2017 フォーマット
 *
 * HTML 構造（1日分のファイルが渡される）:
 *   div.schedule_timeframe_normal
 *     ul.schedule_session_index
 *       li.schedule_session_li
 *         div.schedule_session ss_{CAT} [ss_{CAT2}_2] [ss_VR]
 *           table.ss
 *             th
 *               p.ss_time > span.ss_time_start / span.ss_time_end
 *               p.room_number
 *             td
 *               p.ss_spec      カテゴリ画像（主/副）
 *               p.ss_title > a[href]     タイトル・詳細URL
 *               p.schedule_speaker       スピーカー（複数ある場合も）
 *                 [span.ss_name]         名前（なければテキストノード）
 *                 span.schedule_speaker_organization  所属（（会社名）形式）
 *
 * カテゴリ: div.schedule_session のクラスから抽出
 *   ss_ENG/VA/PRD/BP/SND/GD/AC  → 対応カテゴリ
 *   ss_KN（2016）/ ss_（2017）  → 基調講演
 *   ss_{CAT}_2                  → サブカテゴリ
 *   ss_VR 等                    → 無視（カテゴリ外タグ）
 *
 * URL解決（../始まり）:
 *   2016: ../session/KN/xxx.html → domain + year/session/KN/xxx.html
 *   2017: ../KN/xxx.html        → domain + year/session/KN/xxx.html（session/ を補完）
 */

const CAT_CLASS_MAP: Record<string, string> = {
  ENG: "ENG",
  VA: "VA",
  PRD: "PRD",
  BP: "BP",
  SND: "SND",
  GD: "GD",
  AC: "AC",
  KN: "基調講演",
};

function extractCategories(classStr: string): { category: string; subCategories: string[] } {
  const classes = classStr.split(/\s+/);
  let category = "";
  const subCategories: string[] = [];

  for (const cls of classes) {
    // サブカテゴリ: ss_ENG_2, ss_PRD_2 等
    const subMatch = cls.match(/^ss_([A-Z]+)_2$/);
    if (subMatch) {
      const code = CAT_CLASS_MAP[subMatch[1]];
      if (code) subCategories.push(code);
      continue;
    }
    // 主カテゴリ: ss_ENG, ss_KN 等
    const priMatch = cls.match(/^ss_([A-Z]+)$/);
    if (priMatch && category === "") {
      const code = CAT_CLASS_MAP[priMatch[1]];
      if (code) category = code;
      continue;
    }
    // 2017年基調講演: ss_（サフィックスなし）
    if (cls === "ss_" && category === "") {
      category = "基調講演";
    }
  }

  return { category, subCategories };
}

function resolveAbsoluteUrl(href: string, domain: string, year: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  if (href.startsWith("../")) {
    const path = href.slice(3); // "../" を除去
    // 2016+: ../session/KN/xxx.html（session/ 含む）
    // 2011-2013: ../program/KN/xxx.html（program/ 含む）
    // 2017: ../KN/xxx.html（ディレクトリ名なし → session/ を補完）
    const hasKnownDir = path.startsWith("session/") || path.startsWith("program/");
    const prefix = hasKnownDir ? "" : "session/";
    return domain + year + "/" + prefix + path;
  }
  if (href.startsWith("/")) {
    return domain.replace(/\/$/, "") + href;
  }
  return domain + href;
}

function extractSessionId(href: string): string {
  const clean = href.split("#")[0].replace(/\/$/, "");
  const parts = clean.split("/").filter(Boolean);
  const last = parts[parts.length - 1] ?? "";
  return last.replace(/\.[^.]+$/, "");
}

export function parseFormatBefore2017(
  $: CheerioAPI,
  day: number,
  domain: string,
  year: string
): RawSession[] {
  const sessions: RawSession[] = [];

  $("div.schedule_session").each((_, el) => {
    const $el = $(el);
    const classStr = $el.attr("class") ?? "";

    const start = $el.find(".ss_time_start").first().text().trim();
    const end = $el.find(".ss_time_end").first().text().trim();
    if (!start || !end) return;

    const roomNo = $el.find(".room_number").first().text().trim();

    const { category, subCategories } = extractCategories(classStr);

    const $titleLink = $el.find(".ss_title a").first();
    const title =
      $titleLink.length > 0
        ? $titleLink.text().trim()
        : $el.find(".ss_title").first().text().trim();
    if (title === "") return;

    const rawHref = $titleLink.attr("href") ?? "";
    const sessionId = rawHref ? extractSessionId(rawHref) : "";
    const detailUrl = resolveAbsoluteUrl(rawHref, domain, year);

    const speakers: Speaker[] = [];
    $el.find("p.schedule_speaker").each((_, sp) => {
      const $sp = $(sp);
      // span.ss_name がある場合はそちら、なければテキストノード
      const ssName = $sp.find("span.ss_name").first().text().trim();
      const name = ssName || $sp.clone().children().remove().end().text().trim();
      // 所属は「（会社名）」形式なので括弧を除去
      const company = $sp
        .find("span.schedule_speaker_organization")
        .first()
        .text()
        .trim()
        .replace(/^（|）$/g, "");
      if (name) speakers.push({ name, company });
    });

    const cancelled = titleIsCancelled(title);

    sessions.push(
      buildSession({
        session_id: sessionId,
        day,
        room_no: roomNo,
        start,
        end,
        category,
        sub_category: subCategories.join(","),
        data_filter: "",
        title,
        speakers,
        detail_url: detailUrl,
        cancelled,
      })
    );
  });

  return sessions;
}
