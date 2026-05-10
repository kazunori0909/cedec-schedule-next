import type {
  ScheduleData,
  Session,
  ExtraEvent,
  RoomColumn,
  UnifiedSession,
  YearSetting,
} from "@/types/schedule";
import { findYearSetting, parseTimeToMinutes, MIN_MINUTES } from "@/lib/cedec";
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

// 指定日のセッションを部屋ごとに振り分け、追加イベント・非公式イベントを統合
export function buildRoomColumns(data: ScheduleData, dayIndex: number, year: string): RoomColumn[] {
  const dayStr = String(dayIndex + 1);
  const setting = findYearSetting(year);

  const dayContent = data.sessions.filter((s) => s.day === dayStr);

  // 部屋ごとにグルーピング
  const roomMap = new Map<string, UnifiedSession[]>();
  let unknownCounter = 0;

  for (const session of dayContent) {
    if (session.room && session.room !== "") {
      if (!roomMap.has(session.room)) roomMap.set(session.room, []);
      roomMap.get(session.room)!.push({ kind: "session", data: session });
    } else {
      // ルーム表記がない場合は不明_N に詰める
      const sStart = parseTimeToMinutes(session.start);
      const sEnd = parseTimeToMinutes(session.end);
      let placed = false;
      for (const [roomName, list] of roomMap) {
        if (!roomName.startsWith("不明_")) continue;
        const overlaps = list.some((u) => {
          if (u.kind !== "session") return false;
          return isOverlap(
            { start: sStart, end: sEnd },
            {
              start: parseTimeToMinutes(u.data.start),
              end: parseTimeToMinutes(u.data.end),
            }
          );
        });
        if (!overlaps) {
          list.push({ kind: "session", data: session });
          placed = true;
          break;
        }
      }
      if (!placed) {
        const newRoom = `不明_${unknownCounter++}`;
        roomMap.set(newRoom, [{ kind: "session", data: session }]);
      }
    }
  }

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

  // 非公式イベント（CUSTOM_SETTING）— 重複しない部屋にプッシュ
  const customs = CUSTOM_SETTING[year]?.events ?? [];
  for (const ev of customs) {
    if (ev.day_index !== dayIndex) continue;
    placeCustomEvent(columns, ev);
  }

  return columns;
}

function placeCustomEvent(
  columns: RoomColumn[],
  ev: { start_time: string; end_time: string }
): void {
  const evStart = parseTimeToMinutes(ev.start_time);
  const evEnd = parseTimeToMinutes(ev.end_time);

  for (const col of columns) {
    const overlaps = col.sessions.some((u) => {
      const range = getSessionRange(u);
      return isOverlap({ start: evStart, end: evEnd }, range);
    });
    if (!overlaps) {
      col.sessions.push({ kind: "event", data: ev as ExtraEvent, isCustom: true });
      return;
    }
  }
  // 既存カラムに収まらない場合は新カラムを追加
  columns.push({
    name: (ev as ExtraEvent).room_no || "非公式",
    key: `custom_${columns.length}`,
    sessions: [{ kind: "event", data: ev as ExtraEvent, isCustom: true }],
  });
}

export function getSessionRange(u: UnifiedSession): { start: number; end: number } {
  if (u.kind === "session") {
    return {
      start: parseTimeToMinutes(u.data.start),
      end: parseTimeToMinutes(u.data.end),
    };
  }
  return {
    start: parseTimeToMinutes(u.data.start_time),
    end: parseTimeToMinutes(u.data.end_time),
  };
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
  const rows: string[] = [];
  for (let t = min; t <= max; t += MIN_MINUTES) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    rows.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
  }
  return rows;
}

// セッションが何行を占めるか（rowSpan）
export function getRowSpan(startStr: string, endStr: string): number {
  const s = parseTimeToMinutes(startStr);
  const e = parseTimeToMinutes(endStr);
  return Math.max(1, (e - s) / MIN_MINUTES);
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
  const favSessions: UnifiedSession[] = [];
  for (const col of columns) {
    for (const u of col.sessions) {
      const id = getSessionId(u, dayIndex);
      if (favorites[id]) favSessions.push(u);
    }
  }
  if (favSessions.length === 0) {
    return [{ name: "お気に入り登録がありません", key: "fav_empty", sessions: [] }];
  }
  const cols: RoomColumn[] = [];
  for (const u of favSessions) {
    let placed = false;
    for (const col of cols) {
      const overlap = col.sessions.some((other) => {
        const a = getSessionRange(u);
        const b = getSessionRange(other);
        return !(a.start >= b.end || a.end <= b.start);
      });
      if (!overlap) {
        col.sessions.push(u);
        placed = true;
        break;
      }
    }
    if (!placed) {
      cols.push({
        name: `お気に入り ${cols.length + 1}`,
        key: `fav_${cols.length}`,
        sessions: [u],
      });
    }
  }
  return cols;
}

export type { RoomColumn, UnifiedSession, YearSetting, Session, ExtraEvent };
