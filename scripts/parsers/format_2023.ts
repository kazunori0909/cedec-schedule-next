import type { CheerioAPI } from "cheerio";
import { buildSession, type RawSession } from "../lib/session";
import { parseTimeRange, roomNoFromText, txt } from "../lib/helpers";
import { extractDetailUrlLegacy, extractSpeakersLegacy } from "../lib/legacy_extract";

/**
 * 2023 フォーマット
 *
 * HTML 構造:
 *   #day{N}
 *     td.td-content
 *       div.session-post[data-id][data-room][data-filter]
 *         .session-time
 *         b.fo-fa-initial
 *         .session-meta
 *           .btn-top-session.cate-type          主分野 (ENG/VA等)
 *           .btn-top-session.cate-type.ses-subcategory  関連分野
 *         .session-speakers
 *       div[id^="exampleModal-"]
 *         .btn-top-session.ses-type  セッション種別 (公募/招待等)
 *         .ses-detail-link > a
 */

const EXCLUDED_SESSION_TYPES = ["公募", "招待"];

export function parseFormat2023($: CheerioAPI): RawSession[] {
  const sessions: RawSession[] = [];

  for (let day = 1; day <= 3; day++) {
    $(`#day${day} td.td-content`).each((_, td) => {
      const $td = $(td);
      const $sp = $td.find("div.session-post").first();
      if ($sp.length === 0) return;

      const sessionId = $sp.attr("data-id") ?? "";
      const roomNo = roomNoFromText($sp.attr("data-room") ?? "");
      const [start, end] = parseTimeRange(txt($sp.find(".session-time").first()));
      const title = txt($sp.find("b.fo-fa-initial").first());

      const $modal = $td.find('[id^="exampleModal-"]').first();

      // session-post 内の cate-type から分野を取得
      let category = txt($sp.find(".btn-top-session.cate-type").not(".ses-subcategory").first());
      const subCategory = txt($sp.find(".btn-top-session.cate-type.ses-subcategory").first());

      // 分野なし (基調講演等) は ses-type にフォールバック（セッション種別は除外）
      if (category === "") {
        const sesType =
          $modal.length > 0 ? txt($modal.find(".btn-top-session.ses-type").first()) : "";
        if (!EXCLUDED_SESSION_TYPES.includes(sesType)) category = sesType;
      }

      const speakers = extractSpeakersLegacy($, $sp);
      const detailUrl = $modal.length > 0 ? extractDetailUrlLegacy($, $modal) : "";

      sessions.push(
        buildSession({
          session_id: sessionId,
          day,
          room_no: roomNo,
          start,
          end,
          category,
          sub_category: subCategory,
          title,
          speakers,
          detail_url: detailUrl,
        })
      );
    });
  }

  return sessions;
}
