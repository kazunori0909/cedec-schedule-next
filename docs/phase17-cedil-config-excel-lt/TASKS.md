# Phase 17 タスク

## 1. トークン設定の配置見直し

- [x] `generate_cedil.php` の設定読み込みを「親ディレクトリを上へ辿って `cedil_config.php` を探す」方式に変更
      （当初は2階層上の決め打ちだったが、サブディレクトリ配置では成立しなかった）
- [x] 探索対象を `cedil_config.php` の1名称に統一（旧名・同階層フォールバックを削除）
- [x] `generate_cedil.config.sample.php` のコメントを新しい配置手順に合わせる
- [x] サンプルをリポジトリルートへ移動（`cedil_config.sample.php`）。`out/cgi/` に残るのが
      `generate_cedil.php` だけになることを確認
- [x] README.md / SECURITY.md の設置手順を更新
- [x] `php public/cgi/generate_cedil.php` が CLI で従来どおり動くことを確認
- [x] サーバー上の設定ファイルを公開ディレクトリ外へ移動し、URL 実行で `cedil.json` を取得できることを確認
- [x] 実機で判明した挙動（サブディレクトリ配置・open_basedir・403 の切り分け方）を KNOWLEDGE.md に記録
- [ ] サーバーの `cgi/generate_cedil.php` を最新版（10,082 バイト）へ差し替え（機能は同じ・任意）
- [ ] サーバーから `cgi/check_config.php`（診断用）を削除
- [ ] トークンをローテーション（チャットに実値が出たため）

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
