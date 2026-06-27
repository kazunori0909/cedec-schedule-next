"use client";

import { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { CategoryBadge } from "@/components/CategoryBadge";

interface Props {
  categories: string[];
  hideSpecs: Record<string, boolean>;
  onToggle: (spec: string) => void;
}

export function FilterDrawer({ categories, hideSpecs, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const hiddenCount = categories.filter((c) => hideSpecs[c]).length;

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (categories.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-sm text-muted-foreground cursor-pointer"
        aria-label="フィルターを開く"
      >
        <Filter className="w-4 h-4" />
        <span>フィルター</span>
        {hiddenCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold leading-none">
            {hiddenCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="フィルター"
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-xl px-4 pt-4 pb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-sm">フィルター</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="フィルターを閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-y-2 mb-4">
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
            <button
              onClick={() => setOpen(false)}
              className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium cursor-pointer"
            >
              閉じる
            </button>
          </div>
        </>
      )}
    </>
  );
}
