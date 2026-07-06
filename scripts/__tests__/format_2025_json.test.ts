import { describe, expect, it } from "vitest";

import { parseFormat2025Json, type TimetableJson } from "../parsers/format_2025_json";

// 招待セッション判定（type_id → is_invited）を検証する（Phase 2: 招待セッション表示）

function makeData(overrides: Partial<TimetableJson["posts"][number]> = {}): TimetableJson {
  return {
    posts: [
      {
        id: 1,
        uuid: "abc123",
        title: "テストセッション",
        held_at: "2025/08/20 10:00:00",
        end_time: "2025/08/20 11:00:00",
        room: "第1会場",
        category_id: 1,
        format_id: 1,
        type_id: 1,
        subcategory: [],
        speakers: [],
        coming_soon: 0,
        ...overrides,
      },
    ],
    speakers: {},
  };
}

const FIRST_DATE = "0820";
const YEAR = "2025";

describe("parseFormat2025Json - 招待セッション判定", () => {
  it.each([2, 5, 6, 7])("type_id=%i は is_invited: true になる", (typeId) => {
    const sessions = parseFormat2025Json(makeData({ type_id: typeId }), {}, YEAR, FIRST_DATE);
    expect(sessions[0].is_invited).toBe(true);
  });

  it.each([1, 3, 4, 8, 9])("type_id=%i は is_invited: false になる", (typeId) => {
    const sessions = parseFormat2025Json(makeData({ type_id: typeId }), {}, YEAR, FIRST_DATE);
    expect(sessions[0].is_invited).toBe(false);
  });

  it("中止セッションは招待種別でも is_invited: false になる", () => {
    const sessions = parseFormat2025Json(
      makeData({ id: 1, type_id: 2 }),
      { show: { sessions: [1] } },
      YEAR,
      FIRST_DATE
    );
    expect(sessions[0].is_invited).toBe(false);
  });
});
