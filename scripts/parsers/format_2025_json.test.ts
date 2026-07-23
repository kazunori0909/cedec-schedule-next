import { describe, expect, it } from "vitest";

import { parseFormat2025Json, parseLightningTalks, type TimetableJson } from "./format_2025_json";

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

// ---------------------------------------------------------------------------
// ライトニングトーク（LT 枠の children 展開）
// ---------------------------------------------------------------------------

type Child = { uuid: string; title: string; start: string; id?: number; category_id?: number };

/** LT 枠（format_id=22）の親ポストと、その children を組み立てる */
function makeLtData(children: Child[], parentEnd = "2025/08/20 13:00:00"): TimetableJson {
  return {
    posts: [
      {
        id: 100,
        uuid: "lt-parent",
        title: "CEDEC Lightning 2025　第1会場　1日目",
        held_at: "2025/08/20 12:30:00",
        end_time: parentEnd,
        room: "第1会場",
        category_id: null,
        format_id: 22,
        type_id: 1,
        subcategory: [],
        speakers: [],
        coming_soon: 0,
        children: children.map((c) => ({
          id: c.id ?? 200,
          uuid: c.uuid,
          title: c.title,
          held_at: null,
          held_at_as_child: c.start,
          end_time: null,
          room: "第1会場",
          category_id: c.category_id ?? 1,
          format_id: 22,
          type_id: 1,
          subcategory: [],
          speakers: [],
          coming_soon: 0,
        })),
      },
    ],
    speakers: {},
  };
}

describe("parseLightningTalks", () => {
  it("children を個々の LT 講演として展開する", () => {
    const talks = parseLightningTalks(
      makeLtData([
        { uuid: "a", title: "LT-A", start: "2025/08/20 12:30:00", id: 201 },
        { uuid: "b", title: "LT-B", start: "2025/08/20 12:36:00", id: 202 },
      ]),
      {},
      FIRST_DATE
    );
    expect(talks.map((t) => t.session_id)).toEqual(["a", "b"]);
    expect(talks[0].day).toBe(1);
    expect(talks[0].room_no).toBe("1");
  });

  it("公式 JSON の並び順によらず開始時刻順に並べ替える", () => {
    const talks = parseLightningTalks(
      makeLtData([
        { uuid: "c", title: "LT-C", start: "2025/08/20 12:42:00", id: 203 },
        { uuid: "a", title: "LT-A", start: "2025/08/20 12:30:00", id: 201 },
        { uuid: "b", title: "LT-B", start: "2025/08/20 12:36:00", id: 202 },
      ]),
      {},
      FIRST_DATE
    );
    expect(talks.map((t) => t.start)).toEqual(["12:30", "12:36", "12:42"]);
  });

  it("終了時刻は次の講演の開始時刻になる", () => {
    const talks = parseLightningTalks(
      makeLtData([
        { uuid: "a", title: "LT-A", start: "2025/08/20 12:30:00", id: 201 },
        { uuid: "b", title: "LT-B", start: "2025/08/20 12:36:00", id: 202 },
      ]),
      {},
      FIRST_DATE
    );
    expect(talks[0].end).toBe("12:36");
  });

  it("枠が定員に満たない場合、最後の講演は枠の終わりまで伸ばさず標準枠長で終える", () => {
    // 12:30-13:00 の枠に 6分刻みで 3 件のみ → 最後は 12:48 終了（13:00 ではない）
    const talks = parseLightningTalks(
      makeLtData([
        { uuid: "a", title: "LT-A", start: "2025/08/20 12:30:00", id: 201 },
        { uuid: "b", title: "LT-B", start: "2025/08/20 12:36:00", id: 202 },
        { uuid: "c", title: "LT-C", start: "2025/08/20 12:42:00", id: 203 },
      ]),
      {},
      FIRST_DATE
    );
    expect(talks[2].end).toBe("12:48");
  });

  it("枠が埋まっている場合、最後の講演は枠の終了時刻を超えない", () => {
    const talks = parseLightningTalks(
      makeLtData(
        [
          { uuid: "a", title: "LT-A", start: "2025/08/20 12:30:00", id: 201 },
          { uuid: "b", title: "LT-B", start: "2025/08/20 12:36:00", id: 202 },
        ],
        "2025/08/20 12:40:00"
      ),
      {},
      FIRST_DATE
    );
    expect(talks[1].end).toBe("12:40");
  });

  it("講演が 1 件だけの枠は既定の枠長（6分）を使う", () => {
    const talks = parseLightningTalks(
      makeLtData([{ uuid: "a", title: "LT-A", start: "2025/08/20 12:30:00", id: 201 }]),
      {},
      FIRST_DATE
    );
    expect(talks[0].end).toBe("12:36");
  });

  it("詳細ページを持たないため detail_url は空になる", () => {
    const talks = parseLightningTalks(
      makeLtData([{ uuid: "a", title: "LT-A", start: "2025/08/20 12:30:00", id: 201 }]),
      {},
      FIRST_DATE
    );
    expect(talks[0].detail_url).toBe("");
  });

  it("非表示指定（hide）の講演は出力せず、他の講演の時間割は崩さない", () => {
    const talks = parseLightningTalks(
      makeLtData([
        { uuid: "a", title: "LT-A", start: "2025/08/20 12:30:00", id: 201 },
        { uuid: "b", title: "LT-B", start: "2025/08/20 12:36:00", id: 202 },
        { uuid: "c", title: "LT-C", start: "2025/08/20 12:42:00", id: 203 },
      ]),
      { hide: { sessions: [202] } },
      FIRST_DATE
    );
    expect(talks.map((t) => t.session_id)).toEqual(["a", "c"]);
    // LT-A は非表示の LT-B の開始時刻で終わる（枠の並びは変えない）
    expect(talks[0].end).toBe("12:36");
  });

  it("中止指定（show）の講演はタイトルに印が付き分野が伏せられる", () => {
    const talks = parseLightningTalks(
      makeLtData([{ uuid: "a", title: "LT-A", start: "2025/08/20 12:30:00", id: 201 }]),
      { show: { sessions: [201] } },
      FIRST_DATE
    );
    expect(talks[0].title).toBe("【講演キャンセル】LT-A");
    expect(talks[0].category).toBe("");
  });

  it("LT 枠でないポストは対象外", () => {
    expect(parseLightningTalks(makeData(), {}, FIRST_DATE)).toHaveLength(0);
  });

  it("children を持たない LT 枠は対象外", () => {
    expect(parseLightningTalks(makeLtData([]), {}, FIRST_DATE)).toHaveLength(0);
  });
});
