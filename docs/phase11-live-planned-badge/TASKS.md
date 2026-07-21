# Phase 11 タスク

- [x] `fetchLiveSessions` の戻り値を `{ urls, planned }` に拡張（`scripts/lib/live.ts`）
- [x] `LIVE_URL_PENDING` センチネル定数・`isLiveUrlPending()` 追加、`getYoutubeURL` でセンチネル除外（`src/lib/cedec.ts`）
- [x] `Session.live` のコメントをセンチネル対応に更新（`src/types/schedule.ts`）
- [x] `postprocessSessions` で配信予定セッションの `live` にセンチネル設定（`scripts/generate_json.ts`）
- [x] `SessionCell` に「Live配信予定」バッジ表示を追加（`src/components/schedule/SessionCell.tsx`）
- [x] `getYoutubeURL` / `isLiveUrlPending` のユニットテスト追加（`src/lib/cedec.test.ts`）
- [x] `npm run generate:json 2026` で配信予定 41 件に `live:"planned"` が付与されることを確認
- [x] `npm run lint` / `npm run build` / `npm test`（176 passed）
- [ ] docs/README.md の「（進行中）」を ✅ に更新（マージ時）

## 共通

- [x] 個人情報チェック（更新した Git 追跡ファイルに実値が混入していないか）
