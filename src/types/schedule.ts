// schedule.json の型定義
export type CategoryCode =
  | "ENG"
  | "VA"
  | "PRD"
  | "BP"
  | "SND"
  | "GD"
  | "AC"
  | "NW"
  | "PG"
  | "PD"
  | "BM"
  | "基調講演"
  | "";

export interface Speaker {
  name: string;
  company: string;
}

export interface Session {
  id: string;
  day: string; // "1" | "2" | "3"
  room: string; // "1"〜"13" | "メインホール" | "Epic部屋" | ""
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  category: CategoryCode;
  title: string;
  speakers: Speaker[];
  detail_url: string;
  sub_category?: CategoryCode[];
  youtube?: string;
  live?: string;
  // 招待・特別招待・団体招待・海外招待のいずれか（JSON方式の年度のみ判定可能）
  is_invited?: boolean;
}

export interface ScheduleData {
  year: number;
  first_date: string; // "MMDD"
  generated: string; // ISO 8601
  // データ取得日時（"YYYY/MM/DD HH:MM" JST）。JSON方式（2025〜）の年度のみ付与され、
  // フロントの「取得日時」表示に使う。未付与の年度は CASH_SETTING にフォールバックする。
  fetched?: string;
  sessions: Session[];
}

// 年度別設定（events含む追加イベント）
export interface ExtraEvent {
  title: string;
  day_index: number; // 0起算
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  room_no: string;
  detail_url?: string;
  html?: string;
  hash_tag?: string[];
  colspan?: "all" | number;
  youtube?: string;
}

export interface DevNightConfig {
  rel_path: string; // domain からの相対パス（例: "event/developer/"）
  room_no: string;
  // 以下は省略時デフォルト値を使用
  day_index?: number; // 省略時: 1
  start_time?: string; // 省略時: "19:30"
  end_time?: string; // 省略時: "21:30"
}

// 会場の表示名上書き（公式が特定日・特定会場をスポンサー名で表示するケース。例: 2025 day1 第13会場→Epic部屋）
export interface RoomOverride {
  room: string; // 公式 JSON の room 値（例: "第13会場"）
  display: string; // 表示名（例: "Epic部屋"）
  day?: number; // 対象の開催日（1〜3）。省略時は全日
}

export interface YearSetting {
  year: string;
  first_date: string; // "MMDD"
  events?: ExtraEvent[];
  dev_night?: DevNightConfig;
  // CEDiL検索タグID。新年度追加時は未定のため省略し、CEDiL登録後に追記する
  cedil_tag_no?: number;
  // 会場表示名の上書き（JSON方式の年度のみ・公式のスポンサー会場名に追従するため）
  room_overrides?: RoomOverride[];
}

export interface CashInfo {
  time: string; // "YYYY/MM/DD HH:MM"
}

// CEDiL データ
export interface CedilItem {
  title: string;
  url: string;
  date?: number;
}

export interface CedilData {
  list: CedilItem[];
  update_date: string;
}

// 非公式イベント（追加イベントと同じ ExtraEvent 型で表現する）
export interface CustomYearSetting {
  events: ExtraEvent[];
}

// セッション統合型（公式 + 追加 + 非公式）
export type UnifiedSession =
  | { kind: "session"; data: Session }
  | { kind: "event"; data: ExtraEvent; isCustom?: boolean };

// 表示用
export interface RoomColumn {
  name: string; // 部屋名（表示用）
  key: string; // 内部キー（重複回避のためサフィックスあり）
  sessions: UnifiedSession[];
}
