import type { CheerioAPI, Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";
import type { Speaker } from "../../src/types/schedule";
import { buildSession, type RawSession } from "../lib/session";
import { CAT_CLASS_MAP } from "../lib/helpers";

/**
 * 2018 フォーマット
 *
 * HTML 構造（custom.html に全日程）:
 *   #taballday{N}
 *     div.session-post
 *       .session-title                    タイトル（プレーンテキスト、<a>なし）
 *       .session-item
 *         .detail-session-meta-top        "HH:MM 〜 HH:MM"
 *         .btn-top-session.{en|va|pd|bp|sd|gd|ab}  主分野
 *         .btn-top-session.ses-subcategory          関連分野
 *         .ses-detail-link > a[href]      詳細URL（ファイル名がセッションID）
 *       div.speaker_info                  スピーカー
 *         .name                           スピーカー名
 *         .prof > p                       所属
 */

function extractSessionIdFromHref(href: string): string {
  const clean = href.split("#")[0].replace(/\/$/, "");
  const parts = clean.split("/").filter(Boolean);
  const last = parts[parts.length - 1] ?? "";
  return last.replace(/\.[^.]+$/, "");
}

/** .speaker_info > .name / .prof p からスピーカー配列を返す */
function extractSpeakers($: CheerioAPI, ctx: Cheerio<AnyNode>): Speaker[] {
  const speakers: Speaker[] = [];
  ctx.find(".speaker_info").each((_, info) => {
    const name = $(info).find(".name").first().text().trim();
    const company = $(info).find(".prof p").first().text().trim();
    if (name !== "") speakers.push({ name, company });
  });
  return speakers;
}

export function parseFormat2018($: CheerioAPI): RawSession[] {
  const sessions: RawSession[] = [];

  for (let day = 1; day <= 3; day++) {
    $(`#taballday${day} > .session-post`).each((_, el) => {
      const $el = $(el);

      const title = $el.find(".session-title").first().text().trim();
      if (title === "") return;

      const $item = $el.find(".session-item").first();
      const metaText = $item.find(".detail-session-meta-top").text();
      const timeMatch = metaText.match(/(\d{2}:\d{2})\s*〜\s*(\d{2}:\d{2})/);
      const start = timeMatch?.[1] ?? "";
      const end = timeMatch?.[2] ?? "";
      if (!start || !end) return;

      const detailHref = $item.find(".ses-detail-link a").first().attr("href") ?? "";
      const sessionId = detailHref ? extractSessionIdFromHref(detailHref) : "";

      let category = "";
      const subCategories: string[] = [];
      $item.find(".btn-top-session").each((_, btn) => {
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

      const speakers = extractSpeakers($, $el);

      sessions.push(
        buildSession({
          session_id: sessionId,
          day,
          room_no: "",
          start,
          end,
          category,
          sub_category: subCategories.join(","),
          title,
          speakers,
          detail_url: detailHref,
        })
      );
    });
  }

  return sessions;
}
