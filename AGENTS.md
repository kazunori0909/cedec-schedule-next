# CEDEC Schedule — プロジェクト概要

CEDEC（ゲーム開発者向けカンファレンス）の非公式タイムテーブルビューア。
Next.js + React + TypeScript で構築された静的サイト（`next build` で `out/` を生成）。

## 技術スタック

- **フロントエンド**: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
  - React Compiler 有効（`reactCompiler: true`）。導出値のメモ化は Compiler に委ね、手動 `useMemo`/`useCallback` は書かない。react-hooks 系ルールの eslint-disable は Compiler の最適化拒否（Suppression skip）を招くため禁止
- **状態管理**: Zustand + localStorage（フィルター・お気に入り・選択日付の永続化）
- **データ生成**: TypeScript スクリプト（`scripts/`、tsx で実行）
- **HTMLパース**: cheerio（jQueryライクAPI）
- **データ**: `public/web_data/{year}/schedule.json`, `cedil.json`（事前生成済みJSON、git管理外）
- **開発環境**: devcontainer（Node.js 22）

## データフロー

```
【2025〜（標準）】CEDEC公式 session/timetable.json
  → scripts/generate_json.ts が条件付き取得（If-Modified-Since）
  → web_data_original/{year}/ にキャッシュ（timetable.json / cancel.json）
  → JSON を解析（scripts/parsers/format_2025_json.ts）
  → public/web_data/{year}/schedule.json 生成（取得日時 fetched 付き）
  → Next.jsアプリが fetch で取得 → テーブル描画

【2024以前（旧方式）】CEDEC公式サイトHTML
  → (手動) web_data_original/{year}/ にキャッシュ保存
  → scripts/generate_json.ts で解析（cheerio・YEAR_CONFIGS で format 指定の年度）
  → public/web_data/{year}/schedule.json 生成

CEDiL公式サイト
  → public/cgi/generate_cedil.php で解析（XServer 上で URL/cron 実行。ローカルは php CLI）
  → public/web_data/{year}/cedil.json 生成（アプリは実行時 fetch のため再ビルド不要）
  → セッションにリンクを付与
```

## 主要な状態（src/store/scheduleStore.ts）

Zustand ストア + `persist` ミドルウェアで管理。`yearStates` に年度ごとの state を集約し、
`useCurrentYearState(year)` で指定年度のサブセットを購読する。
`year`（現在表示中の年度）はストアに持たず、URL の `?year=` クエリパラメータが唯一の真実。

| 状態                            | スコープ   | 用途                                     |
| ------------------------------- | ---------- | ---------------------------------------- |
| `hydrated`                      | グローバル | localStorage からの読み込み完了フラグ    |
| `yearStates[year].dayIndex`     | 年度ごと   | 選択中の日付インデックス                 |
| `yearStates[year].favoriteMode` | 年度ごと   | お気に入りモード有効フラグ               |
| `yearStates[year].hideSpecs`    | 年度ごと   | フィルター非表示状態 `{ タグ名: true }`  |
| `yearStates[year].favorites`    | 年度ごと   | お気に入り登録状態 `{ sessionId: true }` |

localStorage は単一キー `cedec_schedule_state` に zustand/persist 形式で全年度分を保存する。

## フォルダ構成

```
cedec_schedule/
├── src/
│   ├── app/                    # App Router（layout.tsx, page.tsx, globals.css）
│   ├── components/             # UIコンポーネント
│   │   ├── ScheduleView.tsx    # メインビュー（年度・日付・フィルター統合）
│   │   ├── CategoryBadge.tsx   # カテゴリバッジ（色付きラベル）
│   │   ├── DateSelector.tsx    # 日付選択タブ
│   │   ├── ExcelDownloadButton.tsx # Excelダウンロードボタン（exceljs動的import）
│   │   ├── FavoriteToggle.tsx  # お気に入りモード切替ボタン
│   │   ├── FilterDrawer.tsx    # フィルター（モバイル用ボトムシート、sm未満で表示）
│   │   ├── FilterPanel.tsx     # フィルター（デスクトップ用インライン、sm以上で表示）
│   │   ├── InfoTooltip.tsx     # データ取得日時（ℹアイコン＋ツールチップ）
│   │   ├── SideMenu.tsx        # 年度切り替えサイドメニュー
│   │   └── schedule/
│   │       ├── ScheduleTable.tsx # 部屋別タイムテーブル
│   │       └── SessionCell.tsx   # 個別セッションセル
│   ├── hooks/                  # カスタムフック
│   │   ├── useCurrentTimeRow.ts # 現在時刻ハイライト（開催期間中1分更新）
│   │   ├── useScheduleData.ts  # スケジュール・CEDiLデータ取得
│   │   └── useYearParam.ts     # URL の ?year= を購読・更新（useSyncExternalStore）
│   ├── lib/
│   │   ├── cedec.ts            # 年度別設定（SCHEDULE_SETTING）・getDomain・resolveDevNight・resolveDetailUrl
│   │   ├── cedil.ts            # CEDiL資料リンク付与
│   │   ├── custom.ts           # 非公式イベント定義
│   │   ├── exportExcel.ts      # Excelエクスポートロジック（exceljs・buildMatrix利用）
│   │   ├── schedule.ts         # JSONフェッチ・パース・buildScheduleViewModel（部屋カラム・時刻軸導出）・buildMatrix（CellInfo型・タイムテーブル2Dマトリクス生成）
│   │   └── utils.ts            # 共通ユーティリティ（safeExternalUrl 等）
│   ├── store/scheduleStore.ts  # Zustandストア（永続化込み）
│   ├── types/schedule.ts       # 型定義
│   └── __tests__/              # Vitestユニットテスト
├── public/
│   ├── cgi/generate_cedil.php  # CEDiLサイトを解析しcedil.jsonを生成（PHP・URL/cron/CLI）
│   └── web_data/               # 事前生成済みJSON（git管理外）
├── scripts/                    # データ生成スクリプト（tsx で実行）
│   ├── generate_json.ts        # 公式HTMLを解析しschedule.jsonを生成
│   ├── generate_youtube.ts     # CEDECチャンネル動画リストをキャッシュ
│   ├── lib/                    # 共通ユーティリティ
│   └── parsers/                # 年度別パーサー（HTML: before2017・2018〜2020・2023・2024 / JSON: format_2025_json・cedec_taxonomy）
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
- `php public/cgi/generate_cedil.php [year]` — cedil.json 生成（引数なし=最新年度 / `all`=全年度。URL/cron でも実行可）
- `npm run generate:youtube [-- --force]` — YouTube動画リスト取得（要 `.env` の `YOUTUBE_API_KEY`）
