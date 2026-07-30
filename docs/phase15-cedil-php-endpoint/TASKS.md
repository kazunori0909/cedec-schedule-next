# Phase 15 タスク

- [x] ブランチを作成する（`feature/cedil-php-endpoint`）
- [x] `public/cgi/generate_cedil.php` を作成（年度テーブル・引数分岐・DOM+XPath 解析）
- [x] 現行 `scripts/generate_cedil.ts` と出力を突き合わせ、差異を確認・解消
- [x] PHP 構文チェック（`php -l`）
- [x] PHP 版と TS 版の `list` 出力がバイト一致することを確認（2026 で 94/94 一致）
- [x] 引数モード検証（未指定＝最新年度 / 年度指定 / 不正年度は 400・exit 1）
- [x] `next build` で `out/cgi/generate_cedil.php` に同梱されることを確認
- [ ] XServer 実機で URL 呼び出し → `cedil.json` 更新を確認（デプロイ後）
- [ ] （任意）`cgi/` の保護（.htaccess Basic 認証 / IP 制限）や cron 設定を検討
- [ ] docs/README.md のフェーズ完了時に「（進行中）」を「✅」へ更新

## 共通

- [ ] 個人情報チェック（更新した Git 追跡ファイルに実値が混入していないか）

## 運用メモ（デプロイ後）

- 手動更新: `https://<サイト>/cgi/generate_cedil.php`（最新年度）/ `?year=2025` / `?year=all`
- 自動更新: XServer のサーバーパネル cron で
  `php <パス>/cgi/generate_cedil.php 2026` を会期中だけ定期実行
- 公開 URL のため、濫用が気になる場合は cgi/ を .htaccess で保護する
