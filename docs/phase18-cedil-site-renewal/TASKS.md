# Phase 18 タスク

- [x] 新旧 URL・イベントIDの同一性を実取得で確認（301 リダイレクト・年度プルダウン全 16 年度）
- [x] `CEDIL_BASE` を `search?event=` 形式へ変更（`fetchPage()` のページ指定も `&page=`）
- [x] `parsePage()` を新 HTML 構造（`a.c-session-card` / `.c-session-card__title`）へ追従
- [x] 次ページ判定を `a.c-pagination__arrow.--next` の `?page=` 読み取りへ変更
- [x] セッション URL から検索条件クエリ（`?event=`）を除去して既存 JSON と互換を保つ
- [x] `cls()` を XPath 述語のみを返す形に変更し、要素指定と組み合わせられるようにする
- [x] `$YEAR_TAG` → `$YEAR_EVENT` へリネーム（値は据え置き）・コメント/CLI 出力の呼称を統一
- [x] `php -l` で構文チェック
- [x] 2026 年度を再生成して件数・URL 形式・重複なしを確認
- [x] 2014 年度（リニューアル前生成分）を再生成し、旧出力と完全一致することを確認
- [x] README.md の呼称・URL 形式・`$YEAR_EVENT` 参照を更新（「8. CEDiL イベントIDの更新」）
- [x] `.claude/skills/new-year/SKILL.md` の該当記述を更新
- [x] docs/README.md の開発フェーズ記録テーブルに Phase 18 を追加

## 共通

- [x] 実機調査で判明した挙動・制約を KNOWLEDGE.md に記録
- [x] 個人情報チェック（更新した Git 追跡ファイルに実値が混入していないか）
