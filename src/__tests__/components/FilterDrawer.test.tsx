// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FilterDrawer } from "@/components/FilterDrawer";

// Radix Dialog はモーダル表示中に body へ pointer-events: none を設定するため、
// jsdom では userEvent の pointer-events チェックを無効化して操作する
const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 });

describe("FilterDrawer", () => {
  it("categories が空のときは何もレンダリングしない", () => {
    const { container } = render(
      <FilterDrawer categories={[]} hideSpecs={{}} onToggle={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("フィルターボタンが表示される", () => {
    render(<FilterDrawer categories={["ENG", "GD"]} hideSpecs={{}} onToggle={vi.fn()} />);
    expect(screen.getByRole("button", { name: "フィルターを開く" })).toBeInTheDocument();
  });

  it("非表示カテゴリーがあるときバッジに件数が表示される", () => {
    render(
      <FilterDrawer
        categories={["ENG", "GD", "PRD"]}
        hideSpecs={{ ENG: true, PRD: true }}
        onToggle={vi.fn()}
      />
    );
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("非表示カテゴリーがないときバッジは表示されない", () => {
    render(<FilterDrawer categories={["ENG", "GD"]} hideSpecs={{}} onToggle={vi.fn()} />);
    expect(screen.queryByText(/^\d+$/)).toBeNull();
  });

  it("ボタンをクリックするとドロワーが開く", async () => {
    const user = setupUser();
    render(<FilterDrawer categories={["ENG", "GD"]} hideSpecs={{}} onToggle={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "フィルターを開く" }));
    expect(screen.getByRole("dialog", { name: "フィルター" })).toBeInTheDocument();
    expect(screen.getByText("ENG")).toBeInTheDocument();
    expect(screen.getByText("GD")).toBeInTheDocument();
  });

  it("閉じるボタンでドロワーが閉じる", async () => {
    const user = setupUser();
    render(<FilterDrawer categories={["ENG"]} hideSpecs={{}} onToggle={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "フィルターを開く" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "閉じる" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("オーバーレイをクリックするとドロワーが閉じる", async () => {
    const user = setupUser();
    render(<FilterDrawer categories={["ENG"]} hideSpecs={{}} onToggle={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "フィルターを開く" }));
    const overlay = document.querySelector('[data-slot="sheet-overlay"]');
    expect(overlay).not.toBeNull();
    await user.click(overlay!);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("ESC キーでドロワーが閉じる", async () => {
    const user = setupUser();
    render(<FilterDrawer categories={["ENG"]} hideSpecs={{}} onToggle={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "フィルターを開く" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("ドロワー内のカテゴリーバッジをクリックすると onToggle が呼ばれる", async () => {
    const onToggle = vi.fn();
    const user = setupUser();
    render(<FilterDrawer categories={["ENG", "GD"]} hideSpecs={{}} onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: "フィルターを開く" }));
    await user.click(screen.getByText("ENG"));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith("ENG");
  });
});
