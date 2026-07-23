"use client";

import { useEffect } from "react";
import { CASH_SETTING, findYearSetting, getDateList, LT_DAY_INDEX } from "@/lib/cedec";
import { useCurrentYearState, useScheduleStore } from "@/store/scheduleStore";
import { useCurrentTimeRow } from "@/hooks/useCurrentTimeRow";
import { useScheduleData } from "@/hooks/useScheduleData";
import { setYearParam, useYearParam } from "@/hooks/useYearParam";
import { buildLightningTalkViewModel, buildScheduleViewModel } from "@/lib/schedule";
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
  // year は URL の ?year= が唯一の真実（useYearParam が購読）。
  // 静的出力ではクライアントで確定するまで null のため、ローディング表示で
  // DEFAULT_YEAR のフラッシュを防ぐ。
  const year = useYearParam();

  if (year === null) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  return <ScheduleViewInner year={year} />;
}

function ScheduleViewInner({ year }: { year: string }) {
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

  // 導出値のメモ化は React Compiler が行う（手動 useMemo は不要）
  const setting = findYearSetting(year);
  const dateList = getDateList(setting);

  // 開催期間中なら今日の dayIndex を自動選択
  const todayDayIndex = findTodayDayIndex(dateList, year);

  // ViewModel: データ取得
  const { scheduleData, loading, error, cedilLookup, cedilUpdate, cedilCount } = useScheduleData(
    year,
    dateList
  );

  // LT データを持たない年度で LT タブの選択状態が復元された場合は Day1 にフォールバックする
  const lightningTalks = scheduleData?.lightning_talks ?? [];
  const isLightningTalkTab = dayIndex === LT_DAY_INDEX && lightningTalks.length > 0;
  const activeDayIndex = dayIndex === LT_DAY_INDEX && !isLightningTalkTab ? 0 : dayIndex;

  // ViewModel: 部屋カラム・時刻軸
  // LT タブは全日程を横断するため、日付・お気に入りによる絞り込みは行わない
  const { displayColumns, allCategories, timeRows } = isLightningTalkTab
    ? buildLightningTalkViewModel(lightningTalks)
    : buildScheduleViewModel(scheduleData, year, activeDayIndex, favoriteMode, favorites);

  // 開催期間中の自動日付選択（データ読み込み完了後に当日へ）
  useEffect(() => {
    if (!scheduleData) return;
    if (todayDayIndex !== undefined) {
      setDayIndex(year, todayDayIndex);
    }
  }, [scheduleData, todayDayIndex, year, setDayIndex]);

  // 現在時刻ハイライト（開催期間中のみ。全日程横断の LT タブでは当日判定が成立しないため無効）
  const highlightEnabled = todayDayIndex === activeDayIndex;
  const currentTimeStr = useCurrentTimeRow(timeRows, highlightEnabled);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
          <SideMenu currentYear={year} onYearChange={setYearParam} />
          {/* 狭幅では縮小して一行に収める。min-w-0 + truncate は安全網で、
              想定より狭い端末でもタイトルが右側のボタンを押し出さないようにする */}
          <h1 className="min-w-0 truncate text-sm font-bold sm:text-xl">
            CEDEC {year} 非公式タイムテーブル
          </h1>
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
        <div className="px-3 pb-3 flex flex-col gap-2 sm:px-4">
          <div className="flex items-center gap-3 flex-wrap">
            <DateSelector
              dateList={dateList}
              selected={activeDayIndex}
              showLightningTalk={lightningTalks.length > 0}
              onSelect={(i) => setDayIndex(year, i)}
            />
            {!isLightningTalkTab && (
              <FavoriteToggle active={favoriteMode} onToggle={() => toggleFavoriteMode(year)} />
            )}
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
            <h2 className="text-lg font-bold mb-3">
              {isLightningTalkTab ? "ライトニングトーク" : `Day ${activeDayIndex + 1}`}
            </h2>
            <ScheduleTable
              columns={displayColumns}
              timeRows={timeRows}
              dayIndex={activeDayIndex}
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

// 今日が開催期間中ならその日付インデックスを返す
function findTodayDayIndex(dateList: Date[], year: string): number | undefined {
  const now = getNow();
  if (now.getFullYear() !== parseInt(year, 10)) return undefined;
  for (let i = 0; i < dateList.length; i++) {
    if (dateList[i].getMonth() === now.getMonth() && dateList[i].getDate() === now.getDate()) {
      return i;
    }
  }
  return undefined;
}
