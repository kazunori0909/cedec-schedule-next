"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_YEAR, isValidYear } from "@/lib/cedec";

// URL の ?year= クエリパラメータを「唯一の真実」として購読するフック。
// next build（静的出力）ではビルド時に URL パラメータが存在しないため、
// サーバースナップショットは null を返し、クライアントで確定するまで
// 呼び出し側がローディング表示を出す（DEFAULT_YEAR のフラッシュ防止）。

// setYearParam（replaceState は popstate を発火しない）の変更を購読者へ届けるリスナー群
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // ブラウザの戻る/進むや手動の URL 変更にも追従する
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

function getSnapshot(): string {
  const param = new URLSearchParams(window.location.search).get("year");
  return param && isValidYear(param) ? param : DEFAULT_YEAR;
}

function getServerSnapshot(): string | null {
  return null;
}

/** 現在の年度（URL 確定前は null） */
export function useYearParam(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** 年度を変更する（URL を書き換え、購読者へ通知する） */
export function setYearParam(newYear: string): void {
  const params = new URLSearchParams(window.location.search);
  if (newYear === DEFAULT_YEAR) {
    params.delete("year");
  } else {
    params.set("year", newYear);
  }
  const search = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}`);
  listeners.forEach((listener) => listener());
}
