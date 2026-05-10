import type { Speaker } from "../../src/types/schedule";

/**
 * パーサーが返す内部セッション型。
 * PHP の build_session() と同じ構造。
 * sub_category はカンマ区切り文字列で持ち、JSON 出力時に配列化する。
 */
export interface RawSession {
  session_id: string;
  day: number;
  room_no: string;
  start: string;
  end: string;
  category: string;
  sub_category: string;
  data_filter: string;
  title: string;
  speakers: Speaker[];
  detail_url: string;
  cancelled: boolean;
  live?: string | null;
  youtube?: string | null;
}

export interface BuildSessionArgs {
  session_id: string;
  day: number;
  room_no: string;
  start: string;
  end: string;
  category: string;
  sub_category?: string;
  data_filter?: string;
  title: string;
  speakers: Speaker[];
  detail_url: string;
  cancelled?: boolean;
}

export function buildSession(args: BuildSessionArgs): RawSession {
  return {
    session_id: args.session_id,
    day: args.day,
    room_no: args.room_no,
    start: args.start,
    end: args.end,
    category: args.category,
    sub_category: args.sub_category ?? "",
    data_filter: args.data_filter ?? "",
    title: args.title,
    speakers: args.speakers,
    detail_url: args.detail_url,
    cancelled: args.cancelled ?? false,
    live: null,
    youtube: null,
  };
}
