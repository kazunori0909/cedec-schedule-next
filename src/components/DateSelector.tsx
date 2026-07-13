"use client";

import { Button } from "@/components/ui/button";

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
        return (
          <Button
            key={i}
            variant="outline"
            size="lg"
            onClick={() => onSelect(i)}
            aria-pressed={i === selected}
            className="text-base aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
