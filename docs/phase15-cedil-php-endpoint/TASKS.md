# Phase 15 タスク

- [x] ブランチを作成する（`feature/cedil-php-endpoint`）
- [x] `public/cgi/generate_cedil.php` を作成（年度テーブル・引数分岐・DOM+XPath 解析）
- [x] 現行 `scripts/generate_cedil.ts` と出力を突き合わせ、差異を確認・解消
- [x] PHP 構文チェック（`php -l`）
- [x] PHP 版と TS 版の `list` 出力がバイト一致することを確認（2026 で 94/94 一致）
- [x] 引数モード検証（未指定＝最新年度 / 年度指定 / 不正年度は 400・exit 1）
- [x] `next build` で `out/cgi/generate_cedil.php` に同梱されることを確認
- [x] XServer 実機で URL 呼び出し → `cedil.json` 更新を確認（デプロイ後・ユーザー確認済み）
- [x] docs/README.md のフェーズ完了時に「（進行中）」を「✅」へ更新

## 公開 URL のセキュリティ強化

- [x] 秘密トークン `?key=` 認証を追加（`generate_cedil.config.php` と `hash_equals`・未設定は 403）
- [x] トークン設定サンプル `generate_cedil.config.sample.php` を追加し実値を `.gitignore`
- [x] 全年度一括（`all`）を撤廃
- [x] 入力ハードニング（配列 year 拒否・テーブルキー完全一致・入力値を応答に出さない・`display_errors` off）
- [x] 認証/不正入力/正常系を php CLI・組み込みサーバーで検証（403 / 400 / exit1 / 200）
- [ ] （任意・多層化）`cgi/` の `.htaccess` Basic 認証 / IP 制限の併用を検討

## 旧 TS スクリプトの廃止（実機確認 OK 後）

- [x] `scripts/generate_cedil.ts` を削除
- [x] `package.json` の `generate:cedil` スクリプトを削除
- [x] README.md / AGENTS.md を PHP 方式へ更新（構成図・コマンド・年度追加手順・履歴）
- [x] `scripts/lib/helpers.ts` のコメントから `generate_cedil.ts` 参照を除去
- [x] new-year / update-timetable スキルの `generate:cedil` 記述を PHP 方式へ更新
- [x] 共有物（cheerio 依存・`outputDir`・`cedil_tag_no`）が他所で使用中で残ることを確認

## 共通

- [x] 個人情報チェック（更新した Git 追跡ファイルに実値が混入していないか）

## 運用メモ（デプロイ後）

- 事前準備（URL 利用時）: `generate_cedil.config.sample.php` を `generate_cedil.config.php` へ
  コピーし `'key'` を長いランダム文字列に設定（サーバー上・コミット不可）
- 手動更新（URL）: `https://<サイト>/cgi/generate_cedil.php?key=<TOKEN>`（最新年度）/ `&year=2025`
- 自動更新（cron・トークン不要）: XServer のサーバーパネル cron で
  `php <パス>/cgi/generate_cedil.php 2026` を会期中だけ定期実行
- `all` は非対応。複数年度が必要なときは年度ごとに実行する
