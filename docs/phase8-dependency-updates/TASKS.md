# Phase 8 タスク

- [x] `npm outdated` / `npm audit` で更新候補・脆弱性を洗い出す
- [x] TypeScript 7.0 の移行可否を検証ブランチで実測（見送り判断）
- [x] ESLint 10 の移行可否を検証ブランチで実測（見送り判断）
- [x] 安全なパッチ／マイナー更新を適用（`npm update` ＋ next 16.2.10 の exact ピン編集）
- [x] prettier 3.9 のフォーマット差分（`src/types/schedule.ts`）を追従
- [x] lint / tsc --noEmit / test:run / build / format:check がすべて通過することを確認
- [x] docs/README.md の開発フェーズ記録テーブルに Phase 8 を追加
- [x] コミット（PR #52 `chore/deps-safe-updates` としてマージ済み）

## 共通

- [x] 実機調査で判明した挙動・制約を KNOWLEDGE.md に記録
- [x] 個人情報チェック（更新した Git 追跡ファイルに実値が混入していないか）
