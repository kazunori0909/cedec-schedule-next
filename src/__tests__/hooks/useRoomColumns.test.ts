// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ScheduleData, Session } from "@/types/schedule";
import { useRoomColumns } from "@/hooks/useRoomColumns";

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

function makeScheduleData(sessions: Session[]): ScheduleData {
  return {
    year: 2020,
    first_date: "0902",
    domain: "https://cedec.cesa.or.jp/2020/",
    generated: "2020-09-07T16:00:00Z",
    sessions,
  };
}

describe("useRoomColumns", () => {
  it("scheduleData が null のとき全フィールドが空/デフォルト値", () => {
    const { result } = renderHook(() => useRoomColumns(null, "2020", 0, false, {}));
    expect(result.current.columns).toHaveLength(0);
    expect(result.current.displayColumns).toHaveLength(0);
    expect(result.current.allCategories).toHaveLength(0);
    // データなし → デフォルト範囲
    expect(result.current.timeRange).toEqual({ min: 9 * 60, max: 18 * 60 });
  });

  it("セッションデータが渡されると部屋カラムが生成される", () => {
    const data = makeScheduleData([
      makeSession({ room: "1", id: "s1" }),
      makeSession({ room: "2", id: "s2" }),
    ]);
    const { result } = renderHook(() => useRoomColumns(data, "2020", 0, false, {}));
    expect(result.current.columns).toHaveLength(2);
    expect(result.current.displayColumns).toHaveLength(2);
  });

  it("allCategories はユニーク・ソート済みカテゴリを返す", () => {
    const data = makeScheduleData([
      makeSession({ room: "1", id: "s1", category: "GD" }),
      makeSession({ room: "1", id: "s2", category: "ENG" }),
      makeSession({ room: "1", id: "s3", category: "GD" }), // 重複
    ]);
    const { result } = renderHook(() => useRoomColumns(data, "2020", 0, false, {}));
    expect(result.current.allCategories).toEqual(["ENG", "GD"]);
  });

  it("favoriteMode=true かつお気に入りなしのとき displayColumns はプレースホルダー", () => {
    const data = makeScheduleData([makeSession({ id: "s1" })]);
    const { result } = renderHook(() => useRoomColumns(data, "2020", 0, true, {}));
    expect(result.current.displayColumns).toHaveLength(1);
    expect(result.current.displayColumns[0].key).toBe("fav_empty");
  });

  it("favoriteMode=true でお気に入り登録済みのセッションのみ表示", () => {
    const data = makeScheduleData([
      makeSession({ id: "s1", room: "1" }),
      makeSession({ id: "s2", room: "2" }),
    ]);
    const { result } = renderHook(() => useRoomColumns(data, "2020", 0, true, { s1: true }));
    const allDisplayed = result.current.displayColumns.flatMap((c) => c.sessions);
    expect(allDisplayed).toHaveLength(1);
    expect(allDisplayed[0].kind === "session" && allDisplayed[0].data.id).toBe("s1");
  });

  it("timeRows は timeRange の min/max を 5 分刻みでカバーする", () => {
    const data = makeScheduleData([makeSession({ start: "09:00", end: "09:10" })]);
    const { result } = renderHook(() => useRoomColumns(data, "2020", 0, false, {}));
    expect(result.current.timeRows[0]).toBe("09:00");
    expect(result.current.timeRows.at(-1)).toBe("09:10");
  });

  it("dayIndex が変わると対応する日のセッションのみ表示される", () => {
    const data = makeScheduleData([
      makeSession({ day: "1", id: "s1", room: "1" }),
      makeSession({ day: "2", id: "s2", room: "2" }),
    ]);
    const { result: r0 } = renderHook(() => useRoomColumns(data, "2020", 0, false, {}));
    const { result: r1 } = renderHook(() => useRoomColumns(data, "2020", 1, false, {}));
    expect(r0.current.columns[0].name).toBe("1");
    expect(r1.current.columns[0].name).toBe("2");
  });
});
