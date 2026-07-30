// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Session, UnifiedSession } from "@/types/schedule";
import { SessionCell } from "@/components/schedule/SessionCell";
import { LIVE_URL_PENDING } from "@/lib/cedec";

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "s1",
    day: "1",
    room: "1",
    start: "10:00",
    end: "11:00",
    category: "ENG",
    title: "テストセッションタイトル",
    speakers: [],
    detail_url: "",
    ...overrides,
  };
}

const DEFAULT_PROPS = {
  year: "2025",
  isFavorite: false,
  onToggleFavorite: vi.fn(),
  hideSpecs: {},
  roomName: "1",
};

describe("SessionCell - セッション表示", () => {
  it("セッションタイトルをレンダリングする", () => {
    const session: UnifiedSession = {
      kind: "session",
      data: makeSession({ title: "AIを活用したゲーム開発" }),
    };
    render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    expect(screen.getByText("AIを活用したゲーム開発")).toBeInTheDocument();
  });

  it("カテゴリーバッジを表示する", () => {
    const session: UnifiedSession = {
      kind: "session",
      data: makeSession({ category: "ENG" }),
    };
    render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    expect(screen.getByText("ENG")).toBeInTheDocument();
  });

  it("is_invited が true のとき 招待 バッジを表示する", () => {
    const session: UnifiedSession = {
      kind: "session",
      data: makeSession({ is_invited: true }),
    };
    render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    expect(screen.getByText("招待")).toBeInTheDocument();
  });

  it("is_invited が未設定のとき 招待 バッジを表示しない", () => {
    const session: UnifiedSession = {
      kind: "session",
      data: makeSession(),
    };
    render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    expect(screen.queryByText("招待")).not.toBeInTheDocument();
  });

  it("カテゴリーが hideSpecs に含まれるとフィルター表示になる", () => {
    const session: UnifiedSession = {
      kind: "session",
      data: makeSession({ category: "ENG" }),
    };
    render(<SessionCell {...DEFAULT_PROPS} session={session} hideSpecs={{ ENG: true }} />);
    expect(screen.getByText("（フィルター中）")).toBeInTheDocument();
    expect(screen.queryByText("テストセッションタイトル")).not.toBeInTheDocument();
  });

  it("detail_url が http(s) のときリンクになる", () => {
    const session: UnifiedSession = {
      kind: "session",
      data: makeSession({
        title: "リンク付きセッション",
        detail_url: "https://cedec.cesa.or.jp/2025/session/detail/1",
      }),
    };
    render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    const link = screen.getByRole("link", { name: "リンク付きセッション" });
    expect(link).toHaveAttribute("href", "https://cedec.cesa.or.jp/2025/session/detail/1");
  });

  it("detail_url が javascript: のときリンクを表示しない（XSS 対策）", () => {
    const session: UnifiedSession = {
      kind: "session",
      data: makeSession({
        title: "XSS攻撃セッション",
        detail_url: "javascript:alert(1)",
      }),
    };
    render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    // リンクではなく p タグでタイトルが表示される
    expect(screen.queryByRole("link", { name: "XSS攻撃セッション" })).not.toBeInTheDocument();
    expect(screen.getByText("XSS攻撃セッション")).toBeInTheDocument();
  });

  it("お気に入りボタンをクリックすると onToggleFavorite が呼ばれる", async () => {
    const onToggleFavorite = vi.fn();
    const session: UnifiedSession = {
      kind: "session",
      data: makeSession(),
    };
    const user = userEvent.setup();
    render(
      <SessionCell {...DEFAULT_PROPS} session={session} onToggleFavorite={onToggleFavorite} />
    );
    await user.click(screen.getByRole("button", { name: "お気に入り切替" }));
    expect(onToggleFavorite).toHaveBeenCalledOnce();
  });

  it("cedilUrl が渡されると 資料公開: 公開済み リンクを表示する", () => {
    const session: UnifiedSession = {
      kind: "session",
      data: makeSession(),
    };
    render(
      <SessionCell
        {...DEFAULT_PROPS}
        session={session}
        cedilUrl="https://cedil.example.com/item/1"
      />
    );
    expect(screen.getByText("資料公開: 公開済み")).toBeInTheDocument();
  });

  it("cedilUrl が渡されないとき 資料公開: 不明 を表示する", () => {
    const session: UnifiedSession = {
      kind: "session",
      data: makeSession(),
    };
    render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    expect(screen.getByText("資料公開: 不明")).toBeInTheDocument();
  });

  it("live が実 URL のとき YouTube リンクを表示する", () => {
    const session: UnifiedSession = {
      kind: "session",
      data: makeSession({ live: "https://www.youtube.com/watch?v=xxxx" }),
    };
    render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    expect(screen.getByRole("link", { name: /YouTube/ })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=xxxx"
    );
    expect(screen.queryByText("Live配信予定")).not.toBeInTheDocument();
  });

  it("live が URL 未確定センチネルのとき Live配信予定 を表示しリンクにしない", () => {
    const session: UnifiedSession = {
      kind: "session",
      data: makeSession({ live: LIVE_URL_PENDING }),
    };
    render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    expect(screen.getByText("Live配信予定")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /YouTube/ })).not.toBeInTheDocument();
  });

  it("live が無いときは Live配信予定 も YouTube リンクも表示しない", () => {
    const session: UnifiedSession = { kind: "session", data: makeSession() };
    render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    expect(screen.queryByText("Live配信予定")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /YouTube/ })).not.toBeInTheDocument();
  });

  it("講演キャンセル表記のセッションは淡色表示になる", () => {
    const session: UnifiedSession = {
      kind: "session",
      data: makeSession({ title: "【講演キャンセル】中止セッション" }),
    };
    const { container } = render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    expect(container.firstElementChild).toHaveClass("opacity-50");
  });

  it("通常のセッションは淡色表示にならない", () => {
    const session: UnifiedSession = { kind: "session", data: makeSession() };
    const { container } = render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    expect(container.firstElementChild).not.toHaveClass("opacity-50");
  });

  it("スピーカーが複数いるとき、最初の1名のみ表示し ほかN名 ボタンを出す", () => {
    const session: UnifiedSession = {
      kind: "session",
      data: makeSession({
        speakers: [
          { name: "田中太郎", company: "株式会社A" },
          { name: "鈴木花子", company: "株式会社B" },
          { name: "山田次郎", company: "株式会社C" },
        ],
      }),
    };
    render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    expect(screen.getByText("田中太郎")).toBeInTheDocument();
    expect(screen.queryByText("鈴木花子")).not.toBeInTheDocument();
    expect(screen.getByText("ほか2名")).toBeInTheDocument();
  });

  it("ほかN名 ボタンをクリックすると残りのスピーカーが展開される", async () => {
    const session: UnifiedSession = {
      kind: "session",
      data: makeSession({
        speakers: [
          { name: "田中太郎", company: "株式会社A" },
          { name: "鈴木花子", company: "株式会社B" },
        ],
      }),
    };
    const user = userEvent.setup();
    render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    await user.click(screen.getByText("ほか1名"));
    expect(screen.getByText("鈴木花子")).toBeInTheDocument();
  });
});

