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
    generated: "2020-09-07T16:00:00Z",
    sessions,
  };
}

// 変換ロジック（buildRoomColumns・getTimeRange 等）は schedule.test.ts で網羅済み。
// ここはフック固有の null ガードと favoriteMode 分岐のみを検証する。
describe("useRoomColumns", () => {
  it("scheduleData が null のとき全フィールドが空/デフォルト値", () => {
    const { result } = renderHook(() => useRoomColumns(null, "2020", 0, false, {}));
    expect(result.current.columns).toHaveLength(0);
    expect(result.current.displayColumns).toHaveLength(0);
    expect(result.current.allCategories).toHaveLength(0);
    // データなし → デフォルト範囲
    expect(result.current.timeRange).toEqual({ min: 9 * 60, max: 18 * 60 });
  });

  it("favoriteMode=true かつお気に入りなしのとき displayColumns はプレースホルダー", () => {
    const data = makeScheduleData([makeSession({ id: "s1" })]);
    const { result } = renderHook(() => useRoomColumns(data, "2020", 0, true, {}));
    expect(result.current.displayColumns).toHaveLength(1);
    expect(result.current.displayColumns[0].key).toBe("fav_empty");
  });
});
