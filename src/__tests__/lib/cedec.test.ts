import { describe, expect, it } from "vitest";

import {
  findYearSetting,
  formatMinutesToTime,
  getAllYears,
  getCategoryClass,
  getDateList,
  getFloorURL,
  isValidYear,
  parseTimeToMinutes,
  resolveDetailUrl,
  SCHEDULE_SETTING,
} from "@/lib/cedec";

// ---------------------------------------------------------------------------
// parseTimeToMinutes / formatMinutesToTime
// ---------------------------------------------------------------------------
describe("parseTimeToMinutes", () => {
  it("09:00 → 540", () => expect(parseTimeToMinutes("09:00")).toBe(540));
  it("00:00 → 0", () => expect(parseTimeToMinutes("00:00")).toBe(0));
  it("23:59 → 1439", () => expect(parseTimeToMinutes("23:59")).toBe(1439));
});

describe("formatMinutesToTime", () => {
  it("parseTimeToMinutes との往復変換が一致する", () => {
    const times = ["09:00", "10:30", "17:45", "00:00", "23:55"];
    for (const t of times) {
      expect(formatMinutesToTime(parseTimeToMinutes(t))).toBe(t);
    }
  });
});

// ---------------------------------------------------------------------------
// getCategoryClass
// ---------------------------------------------------------------------------
describe("getCategoryClass", () => {
  it("ENG → cat-eng", () => expect(getCategoryClass("ENG")).toBe("cat-eng"));
  it("VA → cat-va", () => expect(getCategoryClass("VA")).toBe("cat-va"));
  it("PRD → cat-prd", () => expect(getCategoryClass("PRD")).toBe("cat-prd"));
  it("BP → cat-bp", () => expect(getCategoryClass("BP")).toBe("cat-bp"));
  it("SND → cat-snd", () => expect(getCategoryClass("SND")).toBe("cat-snd"));
  it("GD → cat-gd", () => expect(getCategoryClass("GD")).toBe("cat-gd"));
  it("AC → cat-ac", () => expect(getCategoryClass("AC")).toBe("cat-ac"));
  it("基調講演 → cat-keynote", () => expect(getCategoryClass("基調講演")).toBe("cat-keynote"));
  it("未知のカテゴリは undefined を返す", () =>
    expect(getCategoryClass("UNKNOWN")).toBeUndefined());
  it("空文字は undefined を返す", () => expect(getCategoryClass("")).toBeUndefined());
});

// ---------------------------------------------------------------------------
// isValidYear / findYearSetting / getAllYears
// ---------------------------------------------------------------------------
describe("isValidYear", () => {
  it("有効な年度は true を返す", () => {
    for (const s of SCHEDULE_SETTING) {
      expect(isValidYear(s.year)).toBe(true);
    }
  });

  it("存在しない年度は false を返す", () => {
    expect(isValidYear("2010")).toBe(false);
    expect(isValidYear("9999")).toBe(false);
    expect(isValidYear("")).toBe(false);
  });
});

describe("findYearSetting", () => {
  it("2025 の設定を返す", () => {
    const s = findYearSetting("2025");
    expect(s.year).toBe("2025");
    expect(s.first_date).toBe("0722");
  });

  it("存在しない年度はリストの先頭（デフォルト）を返す", () => {
    const s = findYearSetting("9999");
    expect(s.year).toBe(SCHEDULE_SETTING[0].year);
  });
});

describe("getAllYears", () => {
  it("全年度の配列を返す", () => {
    const years = getAllYears();
    expect(years).toEqual(SCHEDULE_SETTING.map((s) => s.year));
    expect(years.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// getDateList
// ---------------------------------------------------------------------------
describe("getDateList", () => {
  it("3日間の Date 配列を返す", () => {
    const setting = findYearSetting("2025"); // first_date: "0722"
    const dates = getDateList(setting);
    expect(dates).toHaveLength(3);
  });

  it("初日が正しい日付である", () => {
    const setting = findYearSetting("2025"); // first_date: "0722"
    const dates = getDateList(setting);
    expect(dates[0].getFullYear()).toBe(2025);
    expect(dates[0].getMonth()).toBe(6); // 7月 → 0-indexed で 6
    expect(dates[0].getDate()).toBe(22);
  });

  it("連続した3日間になっている", () => {
    const setting = findYearSetting("2024"); // first_date: "0821"
    const dates = getDateList(setting);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i].getDate() - dates[i - 1].getDate()).toBe(1);
    }
  });
});

// ---------------------------------------------------------------------------
// resolveDetailUrl
// ---------------------------------------------------------------------------
describe("resolveDetailUrl", () => {
  const domain = "https://cedec.cesa.or.jp/2025/";

  it("絶対 URL はそのまま返す", () => {
    expect(resolveDetailUrl("https://external.example.com/page", domain)).toBe(
      "https://external.example.com/page"
    );
  });

  it("/ から始まる相対パスはドメインのベースに連結する", () => {
    expect(resolveDetailUrl("/session/detail/123", domain)).toBe(
      "https://cedec.cesa.or.jp/session/detail/123"
    );
  });

  it("/ なしの相対パスは / を補完して連結する", () => {
    expect(resolveDetailUrl("session/detail/456", domain)).toBe(
      "https://cedec.cesa.or.jp/session/detail/456"
    );
  });

  it("空文字は空文字を返す", () => {
    expect(resolveDetailUrl("", domain)).toBe("");
  });

  it("javascript: スキームは空文字を返す（XSS 対策）", () => {
    expect(resolveDetailUrl("javascript:alert(1)", domain)).toBe("");
  });

  it("data: スキームは空文字を返す（XSS 対策）", () => {
    expect(resolveDetailUrl("data:text/html,<h1>xss</h1>", domain)).toBe("");
  });

  it("年パスを含まないドメイン（2018年形式）でも正しく絶対 URL を返す", () => {
    const domain2018 = "https://2018.cedec.cesa.or.jp/";
    expect(resolveDetailUrl("/session/detail/123", domain2018)).toBe(
      "https://2018.cedec.cesa.or.jp/session/detail/123"
    );
  });
});

// ---------------------------------------------------------------------------
// getFloorURL
// ---------------------------------------------------------------------------
describe("getFloorURL", () => {
  it("不明 は undefined を返す", () => {
    expect(getFloorURL("不明", "2025")).toBeUndefined();
  });

  it("オンライン は undefined を返す", () => {
    expect(getFloorURL("オンライン", "2025")).toBeUndefined();
  });

  it("2023年以降は undefined を返す", () => {
    expect(getFloorURL("1", "2023")).toBeUndefined();
    expect(getFloorURL("1", "2025")).toBeUndefined();
  });

  it("2020〜2021年はエンコードされた URL を返す", () => {
    const url = getFloorURL("1", "2020");
    expect(url).toBeDefined();
    expect(url).toContain("cedec.cesa.or.jp/2020");
  });

  it("2022年はエンコードされた URL を返す", () => {
    const url = getFloorURL("1", "2022");
    expect(url).toBeDefined();
    expect(url).toContain("cedec.cesa.or.jp/2022");
  });
});
