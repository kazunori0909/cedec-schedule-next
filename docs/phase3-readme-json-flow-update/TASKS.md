# Phase 3 タスク

- [x] README.md「年度別対応」1. 公式HTMLの配置 を JSON方式/旧HTML方式で書き分ける（見出しも「公式データの準備」に変更）
- [x] README.md「年度別対応」2-2. YEAR_CONFIGS の例を実コードに合わせて修正（`format_2025` 削除、`format`省略=JSON方式である旨を明記）
- [x] README.md「年度別対応」3. 取得日時の記録 を JSON方式（自動・`fetched`）/旧方式（`CASH_SETTING` 手動）で書き分ける
- [x] README.md ファイル構成ツリーの `web_data_original/` 記載も実際のファイル名（`timetable.json`/`cancel.json`/`all.html`等）に修正（調査中に判明した追加の矛盾）
- [x] README.md 更新履歴に今回の修正を追記するか検討 → 追記しない（既存ログは機能変更用。JSON移行自体は既存の「2026年 ...直読み方式に切り替え」に記録済みのため、今回はドキュメント修正のみで対象外と判断）
- [x] `.claude/skills/new-year/SKILL.md` の記述が新しい README.md と整合しているか確認 → 「作業時の要点」にJSON方式/旧HTML方式の分岐を追記
- [x] AGENTS.md の記述と矛盾がないか確認 → 明確な矛盾なし（パーサー一覧の粒度がやや粗いのみ、対象外）

## 共通

- [x] 個人情報チェック（更新した Git 追跡ファイルに実値が混入していないか） → 問題なし
