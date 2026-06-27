"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X, ExternalLink } from "lucide-react";
import { SCHEDULE_SETTING } from "@/lib/cedec";
import { cn } from "@/lib/utils";

interface Props {
  currentYear: string;
  onYearChange: (year: string) => void;
}

export function SideMenu({ currentYear, onYearChange }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // body スクロールロック
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // ESC キーで閉じる
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-md hover:bg-accent cursor-pointer"
        aria-label="メニューを開く"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-1000">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <aside
              className={cn(
                "absolute top-0 left-0 h-full w-72 bg-card border-r border-border shadow-lg",
                "p-4 overflow-y-auto"
              )}
              role="dialog"
              aria-modal="true"
              aria-label="メニュー"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">メニュー</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1 rounded hover:bg-accent cursor-pointer"
                  aria-label="メニューを閉じる"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <section className="mb-6">
                <h3 className="text-sm font-semibold mb-2 border-b border-border pb-1">
                  年度を選択
                </h3>
                <ul className="flex flex-col gap-1">
                  {SCHEDULE_SETTING.map((s) => (
                    <li key={s.year}>
                      <button
                        type="button"
                        onClick={() => {
                          onYearChange(s.year);
                          setOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md transition-colors cursor-pointer",
                          s.year === currentYear
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        )}
                      >
                        CEDEC {s.year}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-6">
                <h3 className="text-sm font-semibold mb-2 border-b border-border pb-1">
                  外部リンク
                </h3>
                <ul className="flex flex-col gap-1">
                  <li>
                    <a
                      href={`https://cedec.cesa.or.jp/${currentYear}/`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-session-link-sub"
                    >
                      CEDEC {currentYear} 公式
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://cedil.cesa.or.jp/"
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-session-link-sub"
                    >
                      CEDiL（資料公開）
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                </ul>
              </section>

              <section className="text-xs text-muted-foreground">
                <h3 className="text-sm font-semibold mb-2 border-b border-border pb-1 text-foreground">
                  使い方
                </h3>
                <ul className="space-y-1 list-disc pl-4">
                  <li>カテゴリーバッジをクリックでフィルター切替</li>
                  <li>セッションの星アイコンでお気に入り登録</li>
                  <li>「お気に入り」ボタンで登録セッションのみ表示</li>
                </ul>
              </section>
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}
