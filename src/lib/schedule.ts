import type {
  ScheduleData,
  ExtraEvent,
  RoomColumn,
  Session,
  UnifiedSession,
} from "@/types/schedule";
import {
  findYearSetting,
  parseTimeToMinutes,
  formatMinutesToTime,
  MIN_MINUTES,
  resolveDevNight,
} from "@/lib/cedec";
import { CUSTOM_SETTING } from "@/lib/custom";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const scheduleCache: Record<string, ScheduleData> = {};

export async function fetchSchedule(year: string): Promise<ScheduleData> {
  if (scheduleCache[year]) return scheduleCache[year];
  const res = await fetch(`${BASE_PATH}/web_data/${year}/schedule.json`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load schedule.json for ${year}: ${res.status}`);
  }
  const data = (await res.json()) as ScheduleData;
  scheduleCache[year] = data;
  return data;
}

// 部屋名のソート（メインホールが先頭、それ以外は数値ソート）
function sortRoomNames(names: string[]): string[] {
  const hasMain = names.includes("メインホール");
  const others = names.filter((n) => n !== "メインホール");
  others.sort((a, b) => {
    const numA = parseInt(a.replace("R", "").split("+")[0], 10);
    const numB = parseInt(b.replace("R", "").split("+")[0], 10);
    if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b);
    if (isNaN(numA)) return 1;
    if (isNaN(numB)) return -1;
    return numA - numB;
  });
  return hasMain ? ["メインホール", ...others] : others;
}

function isOverlap(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
  return !(a.start >= b.end || a.end <= b.start);
}

// item を、既存セッションと時間が重複しないグループに追加する。
// 重複しないグループが無ければ新規グループを作成する。追加先グループの index を返す。
function placeInNonOverlappingGroup(groups: UnifiedSession[][], item: UnifiedSession): number {
  const range = getSessionRange(item);
  for (let i = 0; i < groups.length; i++) {
    const overlaps = groups[i].some((u) => isOverlap(range, getSessionRange(u)));
    if (!overlaps) {
      groups[i].push(item);
      return i;
    }
  }
  groups.push([item]);
  return groups.length - 1;
}

// 指定日のセッションを部屋ごとに振り分け、追加イベント・非公式イベントを統合
export function buildRoomColumns(data: ScheduleData, dayIndex: number, year: string): RoomColumn[] {
  const dayStr = String(dayIndex + 1);
  const setting = findYearSetting(year);

  const dayContent = data.sessions.filter((s) => s.day === dayStr);

  // 部屋ごとにグルーピング
  const roomMap = new Map<string, UnifiedSession[]>();
  // ルーム表記がないセッションは時間が重複しないグループに振り分ける
  const unknownGroups: UnifiedSession[][] = [];

  for (const session of dayContent) {
    const unified: UnifiedSession = { kind: "session", data: session };
    if (session.room && session.room !== "") {
      if (!roomMap.has(session.room)) roomMap.set(session.room, []);
      roomMap.get(session.room)!.push(unified);
    } else {
      placeInNonOverlappingGroup(unknownGroups, unified);
    }
  }
  unknownGroups.forEach((group, i) => roomMap.set(`不明_${i}`, group));

  // ソート済み部屋名でカラムを構築
  const sortedNames = sortRoomNames([...roomMap.keys()]);
  const columns: RoomColumn[] = sortedNames.map((name) => ({
    name: name.startsWith("不明_") ? "不明" : name,
    key: name,
    sessions: roomMap.get(name) ?? [],
  }));

  // 追加イベント（events）を最初の部屋に追加
  if (setting.events && columns.length > 0) {
    for (const ev of setting.events) {
      if (ev.day_index !== dayIndex) continue;
      columns[0].sessions.push({ kind: "event", data: ev });
    }
  }

  // dev_night を ExtraEvent に展開して注入
  const devNight = resolveDevNight(setting);
  if (devNight && devNight.day_index === dayIndex && columns.length > 0) {
    columns[0].sessions.push({ kind: "event", data: devNight });
  }

  // 非公式イベント（CUSTOM_SETTING）— 重複しない部屋にプッシュ
  const customs = CUSTOM_SETTING[year]?.events ?? [];
  for (const ev of customs) {
    if (ev.day_index !== dayIndex) continue;
    placeCustomEvent(columns, ev);
  }

  return columns;
}

function placeCustomEvent(columns: RoomColumn[], ev: ExtraEvent): void {
  const item: UnifiedSession = { kind: "event", data: ev, isCustom: true };
  // columns.map で取り出した sessions 配列は参照が共有されるため、
  // 既存カラムへの push はそのままカラムへ反映される。
  const groups = columns.map((col) => col.sessions);
  const idx = placeInNonOverlappingGroup(groups, item);
  // 既存カラムに収まらない場合は新カラムを追加
  if (idx >= columns.length) {
    columns.push({
      name: ev.room_no || "非公式",
      key: `custom_${idx}`,
      sessions: groups[idx],
    });
  }
}

export function getSessionRange(u: UnifiedSession): { start: number; end: number } {
  const startStr = u.kind === "session" ? u.data.start : u.data.start_time;
  const endStr = u.kind === "session" ? u.data.end : u.data.end_time;
  return { start: parseTimeToMinutes(startStr), end: parseTimeToMinutes(endStr) };
}

export function getSessionStartString(u: UnifiedSession): string {
  return u.kind === "session" ? u.data.start : u.data.start_time;
}

export function getSessionEndString(u: UnifiedSession): string {
  return u.kind === "session" ? u.data.end : u.data.end_time;
}

export function getSessionTitle(u: UnifiedSession): string {
  return u.data.title;
}

// タイトルに講演キャンセル表記を含むか（外部データ由来のマーカー判定）
export function isCanceledSession(title: string): boolean {
  return title.includes("【講演キャンセル】");
}

export function getSessionId(u: UnifiedSession, dayIndex: number): string {
  if (u.kind === "session") return u.data.id;
  // イベントは day + title から ID を生成（既存ロジックに合わせる）
  return `${dayIndex}_event_${u.data.title.split(" ").join("")}`;
}

// 表示すべき時刻範囲（min/max を分で返す）
export function getTimeRange(columns: RoomColumn[]): { min: number; max: number } {
  let min = 24 * 60;
  let max = 0;
  for (const col of columns) {
    for (const u of col.sessions) {
      const r = getSessionRange(u);
      if (r.start < min) min = r.start;
      if (r.end > max) max = r.end;
    }
  }
  if (min > max) {
    return { min: 9 * 60, max: 18 * 60 };
  }
  return { min, max };
}

// 5分刻みの時刻列を生成
export function generateTimeRows(min: number, max: number): string[] {
  return Array.from({ length: Math.floor((max - min) / MIN_MINUTES) + 1 }, (_, i) =>
    formatMinutesToTime(min + i * MIN_MINUTES)
  );
}

// 全カテゴリーをユニーク取得
export function getAllCategories(columns: RoomColumn[]): string[] {
  const set = new Set<string>();
  for (const col of columns) {
    for (const u of col.sessions) {
      if (u.kind !== "session") continue;
      if (u.data.category) set.add(u.data.category);
    }
  }
  return [...set].sort();
}

// お気に入り登録されたセッションだけを抽出した部屋カラムを生成
export function buildFavoriteColumns(
  columns: RoomColumn[],
  favorites: Record<string, boolean>,
  dayIndex: number
): RoomColumn[] {
  const favSessions = columns
    .flatMap((col) => col.sessions)
    .filter((u) => favorites[getSessionId(u, dayIndex)]);
  if (favSessions.length === 0) {
    return [{ name: "お気に入り登録がありません", key: "fav_empty", sessions: [] }];
  }
  const groups: UnifiedSession[][] = [];
  for (const u of favSessions) {
    placeInNonOverlappingGroup(groups, u);
  }
  return groups.map((sessions, i) => ({
    name: `お気に入り ${i + 1}`,
    key: `fav_${i}`,
    sessions,
  }));
}

export interface ScheduleViewModel {
  /** お気に入りモード時はフィルター済み、通常時は全カラム */
  displayColumns: RoomColumn[];
  /** フィルター前の全セッションから抽出したカテゴリ一覧 */
  allCategories: string[];
  /** テーブルの行となる時刻列 */
  timeRows: string[];
}

// 部屋カラム・表示用カラム・時刻軸をまとめて導出する純関数。
// レンダー間のメモ化は React Compiler が呼び出しコンポーネント側で行う。
export function buildScheduleViewModel(
  scheduleData: ScheduleData | null,
  year: string,
  dayIndex: number,
  favoriteMode: boolean,
  favorites: Record<string, boolean>
): ScheduleViewModel {
  const columns = scheduleData ? buildRoomColumns(scheduleData, dayIndex, year) : [];
  const allCategories = getAllCategories(columns);
  const displayColumns = favoriteMode
    ? buildFavoriteColumns(columns, favorites, dayIndex)
    : columns;
  const timeRange = getTimeRange(displayColumns);
  return {
    displayColumns,
    allCategories,
    timeRows: generateTimeRows(timeRange.min, timeRange.max),
  };
}

// ライトニングトークの会場カラムキー（"1-2" = 1日目・第2会場）
function ltColumnKey(talk: Session): string {
  return `${talk.day}-${talk.room}`;
}

// ライトニングトークを「日 × 会場」のカラムへ振り分ける。
// 講演が存在する組み合わせのみを、日→会場の順に並べて返す。
export function buildLightningTalkColumns(talks: Session[]): RoomColumn[] {
  const byColumn = new Map<string, UnifiedSession[]>();
  for (const talk of talks) {
    const key = ltColumnKey(talk);
    if (!byColumn.has(key)) byColumn.set(key, []);
    byColumn.get(key)!.push({ kind: "session", data: talk });
  }

  return [...byColumn.keys()]
    .sort((a, b) => {
      const [dayA, roomA] = a.split("-");
      const [dayB, roomB] = b.split("-");
      return dayA === dayB
        ? roomA.localeCompare(roomB, undefined, { numeric: true })
        : dayA.localeCompare(dayB);
    })
    .map((key) => {
      const [day, room] = key.split("-");
      return {
        name: `Day${day}-${room}`,
        key: `lt_${key}`,
        roomName: `第${room}会場`,
        sessions: byColumn.get(key) ?? [],
      };
    });
}

// ライトニングトークは 6 分刻みで 5 分固定グリッドに乗らず、日によって開催時間も異なる。
// そのため実際に出現する開始・終了時刻の和集合を時刻軸にする。
export function buildLightningTalkTimeRows(columns: RoomColumn[]): string[] {
  const times = new Set<string>();
  for (const col of columns) {
    for (const u of col.sessions) {
      times.add(getSessionStartString(u));
      times.add(getSessionEndString(u));
    }
  }
  return [...times].sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
}

// LT タブ用の ViewModel。全日程を横断するため日付による絞り込みは行わない。
export function buildLightningTalkViewModel(talks: Session[]): ScheduleViewModel {
  const displayColumns = buildLightningTalkColumns(talks);
  return {
    displayColumns,
    allCategories: getAllCategories(displayColumns),
    timeRows: buildLightningTalkTimeRows(displayColumns),
  };
}

export interface CellInfo {
  kind: "session" | "event" | "empty" | "occupied";
  session?: UnifiedSession;
  rowSpan?: number;
  colSpan?: number;
  isFullSpan?: boolean;
}

// 2D マトリクスを構築（rowspan/colspanの占有領域を計算）
export function buildMatrix(timeRows: string[], columns: RoomColumn[]): CellInfo[][] {
  const rowCount = timeRows.length;
  const colCount = columns.length;
  const matrix: CellInfo[][] = Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => ({ kind: "empty" }) as CellInfo)
  );
  const timeIndex = new Map<string, number>();
  timeRows.forEach((t, i) => timeIndex.set(t, i));

  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    const col = columns[colIdx];
    for (const session of col.sessions) {
      const startStr = getSessionStartString(session);
      const endStr = getSessionEndString(session);
      const startIdx = timeIndex.get(startStr);
      if (startIdx === undefined) continue;
      // 高さは行インデックスの差で求める。5分固定でない時刻軸（LT タブ）でも成立させるため。
      // 終了時刻が時刻軸に無い場合（データ不整合）は 1 行として描画する。
      const endIdx = timeIndex.get(endStr);
      const rowSpan = endIdx === undefined ? 1 : Math.max(1, endIdx - startIdx);

      const isFullSpan = session.kind === "event" && session.data.colspan === "all";
      const colSpan = isFullSpan ? colCount : 1;

      matrix[startIdx][colIdx] = {
        kind: session.kind,
        session,
        rowSpan,
        colSpan,
        isFullSpan,
      };

      // rowSpan/colSpan の占有領域をマーク
      for (let r = 0; r < rowSpan; r++) {
        for (let c = 0; c < colSpan; c++) {
          if (r === 0 && c === 0) continue;
          if (startIdx + r >= rowCount) break;
          if (colIdx + c >= colCount) break;
          matrix[startIdx + r][colIdx + c] = { kind: "occupied" };
        }
      }
    }
  }

  return matrix;
}
