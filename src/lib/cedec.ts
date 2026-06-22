import type {
  YearSetting,
  CashInfo,
  CategoryCode,
  ExtraEvent,
  DevNightConfig,
} from "@/types/schedule";

// 年度別設定
// 　※eventsは、2019年以前は、CEDEC AWARDSなどのイベントのために利用
// 　 以降はセッション一覧に表記されるようになったため、未使用
// prettier-ignore
export const SCHEDULE_SETTING: YearSetting[] = [
  { year: "2026", first_date: "0722",                     dev_night: { rel_path: "event/developer/", room_no: "1階「G7＋G8」" }, },
  { year: "2025", first_date: "0722", cedil_tag_no: 756,  dev_night: { rel_path: "event/developer/", room_no: "多目的ホール" }, room_overrides: [{ day: 1, room: "第13会場", display: "Epic部屋" }], },
  { year: "2024", first_date: "0821", cedil_tag_no: 752,  dev_night: { rel_path: "event/developer/", room_no: "多目的ホール" }, },
  { year: "2023", first_date: "0823", cedil_tag_no: 748 },
  { year: "2022", first_date: "0823", cedil_tag_no: 743,},
  { year: "2021", first_date: "0824", cedil_tag_no: 740 },
  { year: "2020", first_date: "0902", cedil_tag_no: 728 },
  {
    year: "2019", first_date: "0904", cedil_tag_no: 720,
    dev_night: { rel_path: "event/developer.html", room_no: "501＋502" },
    events: [
      { 
        title: "CEDEC AWARDS",  day_index: 1, start_time: "17:50",  end_time: "19:25", colspan: "all" as const,
        room_no: "メインホール",  html: "※公式サイトに終了時間は明記されていません<br/>",
      },
    ],
  },
  {
    year: "2018", first_date: "0822", cedil_tag_no: 717,
    dev_night: { rel_path: "event/developer.html", room_no: "501＋502" },
    events: [
      { 
        title: "CEDEC AWARDS",  day_index: 1, start_time: "17:50",  end_time: "19:25", colspan: "all" as const,
        room_no: "メインホール",  html: "※公式サイトに終了時間は明記されていません<br/>",
      },
    ],
  },
  { year: "2017", first_date: "0830", cedil_tag_no: 713 },
  { year: "2016", first_date: "0824", cedil_tag_no: 712 },
  { year: "2015", first_date: "0826", cedil_tag_no: 709 },
  { year: "2014", first_date: "0902", cedil_tag_no: 9 },
  { year: "2013", first_date: "0821", cedil_tag_no: 8 },
  { year: "2012", first_date: "0820", cedil_tag_no: 4 },
  { year: "2011", first_date: "0906", cedil_tag_no: 6 },
];

// データ取得タイムスタンプ（手動更新・旧HTML方式の年度のみ）
// JSON方式（2025〜）は schedule.json の `fetched` を使うためここには記載しない。
export const CASH_SETTING: Record<string, CashInfo> = {
  "2024": { time: "2024/08/19 23:00" },
  "2023": { time: "2023/08/23 01:23" },
  "2022": { time: "2022/08/28 16:00" },
  "2021": { time: "2021/08/24 00:30" },
  "2020": { time: "2020/09/07 16:00" },
  "2019": { time: "2026/05/16 12:00" },
  "2018": { time: "2026/05/16 12:00" },
  "2017": { time: "2026/05/16 12:00" },
  "2016": { time: "2026/05/16 12:00" },
  "2015": { time: "2026/05/16 12:00" },
  "2014": { time: "2026/05/16 12:00" },
  "2013": { time: "2026/05/16 12:00" },
  "2012": { time: "2026/05/16 12:00" },
  "2011": { time: "2026/05/16 12:00" },
};

export const TIME_SPAN = 3;
export const MIN_MINUTES = 5;
export const DEFAULT_YEAR = "2026";

// 年度から公式サイトのドメインを導出する（全年度 https://cedec.cesa.or.jp/{year}/ に統一）
export function getDomain(year: string): string {
  return `https://cedec.cesa.or.jp/${year}/`;
}

