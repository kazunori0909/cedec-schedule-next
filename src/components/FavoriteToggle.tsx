"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  active: boolean;
  onToggle: () => void;
}

export function FavoriteToggle({ active, onToggle }: Props) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      aria-pressed={active}
      aria-label="お気に入りモード切替"
      className="group aria-pressed:border-fav-border aria-pressed:bg-fav-bg aria-pressed:text-fav-text"
    >
      <Star className="group-aria-pressed:fill-star group-aria-pressed:text-star" />
      お気に入り
    </Button>
  );
}
