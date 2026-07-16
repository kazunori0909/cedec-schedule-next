"use client";

import { useSyncExternalStore } from "react";
import { MIN_MINUTES, parseTimeToMinutes } from "@/lib/cedec";
import { getNow } from "@/lib/utils";

// 現在時刻（時計）を外部システムとして useSyncExternalStore で購読する。
// スナップショットは「MIN_MINUTES 刻みに丸めた現在分」のプリミティブ値のため、
// 同じ時間帯の間は値が変わらず再レンダーも発生しない。

function subscribeMinute(listener: () => void): () => void {
  const id = setInterval(listener, 60 * 1000);
  return () => clearInterval(id);
}

// enabled=false の間はタイマーを張らない
function subscribeNoop(): () => void {
  return () => {};
}

function getRoundedNowMinutes(): number {
  const now = getNow();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return Math.floor(minutes / MIN_MINUTES) * MIN_MINUTES;
}

// ビルド時（静的プリレンダー）には現在時刻のハイライトを出さない
function getServerSnapshot(): number | undefined {
  return undefined;
}

// 現在時刻に対応する時刻ラベル（"HH:MM"）を返す。1分間隔で更新する
export function useCurrentTimeRow(timeRows: string[], enabled: boolean): string | undefined {
  const rounded = useSyncExternalStore(
    enabled ? subscribeMinute : subscribeNoop,
    getRoundedNowMinutes,
    getServerSnapshot
  );
  if (!enabled || rounded === undefined) return undefined;
  return findTimeRow(timeRows, rounded);
}

// 丸めた現在分に一致する行を探す（範囲外なら開始/終了に寄せる）
function findTimeRow(timeRows: string[], rounded: number): string | undefined {
  if (timeRows.length === 0) return undefined;
  for (const t of timeRows) {
    if (parseTimeToMinutes(t) === rounded) return t;
  }
  const first = parseTimeToMinutes(timeRows[0]);
  const last = parseTimeToMinutes(timeRows[timeRows.length - 1]);
  if (rounded < first) return timeRows[0];
  if (rounded > last) return timeRows[timeRows.length - 1];
  return undefined;
}
