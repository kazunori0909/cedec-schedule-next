// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { InfoTooltip } from "@/components/InfoTooltip";

// Radix Popover のコンテンツは role="dialog" で描画される
describe("InfoTooltip", () => {
  it("アイコンボタンが表示される", () => {
    render(<InfoTooltip lines={["テスト行1"]} />);
    expect(screen.getByRole("button", { name: "データ取得日時" })).toBeInTheDocument();
  });

  it("初期状態ではツールチップは非表示", () => {
    render(<InfoTooltip lines={["テスト行1"]} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("クリックするとツールチップが表示される", () => {
    render(<InfoTooltip lines={["セッション情報 取得日時：2026/05/03 22:00"]} />);
    fireEvent.click(screen.getByRole("button", { name: "データ取得日時" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("セッション情報 取得日時：2026/05/03 22:00")).toBeInTheDocument();
  });

  it("複数行を表示できる", () => {
    render(
      <InfoTooltip
        lines={[
          "セッション情報 取得日時：2026/05/03 22:00",
          "CEDiL情報 159件 取得日時：2026/05/03 22:01",
        ]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "データ取得日時" }));
    expect(screen.getByText("セッション情報 取得日時：2026/05/03 22:00")).toBeInTheDocument();
    expect(screen.getByText("CEDiL情報 159件 取得日時：2026/05/03 22:01")).toBeInTheDocument();
  });

  it("マウスオーバーでツールチップが表示される", () => {
    render(<InfoTooltip lines={["テスト行1"]} />);
    fireEvent.mouseEnter(screen.getByRole("button", { name: "データ取得日時" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("マウスアウトでツールチップが閉じる", () => {
    render(<InfoTooltip lines={["テスト行1"]} />);
    const btn = screen.getByRole("button", { name: "データ取得日時" });
    fireEvent.mouseEnter(btn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.mouseLeave(btn);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("外側をクリックするとツールチップが閉じる", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <InfoTooltip lines={["テスト行1"]} />
        <button>外側</button>
      </div>
    );
    // クリック（mouseenterも発火）でツールチップを表示
    await user.click(screen.getByRole("button", { name: "データ取得日時" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // 外側のボタンをクリック → mouseleave と outside click で閉じる
    await user.click(screen.getByRole("button", { name: "外側" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
