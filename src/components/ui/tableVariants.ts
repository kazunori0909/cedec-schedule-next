import { cva } from "class-variance-authority";

/** スケジュールテーブルのヘッダー <th> バリアント */
export const tableHeaderVariants = cva("border border-border", {
  variants: {
    kind: {
      room: "bg-secondary px-2 py-2 text-base font-semibold text-secondary-foreground min-w-35",
      time: "w-10 sticky left-0 bg-card z-10 text-center text-xs",
    },
  },
});

/** スケジュールテーブルのデータ <td> バリアント */
export const tableCellVariants = cva("border border-border align-top", {
  variants: {
    kind: {
      time: "w-10 sticky left-0 bg-card z-10 text-center text-[11px] text-muted-foreground",
      empty: "",
    },
    highlight: {
      true: "bg-session-highlight",
      false: "",
    },
  },
  compoundVariants: [
    // 時刻列のみ太字
    { kind: "time", highlight: true, className: "font-bold" },
  ],
  defaultVariants: {
    highlight: false,
  },
});
