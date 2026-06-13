import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 外部 URL として安全か検証し、安全でなければ undefined を返す。
 * javascript:, data:, vbscript: 等のスキームによる XSS を防ぐため、
 * http(s) と相対パスのみを許可する。
 */
export function safeExternalUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (trimmed === "") return undefined;

  // 相対パス（/ または ./）は許可
  if (trimmed.startsWith("/") || trimmed.startsWith("./")) return trimmed;

  // 絶対 URL は http(s) のみ許可
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmed;
    }
  } catch {
    // URL としてパースできない場合は破棄
  }
  return undefined;
}

/**
 * ハッシュタグ文字列から X（旧 Twitter）のハッシュタグページ URL を生成する。
 * 先頭の `#` は付いていてもいなくても受け付け、空文字なら undefined を返す。
 */
export function hashTagUrl(tag: string): string | undefined {
  const trimmed = tag.trim().replace(/^#+/, "");
  if (trimmed === "") return undefined;
  return `https://x.com/hashtag/${encodeURIComponent(trimmed)}`;
}

/**
 * デバッグ用に「現在時刻」を URL クエリ `?now=YYYY-MM-DDTHH:mm` で上書きする。
 * 開催日当日でなくても現在時刻ハイライトを確認できるようにするための仕組み。
 *
 * `npm run dev`（開発時）のみ有効。本番ビルドでは process.env.NODE_ENV が
 * "production" に静的置換されるため、この関数は常に null を返しデッドコード除去される。
 * 指定がない・形式不正・本番ビルドの場合は null（= 実時刻を使う）を返す。
 */
export function getDebugNow(): Date | null {
  if (process.env.NODE_ENV === "production") return null;
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("now");
  if (!raw) return null;
  // YYYY-MM-DD[T|空白]HH:mm 形式をローカル時刻として解釈する
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
}

/**
 * 現在時刻を返す。`?now=` による上書き（開発時のみ）があればそれを、なければ実時刻を返す。
 */
export function getNow(): Date {
  return getDebugNow() ?? new Date();
}
