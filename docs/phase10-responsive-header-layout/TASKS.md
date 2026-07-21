# Phase 10 タスク

## Excel DL の表現変更

- [x] 新しいラベル表現を確定する（→ 案A: アイコンのみ）
- [x] `ExcelDownloadButton.tsx` のボタン内テキストを変更（PC フルサイズ版も同じ表現に統一）
      — `size="icon-sm"` のアイコンボタン化。ローディング中は `Loader2`（スピナー）に差し替え
- [x] アクセシビリティ担保（`title` 維持 + `aria-label` を追加）

## タイトルの一行化

- [x] `ScheduleView.tsx` のタイトルをレスポンシブなフォントサイズ + 折り返し防止に変更
      — `text-base font-bold whitespace-nowrap sm:text-xl`（狭幅 16px / sm 以上 20px）
- [x] 任意値を使わず標準スケール（`@theme` 規約）で表現

## 検証

- [x] iPhone SE3（375px）でヘッダーが1行に収まり高さが縮んだことを確認（`npm run build` + テスト環境）
- [x] PC フルサイズ版でレイアウト崩れがないことを確認
- [x] `npm run lint` 通過 / Prettier 差分なし
- [x] `npm run dev` でコンパイルエラーなし・`/?year=2026` が 200 応答

## 共通

- [ ] docs/README.md の「開発フェーズ記録」テーブルを完了時に「進行中」→「✅」へ更新
- [ ] 個人情報チェック（更新した Git 追跡ファイルに実値が混入していないか）
