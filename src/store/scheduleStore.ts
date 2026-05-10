"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_YEAR } from "@/lib/cedec";

interface YearState {
  dayIndex: number;
  favoriteMode: boolean;
  hideSpecs: Record<string, boolean>; // タグ名 → 非表示か
  favorites: Record<string, boolean>; // セッションID → お気に入り
}

const EMPTY_YEAR_STATE: YearState = {
  dayIndex: 0,
  favoriteMode: false,
  hideSpecs: {},
  favorites: {},
};

interface ScheduleStore {
  year: string;
  hydrated: boolean;
  yearStates: Record<string, YearState>;

  setYear: (year: string) => void;
  setHydrated: () => void;
  setDayIndex: (dayIndex: number) => void;
  toggleFavoriteMode: () => void;
  toggleHideSpec: (spec: string) => void;
  toggleFavorite: (sessionId: string) => void;
}

function updateYear(
  yearStates: Record<string, YearState>,
  year: string,
  updater: (prev: YearState) => YearState
): Record<string, YearState> {
  const prev = yearStates[year] ?? EMPTY_YEAR_STATE;
  return { ...yearStates, [year]: updater(prev) };
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set) => ({
      year: DEFAULT_YEAR,
      hydrated: false,
      yearStates: {},

      setYear: (year) => set({ year }),

      // rehydrate 完了後に ScheduleView から呼ぶ
      setHydrated: () => set({ hydrated: true }),

      setDayIndex: (dayIndex) =>
        set((s) => ({
          yearStates: updateYear(s.yearStates, s.year, (y) => ({ ...y, dayIndex })),
        })),

      toggleFavoriteMode: () =>
        set((s) => ({
          yearStates: updateYear(s.yearStates, s.year, (y) => ({
            ...y,
            favoriteMode: !y.favoriteMode,
          })),
        })),

      toggleHideSpec: (spec) =>
        set((s) => ({
          yearStates: updateYear(s.yearStates, s.year, (y) => {
            const hideSpecs = { ...y.hideSpecs };
            if (hideSpecs[spec]) delete hideSpecs[spec];
            else hideSpecs[spec] = true;
            return { ...y, hideSpecs };
          }),
        })),

      toggleFavorite: (sessionId) =>
        set((s) => ({
          yearStates: updateYear(s.yearStates, s.year, (y) => {
            const favorites = { ...y.favorites };
            if (favorites[sessionId]) delete favorites[sessionId];
            else favorites[sessionId] = true;
            return { ...y, favorites };
          }),
        })),
    }),
    {
      name: "cedec_schedule_state",
      storage: createJSONStorage(() => localStorage),
      // year はURL駆動なので永続化しない
      partialize: (s) => ({ yearStates: s.yearStates }),
      // skipHydration: ストア生成時の同期 rehydrate を抑制し Next.js の
      // hydration mismatch を防ぐ。rehydrate は ScheduleView の useEffect で行う。
      skipHydration: true,
    }
  )
);

/** 現在年度の state を返すヘルパー */
export function useCurrentYearState(): YearState {
  return useScheduleStore((s) => s.yearStates[s.year] ?? EMPTY_YEAR_STATE);
}
