/** カテゴリーバッジの基本クラス（バリアントなし） */
export const categoryBadgeClass = "inline-block px-1.5 py-0.5 mr-1 text-white text-xs leading-none";

/**
 * カテゴリーコード → 表示色。画面（Tailwind クラス）と Excel 出力（hex）の唯一の定義元。
 * Tailwind はクラス名を静的に走査するため `bg` は文字列リテラルで書く必要がある
 * （`bg-cat-${code}` のような動的生成は不可）。`hex` は globals.css の `--cat-*` と同じ値。
 */
const CATEGORY_COLORS: Record<string, { bg: string; hex: string }> = {
  ENG: { bg: "bg-cat-eng", hex: "A88E1E" },
  VA: { bg: "bg-cat-va", hex: "E55E74" },
  PRD: { bg: "bg-cat-prd", hex: "5269CE" },
  BP: { bg: "bg-cat-bp", hex: "45B2E0" },
  SND: { bg: "bg-cat-snd", hex: "76B946" },
  GD: { bg: "bg-cat-gd", hex: "3ACBB4" },
  AC: { bg: "bg-cat-ac", hex: "B677D3" },
  NW: { bg: "bg-cat-nw", hex: "188B42" }, // 2011/2012 のみ
  // 2011/2012 固有コード（ENG または BP と同色）
  PG: { bg: "bg-cat-eng", hex: "A88E1E" },
  PD: { bg: "bg-cat-bp", hex: "45B2E0" },
  BM: { bg: "bg-cat-bp", hex: "45B2E0" },
  基調講演: { bg: "bg-cat-keynote", hex: "1F3C5A" },
};

/** カテゴリーコードから背景クラスを解決する。hidden 時は非表示色を返す */
export function resolveCategoryBg(category: string, hidden: boolean): string {
  if (hidden) return "bg-cat-hidden";
  return CATEGORY_COLORS[category]?.bg ?? "bg-cat-default";
}

/** カテゴリーコードから背景色（hex 6桁）を解決する。未定義コードは undefined */
export function resolveCategoryHex(category: string): string | undefined {
  return CATEGORY_COLORS[category]?.hex;
}
