"use client";

import { cn } from "@/lib/utils";
import { categoryBadgeClass, resolveCategoryBg } from "@/components/categoryBadgeColors";

interface Props {
  category: string;
  hidden?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}

export function CategoryBadge({ category, hidden = false, onClick, clickable = false }: Props) {
  if (!category) return null;
  return (
    <span
      className={cn(
        categoryBadgeClass,
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
