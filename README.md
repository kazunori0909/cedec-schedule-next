# cedec_schedule

CEDEC非公式タイムスケジュール。CEDEC公式スケジュールページのデータを部屋別タイムテーブル形式で整形・表示します。  
CEDiLに登録済みの資料リンクも自動付与します。

## 機能

- 部屋別タイムテーブル表示
- 分野フィルター（クリックで表示/非表示切り替え）
- お気に入り登録（localStorageで保存）
- 現在時刻の自動ハイライト（開催期間中は1分ごとに更新）
- CEDiL資料リンクの自動付与
- 会期中セッションのYouTube Live配信リンク表示
- 会期後セッションのYouTube動画リンク自動付与（YouTube Data API v3連携）
- 非公式イベントの追加表示（`custom.ts` で設定）

## 技術構成

| 区分           | 採用技術                               |
| -------------- | -------------------------------------- |
| フロントエンド | Next.js 16 + React 19 + TypeScript     |
| スタイリング   | Tailwind CSS v4                        |
| 状態管理       | Zustand（localStorage で永続化）       |
| データ生成     | TypeScript スクリプト（tsx + cheerio） |
| 開発環境       | devcontainer（Node.js 22）             |

## ファイル構成

```
cedec_schedule/
├── src/
│   ├── app/                    App Router（layout.tsx, page.tsx）
│   ├── components/             UIコンポーネント
│   │   ├── ScheduleView.tsx    メインビュー
│   │   ├── CategoryBadge.tsx   カテゴリバッジ
│   │   ├── CurrentTimeHighlight.tsx  現在時刻ハイライト
│   │   ├── DateSelector.tsx    日付選択タブ
│   │   ├── FavoriteToggle.tsx  お気に入りモード切替
│   │   ├── FilterDrawer.tsx    フィルター（モバイル用）
│   │   ├── FilterPanel.tsx     フィルター（デスクトップ用）
│   │   ├── InfoTooltip.tsx     データ取得日時ツールチップ
│   │   ├── SideMenu.tsx        年度切り替えサイドメニュー
│   │   └── schedule/
│   │       ├── ScheduleTable.tsx  部屋別タイムテーブル
│   │       └── SessionCell.tsx    個別セッションセル
│   ├── hooks/
│   │   ├── useRoomColumns.ts   部屋カラム・フィルタリング・時刻軸
│   │   └── useScheduleData.ts  スケジュール・CEDiLデータ取得
│   ├── lib/
│   │   ├── cedec.ts            年度設定（SCHEDULE_SETTING）
│   │   ├── cedil.ts            CEDiL資料リンク付与
│   │   ├── custom.ts           非公式イベント設定
│   │   ├── schedule.ts         JSON取得・パース
│   │   └── utils.ts            共通ユーティリティ（safeExternalUrl 等）
│   ├── store/scheduleStore.ts  Zustandストア
│   ├── types/schedule.ts       型定義
│   └── __tests__/              Vitestユニットテスト
├── public/
│   └── web_data/               生成済みJSON（git管理外）
│       └── {year}/
│           ├── schedule.json
│           └── cedil.json
├── scripts/                    データ生成スクリプト（tsx で実行）
│   ├── generate_json.ts        スケジュールJSON生成スクリプト
│   ├── generate_cedil.ts       CEDiL JSONデータ生成スクリプト
│   ├── generate_youtube.ts     YouTube動画リスト生成スクリプト
│   ├── lib/                    共通ユーティリティ
│   └── parsers/                年度別フォーマットパーサー（before2017・2018〜2020・2023〜2025）
├── web_data_original/          公式サイトから取得したHTMLキャッシュ
│   ├── {year}/
│   │   ├── day1.html           公式スケジュールHTML（2025年以降）
│   │   ├── day2.html
│   │   ├── day3.html
│   │   ├── live.html           YouTube Live配信ページキャッシュ
│   │   └── custom.html         公式スケジュールHTML（2020〜2024年）
│   └── youtube_videos.json     CEDECチャンネル動画リスト（APIキャッシュ）
├── .devcontainer/              開発環境定義
├── package.json
└── .env.example                環境変数テンプレート
```

## 開発の始め方

devcontainer での起動を推奨。コンテナ起動後、依存をインストールして開発サーバーを起動する。

```bash
npm install
npm run dev          # 開発サーバー（http://localhost:3000）
npm run build        # 本番ビルド（out/ に静的ファイル生成）
npm run generate:json {year}      # schedule.json 生成
npm run generate:cedil {year}     # cedil.json 生成
npm run generate:youtube          # YouTube動画リスト取得（要 .env の YOUTUBE_API_KEY）
```

## 年度別対応方法

### 1. 公式HTMLの取得・配置

CEDEC公式スケジュールページのHTMLをブラウザで保存し、以下のパスに配置する。

**2025年以降（日別ファイル形式）:**

```
web_data_original/{year}/day1.html
web_data_original/{year}/day2.html
web_data_original/{year}/day3.html
```

