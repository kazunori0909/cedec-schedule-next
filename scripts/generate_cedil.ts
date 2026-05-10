/**
 * generate_cedil.ts
 *
 * CEDiLサイトを年度別タグでクロールし、
 * next-app/public/web_data/{year}/cedil.json に資料情報を出力する。
 *
 * 使用方法:
 *   npm run generate:cedil 2025         # 指定年度
 *   npm run generate:cedil               # 全年度
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as cheerio from "cheerio";
import { SCHEDULE_SETTING } from "../src/lib/cedec";
import { outputDir } from "./lib/paths";

interface CedilItem {
  title: string;
  url: string;
}

interface CedilResult {
  list: CedilItem[];
  update_date: string;
}

const FETCH_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function readPage(tag: number, page: number, result: CedilResult): Promise<number | null> {
  const url = `https://cedil.cesa.or.jp/cedil_sessions/search_tag/${tag}?page=${page}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[ERROR] ${url} の取得に失敗しました: ${res.status}`);
    return null;
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  if (page === 1) {
    const msg = $(".search_message").first();
    if (msg.length > 0) {
      console.log(`  ${msg.text().trim()}`);
    }
  }

  $(".session_list").each((_, session) => {
    const h2 = $(session).find("h2").first();
    if (h2.length === 0) return;

    let title = h2.text().trim();
    title = title.replace(/[\n 　]/g, "");

    const a = h2.find("a").first();
    const href = a.length > 0 ? (a.attr("href") ?? "") : "";

    result.list.push({ title, url: href });
  });

  // 次ページ: .page_change span.active の次の兄弟 span
  const nextNode = $(".page_change span.active").next("span").first();
  const nextText = nextNode.length > 0 ? nextNode.text().trim() : "";
  return nextText !== "" ? parseInt(nextText, 10) : null;
}

async function processYear(year: string, tag: number): Promise<void> {
  console.log(`[INFO] ${year} (tag=${tag}) 処理開始`);

  const result: CedilResult = {
    list: [],
    update_date: new Date().toISOString(),
  };

  let page: number | null = 1;
  while (page !== null) {
    const next = await readPage(tag, page, result);
    if (next === null) break;
    await sleep(FETCH_DELAY_MS);
    page = next;
  }

  const dir = outputDir(year);
  mkdirSync(dir, { recursive: true });
  const outputPath = resolve(dir, "cedil.json");
  writeFileSync(outputPath, JSON.stringify(result));
  console.log(`[OK]   ${outputPath} に ${result.list.length} 件を出力`);
}

async function main(): Promise<void> {
  const targetYear = process.argv[2];
  const targets = targetYear
    ? SCHEDULE_SETTING.filter((s) => s.year === targetYear)
    : SCHEDULE_SETTING;

  if (targets.length === 0) {
    console.error(`[ERROR] 年度 '${targetYear}' は SCHEDULE_SETTING に未定義です`);
    process.exit(1);
  }

  for (const setting of targets) {
    await processYear(setting.year, setting.cedil_tag_no);
  }
}

main().catch((err) => {
  console.error("[ERROR]", err);
  process.exit(1);
});
