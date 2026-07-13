# Phase 5: shadcn/ui 採用によるUIプリミティブ統合リファクタリング

## 課題

jQuery 時代からのリアーキテクト後、トークン基盤（`@theme` セマンティックカラー・CVA・`cn()`）は
整備済みだが、コンポーネント側が基盤を使い切れておらず同一スタイルの再実装が散っている。

1. **ボタンの手書き重複** — `px-3 py-1.5 rounded-md … cursor-pointer` と
   「アクティブ時 `bg-primary text-primary-foreground` / 非アクティブ時 `bg-card border-border hover:bg-accent`」
   のペアが DateSelector・FavoriteToggle・SideMenu・FilterDrawer（2箇所）で微妙に違う形で再実装されている
2. **オーバーレイの二重実装と品質差** — FilterDrawer と SideMenu が背景・スクロールロック・
   `role="dialog"` を別々に実装。SideMenu は ESC 対応・portal・overflow 復元ありだが
   FilterDrawer はどれもなし。フォーカストラップは両方なし
3. **外部リンクパターンの重複** — `inline-flex items-center gap-1 … hover:underline` +
   `<ExternalLink>` アイコンが SessionCell 内 3 箇所・SideMenu 2 箇所
4. **マジック値の散在** — `text-[10px]` が 10 箇所以上、場当たり的な z-index（`z-40` / `z-50` / `z-1000`）
5. **細かい負債** — CategoryBadge の `main` / `sub` バリアントが実質同一、
   CVA ファイル方式とインライン三項演算子方式の混在

## 方針

**shadcn/ui（Radix UI ベースのコピーイン方式）を採用**し、3 ステップで統合する。

- 案A（採用）: shadcn/ui 採用
  - `globals.css` のトークン定義がすでに shadcn 標準そのもの（`tw-animate-css` も導入済み）で導入コスト最小
  - コードが `components/ui/` に入るコピーイン方式のため、named export・strict・日本語コメントの
    プロジェクト規約に合わせて改変できる
  - フォーカストラップ・ESC・スクロールロック等のアクセシビリティが Radix から得られる
- 案B（不採用）: 依存を増やさず自前 Button バリアント + `useModalBehavior()` フックで統合
  - フォーカストラップを自前で正しく実装するのは割に合わない。モーダルが 2 つある時点で Radix が妥当

### ステップ 1: プリミティブ導入と置き換え（効果最大）

- `Button` を CVA バリアント付きで導入（`variant` / `size`）し、手書きボタン群を置き換える。
  選択状態は三項演算子でなく `aria-pressed` / `data-state` 属性 + データ属性スタイリングに寄せる
- `Sheet`（Radix Dialog ベース）を導入し、FilterDrawer（下から）と SideMenu（左から）を
  同一プリミティブの `side` 違いに統合
- `InfoTooltip` を Radix Tooltip/Popover ベースに置き換え（手書きの外側クリック検知を削除）

### ステップ 2: 共有パターンの部品化

- `ExternalTextLink`（`safeExternalUrl` 適用 + `rel="noopener"` + アイコン内包）を作りリンク 5 箇所を置換。
  SECURITY.md の safeExternalUrl 必須ルールをコンポーネントの型で強制できる
- SessionCell 内のメタ情報行（`text-[10px]` 系）を小部品 or CVA バリアントに集約

### ステップ 3: トークンの仕上げ

- `@theme` に `--text-2xs`（→ `text-2xs`）と z-index スケールを追加し、`text-[10px]` と
  場当たり z-index を根絶
- CategoryBadge の同一バリアント削除
- スタイル定義の置き場を「状態を持つものは `ui/*Variants.ts`、一回きりはインライン」と規約化し
  CLAUDE.md に追記

## 決定事項ログ

### 2026-07-13: shadcn/ui 採用の承認

- 案A（shadcn/ui 採用・大掛かりな改修も許容）をユーザーが承認。新規依存（Radix UI）追加を含む
- スタイルの一元化とアクセシビリティ改善（フォーカストラップ等）を同時に達成することが狙い

### 2026-07-13: 実装時の設計判断

- InfoTooltip は Radix **Tooltip ではなく Popover** を採用（モバイルのタップ対応が必要なため）。
  さらに Trigger のクリックトグルがホバー開と競合するため PopoverAnchor + controlled open にした
  （詳細は KNOWLEDGE.md）
- z-index 専用トークンは**追加しない**ことにした。場当たりな `z-1000` は手書きオーバーレイの
  Radix 化で消滅し、残りは標準の `z-10/30/50` に収まったため
- FilterDrawer の右上 × は非表示（`showCloseButton={false}`）。下部の大きな「閉じる」ボタンと
  重複し、テストのアクセシブルネームも衝突するため
