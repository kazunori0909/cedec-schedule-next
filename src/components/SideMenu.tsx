"use client";

import { Menu } from "lucide-react";
import { SCHEDULE_SETTING } from "@/lib/cedec";
import { Button } from "@/components/ui/button";
import { ExternalTextLink } from "@/components/ui/ExternalTextLink";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Props {
  currentYear: string;
  onYearChange: (year: string) => void;
}

/** 年度切り替えサイドメニュー。開閉・スクロールロック・ESC・フォーカストラップは Radix に委譲 */
export function SideMenu({ currentYear, onYearChange }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="メニューを開く">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-0 overflow-y-auto p-4">
        <SheetHeader className="mb-4 p-0">
          <SheetTitle className="text-lg">メニュー</SheetTitle>
          <SheetDescription className="sr-only">年度の切り替えと外部リンク</SheetDescription>
        </SheetHeader>

        <section className="mb-6">
          <h3 className="text-sm font-semibold mb-2 border-b border-border pb-1">年度を選択</h3>
          <ul className="flex flex-col gap-1">
            {SCHEDULE_SETTING.map((s) => (
              <li key={s.year}>
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    onClick={() => onYearChange(s.year)}
                    aria-pressed={s.year === currentYear}
                    className="w-full justify-start aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                  >
                    CEDEC {s.year}
                  </Button>
                </SheetClose>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-semibold mb-2 border-b border-border pb-1">外部リンク</h3>
          <ul className="flex flex-col gap-1">
            <li>
              <ExternalTextLink
                href={`https://cedec.cesa.or.jp/${currentYear}/`}
                className="gap-2 px-3 py-2 rounded-md hover:bg-accent text-session-link-sub"
              >
                CEDEC {currentYear} 公式
              </ExternalTextLink>
            </li>
            <li>
              <ExternalTextLink
                href="https://cedil.cesa.or.jp/"
                className="gap-2 px-3 py-2 rounded-md hover:bg-accent text-session-link-sub"
              >
                CEDiL（資料公開）
              </ExternalTextLink>
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
      </SheetContent>
    </Sheet>
  );
}
