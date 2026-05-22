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
}

export interface ScheduleData {
  year: number;
  first_date: string; // "MMDD"
  generated: string; // ISO 8601
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
  hash_tag?: string;
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

export interface YearSetting {
  year: string;
  first_date: string; // "MMDD"
  events?: ExtraEvent[];
  dev_night?: DevNightConfig;
  // CEDiL検索タグID。新年度追加時は未定のため省略し、CEDiL登録後に追記する
  cedil_tag_no?: number;
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

// 非公式イベント
export interface CustomEvent {
  title: string;
  day_index: number;
  start_time: string;
  end_time: string;
  room_no: string;
  detail_url?: string;
  html?: string;
  hash_tag?: string;
}

export interface CustomYearSetting {
  events: CustomEvent[];
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
