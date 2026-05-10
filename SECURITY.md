# セキュリティガイドライン

## シークレット・環境変数

- **`.env` ファイルは絶対に読み込まない・内容を出力しない**。必要な場合は `.env.example` のプレースホルダーのみ参照する。
- `.env` を `git add` しない（`.gitignore` で除外済み）。
- `NEXT_PUBLIC_` プレフィックスの環境変数に秘密情報を入れない（ブラウザバンドルに含まれて公開される）。
- 新しい API キー・認証情報は `.env` に追加し、`.env.example` にはプレースホルダーのみ記載する。

## 外部データの安全な扱い

- `schedule.json` / `cedil.json` は外部サイト由来のため信頼できない入力として扱う。
- 外部 URL（`detail_url`、`live`、`youtube`、`cedil_url`、`floor_url`）を `<a href>` に渡す場合は **必ず `safeExternalUrl()`（`src/lib/utils.ts`）を経由する**。`javascript:` / `data:` 等のスキームによる XSS を防ぐ。
- `dangerouslySetInnerHTML` は原則禁止。例外は `src/lib/custom.ts` のハードコード済み非公式イベント HTML のみ（新規追加時は必ずレビュー）。
- セッションタイトル・説明文は JSX 経由でレンダリングする（React が自動エスケープ）。

## `public/` ディレクトリ

- 機密情報を含むファイルを置かない（ビルド時に `out/` へコピーされ Web 公開される）。

## コミット前チェック

- `husky` + `lint-staged` による pre-commit フックで以下を自動実行：
  1. `scripts/check-secrets.sh` — `.env*` や既知シークレットパターンのステージングをブロック
  2. `eslint --fix` + `prettier --write` — ステージされたファイルへ適用
- フックを `--no-verify` でスキップしない。

## 依存パッケージ

- 新規パッケージ追加時は必要性を検討し最小限に留める。
- 定期的に `npm audit` で脆弱性を確認する。
