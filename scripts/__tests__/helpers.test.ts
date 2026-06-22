import { afterEach, describe, expect, it, vi } from "vitest";

import {
  abbreviateCompany,
  dayIndexFromDate,
  isEventOver,
  normalizeTitleForMatch,
  normalizeWhitespace,
  parseTimeRange,
  roomNoFromText,
} from "../lib/helpers";

// generate_json.ts が schedule.json を生成する際の文字列・時刻加工（種類A: 生成段階の正しさ）を検証する。
// 実行時の変換ロジック（種類B）は src/__tests__/lib/ 側で別途カバーしている。

// ---------------------------------------------------------------------------
// roomNoFromText
// ---------------------------------------------------------------------------
describe("roomNoFromText", () => {
  it("第N会場 から数字部分を抽出する", () => {
    expect(roomNoFromText("第3会場")).toBe("3");
    expect(roomNoFromText("第12会場")).toBe("12");
  });

  it("前後の空白を除去する", () => {
    expect(roomNoFromText("  第5会場  ")).toBe("5");
  });

  it("第・会場 を含まない文字列はトリムのみ", () => {
    expect(roomNoFromText("メインホール")).toBe("メインホール");
  });
});

// ---------------------------------------------------------------------------
// parseTimeRange
// ---------------------------------------------------------------------------
describe("parseTimeRange", () => {
  it("HH:MM-HH:MM を開始・終了に分解する", () => {
    expect(parseTimeRange("09:35-09:40 /5分")).toEqual(["09:35", "09:40"]);
    expect(parseTimeRange("10:00-11:30")).toEqual(["10:00", "11:30"]);
  });

  it("前後に改行・タブがあっても抽出する", () => {
    expect(parseTimeRange("\t09:00-10:00\n")).toEqual(["09:00", "10:00"]);
  });

  it("時刻表記がない場合は空文字のペアを返す", () => {
    expect(parseTimeRange("時間未定")).toEqual(["", ""]);
  });
});

// ---------------------------------------------------------------------------
// normalizeWhitespace
// ---------------------------------------------------------------------------
describe("normalizeWhitespace", () => {
  it("改行・タブ・連続空白を半角スペース1つに圧縮し前後を除去する", () => {
    expect(normalizeWhitespace("  改行\nと\tタブ  ")).toBe("改行 と タブ");
  });

  it("全角スペースは保持する（意味のある区切りを壊さないため）", () => {
    expect(normalizeWhitespace("全角　スペース")).toBe("全角　スペース");
  });
});

// ---------------------------------------------------------------------------
// abbreviateCompany
// ---------------------------------------------------------------------------
describe("abbreviateCompany", () => {
  it("前後の半角スペースごと法人格を略称化する", () => {
    expect(abbreviateCompany("スクウェア・エニックス 株式会社")).toBe("スクウェア・エニックス(株)");
  });

  it("各種法人格を略称化する", () => {
    expect(abbreviateCompany("株式会社テスト")).toBe("(株)テスト");
    expect(abbreviateCompany("有限会社テスト")).toBe("(有)テスト");
    expect(abbreviateCompany("合同会社テスト")).toBe("(同)テスト");
    expect(abbreviateCompany("合名会社テスト")).toBe("(名)テスト");
    expect(abbreviateCompany("合資会社テスト")).toBe("(資)テスト");
    expect(abbreviateCompany("一般社団法人テスト")).toBe("(一社)テスト");
    expect(abbreviateCompany("公益社団法人テスト")).toBe("(公社)テスト");
    expect(abbreviateCompany("一般財団法人テスト")).toBe("(一財)テスト");
    expect(abbreviateCompany("公益財団法人テスト")).toBe("(公財)テスト");
    expect(abbreviateCompany("学校法人テスト")).toBe("(学)テスト");
    expect(abbreviateCompany("社会福祉法人テスト")).toBe("(福)テスト");
    expect(abbreviateCompany("宗教法人テスト")).toBe("(宗)テスト");
    expect(abbreviateCompany("特定非営利活動法人テスト")).toBe("(特非)テスト");
    expect(abbreviateCompany("独立行政法人テスト")).toBe("(独)テスト");
  });

  it("法人格を含まない場合はそのまま返す", () => {
    expect(abbreviateCompany("法人格なし企業")).toBe("法人格なし企業");
  });
});

// ---------------------------------------------------------------------------
// isEventOver
// ---------------------------------------------------------------------------
describe("isEventOver", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("開催最終日翌日 0:00 を過ぎていれば true", () => {
    vi.useFakeTimers();
    // first_date 0722 → 開催 7/22・23・24 → 境界は 7/25 00:00
    vi.setSystemTime(new Date(2025, 6, 25, 0, 1, 0));
    expect(isEventOver(2025, "0722")).toBe(true);
  });

  it("開催期間中（最終日 23:59）は false", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 6, 24, 23, 59, 0));
    expect(isEventOver(2025, "0722")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// dayIndexFromDate
// ---------------------------------------------------------------------------
describe("dayIndexFromDate", () => {
  it("開催初日は day_index 1", () => {
    expect(dayIndexFromDate(7, 22, 7, 22)).toBe(1);
  });

  it("開催3日目は day_index 3", () => {
    expect(dayIndexFromDate(7, 24, 7, 22)).toBe(3);
  });

  it("月をまたぐ開催日でも正しく算出する", () => {
    // 初日 8/30 → 8/30・8/31・9/1
    expect(dayIndexFromDate(9, 1, 8, 30)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// normalizeTitleForMatch
// ---------------------------------------------------------------------------
describe("normalizeTitleForMatch", () => {
  it("【...】ブロックを除去する", () => {
    expect(normalizeTitleForMatch("【スポンサーセッション】ゲームAI入門")).toBe("ゲームAI入門");
  });

  it("複数の【...】ブロックをすべて除去する", () => {
    expect(normalizeTitleForMatch("【タグ1】【タグ2】 実際のタイトル")).toBe("実際のタイトル");
  });

  it("スラッシュ前後のスペースを統一する", () => {
    expect(normalizeTitleForMatch("ゲーム / 開発")).toBe("ゲーム/開発");
  });

  it("連続空白を1スペースに圧縮し前後を除去する", () => {
    expect(normalizeTitleForMatch("  複数   空白  ")).toBe("複数 空白");
  });
});
