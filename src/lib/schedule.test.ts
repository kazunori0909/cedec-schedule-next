import { describe, expect, it } from "vitest";

import type { RoomColumn, ScheduleData, Session } from "@/types/schedule";
import {
  buildFavoriteColumns,
  buildLightningTalkViewModel,
  buildMatrix,
  buildRoomColumns,
  buildScheduleViewModel,
  generateTimeRows,
  getAllCategories,
  getSessionId,
  getSessionRange,
  getSessionRoom,
  getTimeRange,
  resolveActiveDay,
} from "@/lib/schedule";
import { LT_DAY_INDEX } from "@/lib/cedec";

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
    generated: "2020-09-07T16:00:00Z",
    sessions,
  };
}

// ---------------------------------------------------------------------------
// buildMatrix（rowSpan は時刻行のインデックス差で決まる）
// ---------------------------------------------------------------------------
describe("buildMatrix", () => {
  function columnOf(sessions: Session[]): RoomColumn[] {
    return [{ name: "1", key: "1", sessions: sessions.map((s) => ({ kind: "session", data: s })) }];
  }

  it("5分刻みの時刻軸では 60分セッションが rowSpan 12 になる", () => {
    const rows = generateTimeRows(600, 660);
    const matrix = buildMatrix(rows, columnOf([makeSession({ start: "10:00", end: "11:00" })]));
    expect(matrix[0][0].rowSpan).toBe(12);
  });

  it("開始行から終了行までを occupied で埋める", () => {
    const rows = generateTimeRows(600, 660);
    const matrix = buildMatrix(rows, columnOf([makeSession({ start: "10:00", end: "10:15" })]));
    expect(matrix[0][0].kind).toBe("session");
    expect(matrix[1][0].kind).toBe("occupied");
    expect(matrix[2][0].kind).toBe("occupied");
    // 終了時刻の行は次のセッション用に空けておく
    expect(matrix[3][0].kind).toBe("empty");
  });

  it("5分刻みでない時刻軸（LT タブ）でも高さが行数と一致する", () => {
    const rows = ["12:30", "12:36", "12:42"];
    const matrix = buildMatrix(rows, columnOf([makeSession({ start: "12:30", end: "12:42" })]));
    expect(matrix[0][0].rowSpan).toBe(2);
  });

  it("開始時刻が時刻軸に無いセッションは描画しない", () => {
    const rows = generateTimeRows(600, 660);
    const matrix = buildMatrix(rows, columnOf([makeSession({ start: "10:03", end: "10:30" })]));
    expect(matrix.every((row) => row[0].kind === "empty")).toBe(true);
  });

  it("終了時刻が時刻軸に無いセッションは 1 行として描画する", () => {
    const rows = generateTimeRows(600, 660);
    const matrix = buildMatrix(rows, columnOf([makeSession({ start: "10:00", end: "10:33" })]));
    expect(matrix[0][0].rowSpan).toBe(1);
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

  it("複数会場が混在するため roomName は持たない（セル側でセッションの会場を使う）", () => {
    const columns = buildRoomColumns(
      makeScheduleData([
        makeSession({ id: "a", room: "1" }),
        makeSession({ id: "b", room: "2", start: "10:00", end: "11:00" }),
      ]),
      0,
      "2020"
    );
    const fav = buildFavoriteColumns(columns, { a: true, b: true }, 0);
    expect(fav.every((c) => c.roomName === undefined)).toBe(true);
    expect(fav.flatMap((c) => c.sessions).map(getSessionRoom)).toEqual(["1", "2"]);
  });

  it("カラム名は お気に入り N 形式になる", () => {
    const result = buildFavoriteColumns(columns, { s1: true, s3: true }, 0);
    expect(result[0].name).toBe("お気に入り 1");
    expect(result[1].name).toBe("お気に入り 2");
  });
});

// ---------------------------------------------------------------------------
// buildScheduleViewModel
// ---------------------------------------------------------------------------
// 変換ロジック（buildRoomColumns・getTimeRange 等）は上記の各 describe で網羅済み。
// ここでは null ガードと favoriteMode 分岐のみを検証する。
describe("buildScheduleViewModel", () => {
  it("scheduleData が null のとき全フィールドが空/デフォルト値", () => {
    const vm = buildScheduleViewModel(null, "2020", 0, false, {});
    expect(vm.displayColumns).toHaveLength(0);
    expect(vm.allCategories).toHaveLength(0);
    // データなし → デフォルト範囲（09:00〜18:00）
    expect(vm.timeRows[0]).toBe("09:00");
    expect(vm.timeRows[vm.timeRows.length - 1]).toBe("18:00");
  });

  it("favoriteMode=true かつお気に入りなしのとき displayColumns はプレースホルダー", () => {
    const data = makeScheduleData([makeSession({ id: "s1" })]);
    const vm = buildScheduleViewModel(data, "2020", 0, true, {});
    expect(vm.displayColumns).toHaveLength(1);
    expect(vm.displayColumns[0].key).toBe("fav_empty");
  });
});

// ---------------------------------------------------------------------------
// buildLightningTalkViewModel
// ---------------------------------------------------------------------------
describe("buildLightningTalkViewModel", () => {
  // Day1 は 12:30 始まり・Day2 は 12:10 始まりで、6分刻み（5分グリッドに乗らない）
  const talks: Session[] = [
    makeSession({ id: "t1", day: "1", room: "1", start: "12:30", end: "12:36" }),
    makeSession({ id: "t2", day: "1", room: "1", start: "12:36", end: "12:42" }),
    makeSession({ id: "t3", day: "1", room: "2", start: "12:30", end: "12:36", category: "GD" }),
    makeSession({ id: "t4", day: "2", room: "1", start: "12:10", end: "12:16" }),
  ];

  it("日 × 会場ごとにカラムを作り、日→会場の順に並べる", () => {
    const vm = buildLightningTalkViewModel(talks);
    expect(vm.displayColumns.map((c) => c.name)).toEqual(["Day1-1", "Day1-2", "Day2-1"]);
  });

  it("講演のない日 × 会場の組み合わせはカラムを作らない", () => {
    const vm = buildLightningTalkViewModel(talks);
    expect(vm.displayColumns.map((c) => c.key)).not.toContain("lt_2-2");
  });

  it("カラムには会場名を別途保持する（表示ラベルは Day 付きのため）", () => {
    const vm = buildLightningTalkViewModel(talks);
    expect(vm.displayColumns[1].roomName).toBe("第2会場");
  });

  it("時刻軸は全日程の開始・終了時刻の和集合を昇順で並べたもの", () => {
    const vm = buildLightningTalkViewModel(talks);
    expect(vm.timeRows).toEqual(["12:10", "12:16", "12:30", "12:36", "12:42"]);
  });

  it("カテゴリは LT 講演から抽出する", () => {
    const vm = buildLightningTalkViewModel(talks);
    expect(vm.allCategories).toEqual(["ENG", "GD"]);
  });

  it("LT が無い場合は空のカラム・時刻軸を返す", () => {
    const vm = buildLightningTalkViewModel([]);
    expect(vm.displayColumns).toHaveLength(0);
    expect(vm.timeRows).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// resolveActiveDay（永続化された dayIndex → 表示対象の解決）
// ---------------------------------------------------------------------------
describe("resolveActiveDay", () => {
  it("通常の日付インデックスはそのまま返す", () => {
    expect(resolveActiveDay(2, true)).toEqual({ isLightningTalkTab: false, activeDayIndex: 2 });
  });

  it("LT を持つ年度で LT_DAY_INDEX なら LT タブになる", () => {
    expect(resolveActiveDay(LT_DAY_INDEX, true)).toEqual({
      isLightningTalkTab: true,
      activeDayIndex: LT_DAY_INDEX,
    });
  });

  it("LT を持たない年度で LT_DAY_INDEX が復元されたら Day1 にフォールバックする", () => {
    expect(resolveActiveDay(LT_DAY_INDEX, false)).toEqual({
      isLightningTalkTab: false,
      activeDayIndex: 0,
    });
  });
});
