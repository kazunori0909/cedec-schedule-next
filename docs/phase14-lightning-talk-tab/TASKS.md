# Phase 14 タスク

## データ生成

- [x] `scripts/parsers/cedec_taxonomy.ts` に LT 形式 ID（22）の定数を追加（マジックナンバー排除）
- [x] `scripts/parsers/format_2025_json.ts` に LT 子ポスト展開を実装
  - [x] `format_id === 22` かつ `children.length > 0` の親ポストを LT 枠として検出
  - [x] 子ポストを開始時刻（`held_at_as_child`）順にソート
  - [x] 終了時刻を導出（次の講演の開始 / 最後は `min(開始 + 標準枠長, 親の end_time)`）
  - [x] 親ポストは従来どおり `sessions[]` にも出力し続ける（Day タブでの LT 枠表示を維持）
  - [x] 子ポストの `detail_url` は空文字にする
- [x] `scripts/generate_json.ts` の `generateJson` で `lightning_talks` を出力（0 件なら省略）
- [x] `src/types/schedule.ts` の `ScheduleData` に `lightning_talks?: Session[]` を追加
- [x] `npm run generate:json 2026` で 29 件・6 枠が出力されることを確認

## 表示ロジック

- [x] `src/lib/schedule.ts` の `buildMatrix` の rowSpan を「終了行 index − 開始行 index」に一般化
  - [x] 既存の 5 分グリッドで描画結果が変わらないことをテストで確認
- [x] `buildLightningTalkViewModel`（日 × 会場のカラム生成 + 開始/終了時刻の和集合による時刻行）を追加
  - [x] カラム名は `Day1-1` 形式、講演が存在する組み合わせのみ生成
- [x] `src/lib/cedec.ts` に `LT_DAY_INDEX = -1` を追加

## UI

- [x] `src/components/DateSelector.tsx` に LT タブを追加（`lightning_talks` がある年度のみ・列数を可変に）
- [x] `src/components/schedule/ScheduleTable.tsx` の props を `timeRange` → `timeRows` に変更
      （ScheduleView 側で算出済みの値を再計算している重複も解消する）
- [x] `src/components/ScheduleView.tsx` で LT タブ選択時に LT 用 ViewModel を使う
  - [x] 見出しを `Day {n}` → 「ライトニングトーク」に切り替え
  - [x] LT データがない年度で `dayIndex === LT_DAY_INDEX` が復元されたら 0 にフォールバック
- [x] LT セルの表示確認（`detail_url` 空 → プレーンテキスト、CEDiL「不明」表示、会場表記）

## テスト

- [x] `format_2025_json` の LT 展開テスト（終了時刻導出・講演が定員未満の枠・children なしの LT 枠）
- [x] `buildLightningTalkViewModel` のカラム生成・時刻軸テスト
- [x] `buildMatrix` の rowSpan 一般化に対する既存テストの通過確認

## 動作確認

- [x] `npm run lint` / `npm run format:check` / `npm run build`
- [x] 実機で LT タブの表示・Day タブ間の遷移・タブ選択の永続化を確認
- [x] LT データがない年度（2025 以前）で LT タブが出ないことを確認

## CEDiL 除外の解除（Phase 13 の巻き戻し）

- [x] `scripts/generate_cedil.ts` の `LIGHTNING_TALK_RE` による除外を撤去
- [x] `useScheduleData` / `buildCedilLookup` の突き合わせ対象に `lightning_talks` を追加
- [x] LT タイトルは短く、`normalizedTitle.includes(item.title)` の部分一致が通常セッションへ
      誤ヒットしうるため、マッチ結果を実データで検証する
- [x] `npm run generate:cedil` で除外件数が 0 になり、LT 資料が取り込まれることを確認
      （2026: 14 件中 3 件が LT。14 件すべてが正しいセッションへ紐付き、誤ヒットなし）

## 共通

- [x] 実機調査で判明した挙動・制約を KNOWLEDGE.md に記録
      → 公式 JSON の `children` 構造・5分グリッドの取りこぼしは設計判断そのものなので
      PLAN.md に記録済み。KNOWLEDGE.md は作成しない
- [x] 個人情報チェック（更新した Git 追跡ファイルに実値が混入していないか）

## スコープ外

- Excel 出力への LT 反映（現状は `sessions[]` のみを対象とする）
- 現在時刻ハイライト（LT タブは全日程横断のため、当日判定の意味が変わる）
- LT タブでのお気に入りモード絞り込み（`FavoriteToggle` を非表示にする。★ 登録自体は動く）
