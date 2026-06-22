---
name: update-timetable
description: CEDEC の既存年度のセッション情報（タイムテーブル）を公式サイトから最新化する手順。JSON方式（2025〜）の年度で schedule.json を最新の公式データに更新したいとき、「タイムテーブルを更新」「セッション情報を最新化」「day1〜3 を最新にしたい」等の依頼で使う。新年度を新規追加する場合は new-year スキルを使う。
---

# タイムテーブル更新（JSON方式）

公式サイトの `session/timetable.json` を取得し直し、`public/web_data/{year}/schedule.json` を最新化する。

## 仕組み

2025 以降は公式サイトが配信する **`session/timetable.json` を直読み**する方式が標準
（`scripts/parsers/format_2025_json.ts`）。`npm run generate:json {year}` を実行すると、
以下が自動で行われる:

1. `https://cedec.cesa.or.jp/{year}/session/timetable.json` と `session/cancel.json` を取得
   - 前回取得時の `Last-Modified` を使った **条件付き取得（If-Modified-Since）**。未更新なら 304 で本体転送なし。
   - 取得物は `web_data_original/{year}/`（git 管理外）にキャッシュ。取得日時は `.source_meta.json` に記録。
2. JSON を解析し `public/web_data/{year}/schedule.json` を再生成（`fetched` に取得日時を埋め込む）。

## 手順

1. 対象年度を確認する（指定が無ければ最新年度。現状は 2026）。
2. リポジトリルートで実行:
   ```
   npm run generate:json 2026
   ```
   - ネットワークを使わずキャッシュのみで再生成する場合は `npm run generate:json 2026 --no-fetch`。
3. 出力ログの件数を確認し、必要なら `git diff` でないことを確認（schedule.json は git 管理外のためコミット不要）。
4. 表示確認は `npm run dev` → 対象年度を開き、セッションと「取得日時」（ℹツールチップ）が更新されているか見る。

## 注意（サイトへの配慮）

- 取得は単発・逐次・条件付き（If-Modified-Since）。**並列取得や短時間の連続実行はしない**。
- 自動ポーリングはしない。会期前後に手動で必要な時だけ実行する。

## 補足

- **旧 HTML 方式の年度（2024 以前）には本スキルは使えない**。それらは描画済み HTML を
  `web_data_original/{year}/` に手動配置する方式（`scripts/generate_json.ts` の `YEAR_CONFIGS` で
  `format` を持つ年度）。
- `live` 配信URL は会期が近づくと公開される。公開後は `YEAR_CONFIGS` の該当年度に
  `live: "timetable/free_lives/"` を追記してから再生成する。
- CEDiL 資料リンクは別系統（`npm run generate:cedil`、`cedil_tag_no` 判明後）。
