// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Workbook } from "exceljs";

import type { ScheduleData, Session } from "@/types/schedule";
import { exportScheduleToExcel } from "@/lib/exportExcel";

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

// 2021年は非公式イベント（custom.ts）も Developers' Night も持たないため、
// 生成されるシートが「セッションのある日」だけになり検証しやすい
const YEAR = "2021";
const BASE: ScheduleData = {
  year: 2021,
  first_date: "0824",
  generated: "2021-08-01T00:00:00Z",
  sessions: [makeSession()],
};

// ダウンロード処理（Blob URL 生成 + アンカークリック）を差し替えて、生成された xlsx を捕まえる
let captured: Blob | null = null;

beforeEach(() => {
  captured = null;
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
    captured = blob as Blob;
    return "blob:mock";
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function exportAndLoad(data: ScheduleData): Promise<Workbook> {
  await exportScheduleToExcel(data, YEAR, {});
  expect(captured).not.toBeNull();
  const wb = new Workbook();
  await wb.xlsx.load(await captured!.arrayBuffer());
  return wb;
}

describe("exportScheduleToExcel", () => {
  it("開催日ごとにシートを作る（セッションのない日は作らない）", async () => {
    const wb = await exportAndLoad(BASE);
    expect(wb.worksheets.map((ws) => ws.name)).toEqual(["Day1 (8-24)"]);
  });

  it("ライトニングトークは日別に分けず LT シート1枚にまとめる", async () => {
    const wb = await exportAndLoad({
      ...BASE,
      lightning_talks: [
        makeSession({ id: "t1", day: "1", room: "1", start: "12:30", end: "12:36" }),
        makeSession({ id: "t2", day: "2", room: "2", start: "12:10", end: "12:16" }),
      ],
    });
    expect(wb.worksheets.map((ws) => ws.name)).toEqual(["Day1 (8-24)", "LT"]);

    // ヘッダーは画面と同じ「Day{日}-{会場}」形式で、日 → 会場の順に並ぶ
    const lt = wb.getWorksheet("LT")!;
    expect(lt.getRow(1).values).toEqual([undefined, "時刻", "Day1-1", "Day2-2"]);
    // 時刻軸は5分刻みではなく、実際の開始・終了時刻の和集合
    expect(lt.getColumn(1).values.slice(2)).toEqual(["12:10", "12:16", "12:30", "12:36"]);
  });

  it("LT を持たない年度では LT シートを作らない", async () => {
    const wb = await exportAndLoad(BASE);
    expect(wb.getWorksheet("LT")).toBeUndefined();
  });

  it("お気に入りのセッションはタイトルに★が付く", async () => {
    await exportScheduleToExcel(BASE, YEAR, { s1: true });
    const wb = new Workbook();
    await wb.xlsx.load(await captured!.arrayBuffer());
    const cell = wb.getWorksheet("Day1 (8-24)")!.getCell("B2");
    expect(String(cell.value)).toContain("★ テストセッション");
  });
});
