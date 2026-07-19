# Phase 9: cedil_tag_no 未指定時の CEDiL フェッチ抑止

## 課題

`src/lib/cedec.ts` の `SCHEDULE_SETTING`（`YearSetting`）で `cedil_tag_no` が未指定の年度でも、
`useScheduleData` が無条件に `fetchCedil(year)` を呼んでいる。

- `cedil_tag_no` 未指定の年度は CEDiL 資料が存在せず `cedil.json` も生成されないため、
  `/web_data/{year}/cedil.json` へのリクエストが 404 になる。
- 現状 2026 年は `cedil_tag_no` 未指定であり、Chrome 開発者ツールのコンソール／ネットワークに
  CEDiL データ読み込みエラー（404）のログが出力される。
- 致命的ではないマイナーバグだが、不要なリクエストとエラーログが発生している。

## 方針

`cedil_tag_no` が未指定（`undefined`）の年度では、CEDiL データのフェッチ自体を行わない。

- 判定は `findYearSetting(year).cedil_tag_no` の有無で行う（設定の一元管理方針に沿う）。
- `useScheduleData` の CEDiL 取得 `useEffect` で、`cedil_tag_no` が無ければ早期 return し
  `fetchCedil` を呼ばない。
- CEDiL 未取得時も既存の初期値（空 lookup・count 0・update undefined）で UI が破綻しないことを確認する。

## 決定事項ログ

### 2026-07-19: cedil_tag_no の有無でフェッチを分岐

- `cedil_tag_no` 未指定の年度は CEDiL 資料が存在しないため、そもそもリクエストしない方針を採用。
  理由: 404 エラーログと無駄なネットワークリクエストを根絶するには、フェッチ前に設定で分岐するのが
  最もシンプルで、設定を `cedec.ts` に一元化する既存方針とも整合する。
