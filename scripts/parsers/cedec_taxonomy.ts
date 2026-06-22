/**
 * CEDEC 公式タイムテーブル JSON（session/timetable.json）が持つ数値 ID を
 * 表示名へ変換するためのマスタ定義。
 *
 * 出典: 公式サイトのフロントエンド JS（{year}/assets/js/main.js）にハードコードされた
 *   - 分野:   Ms.list （getCategoryTagName）
 *   - 形式:   Ds.list （getFormatName）
 *   - 種別:   Ls.list （getTypeName）
 * の各定義を抽出したもの。年度間で増減した場合はここを更新する。
 */

/** 分野 ID → コード（例: 1 → "ENG"）。12 は「分野なし」を表すため呼び出し側で除外する */
export const CATEGORY_MAP: Record<number, string> = {
  1: "ENG",
  2: "PRD",
  3: "VA",
  4: "GD",
  5: "SND",
  6: "BP",
  7: "AC",
  8: "INT",
  9: "SP",
  10: "AB",
  11: "BoF",
};

/** 「分野なし」を表す特別 ID（バッジ描画から除外される） */
export const CATEGORY_ID_NONE = 12;

/** 形式 ID → 名称（例: 1 → "レギュラーセッション"） */
export const FORMAT_MAP: Record<number, string> = {
  1: "レギュラーセッション",
  2: "パネルディスカッション",
  3: "ラウンドテーブル",
  4: "ショートセッション",
  5: "インタラクティブセッション",
  6: "ワークショップ",
  7: "基調講演",
  8: "CEDEC CHALLENGE",
  9: "業界研究フェア",
  10: "チュートリアル",
  20: "主催者挨拶",
  21: "CEDEC AWARDS",
  22: "ライトニングトーク",
};

/** 種別 ID → 名称（例: 3 → "スポンサー"） */
export const TYPE_MAP: Record<number, string> = {
  1: "公募",
  2: "招待",
  3: "スポンサー",
  4: "協賛",
  5: "特別招待",
  6: "団体招待",
  7: "海外招待",
  8: "基調講演",
  9: "主催者",
};

export function getCategoryName(id: number | null | undefined): string {
  if (id == null || id === CATEGORY_ID_NONE) return "";
  return CATEGORY_MAP[id] ?? "";
}

export function getFormatName(id: number | null | undefined): string {
  if (id == null) return "";
  return FORMAT_MAP[id] ?? "";
}

export function getTypeName(id: number | null | undefined): string {
  if (id == null) return "";
  return TYPE_MAP[id] ?? "";
}
