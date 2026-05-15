// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FilterPanel } from "@/components/FilterPanel";

describe("FilterPanel", () => {
  it("categories が空のときは何もレンダリングしない", () => {
    const { container } = render(<FilterPanel categories={[]} hideSpecs={{}} onToggle={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("カテゴリー一覧をレンダリングする", () => {
    render(<FilterPanel categories={["ENG", "GD", "PRD"]} hideSpecs={{}} onToggle={vi.fn()} />);
    expect(screen.getByText("ENG")).toBeInTheDocument();
    expect(screen.getByText("GD")).toBeInTheDocument();
    expect(screen.getByText("PRD")).toBeInTheDocument();
  });

  it("バッジをクリックすると onToggle が該当カテゴリーで呼ばれる", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<FilterPanel categories={["ENG", "GD"]} hideSpecs={{}} onToggle={onToggle} />);
    await user.click(screen.getByText("ENG"));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith("ENG");
  });
});
