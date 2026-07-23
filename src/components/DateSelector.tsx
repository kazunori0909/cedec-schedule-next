"use client";

import { Button } from "@/components/ui/button";
import { LT_DAY_INDEX } from "@/lib/cedec";
import { cn } from "@/lib/utils";

const WEEKDAY_JP = ["日", "月", "火", "水", "木", "金", "土"];

interface Props {
  dateList: Date[];
  selected: number;
  // ライトニングトークタブの表示（LT データを持つ年度のみ）
  showLightningTalk: boolean;
  onSelect: (index: number) => void;
}

const buttonClass =
  "text-base aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground";

export function DateSelector({ dateList, selected, showLightningTalk, onSelect }: Props) {
  return (
    <div className={cn("grid gap-2", showLightningTalk ? "grid-cols-4" : "grid-cols-3")}>
      {dateList.map((date, i) => {
        const label = `${date.getMonth() + 1}/${date.getDate()}(${WEEKDAY_JP[date.getDay()]})`;
        return (
          <Button
            key={i}
            variant="outline"
            size="lg"
            onClick={() => onSelect(i)}
            aria-pressed={i === selected}
            className={buttonClass}
          >
            {label}
          </Button>
        );
      })}
      {showLightningTalk && (
        <Button
          variant="outline"
          size="lg"
          onClick={() => onSelect(LT_DAY_INDEX)}
          aria-pressed={selected === LT_DAY_INDEX}
          aria-label="ライトニングトーク"
          className={buttonClass}
        >
          LT
        </Button>
      )}
    </div>
  );
}
