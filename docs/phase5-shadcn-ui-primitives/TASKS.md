# Phase 5 タスク

## ステップ 1: プリミティブ導入と置き換え

- [x] shadcn/ui のセットアップ確認（components.json・必要な Radix 依存の追加）
- [x] `Button` プリミティブ導入（CVA バリアント、cursor-pointer 追加・日本語コメントに改変）
- [x] DateSelector / FavoriteToggle / SideMenu / FilterDrawer / ExcelDownloadButton のボタンを `Button` に置換
- [x] `Sheet` プリミティブ導入
- [x] FilterDrawer を `Sheet`（side=bottom）に統合
- [x] SideMenu を `Sheet`（side=left）に統合
- [x] InfoTooltip を Radix Popover ベースに置換（PopoverAnchor + controlled open、KNOWLEDGE.md 参照）

## ステップ 2: 共有パターンの部品化

- [x] `ExternalTextLink` 導入（safeExternalUrl + rel="noopener" + アイコン内包）
- [x] SessionCell / SideMenu / RoomLink の外部リンクを置換（RoomLink は内部実装を ExternalTextLink 化）
- [x] SessionCell のメタ情報行スタイルを text-2xs トークンに集約

## ステップ 3: トークンの仕上げ

- [x] `@theme` に `--text-2xs` を追加し `text-[10px]` を置換
      （場当たり z-index（`z-1000` 等）は Radix 化で消滅したため専用スケールは追加しない）
- [x] CategoryBadge の実質同一な `main` / `sub` バリアントを削除
- [x] スタイル定義の置き場ルールを CLAUDE.md に追記

## 検証

- [x] 既存テスト（FilterDrawer / FilterPanel / SessionCell / InfoTooltip）の追従・グリーン確認（178件）
- [x] `npm run lint` / `npm run build` 通過（警告は既存の useCurrentTimeRow のみ）
- [x] 実機（dev サーバー + Playwright）でモバイル・デスクトップ両表示を目視確認

## 共通

- [x] 個人情報チェック（更新した Git 追跡ファイルに実値が混入していないか）
- [x] 実機調査で判明した挙動・制約を KNOWLEDGE.md に記録
