@AGENTS.md
@SECURITY.md

# 開発方針

## ルール

- 新機能の追加時は新ブランチを作成してから着手する
- TypeScript strict モード。`any` 型は禁止
- named export を使用（default export 禁止）
- ESLint / Prettier に従う。リンターエラーは出力に従って修正する
- `public/web_data/`・`web_data_original/` はコミット不要（`.gitignore` 済み）

## コードスタイル

- TypeScript（strict）+ React 19 関数コンポーネント + Tailwind CSS
- 状態は Zustand ストア経由で操作（直接 `localStorage` を触らない）
- コメントは日本語で記述

## UI・スタイリング規約（Phase 5〜）

- UI プリミティブは shadcn/ui（`src/components/ui/`、Radix ベースのコピーイン）を使う
  - ボタンは `Button` を使う（`<button>` へのスタイル手書き禁止）。トグル系の選択状態は
    `aria-pressed` 属性 + Tailwind の aria バリアント（`aria-pressed:bg-primary` 等）で表現する
  - ドロワー・モーダルは `Sheet` を使う（スクロールロック・ESC・フォーカストラップを自前実装しない）
  - 外部サイトへの `<a>` は `ExternalTextLink` を使う（`safeExternalUrl` 検証と `rel="noopener"` を内包）
- 状態によって切り替わるスタイルは `src/components/ui/*Variants.ts` に CVA で定義する。
  一箇所でしか使わないスタイルはインラインの `className` に書く
- フォントサイズ等の任意値指定（`text-[10px]` など）は使わず `@theme` トークン（`text-2xs` 等）を使う
