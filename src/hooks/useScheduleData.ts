"use client";

import { useEffect, useState } from "react";
import type { ScheduleData } from "@/types/schedule";
import { fetchSchedule } from "@/lib/schedule";
import { fetchCedil, buildCedilLookup } from "@/lib/cedil";
import { findYearSetting } from "@/lib/cedec";

export interface UseScheduleDataResult {
  scheduleData: ScheduleData | null;
  loading: boolean;
  error: string | null;
  cedilLookup: Record<string, string>;
  cedilUpdate: string | undefined;
  cedilCount: number;
}

/** schedule.json と CEDiL データを取得し、セッションへのルックアップを生成する ViewModel hook */
export function useScheduleData(year: string, dateList: Date[]): UseScheduleDataResult {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cedilLookup, setCedilLookup] = useState<Record<string, string>>({});
  const [cedilUpdate, setCedilUpdate] = useState<string | undefined>();
  const [cedilCount, setCedilCount] = useState<number>(0);

  // year 切り替え時は描画中に state をリセットする（古いデータが一瞬表示されるのを防ぐ）
  const [prevYear, setPrevYear] = useState(year);
  if (year !== prevYear) {
    setPrevYear(year);
    setLoading(true);
    setError(null);
    setScheduleData(null);
    setCedilUpdate(undefined);
    setCedilCount(0);
    setCedilLookup({});
  }

  useEffect(() => {
    // year 切り替え時の古いフェッチ結果で state を上書きさせないためのフラグ
    let cancelled = false;
    fetchSchedule(year)
      .then((data) => {
        if (cancelled) return;
        setScheduleData(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "読み込み失敗");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  useEffect(() => {
    if (!scheduleData) return;
    if (findYearSetting(year).cedil_tag_no === undefined) return;

    let cancelled = false;
    fetchCedil(year).then((cedil) => {
      if (cancelled || !cedil) return;
      setCedilUpdate(cedil.update_date);
      setCedilCount(cedil.list.length);
      // ライトニングトークの資料も CEDiL に登録されるため、突き合わせ対象に含める
      const targets = [...scheduleData.sessions, ...(scheduleData.lightning_talks ?? [])];
      setCedilLookup(buildCedilLookup(cedil.list, targets, dateList));
    });
    return () => {
      cancelled = true;
    };
  }, [scheduleData, year, dateList]);

  return { scheduleData, loading, error, cedilLookup, cedilUpdate, cedilCount };
}
