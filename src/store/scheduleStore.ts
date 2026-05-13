"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
  hydrated: boolean;
  yearStates: Record<string, YearState>;

  setHydrated: () => void;
  setDayIndex: (year: string, dayIndex: number) => void;
  toggleFavoriteMode: (year: string) => void;
  toggleHideSpec: (year: string, spec: string) => void;
  toggleFavorite: (year: string, sessionId: string) => void;
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
      hydrated: false,
      yearStates: {},

      // rehydrate 完了後に ScheduleView から呼ぶ
      setHydrated: () => set({ hydrated: true }),

      setDayIndex: (year, dayIndex) =>
        set((s) => ({
          yearStates: updateYear(s.yearStates, year, (y) => ({ ...y, dayIndex })),
        })),

      toggleFavoriteMode: (year) =>
        set((s) => ({
          yearStates: updateYear(s.yearStates, year, (y) => ({
            ...y,
            favoriteMode: !y.favoriteMode,
          })),
        })),

      toggleHideSpec: (year, spec) =>
        set((s) => ({
          yearStates: updateYear(s.yearStates, year, (y) => {
            const hideSpecs = { ...y.hideSpecs };
            if (hideSpecs[spec]) delete hideSpecs[spec];
            else hideSpecs[spec] = true;
            return { ...y, hideSpecs };
          }),
        })),

      toggleFavorite: (year, sessionId) =>
        set((s) => ({
          yearStates: updateYear(s.yearStates, year, (y) => {
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
      partialize: (s) => ({ yearStates: s.yearStates }),
      // skipHydration: ストア生成時の同期 rehydrate を抑制し Next.js の
      // hydration mismatch を防ぐ。rehydrate は ScheduleView の useEffect で行う。
      skipHydration: true,
    }
  )
);

/** 現在年度の state を返すヘルパー */
export function useCurrentYearState(year: string): YearState {
  return useScheduleStore((s) => s.yearStates[year] ?? EMPTY_YEAR_STATE);
}
