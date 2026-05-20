"use client";

import { cn } from "@/lib/utils";

// 既存サイト main.css のカテゴリー配色に準拠
const CATEGORY_BG: Record<string, string> = {
  ENG: "bg-cat-eng",
  VA: "bg-cat-va",
  PRD: "bg-cat-prd",
  BP: "bg-cat-bp",
  SND: "bg-cat-snd",
  GD: "bg-cat-gd",
  AC: "bg-cat-ac",
  NW: "bg-cat-nw",
  // 2011/2012 固有コード（ENGまたはBPと同色）
  PG: "bg-cat-eng",
  PD: "bg-cat-bp",
  BM: "bg-cat-bp",
  INT: "bg-cat-int",
  基調講演: "bg-cat-keynote",
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
  const bg = CATEGORY_BG[category] ?? "bg-cat-default";
  return (
    <span
      className={cn(
        "inline-block px-1.5 py-0.5 mr-1 text-white text-xs leading-none",
        variant === "sub" ? "text-[10px]" : "text-xs",
        hidden ? "bg-cat-hidden" : bg,
        clickable && "cursor-pointer select-none"
      )}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
    >
      {category}
    </span>
  );
}
