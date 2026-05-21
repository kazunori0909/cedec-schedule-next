import type { CheerioAPI } from "cheerio";
import { buildSession, type RawSession } from "../lib/session";
import { roomNoFromText, txt } from "../lib/helpers";

/**
 * 2025 フォーマット
 *
 * HTML 構造:
 *   div#Day{N}.c-timetable__list
 *     div.c-timetable__list__group[id="t{YYYY}{MM}{DD}{HHMM}"]
 *       a.c-timetable__list__session[href]
 *         .c-timetable__list__session__room    "第1会場"
 *         .c-timetable__list__session__type    "主催者" (分野なし時のみ)
 *         .c-timetable__list__session__format  "レギュラーセッション"
 *         .c-timetable__list__session__time    "60分"
 *         .c-timetable__list__session__categories > li  "ENG", "PRD" など (複数可)
 *         .c-timetable__list__session__title
 *         .c-timetable__list__session__speakers li > span + small
 */

const EXCLUDE_CATEGORIES = ["事前収録講演"];
// 汎用フォーマット名はフィルター用カテゴリとして意味がないため除外する
const GENERIC_FORMATS = [
  "レギュラーセッション",
  "ショートセッション",
  "ライトニングトーク",
  "CEDEC AWARDS",
  "主催者挨拶",
  "事前収録講演",
];

/** $day が指定された場合はそのファイルが単一日のHTMLとみなし Day{N} ラッパーなしで解析する */
export function parseFormat2025($: CheerioAPI, day?: number): RawSession[] {
  const sessions: RawSession[] = [];
  const dayRange = day !== undefined ? [day] : [1, 2, 3];

  for (const d of dayRange) {
    const groupSelector =
      day !== undefined ? ".c-timetable__list__group" : `#Day${d} .c-timetable__list__group`;

    $(groupSelector).each((_, group) => {
      const groupId = $(group).attr("id") ?? "";
      const timeStr = groupId.slice(-4);
      const start = timeStr.length === 4 ? `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}` : "";

      $(group)
        .find("a.c-timetable__list__session")
        .each((_, sesEl) => {
          const $ses = $(sesEl);
          const roomNo = roomNoFromText(
            txt($ses.find(".c-timetable__list__session__room").first())
          );
          const title = txt($ses.find(".c-timetable__list__session__title").first());

          // 分野リスト (ENG/VA等) を __categories__item から取得
          const catTexts: string[] = [];
          $ses.find(".c-timetable__list__session__categories__item").each((_, cn) => {
            const t = txt($(cn));
            if (t !== "" && !EXCLUDE_CATEGORIES.includes(t)) catTexts.push(t);
          });
          let category = catTexts[0] ?? "";
          const subCategory = catTexts.slice(1).join(",");

          // 分野なし (主催者挨拶・基調講演等): __format 優先、なければ __type にフォールバック
          // (__type は "YouTube配信あり" 等の配信インジケーターにも使われるため後回し)
          if (category === "") {
            const format = txt($ses.find(".c-timetable__list__session__format").first());
            const type = txt($ses.find(".c-timetable__list__session__type").first());
            if (!GENERIC_FORMATS.includes(format)) {
              category = format !== "" ? format : type;
            }
          }

          // 所要時間から終了時刻を計算
          const durText = txt($ses.find(".c-timetable__list__session__time").first());
          const dm = durText.match(/(\d+)/);
          const durMin = dm ? parseInt(dm[1], 10) : 0;
          let end = "";
          if (durMin > 0 && start !== "") {
            const sMin = parseInt(start.slice(0, 2), 10) * 60 + parseInt(start.slice(3, 5), 10);
            const eMin = sMin + durMin;
            end = `${String(Math.floor(eMin / 60)).padStart(2, "0")}:${String(eMin % 60).padStart(2, "0")}`;
          }

          const speakers: Array<{ name: string; company: string }> = [];
          $ses.find(".c-timetable__list__session__speakers li").each((_, li) => {
            const name = txt($(li).find("span").first());
            const company = txt($(li).find("small").first()).replace(/^\s*\/\s*/, "");
            if (name !== "") speakers.push({ name, company });
          });

          const detailUrl = $ses.attr("href") ?? "";
          const idMatch = detailUrl.replace(/\/$/, "").match(/\/([^/]+)\/?$/);
          const sessionId = idMatch ? idMatch[1] : "";

          const cancelled = $ses.find(".c-timetable__list__session__type.--cancel").length > 0;
          const finalTitle = cancelled ? `【講演キャンセル】${title}` : title;

          sessions.push(
            buildSession({
              session_id: sessionId,
              day: d,
              room_no: roomNo,
              start,
              end,
              category,
              sub_category: subCategory,
              data_filter: "",
              title: finalTitle,
              speakers,
              detail_url: detailUrl,
              cancelled,
            })
          );
        });
    });
  }

  return sessions;
}
