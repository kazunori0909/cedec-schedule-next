import type { CheerioAPI } from "cheerio";
import type { Speaker } from "../../src/types/schedule";
import { buildSession, type RawSession } from "../lib/session";
import { isCancelled as titleIsCancelled } from "../lib/helpers";

/**
 * 2016/2017 フォーマット
 *
 * HTML 構造（1日分のファイルが渡される）:
 *   div.schedule_timeframe_normal
 *     table.schedule_table_in
 *       td
 *         .ss_time_start / .ss_time_end     開始・終了時刻
 *         .room_number                      部屋番号
 *         .ss_ippr_icon + img[alt]          カテゴリー画像（alt がカテゴリコード）
 *         .ss_title > a[href]               タイトル・詳細URL
 *         .ss_presenter_name / .ss_presenter_company  スピーカー
 *
 * URL解決:
 *   "http" から始まる → そのまま
 *   "../" から始まる  → domain + href.replace("../", year + "/")
 *   "/" から始まる    → domain（末尾/除去）+ href
 */

// 画像の alt 属性値 → カテゴリコードのマッピング
const CAT_ALT_MAP: Record<string, string> = {
  ENG: "ENG",
  VA: "VA",
  PRD: "PRD",
  BP: "BP",
  SND: "SND",
  GD: "GD",
  AC: "AC",
  エンジニアリング: "ENG",
  ビジュアルアーツ: "VA",
  プロデュース: "PRD",
  "ビジネス＆プロデュース": "BP",
  "ビジネス&プロデュース": "BP",
  サウンド: "SND",
  ゲームデザイン: "GD",
  アカデミック: "AC",
  基調講演: "基調講演",
};

function resolveAbsoluteUrl(href: string, domain: string, year: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  if (href.startsWith("../")) {
    // "../path" → domain + year/path（参照元の1階層上がドメインルート）
    return domain + href.replace("../", `${year}/`);
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

  $("div.schedule_timeframe_normal").each((_, el) => {
    const $el = $(el);

    const start = $el.find(".ss_time_start").first().text().trim();
    const end = $el.find(".ss_time_end").first().text().trim();
    if (!start || !end) return;

    const roomNo = $el.find(".room_number").first().text().trim();

    const catAlt = $el.find(".ss_ippr_icon + img").first().attr("alt") ?? "";
    const category = CAT_ALT_MAP[catAlt] ?? "";

    const $titleLink = $el.find(".ss_title a").first();
    const title =
      $titleLink.length > 0
        ? $titleLink.text().trim()
        : $el.find(".ss_title").first().text().trim();

    const rawHref = $titleLink.attr("href") ?? "";
    const sessionId = rawHref ? extractSessionId(rawHref) : "";
    const detailUrl = resolveAbsoluteUrl(rawHref, domain, year);

    const speakers: Speaker[] = [];
    $el.find(".ss_presenter_name").each((i, nameEl) => {
      const name = $(nameEl).text().trim();
      const company = $(nameEl).parent().find(".ss_presenter_company").first().text().trim();
      if (name) speakers.push({ name, company });
    });

    const cancelled = titleIsCancelled(title);
    if (title === "") return;

    sessions.push(
      buildSession({
        session_id: sessionId,
        day,
        room_no: roomNo,
        start,
        end,
        category,
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
