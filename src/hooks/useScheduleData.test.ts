// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ScheduleData } from "@/types/schedule";
import { useScheduleData } from "@/hooks/useScheduleData";

// schedule モジュールのキャッシュをリセットするためモジュールごとモック
vi.mock("@/lib/schedule", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/schedule")>();
  return { ...original, fetchSchedule: vi.fn() };
});
vi.mock("@/lib/cedil", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/cedil")>();
  return { ...original, fetchCedil: vi.fn() };
});
// 年度 "9999" を「cedil_tag_no 未設定の年度」（新年度追加直後の状態）として扱う。
// 実際の SCHEDULE_SETTING は全年度にタグ番号を持つため、設定側をモックして再現する。
const NO_CEDIL_TAG_YEAR = "9999";
vi.mock("@/lib/cedec", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/cedec")>();
  return {
    ...original,
    findYearSetting: (year: string) =>
      year === "9999" ? { year: "9999", first_date: "0722" } : original.findYearSetting(year),
  };
});

import { fetchSchedule } from "@/lib/schedule";
import { fetchCedil } from "@/lib/cedil";

const mockFetchSchedule = vi.mocked(fetchSchedule);
const mockFetchCedil = vi.mocked(fetchCedil);

const MOCK_SCHEDULE: ScheduleData = {
  year: 2020,
  first_date: "0902",
  generated: "2020-09-07T16:00:00Z",
  sessions: [
    {
      id: "s1",
      day: "1",
      room: "1",
      start: "10:00",
      end: "11:00",
      category: "ENG",
      title: "テストセッション",
      speakers: [],
      detail_url: "",
    },
  ],
};

const DATE_LIST = [new Date(2020, 8, 2), new Date(2020, 8, 3), new Date(2020, 8, 4)];

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useScheduleData", () => {
  it("初期状態は loading=true、データなし", () => {
    // fetchSchedule が解決しない Promise を返してローディング状態を確認
    mockFetchSchedule.mockReturnValue(new Promise(() => {}));
    mockFetchCedil.mockResolvedValue(null);

    const { result } = renderHook(() => useScheduleData("2020", DATE_LIST));
    expect(result.current.loading).toBe(true);
    expect(result.current.scheduleData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("fetchSchedule 成功後は loading=false、scheduleData が設定される", async () => {
    mockFetchSchedule.mockResolvedValue(MOCK_SCHEDULE);
    mockFetchCedil.mockResolvedValue(null);

    const { result } = renderHook(() => useScheduleData("2020", DATE_LIST));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.scheduleData).toEqual(MOCK_SCHEDULE);
    expect(result.current.error).toBeNull();
  });

  it("fetchSchedule 失敗時は error が設定される", async () => {
    mockFetchSchedule.mockRejectedValue(new Error("Network error"));
    mockFetchCedil.mockResolvedValue(null);

    const { result } = renderHook(() => useScheduleData("2020", DATE_LIST));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Network error");
    expect(result.current.scheduleData).toBeNull();
  });

  it("CEDiL データが取得できると cedilCount・cedilUpdate が設定される", async () => {
    mockFetchSchedule.mockResolvedValue(MOCK_SCHEDULE);
    mockFetchCedil.mockResolvedValue({
      list: [{ title: "テストセッション", url: "https://cedil.example.com/1" }],
      update_date: "2020-09-10T12:00:00Z",
    });

    const { result } = renderHook(() => useScheduleData("2020", DATE_LIST));

    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.cedilCount).toBe(1));
    expect(result.current.cedilUpdate).toBe("2020-09-10T12:00:00Z");
  });

  it("CEDiL が null の場合は cedilLookup が空のまま", async () => {
    mockFetchSchedule.mockResolvedValue(MOCK_SCHEDULE);
    mockFetchCedil.mockResolvedValue(null);

    const { result } = renderHook(() => useScheduleData("2020", DATE_LIST));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cedilLookup).toEqual({});
    expect(result.current.cedilCount).toBe(0);
  });

  it("cedil_tag_no 未設定の年度では CEDiL を取得しない（404 リクエスト抑止）", async () => {
    mockFetchSchedule.mockResolvedValue(MOCK_SCHEDULE);
    mockFetchCedil.mockResolvedValue(null);

    const { result } = renderHook(() => useScheduleData(NO_CEDIL_TAG_YEAR, DATE_LIST));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetchCedil).not.toHaveBeenCalled();
    expect(result.current.cedilLookup).toEqual({});
    expect(result.current.cedilUpdate).toBeUndefined();
  });

  it("年度が変わると新しいデータを取得する", async () => {
    const schedule2021: ScheduleData = { ...MOCK_SCHEDULE, year: 2021 };
    mockFetchSchedule.mockResolvedValueOnce(MOCK_SCHEDULE).mockResolvedValueOnce(schedule2021);
    mockFetchCedil.mockResolvedValue(null);

    const { result, rerender } = renderHook(
      ({ year }: { year: string }) => useScheduleData(year, DATE_LIST),
      { initialProps: { year: "2020" } }
    );

    await waitFor(() => expect(result.current.scheduleData?.year).toBe(2020));

    rerender({ year: "2021" });

    await waitFor(() => expect(result.current.scheduleData?.year).toBe(2021));
    expect(mockFetchSchedule).toHaveBeenCalledTimes(2);
  });
});
