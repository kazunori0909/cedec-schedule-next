"use client";

import { useEffect, useState } from "react";
import type { ScheduleData } from "@/types/schedule";
import { fetchSchedule } from "@/lib/schedule";
import { fetchCedil, buildCedilLookup } from "@/lib/cedil";

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

  useEffect(() => {
    setLoading(true);
    setError(null);
    setScheduleData(null);
    fetchSchedule(year)
      .then((data) => {
        setScheduleData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "読み込み失敗");
        setLoading(false);
      });
  }, [year]);

  useEffect(() => {
    if (!scheduleData) return;
    fetchCedil(year).then((cedil) => {
      if (!cedil) return;
      setCedilUpdate(cedil.update_date);
      setCedilCount(cedil.list.length);
      setCedilLookup(buildCedilLookup(cedil.list, scheduleData.sessions, dateList));
    });
  }, [scheduleData, year, dateList]);

  return { scheduleData, loading, error, cedilLookup, cedilUpdate, cedilCount };
}
