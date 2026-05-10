import type { CheerioAPI, Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";
import type { Speaker } from "../../src/types/schedule";

/** 2020/2021/2022/2023 の .session-speakers からスピーカー配列を返す */
export function extractSpeakersLegacy($: CheerioAPI, ctx: Cheerio<AnyNode>): Speaker[] {
  const speakers: Speaker[] = [];
  ctx.find(".session-speakers li").each((_, li) => {
    const name = $(li).find(".name b").first().text().trim();
    const company = $(li).find(".prof p").first().text().trim();
    if (name !== "") speakers.push({ name, company });
  });
  return speakers;
}

/** 2020/2021/2022/2023 の .ses-detail-link から詳細URL を返す */
export function extractDetailUrlLegacy($: CheerioAPI, ctx: Cheerio<AnyNode>): string {
  const link = ctx.find(".ses-detail-link a").first();
  return link.length > 0 ? (link.attr("href") ?? "") : "";
}
