# Phase 17 タスク

## 1. トークン設定の配置見直し

- [x] `generate_cedil.php` の設定読み込みを「webroot 外を優先・従来パスへフォールバック」に変更
- [x] `generate_cedil.config.sample.php` のコメントを新しい配置手順に合わせる
- [x] README.md / SECURITY.md の設置手順を更新
- [x] `php public/cgi/generate_cedil.php` が CLI で従来どおり動くことを確認
- [ ] サーバー上の設定ファイルを webroot 外へ移動（ユーザー作業。移行後に URL 実行で 200 が返ることを確認）

## 2. Excel の LT シート

- [x] シート出力処理を関数へ切り出す
- [x] `lightning_talks` がある年度に `LT` シートを追加する
- [x] LT のある年度・ない年度の両方でダウンロードを確認

## 3. Phase 4 のクローズ

- [x] `docs/phase4-devcontainer-fable-model/TASKS.md` の実機確認タスクを完了にする
- [x] `docs/README.md` の Phase 4 を ✅ にする

## 共通

- [x] `npm run lint` / `npm run format:check` / `npm run test:run` / `npm run build` が通ることを確認
- [x] 個人情報チェック（更新した Git 追跡ファイルに実値が混入していないか）
