"use client";

import { useEffect, useMemo, useState } from "react";
import { CASH_SETTING, DEFAULT_YEAR, findYearSetting, getDateList, isValidYear } from "@/lib/cedec";
import { useCurrentYearState, useScheduleStore } from "@/store/scheduleStore";
import { useCurrentTimeRow } from "@/hooks/useCurrentTimeRow";
import { useScheduleData } from "@/hooks/useScheduleData";
import { useRoomColumns } from "@/hooks/useRoomColumns";
import { formatCedilDate } from "@/lib/cedil";
import { getNow } from "@/lib/utils";

import { DateSelector } from "@/components/DateSelector";
import { ExcelDownloadButton } from "@/components/ExcelDownloadButton";
import { FavoriteToggle } from "@/components/FavoriteToggle";
import { FilterDrawer } from "@/components/FilterDrawer";
import { FilterPanel } from "@/components/FilterPanel";
import { InfoTooltip } from "@/components/InfoTooltip";
import { SideMenu } from "@/components/SideMenu";
import { ScheduleTable } from "@/components/schedule/ScheduleTable";

export function ScheduleView() {
  // next build（静的出力）ではビルド時にURLパラメータが存在しないため useSearchParams は
  // 使わず、useEffect でクライアント側から window.location.search を読み出す。
  // year が確定するまで null を返すことで DEFAULT_YEAR のフラッシュを防ぐ。
  const [year, setYear] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const yearParam = params.get("year");
    // URL（ブラウザ専用の外部状態）はマウント後にしか読めないため、ここでの
    // setState は不可避。SSR 相当のフラッシュ防止のための一度きりの同期。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYear(yearParam && isValidYear(yearParam) ? yearParam : DEFAULT_YEAR);
  }, []);

  if (year === null) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  return <ScheduleViewInner year={year} onYearChange={setYear} />;
}

function ScheduleViewInner({
  year,
  onYearChange,
}: {
  year: string;
  onYearChange: (year: string) => void;
}) {
  const { hydrated, setHydrated, setDayIndex, toggleFavoriteMode, toggleHideSpec, toggleFavorite } =
    useScheduleStore();
  const { dayIndex, favoriteMode, hideSpecs, favorites } = useCurrentYearState(year);

  // マウント後に localStorage から rehydrate（skipHydration: true のため手動で呼ぶ）
  // localStorage は同期的なため、コールバック登録を rehydrate より先に行う
  // setHydrated は Zustand のアクション（ストア生成時に確定する安定参照）のため再発火しない
  useEffect(() => {
    const unsub = useScheduleStore.persist.onFinishHydration(() => setHydrated());
    useScheduleStore.persist.rehydrate();
    return unsub;
  }, [setHydrated]);

  const setting = useMemo(() => findYearSetting(year), [year]);
  const dateList = useMemo(() => getDateList(setting), [setting]);

  // 開催期間中なら今日の dayIndex を自動選択
  const todayDayIndex = useMemo(() => {
    const now = getNow();
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

  // 年度変更: URL と year state を同時更新
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
    onYearChange(newYear);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <SideMenu currentYear={year} onYearChange={handleYearChange} />
          <h1 className="text-xl font-bold">CEDEC {year} スケジュール</h1>
          <span className="text-xs text-muted-foreground hidden sm:inline">非公式</span>
          {(scheduleData?.fetched || CASH_SETTING[year] || cedilUpdate) && (
            <InfoTooltip
              lines={[
                // JSON方式（2025〜）は schedule.json の取得日時を優先。
                // それ以外は CASH_SETTING（手動更新）にフォールバックする。
                ...(scheduleData?.fetched
                  ? [`※セッション情報 取得日時：${scheduleData.fetched}`]
                  : CASH_SETTING[year]
                    ? [`※セッション情報 取得日時：${CASH_SETTING[year].time}`]
                    : []),
                ...(cedilUpdate
                  ? [`※CEDiL情報 ${cedilCount}件 取得日時：${formatCedilDate(cedilUpdate)}`]
                  : []),
              ]}
            />
          )}
          <div className="ml-auto">
            {scheduleData && (
              <ExcelDownloadButton scheduleData={scheduleData} year={year} favorites={favorites} />
            )}
          </div>
        </div>
        <div className="px-4 pb-3 flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <DateSelector
              dateList={dateList}
              selected={dayIndex}
              onSelect={(i) => setDayIndex(year, i)}
            />
            <FavoriteToggle active={favoriteMode} onToggle={() => toggleFavoriteMode(year)} />
            {/* モバイル: ドロワーボタン */}
            <div className="sm:hidden">
              <FilterDrawer
                categories={allCategories}
                hideSpecs={hideSpecs}
                onToggle={(spec) => toggleHideSpec(year, spec)}
              />
            </div>
          </div>
          {/* デスクトップ: インラインフィルター */}
          <div className="hidden sm:block">
            <FilterPanel
              categories={allCategories}
              hideSpecs={hideSpecs}
              onToggle={(spec) => toggleHideSpec(year, spec)}
            />
          </div>
        </div>
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
        CEDEC非公式タイムテーブル
        <br />
        このサイトはコミュニティ運営の非公式ビューアです
      </footer>
    </div>
  );
}
