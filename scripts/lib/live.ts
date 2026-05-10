import { existsSync, readFileSync, writeFileSync } from "node:fs";
import * as cheerio from "cheerio";
import { dayIndexFromDate, roomNoFromText } from "./helpers";

/**
 * LIVEページを取得し、session_id => YouTube URL のマッピングを返す。
 *
 * ページ構造:
 *   .p-session__time-item  日付ブロック（YouTube URL一覧）
 *     .p-session__time-title  "7月22日（火）"
 *     .p-session__time-body   会場名 + <a href="youtube URL">
 *   .c-guide-card__link  セッションカード
 *     .c-session__date    "7/22"
 *     .c-session__venue   "第1会場"
 */
export async function fetchLiveSessions(
  liveUrl: string,
  firstDate: string,
  cachePath: string
): Promise<Map<string, string>> {
  let html: string;
  if (existsSync(cachePath)) {
    console.log(`[INFO] LIVEページをキャッシュから読み込みます: ${cachePath}`);
    html = readFileSync(cachePath, "utf8");
  } else {
    console.log(`[INFO] LIVEページをフェッチします: ${liveUrl}`);
    const res = await fetch(liveUrl);
    if (!res.ok) {
      console.warn(`[WARN] LIVEページの取得に失敗しました: ${liveUrl}`);
      return new Map();
    }
    html = await res.text();
    writeFileSync(cachePath, html);
    console.log(`[INFO] LIVEページを保存しました: ${cachePath}`);
  }

  const $ = cheerio.load(html);
  const firstMonth = parseInt(firstDate.slice(0, 2), 10);
  const firstDay = parseInt(firstDate.slice(2, 4), 10);

  // 1. {day_index}_{room_no} => YouTube URL のマッピングを構築
  const roomYoutube = new Map<string, string>();
  $(".p-session__time-item").each((_, item) => {
    const titleText = $(item).find(".p-session__time-title").first().text().trim();
    const dm = titleText.match(/(\d+)月(\d+)日/);
    if (!dm) return;
    const dayIndex = dayIndexFromDate(
      parseInt(dm[1], 10),
      parseInt(dm[2], 10),
      firstMonth,
      firstDay
    );

    $(item)
      .find(".p-session__time-body")
      .each((_, body) => {
        const roomText = $(body).find("span").first().text().trim();
        const roomNo = roomNoFromText(roomText);
        const link = $(body).find("a").first();
        const youtube = link.length > 0 ? (link.attr("href") ?? "") : "";
        if (roomNo !== "" && youtube !== "") {
          roomYoutube.set(`${dayIndex}_${roomNo}`, youtube);
        }
      });
  });

  // 2. セッションカードから session_id => YouTube URL を解決
  const result = new Map<string, string>();
  $("a.c-guide-card__link").each((_, card) => {
    const href = $(card).attr("href") ?? "";
    const m = href.match(/\/detail\/([^/]+)/);
    if (!m) return;
    const sessionId = m[1];

    const dateText = $(card).find(".c-session__date").first().text().trim();
    const venueText = $(card).find(".c-session__venue").first().text().trim();
    const dm = dateText.match(/(\d+)\/(\d+)/);
    if (!dm) return;
    const dayIndex = dayIndexFromDate(
      parseInt(dm[1], 10),
      parseInt(dm[2], 10),
      firstMonth,
      firstDay
    );
    const roomNo = roomNoFromText(venueText);

    const key = `${dayIndex}_${roomNo}`;
    const youtube = roomYoutube.get(key);
    if (youtube) {
      result.set(sessionId, youtube);
    }
  });

  return result;
}
