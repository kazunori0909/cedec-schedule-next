import { existsSync, readFileSync } from "node:fs";
import { YOUTUBE_CACHE } from "./paths";
import { normalizeTitleForMatch } from "./helpers";

interface YoutubeCache {
  videos?: Record<string, Array<{ session_title: string; url: string }>>;
}

/**
 * youtube_videos.json から指定年度の session_title => url マッピングを構築する。
 * キーはタイトル正規化済み。
 */
export function buildYoutubeMap(year: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!existsSync(YOUTUBE_CACHE)) return map;

  const data = JSON.parse(readFileSync(YOUTUBE_CACHE, "utf8")) as YoutubeCache;
  const videos = data.videos?.[year] ?? [];

  for (const v of videos) {
    map.set(normalizeTitleForMatch(v.session_title), v.url);
  }
  return map;
}

/**
 * セッションタイトルに対応する YouTube URL を返す。
 *
 * マッチング戦略:
 *   1. 正規化後の完全一致
 *   2. YouTubeタイトルが切り捨てられているケース:
 *      スケジュールタイトルがYTタイトルで始まる（20文字以上の場合のみ）
 */
export function findYoutubeUrl(
  sessionTitle: string,
  youtubeMap: Map<string, string>
): string | null {
  if (youtubeMap.size === 0) return null;

  const norm = normalizeTitleForMatch(sessionTitle);

  // 1. 完全一致
  const exact = youtubeMap.get(norm);
  if (exact) return exact;

  // 2. YouTubeタイトルが切り捨てられた場合（スケジュール側が長い）
  for (const [ytNorm, url] of youtubeMap) {
    if ([...ytNorm].length >= 20 && norm.startsWith(ytNorm)) {
      return url;
    }
  }
  return null;
}
