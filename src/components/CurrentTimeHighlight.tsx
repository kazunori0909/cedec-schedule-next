"use client";

import { useEffect, useState } from "react";
import { MIN_MINUTES } from "@/lib/cedec";

// 現在時刻に対応する時刻ラベル（"HH:MM"）を返す
// 1分間隔で更新する
export function useCurrentTimeRow(timeRows: string[], enabled: boolean): string | undefined {
  const [time, setTime] = useState<string | undefined>(() =>
    enabled ? findCurrentTimeRow(timeRows) : undefined
  );

  useEffect(() => {
    if (!enabled) {
      setTime(undefined);
      return;
    }
    setTime(findCurrentTimeRow(timeRows));
    const interval = setInterval(() => {
      setTime(findCurrentTimeRow(timeRows));
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [timeRows, enabled]);

  return time;
}

function findCurrentTimeRow(timeRows: string[]): string | undefined {
  if (timeRows.length === 0) return undefined;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  // 現在時刻以下で最大の行を探す（5分単位に丸める）
  const rounded = Math.floor(nowMinutes / MIN_MINUTES) * MIN_MINUTES;
  for (const t of timeRows) {
    const [h, m] = t.split(":").map((s) => parseInt(s, 10));
    const tMin = h * 60 + m;
    if (tMin === rounded) return t;
  }
  // 範囲外なら開始/終了に寄せる
  const first = timeStrToMin(timeRows[0]);
  const last = timeStrToMin(timeRows[timeRows.length - 1]);
  if (rounded < first) return timeRows[0];
  if (rounded > last) return timeRows[timeRows.length - 1];
  return undefined;
}

function timeStrToMin(s: string): number {
  const [h, m] = s.split(":").map((x) => parseInt(x, 10));
  return h * 60 + m;
}