// カテゴリーコード → CSS変数名のマッピング
export const SPEC_CLASS: Record<string, string> = {
  ENG: "cat-eng",
  VA: "cat-va",
  PRD: "cat-prd",
  BP: "cat-bp",
  SND: "cat-snd",
  GD: "cat-gd",
  AC: "cat-ac",
  NW: "cat-nw",
  // 2011/2012 固有コード（ENGまたはBPと同色）
  PG: "cat-eng",
  PD: "cat-bp",
  BM: "cat-bp",
  基調講演: "cat-keynote",
};

// dev_night 設定を ExtraEvent に展開する
export function resolveDevNight(setting: YearSetting): ExtraEvent | null {
  const dn: DevNightConfig | undefined = setting.dev_night;
  if (!dn) return null;
  const url = getDomain(setting.year) + dn.rel_path;
  return {
    title: "Developers' Night",
    day_index: dn.day_index ?? 1,
    start_time: dn.start_time ?? "19:30",
    end_time: dn.end_time ?? "21:30",
    room_no: dn.room_no,
    colspan: "all",
    detail_url: url,
    html: "※会場で先着販売",
  };
}

export function findYearSetting(year: string): YearSetting {
  return SCHEDULE_SETTING.find((s) => s.year === year) ?? SCHEDULE_SETTING[0];
}

export function isValidYear(year: string): boolean {
  return SCHEDULE_SETTING.some((s) => s.year === year);
}

export function getAllYears(): string[] {
  return SCHEDULE_SETTING.map((s) => s.year);
}

// 開催日のDateリストを取得
export function getDateList(setting: YearSetting): Date[] {
  const month = parseInt(setting.first_date.slice(0, 2), 10);
  const firstDay = parseInt(setting.first_date.slice(2, 4), 10);
  const list: Date[] = [];
  for (let i = 0; i < TIME_SPAN; ++i) {
    list.push(new Date(parseInt(setting.year, 10), month - 1, firstDay + i));
  }
  return list;
}

// "HH:MM" → 分（int）
export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map((s) => parseInt(s, 10));
  return h * 60 + m;
}

// 分（int） → "HH:MM"
export function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// 部屋名からフロアマップURLを生成（年度別ロジック）
export function getFloorURL(roomName: string, year: string): string | undefined {
  if (roomName === "不明" || roomName === "オンライン") return undefined;

  const yearNum = parseInt(year, 10);
  const FLOOR_GUIDE_URL =
    "http://www.pacifico.co.jp/visitor/floorguide/conference/tabid/204/Default.aspx";

  if (yearNum <= 2019) {
    const floorURL = FLOOR_GUIDE_URL + "#floor";
    if (roomName === "メインホール") return floorURL + "1";
    if (roomName.startsWith("R")) return floorURL + roomName.charAt(1);
    const floorNo = parseInt(roomName.charAt(0), 10);
    if (floorNo >= 1 && floorNo <= 6) return floorURL + floorNo;
  } else if (yearNum <= 2021) {
    return encodeURI(`https://cedec.cesa.or.jp/${year}/enquete/live/第${roomName}会場`);
  } else if (yearNum <= 2022) {
    return encodeURI(
      `https://cedec.cesa.or.jp/${year}/session/live/VNE${("00" + roomName).slice(-2)}`
    );
  }
  return undefined;
}

// セッション詳細URLを絶対URL化
export function resolveDetailUrl(detailUrl: string, year: string): string {
  if (!detailUrl) return "";
  if (detailUrl.startsWith("http")) return detailUrl;
  // javascript: / data: 等の危険スキームを弾く（そのまま base に連結すると safeExternalUrl をすり抜けるため）
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(detailUrl)) return "";
  const domain = getDomain(year);
  // detail_url が /YYYY/ で始まる場合（2024/2025 形式）は domain から年号を除去してベースを作る
  // それ以外の相対パス（2018/2019 形式）は domain をそのままベースとして使う
  const base = /^\/[0-9]{4}\//.test(detailUrl)
    ? domain.replace(/\/[0-9]{4}\/$/, "").replace(/\/$/, "")
    : domain.replace(/\/$/, "");
  return base + (detailUrl.startsWith("/") ? detailUrl : "/" + detailUrl);
}

export function getYoutubeURL(session: { youtube?: string; live?: string }): string | undefined {
  return session.live || session.youtube || undefined;
}

export function getCategoryClass(category: string): string | undefined {
  return SPEC_CLASS[category];
}

export type { CategoryCode };
