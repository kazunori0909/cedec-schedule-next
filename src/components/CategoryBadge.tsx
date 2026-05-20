"use client";

import { cn } from "@/lib/utils";
import { categoryBadgeVariants, resolveCategoryBg } from "@/components/ui/categoryBadgeVariants";

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
  return (
    <span
      className={cn(
        categoryBadgeVariants({ variant }),
        resolveCategoryBg(category, hidden),
        clickable && "cursor-pointer select-none"
      )}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
    >
      {category}
    </span>
  );
}
