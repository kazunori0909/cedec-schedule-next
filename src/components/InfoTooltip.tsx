"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

interface Props {
  lines: string[];
}

export function InfoTooltip({ lines }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // タップ外クリックで閉じる
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        onClick={() => setOpen(true)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="p-1 text-muted-foreground hover:text-foreground"
        aria-label="データ取得日時"
        aria-expanded={open}
      >
        <Info className="w-4 h-4" />
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-md px-3 py-2 text-xs whitespace-nowrap text-popover-foreground"
        >
          {lines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
