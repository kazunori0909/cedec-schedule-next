import { buildSession, type RawSession } from "../lib/session";
import { dayIndexFromDate, roomNoFromText } from "../lib/helpers";
import {
  FORMAT_ID_LIGHTNING_TALK,
  getCategoryName,
  getFormatName,
  getTypeName,
} from "./cedec_taxonomy";
import { formatMinutesToTime, parseTimeToMinutes } from "../../src/lib/cedec";
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
 *
 * ライトニングトーク（format_id=22）だけは親ポストが「LT 枠」を表し、個々の講演は
 * children に入る。これは parseLightningTalks で別途展開する。
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
  // LT 枠の子ポスト（個々の LT 講演）。子は held_at ではなく held_at_as_child を持つ
  children?: RawPost[];
  held_at_as_child?: string | null;
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

// 招待系種別: 招待(2)/特別招待(5)/団体招待(6)/海外招待(7)
const INVITED_TYPE_IDS = new Set([2, 5, 6, 7]);

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

/** "2026/07/22 09:30:00" の日付部分から開催初日基準の day（1〜3）を求める */
function toDay(datetime: string | null | undefined, firstMonth: number, firstDay: number): number {
  const dateStr = datetime?.split(" ")[0] ?? "";
  const [, mm, dd] = dateStr.split("/").map((s) => parseInt(s, 10));
  return dayIndexFromDate(mm, dd, firstMonth, firstDay);
}

/** 分野コードを解決する。分野なし（基調講演・主催者挨拶等）は形式名→種別名にフォールバック */
function resolveCategory(post: RawPost): { category: string; subCategory: string } {
  // 分野: category_id → subcategory[] の順でコード化（12 は除外）
  const cats: string[] = [];
  const mainCat = getCategoryName(post.category_id);
  if (mainCat !== "") cats.push(mainCat);
  for (const sc of post.subcategory ?? []) {
    const name = getCategoryName(sc);
    if (name !== "") cats.push(name);
  }

  let category = cats[0] ?? "";
  if (category === "") {
    const formatName = getFormatName(post.format_id);
    const typeName = TYPE_AS_CATEGORY.has(post.type_id ?? -1) ? getTypeName(post.type_id) : "";
    if (!GENERIC_FORMATS.includes(formatName)) {
      category = formatName !== "" ? formatName : typeName;
    }
  }
  return { category, subCategory: cats.slice(1).join(",") };
}

/** 登壇者 ID を辞書で引いて展開する（前後空白（全角含む）は除去し HTML 方式の .text().trim() と揃える） */
function resolveSpeakers(post: RawPost, dict: Record<string, RawSpeaker>): RawSpeaker[] {
  return (post.speakers ?? []).flatMap((sid) => {
    const sp = dict[String(sid)];
    return sp?.name ? [{ name: sp.name.trim(), company: (sp.company ?? "").trim() }] : [];
  });
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
    const day = toDay(post.held_at, firstMonth, firstDay);

    let { category, subCategory } = resolveCategory(post);
    let speakers = resolveSpeakers(post, data.speakers);
    let isInvited = INVITED_TYPE_IDS.has(post.type_id ?? -1);

    // 中止セッションは公式描画と同様に分野・登壇者を伏せ、タイトルへ印を付ける
    const cancelled = showIds.has(String(post.id));
    let title = post.title;
    if (cancelled) {
      title = `【講演キャンセル】${post.title}`;
      category = "";
      subCategory = "";
      speakers = [];
      isInvited = false;
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
        is_invited: isInvited,
      })
    );
  }

  return sessions;
}

/** 開始時刻の並びが 1 件しかない等で枠長を決められない場合の既定値（分） */
const DEFAULT_LT_SLOT_MINUTES = 6;

