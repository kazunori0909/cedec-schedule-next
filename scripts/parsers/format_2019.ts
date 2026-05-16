import type { CheerioAPI, Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";
import type { Speaker } from "../../src/types/schedule";
import { buildSession, type RawSession } from "../lib/session";
import { isCancelled as titleIsCancelled } from "../lib/helpers";

/**
 * 2019 フォーマット
 *
 * HTML 構造:
 *   #taballsession
 *     div#day{N}                                  ← 日付区切り（空タグ）
 *     div.row.session-post.filtr-item[data-filter]
 *       .session-left > .session-time-frame       "9月N日(曜) HH:MM"
 *       .session-right
 *         .session-title > a[href="#collapse-NNN"]  タイトル
 *         #collapse-NNN.row.session-item
 *           ul.list-unstyled > li.media > .media-body
 *             .name                              スピーカー名
 *             .prof > p (first)                  所属
 *           .meta
 *             .btn-top-session.ses-type          セッション種別（公募/招待/基調講演等）
 *             .btn-top-session.{en|va|pd|bp|sd|gd|ab}  主分野
 *             .btn-top-session.ses-subcategory   関連分野
 *             .detail-session-meta-top           "□ 講演時間: HH:MM 〜 HH:MM"
 *             .ses-detail-link > a[href]         詳細URL（相対パス）
 *
 * ※ 部屋情報は HTML に存在しないため room_no は空文字
 */

// ボタンのクラス名 → カテゴリコードのマッピング
const CAT_CLASS_MAP: Record<string, string> = {
  en: "ENG",
  va: "VA",
  pd: "PRD",
  bp: "BP",
  sd: "SND",
  gd: "GD",
  ab: "AC",
};

function extractSpeakers($: CheerioAPI, $ctx: Cheerio<AnyNode>): Speaker[] {
  const speakers: Speaker[] = [];
  $ctx.find("li.media").each((_, li) => {
    const $li = $(li);
    const name = $li.find(".name").first().text().trim();
    const company = $li.find(".prof p").first().text().trim();
    if (name !== "") speakers.push({ name, company });
  });
  return speakers;
}

export function parseFormat2019($: CheerioAPI): RawSession[] {
  const sessions: RawSession[] = [];
  let currentDay = 1;

  $("#taballsession")
    .children()
    .each((_, el) => {
      const $el = $(el);
      const id = $el.attr("id");

      // 日付区切りマーカー（#day1 / #day2 / #day3）
      if (id && /^day\d$/.test(id)) {
        currentDay = parseInt(id[3], 10);
        return;
      }

      if (!$el.hasClass("session-post")) return;

      const collapseHref = $el
        .find(".session-title a[data-toggle='collapse']")
        .first()
        .attr("href");
      if (!collapseHref || !collapseHref.startsWith("#collapse-")) return;
      const sessionId = collapseHref.replace("#collapse-", "");

      const $collapse = $el.find(".session-item").first();
      const title = $el.find(".session-title a").first().text().trim();
      const dataFilter = $el.attr("data-filter") ?? "";

      // 講演時間を .detail-session-meta-top テキストから取得
      // "□ 講演時間: 09月04日(水) 09:45 〜 11:05" → ["09:45", "11:05"]
      const metaText = $collapse.find(".detail-session-meta-top").text();
      const timeMatch = metaText.match(/(\d{2}:\d{2})\s*〜\s*(\d{2}:\d{2})/);
      const start = timeMatch?.[1] ?? "";
      const end = timeMatch?.[2] ?? "";

      // 主分野・関連分野を .btn-top-session クラスから抽出
      let category = "";
      const subCategories: string[] = [];

      $collapse.find(".btn-top-session").each((_, btn) => {
        const classes = ($(btn).attr("class") ?? "").split(/\s+/);
        if (classes.includes("ses-subcategory")) {
          const catClass = classes.find((c) => c in CAT_CLASS_MAP);
          if (catClass) subCategories.push(CAT_CLASS_MAP[catClass]);
        } else if (category === "") {
          const catClass = classes.find((c) => c in CAT_CLASS_MAP);
          if (catClass) {
            category = CAT_CLASS_MAP[catClass];
          } else if (classes.includes("ses-type") && $(btn).text().trim() === "基調講演") {
            category = "基調講演";
          }
        }
      });

      const speakers = extractSpeakers($, $collapse);
      const detailUrl = $collapse.find(".ses-detail-link a").first().attr("href") ?? "";
      const cancelled = titleIsCancelled(title);

      sessions.push(
        buildSession({
          session_id: sessionId,
          day: currentDay,
          room_no: "",
          start,
          end,
          category,
          sub_category: subCategories.join(","),
          data_filter: dataFilter,
          title,
          speakers,
          detail_url: detailUrl,
          cancelled,
        })
      );
    });

  return sessions;
}
