import { describe, expect, it } from "vitest";

import type { CedilItem } from "@/types/schedule";
import { buildCedilLookup } from "@/lib/cedil";

// テスト用の開催日リスト（2025年7月22・23・24日）
const DATE_LIST = [
  new Date(2025, 6, 22), // day 1
  new Date(2025, 6, 23), // day 2
  new Date(2025, 6, 24), // day 3
];

// ---------------------------------------------------------------------------
// buildCedilLookup
// ---------------------------------------------------------------------------
describe("buildCedilLookup", () => {
  it("タイトルが一致するセッションに URL を対応付ける", () => {
    const cedilList: CedilItem[] = [
      { title: "マルチプレイヤーゲームの最適化手法", url: "https://cedil.example.com/item/1" },
    ];
    const sessions = [{ id: "s1", title: "マルチプレイヤーゲームの最適化手法", day: "1" }];
    const lookup = buildCedilLookup(cedilList, sessions, DATE_LIST);
    expect(lookup["s1"]).toBe("https://cedil.example.com/item/1");
  });

  it("セッションタイトルが CEDiL タイトルを含む場合にマッチする（部分一致）", () => {
    const cedilList: CedilItem[] = [{ title: "AI活用", url: "https://cedil.example.com/item/2" }];
    const sessions = [{ id: "s2", title: "ゲーム開発におけるAI活用の最前線", day: "1" }];
    const lookup = buildCedilLookup(cedilList, sessions, DATE_LIST);
    expect(lookup["s2"]).toBe("https://cedil.example.com/item/2");
  });

  it("タイトルの空白（全角・半角）を無視して照合する", () => {
    const cedilList: CedilItem[] = [
      { title: "ゲーム 開発", url: "https://cedil.example.com/item/3" }, // 半角スペースあり
    ];
    const sessions = [
      { id: "s3", title: "ゲーム　開発の未来", day: "1" }, // 全角スペースあり
    ];
    const lookup = buildCedilLookup(cedilList, sessions, DATE_LIST);
    expect(lookup["s3"]).toBe("https://cedil.example.com/item/3");
  });

  it("日付が指定されている場合、開催日が一致しないとマッチしない", () => {
    const cedilList: CedilItem[] = [
      { title: "最適化入門", url: "https://cedil.example.com/item/4", date: 23 }, // 23日のみ
    ];
    const sessions = [
      { id: "s4", title: "最適化入門", day: "1" }, // day=1 → 22日
    ];
    const lookup = buildCedilLookup(cedilList, sessions, DATE_LIST);
    expect(lookup["s4"]).toBeUndefined();
  });

  it("日付が指定されている場合、開催日が一致するとマッチする", () => {
    const cedilList: CedilItem[] = [
      { title: "最適化入門", url: "https://cedil.example.com/item/5", date: 22 }, // 22日のみ
    ];
    const sessions = [
      { id: "s5", title: "最適化入門", day: "1" }, // day=1 → 22日
    ];
    const lookup = buildCedilLookup(cedilList, sessions, DATE_LIST);
    expect(lookup["s5"]).toBe("https://cedil.example.com/item/5");
  });

  it("一致するタイトルがない場合は空のオブジェクトを返す", () => {
    const cedilList: CedilItem[] = [
      { title: "全く別のタイトル", url: "https://cedil.example.com/item/6" },
    ];
    const sessions = [{ id: "s6", title: "マッチしないセッション", day: "1" }];
    const lookup = buildCedilLookup(cedilList, sessions, DATE_LIST);
    expect(lookup).toEqual({});
  });

  it("セッションが空の場合は空のオブジェクトを返す", () => {
    const cedilList: CedilItem[] = [
      { title: "何かのタイトル", url: "https://cedil.example.com/item/7" },
    ];
    const lookup = buildCedilLookup(cedilList, [], DATE_LIST);
    expect(lookup).toEqual({});
  });

  it("CEDiL リストが空の場合は空のオブジェクトを返す", () => {
    const sessions = [{ id: "s7", title: "テストセッション", day: "1" }];
    const lookup = buildCedilLookup([], sessions, DATE_LIST);
    expect(lookup).toEqual({});
  });

  it("day インデックスが dateList の範囲外の場合はスキップする", () => {
    const cedilList: CedilItem[] = [{ title: "テスト", url: "https://cedil.example.com/item/8" }];
    const sessions = [
      { id: "s8", title: "テスト", day: "9" }, // 存在しない day
    ];
    const lookup = buildCedilLookup(cedilList, sessions, DATE_LIST);
    expect(lookup).toEqual({});
  });

  it("複数セッションを一括でマッピングする", () => {
    const cedilList: CedilItem[] = [
      { title: "セッションA", url: "https://cedil.example.com/a" },
      { title: "セッションB", url: "https://cedil.example.com/b" },
    ];
    const sessions = [
      { id: "sA", title: "セッションA詳細", day: "1" },
      { id: "sB", title: "セッションB詳細", day: "2" },
    ];
    const lookup = buildCedilLookup(cedilList, sessions, DATE_LIST);
    expect(lookup["sA"]).toBe("https://cedil.example.com/a");
    expect(lookup["sB"]).toBe("https://cedil.example.com/b");
  });
});
