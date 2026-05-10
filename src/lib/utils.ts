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
