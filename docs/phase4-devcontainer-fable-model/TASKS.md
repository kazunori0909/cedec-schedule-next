# Phase 4 タスク

- [x] devcontainer で Fable が一覧に出ない原因を調査（CLI バージョン / 認証 / 設定 / 環境変数を切り分け）
- [x] `.devcontainer/devcontainer.json` の `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` を `DISABLE_TELEMETRY` + `DISABLE_ERROR_REPORTING` に置き換え
- [x] `.devcontainer/setup.sh` に Claude Code CLI の最新化処理を追加（イメージキャッシュによるバージョン固定の回避）
- [x] コンテナイメージ上で `sudo npm install -g` が node ユーザーで実行できることを確認（2.1.201 → 2.1.207）
- [x] コンテナをリビルドし、`/model` の一覧に Fable 5 が表示されることを確認（2026-07-30 時点で選択可能）

## 共通

- [x] 実機調査で判明した挙動・制約を KNOWLEDGE.md に記録
- [x] 個人情報チェック（更新した Git 追跡ファイルに実値が混入していないか）
