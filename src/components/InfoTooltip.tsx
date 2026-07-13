"use client";

import { useRef, useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";

interface Props {
  lines: string[];
}

/**
 * データ取得日時（ℹアイコン）。デスクトップはホバー、モバイルはタップで開く。
 * PopoverTrigger はクリックでトグルするため、ホバーで開いた直後のタップで
 * 閉じてしまう。Anchor + 明示的な open 制御で「クリックは常に開く」挙動にする。
 * 外側クリック・ESC での閉じは Radix Popover に委譲。
 */
export function InfoTooltip({ lines }: Props) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Button
          ref={anchorRef}
          variant="ghost"
          size="icon-xs"
          aria-label="データ取得日時"
          aria-expanded={open}
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(true)}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <Info className="size-4" />
        </Button>
      </PopoverAnchor>
      <PopoverContent
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
        // アンカーボタン上の pointerdown は「外側クリック」扱いにしない
        // （ホバーで開いた直後のクリックで閉じる→開くの競合を防ぐ）
        onPointerDownOutside={(e) => {
          if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
        className="w-max max-w-[calc(100vw-2rem)] whitespace-normal wrap-break-word px-3 py-2 text-xs"
      >
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
