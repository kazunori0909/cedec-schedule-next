"use client";

import { cn } from "@/lib/utils";

const WEEKDAY_JP = ["日", "月", "火", "水", "木", "金", "土"];

interface Props {
  dateList: Date[];
  selected: number;
  onSelect: (index: number) => void;
}

export function DateSelector({ dateList, selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {dateList.map((date, i) => {
        const label = `${date.getMonth() + 1}/${date.getDate()}(${WEEKDAY_JP[date.getDay()]})`;
        const isActive = i === selected;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              "px-5 py-2 rounded-md border text-base font-medium transition-colors cursor-pointer",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-card-foreground border-border hover:bg-accent"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