/** 開始時刻（分）の並びから 1 講演あたりの標準枠長を求める（連続する開始間隔の最頻値） */
function resolveSlotMinutes(startMinutes: number[]): number {
  const counts = new Map<number, number>();
  for (let i = 1; i < startMinutes.length; i++) {
    const gap = startMinutes[i] - startMinutes[i - 1];
    if (gap > 0) counts.set(gap, (counts.get(gap) ?? 0) + 1);
  }

  let mode = 0;
  let modeCount = 0;
  for (const [gap, count] of counts) {
    if (count > modeCount) {
      mode = gap;
      modeCount = count;
    }
  }
  return mode > 0 ? mode : DEFAULT_LT_SLOT_MINUTES;
}

/**
 * ライトニングトーク（format_id=22）の親ポストが持つ children を、個々の LT 講演として展開する。
 *
 * 親ポストは「CEDEC Lightning 2026　第1会場　1日目」のような 30 分の枠を表し、
 * 公式タイムテーブルにはこの枠しか現れない。子ポストが実際の講演で、
 *   - 開始時刻は held_at（null）ではなく held_at_as_child に入る
 *   - end_time は常に null
 * のため、終了時刻は「次の講演の開始時刻」から導出する。最後の 1 件は
 * 「開始 + 標準枠長」と親枠の終了時刻の早い方を採用する（講演数が枠の定員に満たない回で
 * 最後の 1 件が枠の終わりまで不当に伸びるのを防ぐ）。
 *
 * 親ポスト自体は parseFormat2025Json 側で通常セッションとして出力され続ける
 * （Day タブで「この時間に LT 枠がある」ことが分かる状態を保つため）。
 */
export function parseLightningTalks(
  data: TimetableJson,
  cancel: CancelJson,
  firstDate: string
): RawSession[] {
  const [firstMonth, firstDay] = parseFirstDate(firstDate);
  const showIds = toIdSet(cancel.show?.sessions);
  const hideIds = toIdSet(cancel.hide?.sessions);

  const talks: RawSession[] = [];

  for (const parent of data.posts) {
    if (parent.format_id !== FORMAT_ID_LIGHTNING_TALK) continue;

    // 開始時刻を持つ子だけを対象に、開始時刻順へ並べ替える（公式 JSON の並びは不定）
    const ordered = (parent.children ?? [])
      .flatMap((child) => {
        const start = toHHMM(child.held_at_as_child ?? null);
        return start !== "" && child.title ? [{ child, start }] : [];
      })
      .sort((a, b) => a.start.localeCompare(b.start));
    if (ordered.length === 0) continue;

    const startMinutes = ordered.map((o) => parseTimeToMinutes(o.start));
    const slotMinutes = resolveSlotMinutes(startMinutes);
    const parentEndStr = toHHMM(parent.end_time);
    const parentEnd = parentEndStr === "" ? Infinity : parseTimeToMinutes(parentEndStr);

    for (let i = 0; i < ordered.length; i++) {
      const { child, start } = ordered[i];
      // 終了時刻は先に全件分求めてから除外判定を行う（非表示の講演が間にあっても枠の並びは崩さない）
      const endMinutes =
        i + 1 < ordered.length
          ? startMinutes[i + 1]
          : Math.min(startMinutes[i] + slotMinutes, parentEnd);

      if (child.coming_soon === 1) continue;
      if (hideIds.has(String(child.id))) continue;

      let { category, subCategory } = resolveCategory(child);
      let speakers = resolveSpeakers(child, data.speakers);
      let title = child.title;
      if (showIds.has(String(child.id))) {
        title = `【講演キャンセル】${child.title}`;
        category = "";
        subCategory = "";
        speakers = [];
      }

      talks.push(
        buildSession({
          session_id: child.uuid,
          day: toDay(child.held_at_as_child ?? parent.held_at, firstMonth, firstDay),
          room_no: roomNoFromText(child.room ?? parent.room ?? ""),
          start,
          end: formatMinutesToTime(endMinutes),
          category,
          sub_category: subCategory,
          title,
          speakers,
          // 個々の LT 講演に固有の詳細ページは存在しない（枠単位のページのみ）
          detail_url: "",
        })
      );
    }
  }

  return talks;
}
