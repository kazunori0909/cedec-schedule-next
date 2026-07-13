"use client";

import { Filter } from "lucide-react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Props {
  categories: string[];
  hideSpecs: Record<string, boolean>;
  onToggle: (spec: string) => void;
}

/** フィルター（モバイル用ボトムシート）。開閉・スクロールロック・ESC・フォーカストラップは Radix に委譲 */
export function FilterDrawer({ categories, hideSpecs, onToggle }: Props) {
  const hiddenCount = categories.filter((c) => hideSpecs[c]).length;

  if (categories.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="text-muted-foreground"
          aria-label="フィルターを開く"
        >
          <Filter />
          フィルター
          {hiddenCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold leading-none">
              {hiddenCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      {/* 下部に大きな「閉じる」ボタンがあるため、右上の × は出さない */}
      <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-sm">フィルター</SheetTitle>
          <SheetDescription className="sr-only">
            カテゴリーバッジをタップして表示・非表示を切り替えます
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-wrap gap-y-2 px-4">
          {categories.map((cat) => (
            <CategoryBadge
              key={cat}
              category={cat}
              hidden={!!hideSpecs[cat]}
              clickable
              onClick={() => onToggle(cat)}
            />
          ))}
        </div>
        <SheetFooter className="pb-8">
          <SheetClose asChild>
            <Button>閉じる</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
