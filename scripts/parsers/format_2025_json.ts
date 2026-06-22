import { buildSession, type RawSession } from "../lib/session";
import { dayIndexFromDate, roomNoFromText } from "../lib/helpers";
import { getCategoryName, getFormatName, getTypeName } from "./cedec_taxonomy";
import type { RoomOverride } from "../../src/types/schedule";

/**
 * JSON フォーマット（公式 session/timetable.json 直読み・2025〜 の標準方式）
 *
 * 公式サイトは React アプリが session/timetable.json を fetch して時間割を描画している。
 * 従来の「描画済み HTML を cheerio で再パースする」方式に代わり、その元データである
 * JSON を直接解析して RawSession を組み立てる。出力スキーマは旧 HTML 方式と互換。
 *
 * - posts:    全セッション（held_at / end_time / room / category_id / 等）
 * - speakers: 登壇者辞書（id → { name, company, ... }）
 * - cancel:   { show:{sessions:[id]}, hide:{sessions:[id]} }
 *             show=【講演キャンセル】表示 / hide=非表示（出力しない）
 */

interface RawPost {
  id: number;
  uuid: string;
  title: string;
  held_at: string | null;
  end_time: string | null;
  room: string | null;
  category_id: number | null;
  format_id: number | null;
  type_id: number | null;
  subcategory: number[];
  speakers: number[];
  coming_soon: number;
}

interface RawSpeaker {
  name: string;
  company: string;
}

export interface TimetableJson {
  posts: RawPost[];
  speakers: Record<string, RawSpeaker>;
}

export interface CancelJson {
  show?: { sessions?: Array<string | number> };
  hide?: { sessions?: Array<string | number> };
}

// 汎用形式名はフィルター用カテゴリとして意味がないため、分野なし時のフォールバックから除外する
const GENERIC_FORMATS = [
  "レギュラーセッション",
  "ショートセッション",
  "ライトニングトーク",
  "CEDEC AWARDS",
  "主催者挨拶",
  "事前収録講演",
];

// 公式の描画ロジックに合わせ、種別バッジは type_id 3(スポンサー)/4(協賛)/9(主催者) のみ採用する
const TYPE_AS_CATEGORY = new Set([3, 4, 9]);

/** "2026/07/22 09:30:00" → "09:30"（不正値は ""） */
function toHHMM(datetime: string | null): string {
  if (!datetime) return "";
  const time = datetime.split(" ")[1] ?? "";
  return /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : "";
}

/** id 配列を文字列の Set に正規化（空文字・null を除外） */
function toIdSet(ids: Array<string | number> | undefined): Set<string> {
  const set = new Set<string>();
  for (const id of ids ?? []) {
    const s = String(id).trim();
    if (s !== "") set.add(s);
  }
  return set;
}

/** first_date "MMDD" → [month, day] */
function parseFirstDate(firstDate: string): [number, number] {
  return [parseInt(firstDate.slice(0, 2), 10), parseInt(firstDate.slice(2, 4), 10)];
}

export function parseFormat2025Json(
  data: TimetableJson,
  cancel: CancelJson,
  year: string,
  firstDate: string,
  roomOverrides: RoomOverride[] = []
): RawSession[] {
  const [firstMonth, firstDay] = parseFirstDate(firstDate);
  const showIds = toIdSet(cancel.show?.sessions);
  const hideIds = toIdSet(cancel.hide?.sessions);

  const sessions: RawSession[] = [];

  for (const post of data.posts) {
    // 公開前（近日公開予定）・非表示指定は出力しない
    if (post.coming_soon === 1) continue;
    if (hideIds.has(String(post.id))) continue;
    if (!post.held_at || !post.title) continue;

    const start = toHHMM(post.held_at);
    const end = toHHMM(post.end_time);
    if (start === "") continue;

    // 開催初日基準の day（1〜3）。held_at = "YYYY/MM/DD HH:MM:SS"
    const dateStr = post.held_at.split(" ")[0] ?? "";
    const [, mm, dd] = dateStr.split("/").map((s) => parseInt(s, 10));
    const day = dayIndexFromDate(mm, dd, firstMonth, firstDay);

    // 分野: category_id → subcategory[] の順でコード化（12 は除外）
    const cats: string[] = [];
    const mainCat = getCategoryName(post.category_id);
    if (mainCat !== "") cats.push(mainCat);
    for (const sc of post.subcategory ?? []) {
      const name = getCategoryName(sc);
      if (name !== "") cats.push(name);
    }

    let category = cats[0] ?? "";
    let subCategory = cats.slice(1).join(",");

    // 分野なし（基調講演・主催者挨拶等）は形式名→種別名にフォールバック
    if (category === "") {
      const formatName = getFormatName(post.format_id);
      const typeName = TYPE_AS_CATEGORY.has(post.type_id ?? -1) ? getTypeName(post.type_id) : "";
      if (!GENERIC_FORMATS.includes(formatName)) {
        category = formatName !== "" ? formatName : typeName;
      }
    }

    // 前後空白（全角含む）は除去。HTML 方式の .text().trim() と挙動を揃える
    let speakers: RawSpeaker[] = (post.speakers ?? []).flatMap((sid) => {
      const sp = data.speakers[String(sid)];
      return sp?.name ? [{ name: sp.name.trim(), company: (sp.company ?? "").trim() }] : [];
    });

    // 中止セッションは公式描画と同様に分野・登壇者を伏せ、タイトルへ印を付ける
    const cancelled = showIds.has(String(post.id));
    let title = post.title;
    if (cancelled) {
      title = `【講演キャンセル】${post.title}`;
      category = "";
      subCategory = "";
      speakers = [];
    }

    // 会場名: 原則 "第N会場" → "N"。年度固有のスポンサー会場名があれば上書きする
    const roomRaw = post.room ?? "";
    const override = roomOverrides.find(
      (o) => o.room === roomRaw && (o.day === undefined || o.day === day)
    );
    const roomNo = override ? override.display : roomNoFromText(roomRaw);

    sessions.push(
      buildSession({
        session_id: post.uuid,
        day,
        room_no: roomNo,
        start,
        end,
        category,
        sub_category: subCategory,
        title,
        speakers,
        detail_url: `/${year}/timetable/detail/${post.uuid}/`,
      })
    );
  }

  return sessions;
}
