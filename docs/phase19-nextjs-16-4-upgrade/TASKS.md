# Phase 19 タスク

## Step 0: 準備

- [x] `feature/phase19-nextjs-16-4` ブランチを作成（前ブランチの 2 コミットを引き継ぎ）
- [x] devcontainer の未コミット差分（`DISABLE_AUTOUPDATER` 削除・lock 更新）をコミット
- [x] gh 設定ボリュームが root 所有でマウントされ認証情報を保存できない問題を Dockerfile で修正
- [x] 参考 PR（scrum-fest-archive#109）を確認し、PLAN.md に合わせ込み方針を追記
- [x] 置き換え前のベースライン計測（`out/` 合計サイズ・JS チャンクサイズ・ビルド時間）

## Step 1: Next.js 16.4.2 / React 19.3

- [ ] `next upgrade --agent` の移行ガイド・codemod を確認
- [ ] next / eslint-config-next 16.4.2、react / react-dom 19.3.1、@types/react(-dom) 19.3.0 に更新
- [ ] lint / tsc --noEmit / test:run / build / format:check を通過

## Step 2: Rust 版 React Compiler

- [ ] `next.config.ts` に `experimental.turbopackRustReactCompiler: true` を追加
- [ ] `babel-plugin-react-compiler` を削除
- [ ] 16.4.2 の Babel 版と Rust 版で、JS チャンクのバイト一致・`memo_cache_sentinel` 数・Compiled 工程の時間を比較
- [ ] `next.config.ts` に Rust 版を使う理由と PLAN への参照をコメントで追加
- [ ] `next dev` で画面を確認（タイムテーブル・フィルター・Excel ダウンロードの動的読み込み）
- [ ] 切り戻し手順を決定事項ログに記録

## Step 3: 脆弱性

- [ ] `npm audit fix`（非破壊）を適用
- [ ] eslint-config-next 経由の high が解消したか再確認
- [ ] 残った指摘（uuid 等）と見送り理由を記録

## Step 4: その他の依存更新

- [ ] レンジ内のマイナー／パッチ更新を適用
- [ ] Vitest 5 の導入を実測し、採否を決める

## Step 5: 最適化

- [ ] バンドルサイズ・ビルド時間をベースラインと比較し、KNOWLEDGE.md に記録
- [ ] `next dev` 後に AGENTS.md へ差分が出ないことを確認

## 共通

- [ ] AGENTS.md の技術スタック（Next 16.4・React Compiler 有効・Rust 版）を更新
- [ ] docs/README.md の Phase 19 を ✅ に更新
- [ ] 実機調査で判明した挙動・制約を KNOWLEDGE.md に記録
- [ ] 個人情報チェック（更新した Git 追跡ファイルに実値が混入していないか）
