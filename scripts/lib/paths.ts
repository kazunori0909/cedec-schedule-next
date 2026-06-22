import { resolve } from "node:path";

/**
 * パス解決ユーティリティ。
 * npm scripts はリポジトリルートで実行される前提で process.cwd() を起点とする。
 */

/** リポジトリルート（cedec_schedule/） */
export const REPO_ROOT = process.cwd();

/** Next.js public ディレクトリ（public/） */
export const PUBLIC_DIR = resolve(process.cwd(), "public");

/** 公式HTMLキャッシュ（web_data_original/） */
export const WEB_DATA_ORIGINAL = resolve(REPO_ROOT, "web_data_original");

/** 生成済みJSON出力先（public/web_data/） */
export const WEB_DATA_OUTPUT = resolve(PUBLIC_DIR, "web_data");

/** 年度別の出力ディレクトリ */
export function outputDir(year: string): string {
  return resolve(WEB_DATA_OUTPUT, year);
}

/** 年度別の入力HTMLパス（全セッションをまとめた1ファイル） */
export function allHtmlPath(year: string): string {
  return resolve(WEB_DATA_ORIGINAL, year, "all.html");
}

/** 年度別の日別HTMLパス（新フォーマット） */
export function dayHtmlPath(year: string, day: number): string {
  return resolve(WEB_DATA_ORIGINAL, year, `day${day}.html`);
}

/** LIVEページキャッシュ */
export function liveHtmlPath(year: string): string {
  return resolve(WEB_DATA_ORIGINAL, year, "live.html");
}

/** 公式タイムテーブルJSON（2025〜 の標準方式 / web_data_original にキャッシュ） */
export function timetableJsonPath(year: string): string {
  return resolve(WEB_DATA_ORIGINAL, year, "timetable.json");
}

/** 公式キャンセル情報JSON（2025〜 の標準方式） */
export function cancelJsonPath(year: string): string {
  return resolve(WEB_DATA_ORIGINAL, year, "cancel.json");
}

/** 取得メタ情報（Last-Modified・取得日時）のキャッシュ */
export function sourceMetaPath(year: string): string {
  return resolve(WEB_DATA_ORIGINAL, year, ".source_meta.json");
}

/** YouTube動画リストキャッシュ */
export const YOUTUBE_CACHE = resolve(WEB_DATA_ORIGINAL, "youtube_videos.json");

/** .env ファイルパス */
export const ENV_PATH = resolve(REPO_ROOT, ".env");
