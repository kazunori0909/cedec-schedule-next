// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { getDebugNow, getNow, hashTagUrl, safeExternalUrl } from "@/lib/utils";

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

describe("getDebugNow（開発時の現在時刻上書き）", () => {
  // 各テスト後にクエリをクリアして他テストへ影響しないようにする
  afterEach(() => {
    window.history.replaceState(null, "", window.location.pathname);
  });

  it("?now= 未指定なら null を返す", () => {
    window.history.replaceState(null, "", "/");
    expect(getDebugNow()).toBeNull();
  });

  it("?now=YYYY-MM-DDTHH:mm をローカル時刻として解釈する", () => {
    window.history.replaceState(null, "", "/?now=2026-07-22T11:24");
    const d = getDebugNow();
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(6); // 0-based: 7月
    expect(d!.getDate()).toBe(22);
    expect(d!.getHours()).toBe(11);
    expect(d!.getMinutes()).toBe(24);
  });

  it("空白区切り（YYYY-MM-DD HH:mm）も受け付ける", () => {
    window.history.replaceState(null, "", "/?now=2026-07-22 09:05");
    const d = getDebugNow();
    expect(d!.getHours()).toBe(9);
    expect(d!.getMinutes()).toBe(5);
  });

  it("形式不正な値は null を返す", () => {
    window.history.replaceState(null, "", "/?now=2026/07/22");
    expect(getDebugNow()).toBeNull();
  });

  it("getNow は上書きが無ければ実時刻に近い値を返す", () => {
    window.history.replaceState(null, "", "/");
    const before = Date.now();
    const now = getNow().getTime();
    const after = Date.now();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(after);
  });
});
