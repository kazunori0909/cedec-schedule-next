import type { CheerioAPI, Cheerio } from "cheerio";
import type { AnyNode, Element } from "domhandler";
import { buildSession, type RawSession } from "../lib/session";
import { roomNoFromText } from "../lib/helpers";

/**
 * 2024 フォーマット
 *
 * HTML 構造:
 *   div[id^="Day{N}Area"]
 *     div.c-timetable__venue  "第1会場"
 *     div.c-timetable__item[data-id][data-uuid][data-category ...]
 *       a[href]
 *       div.timetable-time > time  "11:10-12:10"
 *       div.timetable-category > span  "ENG"
 *       div.timetable-title
 *       div.timetable-speakers > div.speakers-item
 */

const EXCLUDE_CATEGORIES_2024 = ["事前収録", "事前収録講演"];

const FILTER_ATTR_MAP: Array<[string, string]> = [
  ["data-category", "cat"],
  ["data-subcategory", "subcat"],
  ["data-format", "format"],
  ["data-difficulty", "difficulty"],
  ["data-sessiontype", "type"],
  ["data-platforms", "platform"],
  ["data-keywords", "keywords"],
];

const txt = ($el: Cheerio<AnyNode>): string => $el.text().trim();

/** 2024 の data-* 属性を "cat_1,format_2,difficulty_1" 形式に変換 */
function buildDataFilter2024(item: Element): string {
  const parts: string[] = [];
  for (const [attr, key] of FILTER_ATTR_MAP) {
    const v = item.attribs?.[attr] ?? "";
    if (v !== "") parts.push(`${key}_${v}`);
  }
  return parts.join(",");
}

export function parseFormat2024($: CheerioAPI): RawSession[] {
  const sessions: RawSession[] = [];

  for (let day = 1; day <= 3; day++) {
    $(`div[id^='Day${day}Area']`).each((_, area) => {
      const $area = $(area);
      const $venue = $area.find(".c-timetable__venue").first();
      let roomRaw = $venue.length > 0 ? txt($venue) : "";
      if (roomRaw === "") {
        const firstChild = $area.children().first();
        roomRaw = firstChild.length > 0 ? txt(firstChild) : "";
      }
      const roomNo = roomNoFromText(roomRaw);

      $area.find(".c-timetable__item").each((_, item) => {
        const $item = $(item);
        const sessionId = $item.attr("data-uuid") || $item.attr("data-id") || "";
        const dataFilter = buildDataFilter2024(item);

        const timeText = txt($item.find("div.timetable-time time").first());
        let start = "";
        let end = "";
        if (timeText !== "") {
          const parts = timeText.split("-", 2);
          start = (parts[0] ?? "").trim();
          end = (parts[1] ?? "").trim();
        }

        let category = txt($item.find("div.timetable-category span").first());
        if (EXCLUDE_CATEGORIES_2024.includes(category)) category = "";
        const title = txt($item.find(".timetable-title").first());

        const speakers: Array<{ name: string; company: string }> = [];
        $item.find(".speakers-item").each((_, spEl) => {
          const name = txt($(spEl).find(".speakers-name").first());
          const company = txt($(spEl).find(".speakers-company").first());
          if (name !== "") speakers.push({ name, company });
        });

        const $link = $item.children("a").first();
        const detailUrl = $link.length > 0 ? ($link.attr("href") ?? "") : "";

        sessions.push(
          buildSession({
            session_id: sessionId,
            day,
            room_no: roomNo,
            start,
            end,
            category,
            sub_category: "",
            data_filter: dataFilter,
            title,
            speakers,
            detail_url: detailUrl,
          })
        );
      });
    });
  }

  return sessions;
}
