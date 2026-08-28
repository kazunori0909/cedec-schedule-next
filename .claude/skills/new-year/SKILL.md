---
name: new-year
description: CEDEC の新年度データをサイトに追加・対応する手順。新しい年度の SCHEDULE_SETTING / YEAR_CONFIGS への追加、公式 HTML の配置、schedule.json・cedil.json の生成、CASH_SETTING や custom.ts の更新を行うときに使う。
---

# 新年度対応

CEDEC の新しい年度（例: 2026）のデータをサイトに追加する。

**詳細な手順・設定値・コード例は、リポジトリルートの `README.md`「年度別対応」セクションが正。
作業前に必ずそれを読み、その手順に従うこと。** このファイルは作業時の補足のみを示す。

## 作業時の要点

- 対象年度が指定されていない場合は、まずユーザーに確認する。
- **新年度（2025年以降の形式）は JSON 方式が標準。** `YEAR_CONFIGS` で `format` を省略すれば、
  `npm run generate:json {year}` 実行時に公式 `session/timetable.json` / `cancel.json` を自動取得するため、
  公式HTMLの手動配置は不要。旧HTML方式（`format` を指定する場合）のみ `web_data_original/{year}/` への
  手動配置が必要になるため、その場合は配置済みか確認しユーザーに案内する。
- **年度別設定は2ファイル両方に追加する** — `src/lib/cedec.ts` の `SCHEDULE_SETTING` と `scripts/generate_json.ts` の `YEAR_CONFIGS`。片方だけでは動作しない。
- 公式 HTML のフォーマットが前年と異なる場合のみ `scripts/parsers/` に新パーサーを追加する。同形式なら既存の `format_YYYY` を再利用する。
- **`cedil_tag_no` は新規作成時には指定しない** — CEDiL イベントID（`https://cedil.cesa.or.jp/cedil_sessions/search?event={id}` の `{id}`）は会期中〜翌週ごろにCEDiLへセッションが登録された後、URLから判明する。新規追加時は `SCHEDULE_SETTING` で省略し（省略した年度は `cedil.json` が生成されない）、判明後にIDを **2箇所**（`src/lib/cedec.ts` の `SCHEDULE_SETTING.cedil_tag_no` と `public/cgi/generate_cedil.php` の `$YEAR_EVENT` テーブル）へ追記し、`php public/cgi/generate_cedil.php {year}` を実行して `cedil.json` を生成する。
- `src/lib/custom.ts` に `html` を追加・変更した場合は、`dangerouslySetInnerHTML` の例外箇所のため SECURITY.md に従ってレビューする。
- 完了後は `npm run dev` を起動し、追加年度が選択でき正しく表示されることを確認する。
