# Phase 2 タスク

- [x] `src/types/schedule.ts` の `Session` に `is_invited?: boolean` を追加
- [x] `scripts/lib/session.ts` の `RawSession` / `BuildSessionArgs` / `buildSession()` に `is_invited` を追加
- [x] `scripts/parsers/format_2025_json.ts` で `post.type_id` が招待系（2,5,6,7）かを判定し `is_invited` を設定
- [x] `src/components/schedule/SessionCell.tsx` の「Room: 」表示の右側に「招待」バッジを追加（`is_invited` が true の場合のみ）
- [x] 対象年度（2025年以降）の `schedule.json` を再生成し、招待セッションが実際に判定されることを確認（2025年: 220件中26件が is_invited: true）
- [x] Vitest ユニットテストを追加・更新（`format_2025_json.ts` の招待判定、UI表示）

## 共通

- [x] 個人情報チェック（更新した Git 追跡ファイルに実値が混入していないか）
