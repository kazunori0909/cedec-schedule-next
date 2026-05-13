"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CASH_SETTING, DEFAULT_YEAR, findYearSetting, getDateList, isValidYear } from "@/lib/cedec";
import { useCurrentYearState, useScheduleStore } from "@/store/scheduleStore";
import { useCurrentTimeRow } from "@/components/CurrentTimeHighlight";
import { useScheduleData } from "@/hooks/useScheduleData";
import { useRoomColumns } from "@/hooks/useRoomColumns";

import { DateSelector } from "@/components/DateSelector";
import { FavoriteToggle } from "@/components/FavoriteToggle";
import { FilterPanel } from "@/components/FilterPanel";
import { SideMenu } from "@/components/SideMenu";
import { ScheduleTable } from "@/components/schedule/ScheduleTable";

export function ScheduleView() {
  const searchParams = useSearchParams();
  const yearParam = searchParams.get("year");
  // year はURLが唯一の真実。ストアには持たない。
  const year = yearParam && isValidYear(yearParam) ? yearParam : DEFAULT_YEAR;

  const { hydrated, setHydrated, setDayIndex, toggleFavoriteMode, toggleHideSpec, toggleFavorite } =
    useScheduleStore();
  const { dayIndex, favoriteMode, hideSpecs, favorites } = useCurrentYearState(year);

  // マウント後に localStorage から rehydrate（skipHydration: true のため手動で呼ぶ）
  useEffect(() => {
    useScheduleStore.persist.rehydrate();
    const unsub = useScheduleStore.persist.onFinishHydration(() => setHydrated());
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setting = useMemo(() => findYearSetting(year), [year]);
  const dateList = useMemo(() => getDateList(setting), [setting]);

  // 開催期間中なら今日の dayIndex を自動選択
  const todayDayIndex = useMemo(() => {
    const now = new Date();
    if (now.getFullYear() !== parseInt(year, 10)) return undefined;
    for (let i = 0; i < dateList.length; i++) {
      if (dateList[i].getMonth() === now.getMonth() && dateList[i].getDate() === now.getDate())
        return i;
    }
    return undefined;
  }, [dateList, year]);

  // ViewModel: データ取得
  const { scheduleData, loading, error, cedilLookup, cedilUpdate, cedilCount } = useScheduleData(
    year,
    dateList
  );

  // ViewModel: 部屋カラム・時刻軸
  const { displayColumns, allCategories, timeRange, timeRows } = useRoomColumns(
    scheduleData,
    year,
    dayIndex,
    favoriteMode,
    favorites
  );

  // 開催期間中の自動日付選択（データ読み込み完了後に当日へ）
  useEffect(() => {
    if (!scheduleData) return;
    if (todayDayIndex !== undefined) {
      setDayIndex(year, todayDayIndex);
    }
  }, [scheduleData, todayDayIndex, year, setDayIndex]);

  // 現在時刻ハイライト（開催期間中のみ）
  const highlightEnabled = todayDayIndex === dayIndex;
  const currentTimeStr = useCurrentTimeRow(timeRows, highlightEnabled);

  // 年度変更: URL のみ更新（year は URL から派生するため store 更新不要）
  const handleYearChange = (newYear: string) => {
    const params = new URLSearchParams(window.location.search);
    if (newYear === DEFAULT_YEAR) {
      params.delete("year");
    } else {
      params.set("year", newYear);
    }
    const search = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}`
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <SideMenu currentYear={year} onYearChange={handleYearChange} />
          <h1 className="text-xl font-bold">CEDEC {year} スケジュール</h1>
          <span className="text-xs text-muted-foreground hidden sm:inline">非公式</span>
        </div>
        <div className="px-4 pb-3 flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <DateSelector
              dateList={dateList}
              selected={dayIndex}
              onSelect={(i) => setDayIndex(year, i)}
            />
            <FavoriteToggle active={favoriteMode} onToggle={() => toggleFavoriteMode(year)} />
          </div>
          <FilterPanel
            categories={allCategories}
            hideSpecs={hideSpecs}
            onToggle={(spec) => toggleHideSpec(year, spec)}
          />
        </div>
        {(CASH_SETTING[year] || cedilUpdate) && (
          <div className="px-4 pb-2 text-xs text-muted-foreground">
            {CASH_SETTING[year] && (
              <span>※セッション情報 取得日時：{CASH_SETTING[year].time}　</span>
            )}
            {cedilUpdate && (
              <span className="block sm:inline">
                ※CEDiL情報 {cedilCount}件 取得日時：{formatCedilDate(cedilUpdate)}
              </span>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 p-4">
        {loading && <div className="text-center p-8">読み込み中...</div>}
        {error && <div className="text-center p-8 text-destructive">エラー: {error}</div>}
        {!loading && !error && scheduleData && (
          <>
            <h2 className="text-lg font-bold mb-3">Day {dayIndex + 1}</h2>
            <ScheduleTable
              columns={displayColumns}
              timeRange={timeRange}
              dayIndex={dayIndex}
              year={year}
              domain={setting.domain}
              favorites={favorites}
              hideSpecs={hideSpecs}
              cedilLookup={cedilLookup}
              currentTimeStr={currentTimeStr}
              onToggleFavorite={(id) => toggleFavorite(year, id)}
            />
            {!hydrated && (
              <div className="text-xs text-muted-foreground mt-2">ローカル設定を読み込み中...</div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-border py-4 px-4 text-xs text-muted-foreground text-center">
        CEDEC スケジュール（非公式） — このサイトはコミュニティ運営の非公式ビューアです
      </footer>
    </div>
  );
}

function formatCedilDate(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}
