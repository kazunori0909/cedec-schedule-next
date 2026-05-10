import { describe, expect, it } from "vitest";

import type { RoomColumn, ScheduleData, Session } from "@/types/schedule";
import {
  buildFavoriteColumns,
  buildRoomColumns,
  generateTimeRows,
  getAllCategories,
  getRowSpan,
  getSessionId,
  getSessionRange,
  getTimeRange,
} from "@/lib/schedule";

// ---------------------------------------------------------------------------
// テスト用ファクトリ
// ---------------------------------------------------------------------------
function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "s1",
    day: "1",
    room: "1",
    start: "10:00",
    end: "11:00",
    category: "ENG",
    data_filter: "",
    title: "テストセッション",
    speakers: [],
    detail_url: "",
    ...overrides,
  };
}

// 2020年度のスケジュールデータ（events・カスタムイベントなし）
function makeScheduleData(sessions: Session[]): ScheduleData {
  return {
    year: 2020,
    first_date: "0902",
    domain: "https://cedec.cesa.or.jp/2020/",
    generated: "2020-09-07T16:00:00Z",
    sessions,
  };
}

// ---------------------------------------------------------------------------
// getRowSpan
// ---------------------------------------------------------------------------
describe("getRowSpan", () => {
  it("60分セッションは rowSpan 12（5分刻み）", () => {
    expect(getRowSpan("10:00", "11:00")).toBe(12);
  });

  it("30分セッションは rowSpan 6", () => {
    expect(getRowSpan("10:00", "10:30")).toBe(6);
  });

  it("5分セッションは rowSpan 1", () => {
    expect(getRowSpan("10:00", "10:05")).toBe(1);
  });

  it("同じ時刻（0分）は最小値 1 を返す", () => {
    expect(getRowSpan("10:00", "10:00")).toBe(1);
  });

  it("90分セッションは rowSpan 18", () => {
    expect(getRowSpan("13:00", "14:30")).toBe(18);
  });
});

// ---------------------------------------------------------------------------
// generateTimeRows
// ---------------------------------------------------------------------------
describe("generateTimeRows", () => {
  it("540 〜 570 の範囲で 5 分刻みの時刻文字列配列を返す", () => {
    const rows = generateTimeRows(540, 570);
    expect(rows).toEqual(["09:00", "09:05", "09:10", "09:15", "09:20", "09:25", "09:30"]);
  });

  it("min === max のとき 1 要素を返す", () => {
    const rows = generateTimeRows(600, 600);
    expect(rows).toEqual(["10:00"]);
  });

  it("生成される文字列は HH:MM 形式", () => {
    const rows = generateTimeRows(0, 10);
    expect(rows[0]).toBe("00:00");
    expect(rows[1]).toBe("00:05");
    expect(rows[2]).toBe("00:10");
  });
});

// ---------------------------------------------------------------------------
// getTimeRange
// ---------------------------------------------------------------------------
describe("getTimeRange", () => {
  it("セッションの最小・最大時刻を返す", () => {
    const columns: RoomColumn[] = [
      {
        name: "1",
        key: "1",
        sessions: [
          { kind: "session", data: makeSession({ start: "10:00", end: "11:00" }) },
          { kind: "session", data: makeSession({ start: "13:00", end: "14:00" }) },
        ],
      },
    ];
    const range = getTimeRange(columns);
    expect(range.min).toBe(600); // 10:00
    expect(range.max).toBe(840); // 14:00
  });

  it("複数カラムをまたいだ最小・最大を返す", () => {
    const columns: RoomColumn[] = [
      {
        name: "1",
        key: "1",
        sessions: [{ kind: "session", data: makeSession({ start: "09:00", end: "10:00" }) }],
      },
      {
        name: "2",
        key: "2",
        sessions: [{ kind: "session", data: makeSession({ start: "17:00", end: "18:00" }) }],
      },
    ];
    const range = getTimeRange(columns);
    expect(range.min).toBe(540); // 09:00
    expect(range.max).toBe(1080); // 18:00
  });

  it("セッションがない場合はデフォルト範囲（09:00〜18:00）を返す", () => {
    const range = getTimeRange([]);
    expect(range.min).toBe(9 * 60); // 540
    expect(range.max).toBe(18 * 60); // 1080
  });

  it("イベントの時刻も範囲に含める", () => {
    const columns: RoomColumn[] = [
      {
        name: "1",
        key: "1",
        sessions: [
          {
            kind: "event",
            data: {
              title: "テストイベント",
              day_index: 0,
              start_time: "08:00",
              end_time: "09:00",
              room_no: "1",
            },
          },
        ],
      },
    ];
    const range = getTimeRange(columns);
    expect(range.min).toBe(480); // 08:00
    expect(range.max).toBe(540); // 09:00
  });
});

