import { cva, type VariantProps } from "class-variance-authority";
import type { UnifiedSession } from "@/types/schedule";

/**
 * スケジュールテーブルのセッション <td> に適用するバリアント。
 * セルの状態（お気に入り・カスタムイベント・デフォルト）と
 * レイアウト（全列スパン）を一元管理する。
 */
export const sessionTdVariants = cva("border border-border align-top p-2 rounded-md", {
  variants: {
    state: {
      default: "bg-session-default",
      favorite: "bg-session-favorite",
      custom: "bg-session-custom",
    },
    fullSpan: {
      true: "text-center",
    },
  },
  defaultVariants: {
    state: "default",
  },
});

export type SessionTdState = NonNullable<VariantProps<typeof sessionTdVariants>["state"]>;

/** セッションの表示状態を解決する */
export function resolveSessionState(session: UnifiedSession, isFavorite: boolean): SessionTdState {
  if (isFavorite) return "favorite";
  if (session.kind === "event" && session.isCustom) return "custom";
  return "default";
}
