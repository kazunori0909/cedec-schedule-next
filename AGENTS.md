# CEDEC Schedule — プロジェクト概要

CEDEC（ゲーム開発者向けカンファレンス）の非公式タイムテーブルビューア。
Next.js + React + TypeScript で構築された静的サイト（`next build` で `out/` を生成）。

## 技術スタック

- **フロントエンド**: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- **状態管理**: Zustand + localStorage（フィルター・お気に入り・選択日付の永続化）
- **データ生成**: TypeScript スクリプト（`scripts/`、tsx で実行）
- **HTMLパース**: cheerio（jQueryライクAPI）
- **データ**: `public/web_data/{year}/schedule.json`, `cedil.json`（事前生成済みJSON、git管理外）
- **開発環境**: devcontainer（Node.js 22）

## データフロー

```
CEDEC公式サイトHTML
  → (手動) web_data_original/{year}/ にキャッシュ保存
  → scripts/generate_json.ts で解析（cheerio）
  → public/web_data/{year}/schedule.json 生成
  → Next.jsアプリが fetch で取得 → テーブル描画

CEDiL公式サイト
  → scripts/generate_cedil.ts で解析
  → public/web_data/{year}/cedil.json 生成
  → セッションにリンクを付与
```

## 主要な状態（src/store/scheduleStore.ts）

Zustand ストア + `persist` ミドルウェアで管理。`yearStates` に年度ごとの state を集約し、
`useCurrentYearState(year)` で指定年度のサブセットを購読する。

| 状態                            | スコープ   | 用途                                      |
| ------------------------------- | ---------- | ----------------------------------------- |
| `year`                          | グローバル | 現在表示中の年度（URL駆動、永続化しない） |
| `hydrated`                      | グローバル | localStorage からの読み込み完了フラグ     |
| `yearStates[year].dayIndex`     | 年度ごと   | 選択中の日付インデックス                  |
| `yearStates[year].favoriteMode` | 年度ごと   | お気に入りモード有効フラグ                |
| `yearStates[year].hideSpecs`    | 年度ごと   | フィルター非表示状態 `{ タグ名: true }`   |
| `yearStates[year].favorites`    | 年度ごと   | お気に入り登録状態 `{ sessionId: true }`  |

localStorage は単一キー `cedec_schedule_state` に zustand/persist 形式で全年度分を保存する。

## フォルダ構成

```
cedec_schedule/
├── src/
│   ├── app/                    # App Router（layout.tsx, page.tsx, globals.css）
│   ├── components/             # UIコンポーネント
│   │   ├── ScheduleView.tsx    # メインビュー
│   │   ├── FilterDrawer.tsx    # フィルター（モバイル用ボトムシート、sm未満で表示）
│   │   ├── FilterPanel.tsx     # フィルター（デスクトップ用インライン、sm以上で表示）
│   │   ├── InfoTooltip.tsx     # データ取得日時（ℹアイコン＋ツールチップ）
│   │   └── schedule/
│   │       ├── ScheduleTable.tsx # 部屋別タイムテーブル
│   │       └── SessionCell.tsx   # 個別セッションセル
│   ├── lib/
│   │   ├── cedec.ts            # 年度別設定（SCHEDULE_SETTING）
│   │   ├── cedil.ts            # CEDiL資料リンク付与
│   │   ├── custom.ts           # 非公式イベント定義
│   │   ├── schedule.ts         # JSONフェッチ・パース
│   │   └── utils.ts            # 共通ユーティリティ（safeExternalUrl 等）
│   ├── store/scheduleStore.ts  # Zustandストア（永続化込み）
│   └── types/schedule.ts       # 型定義
├── public/web_data/            # 事前生成済みJSON（git管理外）
├── scripts/                    # データ生成スクリプト（tsx で実行）
│   ├── generate_json.ts        # 公式HTMLを解析しschedule.jsonを生成
│   ├── generate_cedil.ts       # CEDiLサイトを解析しcedil.jsonを生成
│   ├── generate_youtube.ts     # CEDECチャンネル動画リストをキャッシュ
│   ├── lib/                    # 共通ユーティリティ
│   └── parsers/                # 年度別フォーマットパーサー（format_2020〜2025）
├── web_data_original/          # 公式サイトHTMLのローカルキャッシュ（コミット対象外）
└── .claude/                    # Claude Code 設定
```

## 開発コマンド（リポジトリルートで実行）

- `npm run dev` — 開発サーバー起動
- `npm run build` — 本番ビルド（`out/` に静的ファイル生成）
- `npm run lint` — ESLint チェック
- `npm run format` — Prettier 自動整形
- `npm run format:check` — フォーマット差分チェック（CI 用）
- `npm run generate:json [year]` — schedule.json 生成（年度省略時は全年度）
- `npm run generate:cedil [year]` — cedil.json 生成
- `npm run generate:youtube [-- --force]` — YouTube動画リスト取得（要 `.env` の `YOUTUBE_API_KEY`）
