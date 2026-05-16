"use client";

import { cn } from "@/lib/utils";

// 既存サイト main.css のカテゴリー配色に準拠
const CATEGORY_BG: Record<string, string> = {
  ENG: "bg-[var(--cat-eng)]",
  VA: "bg-[var(--cat-va)]",
  PRD: "bg-[var(--cat-prd)]",
  BP: "bg-[var(--cat-bp)]",
  SND: "bg-[var(--cat-snd)]",
  GD: "bg-[var(--cat-gd)]",
  AC: "bg-[var(--cat-ac)]",
  NW: "bg-[var(--cat-nw)]",
  // 2011/2012 固有コード（ENGまたはBPと同色）
  PG: "bg-[var(--cat-eng)]",
  PD: "bg-[var(--cat-bp)]",
  BM: "bg-[var(--cat-bp)]",
  INT: "bg-[var(--cat-int)]",
  基調講演: "bg-[var(--cat-keynote)]",
};

interface Props {
  category: string;
  variant?: "main" | "sub";
  hidden?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}

export function CategoryBadge({
  category,
  variant = "main",
  hidden = false,
  onClick,
  clickable = false,
}: Props) {
  if (!category) return null;
  const bg = CATEGORY_BG[category] ?? "bg-[var(--cat-default)]";
  return (
    <span
      className={cn(
        "inline-block px-1.5 py-0.5 mr-1 text-white text-xs leading-none",
        variant === "sub" ? "text-[10px]" : "text-xs",
        hidden ? "bg-[var(--cat-hidden)]" : bg,
        clickable && "cursor-pointer select-none"
      )}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
    >
      {category}
    </span>
  );
}
