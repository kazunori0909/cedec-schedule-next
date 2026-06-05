import { describe, expect, it } from "vitest";

import { hashTagUrl, safeExternalUrl } from "@/lib/utils";

describe("safeExternalUrl", () => {
  describe("無効な入力", () => {
    it("undefined は undefined を返す", () => {
      expect(safeExternalUrl(undefined)).toBeUndefined();
    });

    it("null は undefined を返す", () => {
      expect(safeExternalUrl(null)).toBeUndefined();
    });

    it("空文字は undefined を返す", () => {
      expect(safeExternalUrl("")).toBeUndefined();
    });

    it("スペースのみの文字列は undefined を返す", () => {
      expect(safeExternalUrl("   ")).toBeUndefined();
    });
  });

  describe("危険なスキームをブロック", () => {
    it("javascript: スキームは undefined を返す", () => {
      expect(safeExternalUrl("javascript:alert(1)")).toBeUndefined();
    });

    it("大文字 JAVASCRIPT: スキームは undefined を返す", () => {
      // URL パーサーはスキームを小文字正規化するので同様にブロックされる
      expect(safeExternalUrl("JAVASCRIPT:alert(1)")).toBeUndefined();
    });

    it("data: スキームは undefined を返す", () => {
      expect(safeExternalUrl("data:text/html,<h1>xss</h1>")).toBeUndefined();
    });

    it("vbscript: スキームは undefined を返す", () => {
      expect(safeExternalUrl("vbscript:MsgBox(1)")).toBeUndefined();
    });

    it("ftp: スキームは undefined を返す", () => {
      expect(safeExternalUrl("ftp://example.com/file")).toBeUndefined();
    });

    it("file: スキームは undefined を返す", () => {
      expect(safeExternalUrl("file:///etc/passwd")).toBeUndefined();
    });
  });

  describe("安全な URL を通過させる", () => {
    it("http URL はそのまま返す", () => {
      expect(safeExternalUrl("http://example.com")).toBe("http://example.com");
    });

    it("https URL はそのまま返す", () => {
      expect(safeExternalUrl("https://example.com/path?q=1#hash")).toBe(
        "https://example.com/path?q=1#hash"
      );
    });

    it("/ で始まる相対パスはそのまま返す", () => {
      expect(safeExternalUrl("/web_data/2025/schedule.json")).toBe("/web_data/2025/schedule.json");
    });

    it("./ で始まる相対パスはそのまま返す", () => {
      expect(safeExternalUrl("./relative/path")).toBe("./relative/path");
    });

    it("前後の空白は trim されて返す", () => {
      expect(safeExternalUrl("  https://example.com  ")).toBe("https://example.com");
    });

    it("クエリパラメータ・フラグメント付き URL を通過させる", () => {
      const url = "https://cedec.cesa.or.jp/2025/session/detail/123?foo=bar#section";
      expect(safeExternalUrl(url)).toBe(url);
    });
  });
});

describe("hashTagUrl", () => {
  it("タグから X のハッシュタグページ URL を生成する", () => {
    expect(hashTagUrl("ShaderGrill2026")).toBe("https://x.com/hashtag/ShaderGrill2026");
  });

  it("先頭の # は除去する", () => {
    expect(hashTagUrl("#CEDEC2026")).toBe("https://x.com/hashtag/CEDEC2026");
  });

  it("前後の空白は trim する", () => {
    expect(hashTagUrl("  UICEDEC  ")).toBe("https://x.com/hashtag/UICEDEC");
  });

  it("マルチバイト文字は URL エンコードする", () => {
    expect(hashTagUrl("ゲーム")).toBe("https://x.com/hashtag/%E3%82%B2%E3%83%BC%E3%83%A0");
  });

  it("空文字は undefined を返す", () => {
    expect(hashTagUrl("")).toBeUndefined();
  });

  it("# のみ・空白のみは undefined を返す", () => {
    expect(hashTagUrl("#")).toBeUndefined();
    expect(hashTagUrl("   ")).toBeUndefined();
  });
});
