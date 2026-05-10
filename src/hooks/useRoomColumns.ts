"use client";

import { useMemo } from "react";
import type { RoomColumn, ScheduleData } from "@/types/schedule";
import {
  buildFavoriteColumns,
  buildRoomColumns,
  generateTimeRows,
  getAllCategories,
  getTimeRange,
} from "@/lib/schedule";

export interface UseRoomColumnsResult {
  /** 全セッションを含む部屋カラム（カテゴリフィルター計算用） */
  columns: RoomColumn[];
  /** お気に入りモード時はフィルター済み、通常時は columns と同一 */
  displayColumns: RoomColumn[];
  allCategories: string[];
  timeRange: { min: number; max: number };
  timeRows: string[];
}

/** 部屋カラム・表示用カラム・時刻軸を計算する ViewModel hook */
export function useRoomColumns(
  scheduleData: ScheduleData | null,
  year: string,
  dayIndex: number,
  favoriteMode: boolean,
  favorites: Record<string, boolean>
): UseRoomColumnsResult {
  const columns = useMemo<RoomColumn[]>(() => {
    if (!scheduleData) return [];
    return buildRoomColumns(scheduleData, dayIndex, year);
  }, [scheduleData, dayIndex, year]);

  const allCategories = useMemo(() => getAllCategories(columns), [columns]);

  const displayColumns = useMemo<RoomColumn[]>(() => {
    if (!favoriteMode) return columns;
    return buildFavoriteColumns(columns, favorites, dayIndex);
  }, [favoriteMode, columns, favorites, dayIndex]);

  const timeRange = useMemo(() => getTimeRange(displayColumns), [displayColumns]);

  const timeRows = useMemo(() => generateTimeRows(timeRange.min, timeRange.max), [timeRange]);

  return { columns, displayColumns, allCategories, timeRange, timeRows };
}
