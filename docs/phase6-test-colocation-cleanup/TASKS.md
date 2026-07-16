# Phase 6 タスク

- [x] `src/__tests__/` の階層ミラーを解消し、各テストを対象ソースの隣へ移動
- [x] 共通セットアップを `src/test/setup.ts` に集約
- [x] scripts のテストを `parsers/`・`lib/` の対象ファイル隣へ移動（相対 import 修正）
- [x] `vitest.config.ts` の include を `**/*.test.*` パターンへ更新、coverage からテストを除外
- [x] `lib/schedule.ts` の未使用な型 re-export と、付随する未使用 import を削除
- [x] `categoryBadgeVariants` を `categoryBadgeColors` に改名し `ui/` から `CategoryBadge.tsx` の隣へ移動
- [x] 未使用の `getCategoryClass` / `SPEC_CLASS` とそのテストを削除
- [x] 時刻列の `text-[11px]` を `text-2xs` トークンへ置換
- [x] `set-state-in-effect` 警告 2 件を意図コメント付きで抑制

## 検証

- [x] `npm run lint` — エラー0・警告0
- [x] `npx tsc --noEmit` — エラー0
- [x] `npx vitest run` — 168 テスト全通過
- [x] `npm run dev` / `npm run build` — 動作確認済み

## 共通

- [x] 個人情報チェック（更新した Git 追跡ファイルに実値が混入していないか）
