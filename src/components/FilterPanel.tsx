"use client";

import { Fragment } from "react";
import { Filter } from "lucide-react";
import { CategoryBadge } from "@/components/CategoryBadge";

interface Props {
  categories: string[];
  hideSpecs: Record<string, boolean>;
  onToggle: (spec: string) => void;
}

const MOBILE_BREAK_AFTER = 5;

export function FilterPanel({ categories, hideSpecs, onToggle }: Props) {
  if (categories.length === 0) return null;
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-2 items-center w-full px-3 py-1.5 bg-muted rounded-md">
      <Filter className="w-4 h-4 text-muted-foreground" aria-label="フィルター" />
      <div className="flex flex-wrap items-center gap-y-1">
        {categories.map((cat, i) => (
          <Fragment key={cat}>
            {i === MOBILE_BREAK_AFTER && <span className="w-full sm:hidden" aria-hidden="true" />}
            <CategoryBadge
              category={cat}
              hidden={!!hideSpecs[cat]}
              clickable
              onClick={() => onToggle(cat)}
            />
          </Fragment>
        ))}
      </div>
    </div>
  );
}
