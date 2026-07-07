# Phase 3: README.md 最新化（JSON方式移行の反映）

## 課題

ルート `README.md`「年度別対応」セクションが、2025年から導入した JSON 方式（公式
`session/timetable.json` 直読み）の実装と矛盾している。

1. 「1. 公式HTMLの配置」が全年度で `day1.html`〜`day3.html` 等の手動HTML保存を前提にしているが、
   実際には 2025年以降は `scripts/lib/timetable_source.ts` が公式 `session/timetable.json` /
   `cancel.json` を条件付き取得（If-Modified-Since）して `web_data_original/{year}/` に自動キャッシュする。
   手動HTML配置が必要なのは `format` を指定する旧方式年度（2024年以前）のみ。
2. 「2-2. `generate_json.ts` の `YEAR_CONFIGS`」の例が `{ format: "format_2025", split_files: true, ... }`
   となっているが、`format_2025` パーサーは存在せず、実際の `YEAR_CONFIGS`（`scripts/generate_json.ts`）
   では 2025・2026年とも `format` キーを**省略**することで JSON 方式（標準）になる
   （`format` を指定した年度のみ旧 HTML 方式）。
3. 「3. 取得日時の記録（cedec.ts）」が全年度で `CASH_SETTING` への手動記録を必須としているが、
   JSON 方式の年度は `generate_json.ts` が `fetched`（取得日時）を自動で `schedule.json` に埋め込むため
   `CASH_SETTING` への追記は不要（実際 `CASH_SETTING` に 2025・2026 のエントリは無い）。
4. `.claude/skills/new-year/SKILL.md` は「詳細な手順は README.md の『年度別対応』セクションが正」と
   README.md を参照する構造のため、README.md 側の誤りがそのままスキルの誤り・Claude Code の誤動作に波及する。

## 方針

- README.md「年度別対応」セクションを、JSON方式（2025〜・標準）と旧HTML方式（2024年以前・`format` 指定年度）を
  明確に分けて記述するよう書き換える。
- 「1. 公式HTMLの配置」→ JSON方式年度は「配置不要（`generate:json` 実行時に自動取得・キャッシュ）」、
  旧方式年度のみ手動配置が必要である旨に修正。
- 「2-2. YEAR_CONFIGS」の例を実際のコード（`format` 省略 = JSON方式）に合わせて修正し、
  `format_2025` という存在しないパーサー名を削除する。
- 「3. 取得日時の記録」を、JSON方式年度は自動記録・旧方式年度のみ `CASH_SETTING` 手動記録が必要、と明記。
- AGENTS.md の「データフロー」セクション（JSON方式/旧方式を並記）と記述を揃え、二重管理にならないよう
  README.md 側は「年度別対応」の実務手順、AGENTS.md 側は全体アーキテクチャという役割分担を保つ。
- 更新履歴セクションは変更しない（過去ログのため）。

## 決定事項ログ

（作業中に決定した事項があればここに追記する）
