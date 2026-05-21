@AGENTS.md
@SECURITY.md
@.claude/CLAUDE.local.md

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
