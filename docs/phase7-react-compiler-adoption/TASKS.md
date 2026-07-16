# Phase 7 タスク

- [x] `next.config.ts` に `reactCompiler: true` を追加、`babel-plugin-react-compiler` を導入
- [x] rehydrate effect の依存に `setHydrated` を明示し `exhaustive-deps` 抑制を除去
- [x] `useYearParam` を新設し `?year=` の URL 同期を `useSyncExternalStore` ベースに集約
- [x] `useCurrentTimeRow` を `useSyncExternalStore` 化
- [x] `ScheduleView`・`ScheduleTable` の手動 `useMemo`（5 箇所）を削除
- [x] `useRoomColumns` を hook から純関数 `buildScheduleViewModel`（`lib/schedule.ts`）へ変換
- [x] `set-state-in-effect` の warn 格下げ（Phase 6）を撤回し既定の error に戻す
- [x] AGENTS.md に Compiler 運用方針（手動メモ化禁止・react-hooks 系 eslint-disable 禁止）を明文化

## 検証

- [x] babel-plugin-react-compiler のロガーで全コンポーネント/フックを検証し `Suppression` skip が無いことを確認
      （`ExcelDownloadButton.tsx` の `try/finally` のみ既存の制限により対象外）
- [x] `npm run lint` — エラー0・警告0
- [x] `npx tsc --noEmit` — エラー0
- [x] `npx vitest run` — 168 テスト全通過
- [x] `npm run build` — 成功

## 共通

- [x] 個人情報チェック（更新した Git 追跡ファイルに実値が混入していないか）