describe("SessionCell - イベント表示", () => {
  it("kind=event のとき event.title をレンダリングする", () => {
    const session: UnifiedSession = {
      kind: "event",
      data: {
        title: "Developers' Night",
        day_index: 1,
        start_time: "19:30",
        end_time: "21:30",
        room_no: "多目的ホール",
      },
    };
    render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    expect(screen.getByText("Developers' Night")).toBeInTheDocument();
  });

  it("isCustom=true のとき 【非公式】 ラベルを表示する", () => {
    const session: UnifiedSession = {
      kind: "event",
      isCustom: true,
      data: {
        title: "ProCEDEC 2025",
        day_index: 2,
        start_time: "19:45",
        end_time: "21:45",
        room_no: "会場",
      },
    };
    render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    expect(screen.getByText("【非公式】")).toBeInTheDocument();
  });

  it("isCustom=false のとき 【非公式】 ラベルを表示しない", () => {
    const session: UnifiedSession = {
      kind: "event",
      isCustom: false,
      data: {
        title: "CEDEC AWARDS",
        day_index: 1,
        start_time: "17:30",
        end_time: "19:00",
        room_no: "1",
      },
    };
    render(<SessionCell {...DEFAULT_PROPS} session={session} />);
    expect(screen.queryByText("【非公式】")).not.toBeInTheDocument();
  });
});