// ---------------------------------------------------------------------------
// getAllCategories
// ---------------------------------------------------------------------------
describe("getAllCategories", () => {
  it("ユニークなカテゴリをソート済みで返す", () => {
    const columns: RoomColumn[] = [
      {
        name: "1",
        key: "1",
        sessions: [
          { kind: "session", data: makeSession({ category: "ENG" }) },
          { kind: "session", data: makeSession({ category: "GD" }) },
          { kind: "session", data: makeSession({ category: "ENG" }) }, // 重複
        ],
      },
    ];
    const cats = getAllCategories(columns);
    expect(cats).toEqual(["ENG", "GD"]);
  });

  it("イベントのカテゴリは含まない", () => {
    const columns: RoomColumn[] = [
      {
        name: "1",
        key: "1",
        sessions: [
          {
            kind: "event",
            data: {
              title: "イベント",
              day_index: 0,
              start_time: "19:30",
              end_time: "21:30",
              room_no: "1",
            },
          },
        ],
      },
    ];
    expect(getAllCategories(columns)).toEqual([]);
  });

  it("カテゴリなしのセッションは無視する", () => {
    const columns: RoomColumn[] = [
      {
        name: "1",
        key: "1",
        sessions: [{ kind: "session", data: makeSession({ category: "" }) }],
      },
    ];
    expect(getAllCategories(columns)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getSessionId / getSessionRange
// ---------------------------------------------------------------------------
describe("getSessionId", () => {
  it("session は data.id を返す", () => {
    const u = { kind: "session" as const, data: makeSession({ id: "abc-123" }) };
    expect(getSessionId(u, 0)).toBe("abc-123");
  });

  it("event は dayIndex_event_title 形式のIDを生成する", () => {
    const u = {
      kind: "event" as const,
      data: {
        title: "Developers Night",
        day_index: 1,
        start_time: "19:30",
        end_time: "21:30",
        room_no: "多目的ホール",
      },
    };
    expect(getSessionId(u, 1)).toBe("1_event_DevelopersNight");
  });
});

describe("getSessionRange", () => {
  it("session は start/end を分に変換して返す", () => {
    const u = {
      kind: "session" as const,
      data: makeSession({ start: "10:00", end: "11:00" }),
    };
    expect(getSessionRange(u)).toEqual({ start: 600, end: 660 });
  });

  it("event は start_time/end_time を分に変換して返す", () => {
    const u = {
      kind: "event" as const,
      data: {
        title: "イベント",
        day_index: 0,
        start_time: "19:30",
        end_time: "21:30",
        room_no: "1",
      },
    };
    expect(getSessionRange(u)).toEqual({ start: 1170, end: 1290 });
  });
});

// ---------------------------------------------------------------------------
// buildRoomColumns
// ---------------------------------------------------------------------------
describe("buildRoomColumns", () => {
  it("セッションがない場合は空配列を返す", () => {
    const result = buildRoomColumns(makeScheduleData([]), 0, "2020");
    expect(result).toHaveLength(0);
  });

  it("単一部屋のセッションを 1 カラムに格納する", () => {
    const data = makeScheduleData([makeSession({ room: "1" })]);
    const result = buildRoomColumns(data, 0, "2020");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("1");
    expect(result[0].sessions).toHaveLength(1);
    expect(result[0].sessions[0].kind).toBe("session");
  });

  it("複数部屋を数値順にソートする", () => {
    const data = makeScheduleData([
      makeSession({ room: "3", id: "s3" }),
      makeSession({ room: "1", id: "s1" }),
      makeSession({ room: "2", id: "s2" }),
    ]);
    const result = buildRoomColumns(data, 0, "2020");
    expect(result.map((c) => c.name)).toEqual(["1", "2", "3"]);
  });

  it("メインホールを先頭に配置する", () => {
    const data = makeScheduleData([
      makeSession({ room: "1", id: "s1" }),
      makeSession({ room: "メインホール", id: "s2" }),
    ]);
    const result = buildRoomColumns(data, 0, "2020");
    expect(result[0].name).toBe("メインホール");
    expect(result[1].name).toBe("1");
  });

  it("dayIndex に対応する日のセッションのみを返す", () => {
    const data = makeScheduleData([
      makeSession({ day: "1", id: "s1", room: "1" }),
      makeSession({ day: "2", id: "s2", room: "2" }),
    ]);
    const day0Result = buildRoomColumns(data, 0, "2020");
    const day1Result = buildRoomColumns(data, 1, "2020");
    expect(day0Result).toHaveLength(1);
    expect(day0Result[0].name).toBe("1");
    expect(day1Result).toHaveLength(1);
    expect(day1Result[0].name).toBe("2");
  });

  it("部屋なしセッションを 不明 カラムに配置する", () => {
    const data = makeScheduleData([makeSession({ room: "", id: "s1" })]);
    const result = buildRoomColumns(data, 0, "2020");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("不明");
    expect(result[0].sessions).toHaveLength(1);
  });

  it("部屋なしセッションが時間帯重複する場合は別カラムに分ける", () => {
    const data = makeScheduleData([
      makeSession({ room: "", id: "s1", start: "10:00", end: "11:00" }),
      makeSession({ room: "", id: "s2", start: "10:30", end: "11:30" }), // 重複
    ]);
    const result = buildRoomColumns(data, 0, "2020");
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.name === "不明")).toBe(true);
  });

  it("部屋なしセッションが隣接（重複なし）の場合は同じカラムに収める", () => {
    const data = makeScheduleData([
      makeSession({ room: "", id: "s1", start: "10:00", end: "11:00" }),
      makeSession({ room: "", id: "s2", start: "11:00", end: "12:00" }), // 隣接
    ]);
    const result = buildRoomColumns(data, 0, "2020");
    expect(result).toHaveLength(1);
    expect(result[0].sessions).toHaveLength(2);
  });

  it("2025年の dayIndex=1 に events（Developers' Night）が追加される", () => {
    // 2025年には day_index: 1 の Developers' Night がある
    const data: ScheduleData = {
      year: 2025,
      first_date: "0722",
      domain: "https://cedec.cesa.or.jp/2025/",
      generated: "2026-05-03T22:00:00Z",
      sessions: [makeSession({ day: "2", room: "1" })],
    };
    const result = buildRoomColumns(data, 1, "2025");
    const allSessions = result.flatMap((c) => c.sessions);
    const event = allSessions.find(
      (u) => u.kind === "event" && u.data.title === "Developers' Night"
    );
    expect(event).toBeDefined();
  });

  it("2025年の dayIndex=0 には Developers' Night は追加されない", () => {
    const data: ScheduleData = {
      year: 2025,
      first_date: "0722",
      domain: "https://cedec.cesa.or.jp/2025/",
      generated: "2026-05-03T22:00:00Z",
      sessions: [makeSession({ day: "1", room: "1" })],
    };
    const result = buildRoomColumns(data, 0, "2025");
    const allSessions = result.flatMap((c) => c.sessions);
    const event = allSessions.find(
      (u) => u.kind === "event" && u.data.title === "Developers' Night"
    );
    expect(event).toBeUndefined();
  });

  it("2024年の dayIndex=2 に非公式イベント (ProCEDEC) が追加される", () => {
    const data: ScheduleData = {
      year: 2024,
      first_date: "0821",
      domain: "https://cedec.cesa.or.jp/2024/",
      generated: "2024-08-19T23:00:00Z",
      sessions: [makeSession({ day: "3", room: "1" })],
    };
    const result = buildRoomColumns(data, 2, "2024");
    const allSessions = result.flatMap((c) => c.sessions);
    const customEvent = allSessions.find(
      (u) => u.kind === "event" && u.data.title === "ProCEDEC 2024"
    );
    expect(customEvent).toBeDefined();
    expect(customEvent && "isCustom" in customEvent ? customEvent.isCustom : false).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildFavoriteColumns
// ---------------------------------------------------------------------------
describe("buildFavoriteColumns", () => {
  const columns: RoomColumn[] = [
    {
      name: "1",
      key: "1",
      sessions: [
        { kind: "session", data: makeSession({ id: "s1", start: "10:00", end: "11:00" }) },
        { kind: "session", data: makeSession({ id: "s2", start: "13:00", end: "14:00" }) },
        { kind: "session", data: makeSession({ id: "s3", start: "10:30", end: "11:30" }) },
      ],
    },
  ];

  it("お気に入りがない場合はプレースホルダーカラムを返す", () => {
    const result = buildFavoriteColumns(columns, {}, 0);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("fav_empty");
    expect(result[0].sessions).toHaveLength(0);
  });

  it("お気に入り登録済みのセッションのみ抽出する", () => {
    const result = buildFavoriteColumns(columns, { s1: true }, 0);
    const all = result.flatMap((c) => c.sessions);
    expect(all).toHaveLength(1);
    expect(all[0].kind === "session" && all[0].data.id).toBe("s1");
  });

  it("時間帯重複しないお気に入りは同じカラムに収める", () => {
    // s1(10:00-11:00) と s2(13:00-14:00) は重複しない
    const result = buildFavoriteColumns(columns, { s1: true, s2: true }, 0);
    expect(result).toHaveLength(1);
    expect(result[0].sessions).toHaveLength(2);
  });

  it("時間帯重複するお気に入りは別カラムに分ける", () => {
    // s1(10:00-11:00) と s3(10:30-11:30) は重複する
    const result = buildFavoriteColumns(columns, { s1: true, s3: true }, 0);
    expect(result).toHaveLength(2);
    expect(result[0].sessions).toHaveLength(1);
    expect(result[1].sessions).toHaveLength(1);
  });

  it("カラム名は お気に入り N 形式になる", () => {
    const result = buildFavoriteColumns(columns, { s1: true, s3: true }, 0);
    expect(result[0].name).toBe("お気に入り 1");
    expect(result[1].name).toBe("お気に入り 2");
  });
});
