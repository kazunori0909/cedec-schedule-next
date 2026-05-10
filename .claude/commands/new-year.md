# 新年度対応

新しい年度（$ARGUMENTS）のデータを追加する手順を実行する。

## 手順

1. `src/lib/cedec.ts` の `SCHEDULE_SETTING` に年度エントリを追加する
2. `scripts/generate_json.ts` の `YEAR_CONFIGS` に年度エントリを追加する
3. `web_data_original/{year}/` に公式 HTML がキャッシュ済みか確認し、なければユーザーに案内する
4. `npm run generate:json {year}` を実行して JSON を生成する（出力先: `public/web_data/{year}/`）
5. 必要に応じて `src/lib/custom.ts` に非公式イベントを追加する
6. `npm run dev` で動作確認できることをユーザーに伝える

年度が指定されていない場合はユーザーに確認する。
