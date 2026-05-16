import type { YearSetting, CashInfo, CategoryCode } from "@/types/schedule";

// 年度別設定（impl/cedec.js の SCHEDULE_SETTING を移植）
export const SCHEDULE_SETTING: YearSetting[] = [
  {
    year: "2025",
    first_date: "0722",
    domain: "https://cedec.cesa.or.jp/2025/",
    cedil_tag_no: 756,
    events: [
      {
        title: "Developers' Night",
        day_index: 1,
        start_time: "19:30",
        end_time: "21:30",
        room_no: "多目的ホール",
        html: '※会場で先着500名の限定販売<br/><a href="https://cedec.cesa.or.jp/2025/event/developer/" target="_blank" rel="noopener">詳細</a>',
      },
    ],
  },
  {
    year: "2024",
    first_date: "0821",
    domain: "https://cedec.cesa.or.jp/2024/",
    cedil_tag_no: 752,
    events: [
      {
        title: "Developers' Night",
        day_index: 1,
        start_time: "19:30",
        end_time: "21:30",
        room_no: "多目的ホール",
        html: '※会場で先着500名の限定販売<br/><a href="https://cedec.cesa.or.jp/2024/event/developer/" target="_blank" rel="noopener">詳細</a>',
      },
    ],
  },
  {
    year: "2023",
    first_date: "0823",
    domain: "https://cedec.cesa.or.jp/2023/",
    cedil_tag_no: 748,
  },
  {
    year: "2022",
    first_date: "0823",
    domain: "https://cedec.cesa.or.jp/2022/",
    cedil_tag_no: 743,
    events: [
      {
        title: "CEDEC AWARDS",
        day_index: 1,
        start_time: "17:30",
        end_time: "19:00",
        room_no: "1",
        colspan: "all",
        html: "※公式サイトに終了時間は明記されていません<br/>",
      },
    ],
  },
  {
    year: "2021",
    first_date: "0824",
    domain: "https://cedec.cesa.or.jp/2021/",
    cedil_tag_no: 740,
    events: [
      {
        title: "CEDEC AWARDS",
        day_index: 1,
        start_time: "17:30",
        end_time: "19:00",
        room_no: "1",
        colspan: "all",
        html: "※公式サイトに終了時間は明記されていません<br/>",
      },
    ],
  },
  {
    year: "2020",
    first_date: "0902",
    domain: "https://cedec.cesa.or.jp/2020/",
    cedil_tag_no: 728,
  },
  {
    year: "2019",
    first_date: "0904",
    domain: "https://cedec.cesa.or.jp/2019/",
    cedil_tag_no: 720,
    events: [
      {
        title: "CEDEC AWARDS",
        day_index: 1,
        start_time: "17:50",
        end_time: "19:25",
        room_no: "メインホール",
        colspan: "all" as const,
        html: "※公式サイトに終了時間は明記されていません<br/>",
      },
      {
        title: "Developer's Night",
        day_index: 1,
        start_time: "19:30",
        end_time: "21:30",
        room_no: "501＋502",
        colspan: "all" as const,
        html: "※CEDEC AWARDS終了後に開始<br/>※会期中、2F総合受付にてチケットを販売<br/>",
      },
    ],
  },
  {
    year: "2018",
    first_date: "0822",
    domain: "https://2018.cedec.cesa.or.jp/",
    cedil_tag_no: 717,
    events: [
      {
        title: "CEDEC AWARDS",
        day_index: 1,
        start_time: "17:50",
        end_time: "19:25",
        room_no: "メインホール",
        colspan: "all" as const,
        html: "※公式サイトに終了時間は明記されていません<br/>",
      },
      {
        title: "Developer's Night",
        day_index: 1,
        start_time: "19:30",
        end_time: "21:30",
        room_no: "501＋502",
        colspan: "all" as const,
        html: "※CEDEC AWARDS終了後に開始<br/>※会期中、2F総合受付にてチケットを販売<br/>",
      },
    ],
  },
  {
    year: "2017",
    first_date: "0830",
    domain: "http://cedec.cesa.or.jp/",
    cedil_tag_no: 713,
  },
  {
    year: "2016",
    first_date: "0824",
    domain: "http://cedec.cesa.or.jp/",
    cedil_tag_no: 712,
  },
];

// データ取得タイムスタンプ（手動更新）
export const CASH_SETTING: Record<string, CashInfo> = {
  "2025": { time: "2026/05/03 22:00" },
  "2024": { time: "2024/08/19 23:00" },
  "2023": { time: "2023/08/23 01:23" },
  "2022": { time: "2022/08/28 16:00" },
  "2021": { time: "2021/08/24 00:30" },
  "2020": { time: "2020/09/07 16:00" },
  "2019": { time: "2019/09/10 16:00" },
  "2018": { time: "2018/08/23 20:00" },
  "2017": { time: "2017/08/25 23:30" },
  "2016": { time: "2017/08/25 23:30" },
};

export const TIME_SPAN = 3;
export const MIN_MINUTES = 5;
export const DEFAULT_YEAR = "2025";

// カテゴリーコード → CSS変数名のマッピング
export const SPEC_CLASS: Record<string, string> = {
  ENG: "cat-eng",
  VA: "cat-va",
  PRD: "cat-prd",
  BP: "cat-bp",
  SND: "cat-snd",
  GD: "cat-gd",
  AC: "cat-ac",
  基調講演: "cat-keynote",
};

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
export function resolveDetailUrl(detailUrl: string, domain: string): string {
  if (!detailUrl) return "";
  if (detailUrl.startsWith("http")) return detailUrl;
  // javascript: / data: 等の危険スキームを弾く（そのまま base に連結すると safeExternalUrl をすり抜けるため）
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(detailUrl)) return "";
  const base = domain.replace(/\/[0-9]{4}\/$/, "").replace(/\/$/, "");
  return base + (detailUrl.startsWith("/") ? detailUrl : "/" + detailUrl);
}

export function getYoutubeURL(session: { youtube?: string; live?: string }): string | undefined {
  return session.live || session.youtube || undefined;
}

export function getCategoryClass(category: string): string | undefined {
  return SPEC_CLASS[category];
}

export type { CategoryCode };
