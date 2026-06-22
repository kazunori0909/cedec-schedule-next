/**
 * 公式 session/timetable.json・session/cancel.json を取得し、
 * web_data_original/{year}/ にキャッシュするユーティリティ（2025〜 の新方式）。
 *
 * 設計方針（負荷への配慮）:
 *   - 取得は単発・逐次・リトライ最小（1回まで）。並列/再帰クロールはしない。
 *   - Last-Modified を保存し、次回は If-Modified-Since 付きで条件付き取得する。
 *     未更新なら 304（本体転送なし）となりサーバ負荷はほぼゼロ。
 *   - ネットワーク不可・取得失敗時はローカルキャッシュにフォールバックする。
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { cancelJsonPath, sourceMetaPath, timetableJsonPath } from "./paths";
import { getDomain } from "../../src/lib/cedec";
import type { CancelJson, TimetableJson } from "../parsers/format_2025_json";

const USER_AGENT = "cedec_schedule-updater (non-commercial, unofficial timetable viewer)";
const TIMEOUT_MS = 30000;

interface SourceMeta {
  timetable_last_modified?: string;
  cancel_last_modified?: string;
  fetched_at?: string;
}

export interface TimetableSource {
  timetable: TimetableJson;
  cancel: CancelJson;
  /** 取得日時（"YYYY/MM/DD HH:MM" JST）。表示用 */
  fetchedAt: string;
}

function ensureDir(path: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readMeta(year: string): SourceMeta {
  const path = sourceMetaPath(year);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")) as SourceMeta;
  } catch {
    return {};
  }
}

function writeMeta(year: string, meta: SourceMeta): void {
  const path = sourceMetaPath(year);
  ensureDir(path);
  writeFileSync(path, JSON.stringify(meta, null, 2));
}

/** 現在時刻を "YYYY/MM/DD HH:MM"（JST）で返す */
function nowJst(): string {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}/${get("month")}/${get("day")} ${get("hour")}:${get("minute")}`;
}

/**
 * 1ファイルを条件付き取得してキャッシュへ保存する。
 * @returns 取得できた本文（304 や失敗時はキャッシュ本文）。キャッシュも無ければ null。
 */
async function fetchWithCache(
  url: string,
  cachePath: string,
  lastModified: string | undefined
): Promise<{ body: string | null; lastModified: string | undefined }> {
  const headers: Record<string, string> = { "User-Agent": USER_AGENT };
  if (lastModified) headers["If-Modified-Since"] = lastModified;

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timer);

      if (res.status === 304) {
        const cached = existsSync(cachePath) ? readFileSync(cachePath, "utf8") : null;
        return { body: cached, lastModified };
      }
      if (res.ok) {
        const body = await res.text();
        ensureDir(cachePath);
        writeFileSync(cachePath, body);
        return { body, lastModified: res.headers.get("last-modified") ?? lastModified };
      }
      // 404 等: cancel.json が未公開の場合があるためキャッシュへフォールバック
      const cached = existsSync(cachePath) ? readFileSync(cachePath, "utf8") : null;
      return { body: cached, lastModified };
    } catch (err) {
      clearTimeout(timer);
      if (attempt === 0) continue; // 1回だけ再試行
      console.warn(`[WARN] 取得失敗（キャッシュを使用）: ${url} (${String(err)})`);
      const cached = existsSync(cachePath) ? readFileSync(cachePath, "utf8") : null;
      return { body: cached, lastModified };
    }
  }
  const cached = existsSync(cachePath) ? readFileSync(cachePath, "utf8") : null;
  return { body: cached, lastModified };
}

/**
 * timetable.json / cancel.json を取得（または条件付き取得）して返す。
 * @param fetchRemote false の場合はネットワークアクセスせずキャッシュのみ使用する
 */
export async function loadTimetableSource(
  year: string,
  fetchRemote = true
): Promise<TimetableSource> {
  const ttPath = timetableJsonPath(year);
  const cancelPath = cancelJsonPath(year);
  const meta = readMeta(year);

  let ttBody: string | null;
  let cancelBody: string | null;
  let newMeta: SourceMeta = { ...meta };

  if (fetchRemote) {
    const domain = getDomain(year);
    const tt = await fetchWithCache(
      `${domain}session/timetable.json`,
      ttPath,
      meta.timetable_last_modified
    );
    const cn = await fetchWithCache(
      `${domain}session/cancel.json`,
      cancelPath,
      meta.cancel_last_modified
    );
    ttBody = tt.body;
    cancelBody = cn.body;
    newMeta = {
      timetable_last_modified: tt.lastModified,
      cancel_last_modified: cn.lastModified,
      fetched_at: nowJst(),
    };
    writeMeta(year, newMeta);
  } else {
    ttBody = existsSync(ttPath) ? readFileSync(ttPath, "utf8") : null;
    cancelBody = existsSync(cancelPath) ? readFileSync(cancelPath, "utf8") : null;
  }

  if (!ttBody) {
    throw new Error(
      `${year}: timetable.json を取得できませんでした（ネットワーク不可かつキャッシュ無し）`
    );
  }

  const timetable = JSON.parse(ttBody) as TimetableJson;
  const cancel: CancelJson = cancelBody ? (JSON.parse(cancelBody) as CancelJson) : {};

  return { timetable, cancel, fetchedAt: newMeta.fetched_at ?? meta.fetched_at ?? nowJst() };
}
