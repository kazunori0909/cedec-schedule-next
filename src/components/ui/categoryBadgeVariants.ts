import { cva, type VariantProps } from "class-variance-authority";

/** カテゴリーコード → Tailwind 背景クラスのマッピング */
const CATEGORY_BG: Record<string, string> = {
  ENG: "bg-cat-eng",
  VA: "bg-cat-va",
  PRD: "bg-cat-prd",
  BP: "bg-cat-bp",
  SND: "bg-cat-snd",
  GD: "bg-cat-gd",
  AC: "bg-cat-ac",
  NW: "bg-cat-nw",
  // 2011/2012 固有コード（ENGまたはBPと同色）
  PG: "bg-cat-eng",
  PD: "bg-cat-bp",
  BM: "bg-cat-bp",
  INT: "bg-cat-int",
  基調講演: "bg-cat-keynote",
};

/** カテゴリーコードから背景クラスを解決する。hidden 時は非表示色を返す */
export function resolveCategoryBg(category: string, hidden: boolean): string {
  if (hidden) return "bg-cat-hidden";
  return CATEGORY_BG[category] ?? "bg-cat-default";
}

export const categoryBadgeVariants = cva(
  "inline-block px-1.5 py-0.5 mr-1 text-white leading-none",
  {
    variants: {
      variant: {
        main: "text-xs",
        sub: "text-[10px]",
      },
    },
    defaultVariants: {
      variant: "main",
    },
  }
);

export type CategoryBadgeVariant = NonNullable<
  VariantProps<typeof categoryBadgeVariants>["variant"]
>;
