/**
 * generate_youtube.ts
 *
 * CEDECチャンネルの全動画を YouTube Data API v3 で取得し、
 * web_data_original/youtube_videos.json にキャッシュする。
 *
 * 使用方法:
 *   npm run generate:youtube           # キャッシュがあれば再利用
 *   npm run generate:youtube -- --force # 強制再取得
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { loadEnv } from "./lib/env";
import { YOUTUBE_CACHE } from "./lib/paths";

interface VideoEntry {
  video_id: string;
  session_title: string;
  url: string;
}

interface CacheData {
  generated: string;
  total: number;
  videos: Record<string, VideoEntry[]>;
}

interface YouTubeApiItem {
  snippet: {
    title: string;
    resourceId: { videoId: string };
  };
}

interface YouTubeApiResponse {
  items?: YouTubeApiItem[];
  nextPageToken?: string;
  error?: { message: string };
}

const PLAYLIST_ID = "UUmHaPXvwn9_4pMNAV6ewgoA"; // CEDECチャンネル uploads playlist

async function main(): Promise<void> {
  loadEnv();

  const apiKey = process.env.YOUTUBE_API_KEY;
  const force = process.argv.includes("--force");

  if (!apiKey) {
    console.error("[ERROR] YOUTUBE_API_KEY が設定されていません（.env を確認してください）");
    process.exit(1);
  }

  if (!force && existsSync(YOUTUBE_CACHE)) {
    console.log(`[INFO] キャッシュを使用します: ${YOUTUBE_CACHE}`);
    const data = JSON.parse(readFileSync(YOUTUBE_CACHE, "utf8")) as CacheData;
    const total = Object.values(data.videos).reduce((sum, list) => sum + list.length, 0);
    console.log(`[INFO] ${total} 件の動画データが存在します`);
    return;
  }

  console.log("[INFO] YouTube Data API からチャンネル動画を取得します");

  const videos: Record<string, VideoEntry[]> = {};
  let pageToken: string | undefined;
  let page = 1;

  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("playlistId", PLAYLIST_ID);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[ERROR] APIリクエストに失敗しました: ${res.status} ${res.statusText}`);
      process.exit(1);
    }

    const data = (await res.json()) as YouTubeApiResponse;
    if (data.error) {
      console.error(`[ERROR] API エラー: ${data.error.message}`);
      process.exit(1);
    }

    const items = data.items ?? [];
    for (const item of items) {
      const { snippet } = item;
      const videoId = snippet.resourceId.videoId;
      const title = snippet.title;

      // 削除済み動画はスキップ
      if (title === "Deleted video" || title === "Private video") continue;

      // 【CEDEC20XX】プレフィックスから年度を抽出
      const m = title.match(/【CEDEC(\d{4})】/);
      const year = m ? m[1] : null;

      // 2010年以前・年度不明はスキップ
      if (year === null || parseInt(year, 10) < 2011) continue;

      // プレフィックスを除いたセッションタイトル
      const sessionTitle = title.replace(/^【CEDEC\d{4}】\s*/, "").trim();

      if (!videos[year]) videos[year] = [];
      videos[year].push({
        video_id: videoId,
        session_title: sessionTitle,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }

    pageToken = data.nextPageToken;
    console.log(`[INFO] ページ ${page}: ${items.length} 件取得`);
    page++;
  } while (pageToken);

  // 年度降順にソート
  const sortedYears = Object.keys(videos).sort((a, b) => b.localeCompare(a));
  const sortedVideos: Record<string, VideoEntry[]> = {};
  for (const y of sortedYears) sortedVideos[y] = videos[y];

  const total = Object.values(sortedVideos).reduce((sum, list) => sum + list.length, 0);
  const output: CacheData = {
    generated: new Date().toISOString(),
    total,
    videos: sortedVideos,
  };

  writeFileSync(YOUTUBE_CACHE, JSON.stringify(output, null, 2));
  console.log(`[OK] ${YOUTUBE_CACHE} に ${total} 件を保存しました`);
}

main().catch((err) => {
  console.error("[ERROR]", err);
  process.exit(1);
});
