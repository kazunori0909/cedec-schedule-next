/**
 * generate_json.ts / generate_cedil.ts 共通のテキスト・時刻ユーティリティ。
 *
 * 設計方針:
 *   - 両端の空白除去は通常の .trim()（全角スペースも除去 = HTMLスクレイピングのゴミ掃除）
 *   - 内部の空白操作は ASCII 限定の文字クラス [ \t\n\r\f\v] を使用
 *     （\s だと全角スペースも対象になり、会社名区切り等の意味のある空白を壊すため）
 */

import type { Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";

/** cheerio 要素からテキストを取得してトリムする */
export const txt = ($el: Cheerio<AnyNode>): string => $el.text().trim();

/** 2018/2019 フォーマット: CSS クラス名 → カテゴリーコード */
export const CAT_CLASS_MAP: Record<string, string> = {
  en: "ENG",
  va: "VA",
  pd: "PRD",
  bp: "BP",
  sd: "SND",
  gd: "GD",
  ab: "AC",
};

/** "第3会場" → "3"、"第12会場" → "12" */
export function roomNoFromText(text: string): string {
  return text.replace(/第|会場/g, "").trim();
}

/** "09:35-09:40 /5分" → ["09:35", "09:40"] */
export function parseTimeRange(text: string): [string, string] {
  const normalized = text.replace(/[ \t\n\r\f\v]+/g, " ").trim();
  const m = normalized.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
  return [m?.[1] ?? "", m?.[2] ?? ""];
}

/** 改行・連続空白を半角スペース1つに正規化し、前後の空白を除去する */
export function normalizeWhitespace(str: string): string {
  return str.replace(/[\r\n\t ]+/g, " ").trim();
}

/** 会社名の法人格を略称に変換（前後の半角スペースも除去） */
export function abbreviateCompany(company: string): string {
  // PHP の \s と互換性を持たせるため ASCII 空白のみ。全角スペースは保持する。
  const map: Array<[RegExp, string]> = [
    [/[ \t\n\r\f\v]*株式会社[ \t\n\r\f\v]*/g, "(株)"],
    [/[ \t\n\r\f\v]*有限会社[ \t\n\r\f\v]*/g, "(有)"],
    [/[ \t\n\r\f\v]*合同会社[ \t\n\r\f\v]*/g, "(同)"],
  ];
  let result = company;
  for (const [pattern, abbr] of map) {
    result = result.replace(pattern, abbr);
  }
  return result;
}

/** 開催最終日（初日+2日）の翌日以降であれば true を返す */
export function isEventOver(year: number, firstDate: string): boolean {
  const month = parseInt(firstDate.slice(0, 2), 10);
  const day = parseInt(firstDate.slice(2, 4), 10);
  // 開催最終日（初日+2日）の翌日 0:00 を境界とする
  const boundary = new Date(year, month - 1, day + 3, 0, 0, 0).getTime();
  return Date.now() > boundary;
}

/** 月・日から開催初日基準の day_index (1〜3) を計算する */
export function dayIndexFromDate(
  month: number,
  day: number,
  firstMonth: number,
  firstDay: number
): number {
  const year = 2000;
  const tsFirst = new Date(year, firstMonth - 1, firstDay).getTime();
  const tsEvent = new Date(year, month - 1, day).getTime();
  return Math.floor((tsEvent - tsFirst) / 86400000) + 1;
}

/**
 * タイトルをマッチング比較用に正規化する。
 *   - 【...】ブロックをすべて除去（スポンサータグ・キャンセルタグ等）
 *   - スラッシュ前後のスペースを統一（"A / B" → "A/B"）
 *   - 連続空白・改行を1スペースに圧縮し、両端を trim
 */
export function normalizeTitleForMatch(title: string): string {
  let result = title.replace(/【[^】]+】[ \t\n\r\f\v]*/gu, "");
  result = result.replace(/[ \t\n\r\f\v]*\/[ \t\n\r\f\v]*/g, "/");
  return result.replace(/[ \t\n\r\f\v]+/g, " ").trim();
}
