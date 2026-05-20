"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  active: boolean;
  onToggle: () => void;
}

export function FavoriteToggle({ active, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors",
        active
          ? "bg-fav-bg border-fav-border text-fav-text"
          : "bg-card border-border text-foreground hover:bg-accent"
      )}
      aria-pressed={active}
      aria-label="お気に入りモード切替"
    >
      <Star className={cn("w-4 h-4", active && "fill-star text-star")} />
      <span className="text-sm font-medium">お気に入り</span>
    </button>
  );
}
