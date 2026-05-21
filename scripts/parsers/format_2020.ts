import type { CheerioAPI } from "cheerio";
import { buildSession, type RawSession } from "../lib/session";
import {
  isCancelled as titleIsCancelled,
  parseTimeRange,
  roomNoFromText,
  txt,
} from "../lib/helpers";
import { extractDetailUrlLegacy, extractSpeakersLegacy } from "../lib/legacy_extract";

/**
 * 2020 / 2021 / 2022 フォーマット
 *
 * HTML 構造:
 *   #day{N}
 *     .hide-desktop
 *       div.session-post[data-toggle="modal"][data-target="#mobileModal-NNN"]
 *         .session-time   "09:25-10:45 /80分"
 *         b.fo-fa-initial タイトル
 *         .session-meta
 *           .btn-top-session.cate-type          主分野 (ENG/VA等)
 *           .btn-top-session.cate-type.ses-subcategory  関連分野
 *         .session-speakers > ul > li > .name > b / .prof > p
 *       div#mobileModal-NNN (モーダル)
 *         .btn-top-session.ses-type  セッション種別 (公募/招待等)
 */

const EXCLUDED_SESSION_TYPES = ["公募", "招待"];

export function parseFormat2020($: CheerioAPI): RawSession[] {
  const sessions: RawSession[] = [];

  for (let day = 1; day <= 3; day++) {
    $(`#day${day} div.session-post[data-toggle='modal']`).each((_, el) => {
      const $el = $(el);
      const dataTarget = $el.attr("data-target") ?? "";
      if (dataTarget === "") return;

      const modalId = dataTarget.replace(/^#/, "");
      const sessionId = modalId.replace(/[^0-9]/g, "");
      const $modal = $(`#${modalId}`);
      if ($modal.length === 0) return;

      const roomNo = roomNoFromText($el.attr("data-room") ?? "");
      const [start, end] = parseTimeRange(txt($el.find(".session-time").first()));
      let title = txt($el.find("b.fo-fa-initial").first());
      if (title === "") {
        title = txt($el.find(".session-title b").first());
      }
      const dataFilter = $el.attr("data-filter") ?? "";

      // session-post 内の cate-type から分野を取得
      // (2020 モーダルは「主分野:」テキストが混入するため $el を使用)
      let category = txt($el.find(".btn-top-session.cate-type").not(".ses-subcategory").first());
      const subCategory = txt($el.find(".btn-top-session.cate-type.ses-subcategory").first());

      // 分野なし (基調講演等) は ses-type にフォールバック（セッション種別は除外）
      if (category === "") {
        const sesType = txt($modal.find(".btn-top-session.ses-type").first());
        if (!EXCLUDED_SESSION_TYPES.includes(sesType)) category = sesType;
      }

      let speakers = extractSpeakersLegacy($, $el);
      if (speakers.length === 0) speakers = extractSpeakersLegacy($, $modal);
      const detailUrl = extractDetailUrlLegacy($, $modal);

      const cancelled = titleIsCancelled(title);

      sessions.push(
        buildSession({
          session_id: sessionId,
          day,
          room_no: roomNo,
          start,
          end,
          category,
          sub_category: subCategory,
          data_filter: dataFilter,
          title,
          speakers,
          detail_url: detailUrl,
          cancelled,
        })
      );
    });
  }

  return sessions;
}