**2020〜2024年（1ファイル形式）:**

```
web_data_original/{year}/custom.html
```

### 2. YouTube動画リストの生成（任意）

YouTube Data API v3 を使って CEDECチャンネルの動画一覧を取得し、`schedule.json` に動画URLを付与する。

#### 2-1. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、YouTube Data API キーを設定する。

```bash
cp .env.example .env
# .env を編集して YOUTUBE_API_KEY を設定
```

#### 2-2. 動画リストの生成

```bash
# キャッシュがあれば再利用
npm run generate:youtube

# 強制再取得
npm run generate:youtube -- --force
```

生成結果は `web_data_original/youtube_videos.json` にキャッシュされる。  
`generate:json` 実行時に自動参照し、セッションタイトルと照合して `youtube` フィールドに動画URLを付与する。

### 3. schedule.json の生成

```bash
# 指定年度のみ生成
npm run generate:json {year}

# 全年度を一括生成
npm run generate:json
```

生成結果は `public/web_data/{year}/schedule.json` に出力される。  
公式サイトのHTMLフォーマットが変わった場合は、`scripts/parsers/format_{year}.ts` を更新する。

### 4. SCHEDULE_SETTING への追加（cedec.ts）

[src/lib/cedec.ts](src/lib/cedec.ts) の `SCHEDULE_SETTING` 配列の**先頭**に新年度の設定を追加する。

```typescript
{ year: "2026", first_date: "MMDD", cedil_tag_no: XXX },
```

| パラメータ     | 説明                                                  |
| -------------- | ----------------------------------------------------- |
| `year`         | 開催年度                                              |
| `first_date`   | 初日の日付（MMDD形式）例: `"0820"`                    |
| `cedil_tag_no` | CEDiL検索タグID（CEDiLサイトで確認）                  |
| `dev_night`    | Developers' Night 設定（任意、後述）                  |
| `events`       | その他の公式付随イベント設定（任意、CEDEC AWARDS 等） |

公式サイトURLは `getDomain(year)` が `https://cedec.cesa.or.jp/{year}/` として自動導出するため設定不要。

**Developers' Night がある場合** は `dev_night` 短縮形で追加する:

```typescript
{
  year: "2026", first_date: "MMDD", cedil_tag_no: XXX,
  dev_night: { rel_path: "event/developer/", room_no: "多目的ホール" },
},
```

`day_index`（省略時: 1）・`start_time`（省略時: `"19:30"`）・`end_time`（省略時: `"21:30"`）は自動補完される。

**CEDEC AWARDS 等の不定期イベント**は `events` に追加する:

```typescript
{
  year: "2026", first_date: "MMDD", cedil_tag_no: XXX,
  events: [
    {
      title: "CEDEC AWARDS", day_index: 1, start_time: "17:30", end_time: "19:00",
      room_no: "メインホール", colspan: "all",
    }
  ]
},
```

### 5. キャッシュ設定の更新（cedec.ts）

[src/lib/cedec.ts](src/lib/cedec.ts) の `CASH_SETTING` に、`web_data_original/` の公式HTMLを取得した日時を手動で記録する。  
UIでデータ取得日時として表示される（CEDiLのような自動取得は未対応）。

```typescript
export const CASH_SETTING = {
  "2026": { time: "2026/xx/xx xx:xx" }, // HTMLを取得した日時を記録
  "2025": { time: "2026/05/03 22:00" },
  // ...
};
```

### 6. 非公式イベントの追加（custom.ts、任意）

[src/lib/custom.ts](src/lib/custom.ts) に非公式イベント（懇親会等）を追加する。

```typescript
"2026": {
  events: [
    {
      title:      "イベント名",
      room_no:    "会場名",
      day_index:  2,                    // 1〜3（CEDECの開催日）
      start_time: "19:00",
      end_time:   "21:00",
      html:       '<a href="..." target="_blank">詳細</a>',
      hash_tag:   "ハッシュタグ"          // 任意: XリンクとXアイコンが自動生成される
    }
  ]
}
```

## 更新履歴

- 2026年 next-app/ サブディレクトリを廃止しリポジトリルートに統合
- 2026年 データ生成スクリプトを PHP から TypeScript (tsx + cheerio) に移行
- 2026年 Next.js + React + TypeScript への全面リプレース（旧jQuery版を破棄）
- 2026年 YouTube Live配信リンク・YouTube動画URL自動付与に対応
- 2026年 お気に入り等の保存をCookieからlocalStorageに変更
- 2026年 リファクタリング（jQuery UI削除・不要CSS削除・コード整理）
- 2024年 2024年フォーマット対応
- 2022/07/24 Ver.3.0: 2011〜2019年設定を削除
- 2020/09/09 Ver.2.2: 2020年フォーマット対応
- 2018/08/24 Ver.2.0: 2018年新フォーマット対応・CEDiLリンクをJSONに移行
