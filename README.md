# cedec_schedule

CEDEC非公式タイムテーブル。CEDEC公式スケジュールページのデータを部屋別タイムテーブル形式で整形・表示します。  
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
- Excelダウンロード（お気に入り状態を反映してタイムテーブル形式で出力）

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
│   │   ├── DateSelector.tsx    日付選択タブ
│   │   ├── ExcelDownloadButton.tsx  Excelダウンロードボタン
│   │   ├── FavoriteToggle.tsx  お気に入りモード切替
│   │   ├── FilterDrawer.tsx    フィルター（モバイル用）
│   │   ├── FilterPanel.tsx     フィルター（デスクトップ用）
│   │   ├── InfoTooltip.tsx     データ取得日時ツールチップ
│   │   ├── SideMenu.tsx        年度切り替えサイドメニュー
│   │   ├── ui/                 スタイルプリミティブ（cva バリアント・共有UI）
│   │   │   ├── RoomLink.tsx              部屋名リンク共有コンポーネント
│   │   │   ├── categoryBadgeVariants.ts  カテゴリバッジ cva
│   │   │   ├── sessionVariants.ts        セッションセル cva
│   │   │   └── tableVariants.ts          テーブル th/td cva
│   │   └── schedule/
│   │       ├── ScheduleTable.tsx  部屋別タイムテーブル
│   │       └── SessionCell.tsx    個別セッションセル
│   ├── hooks/
│   │   ├── useCurrentTimeRow.ts 現在時刻ハイライト（開催期間中1分更新）
│   │   ├── useRoomColumns.ts   部屋カラム・フィルタリング・時刻軸
│   │   └── useScheduleData.ts  スケジュール・CEDiLデータ取得
│   ├── lib/
│   │   ├── cedec.ts            年度設定（SCHEDULE_SETTING）
│   │   ├── cedil.ts            CEDiL資料リンク付与
│   │   ├── custom.ts           非公式イベント設定
│   │   ├── exportExcel.ts      Excelエクスポートロジック（exceljs）
│   │   ├── schedule.ts         JSON取得・パース・buildMatrix
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
│   └── parsers/                年度別フォーマットパーサー（before2017・2018〜2024・2025年以降JSON）
├── web_data_original/          公式サイトから取得したデータキャッシュ（コミット対象外）
│   ├── {year}/
│   │   ├── timetable.json      公式タイムテーブルJSON（2025年以降・generate:json実行時に自動取得）
│   │   ├── cancel.json         公式キャンセル情報JSON（2025年以降・自動取得）
│   │   ├── live.html           YouTube Live配信ページキャッシュ（live設定年度・自動取得）
│   │   ├── day1.html〜day3.html 公式スケジュールHTML（2011〜2017年・手動配置）
│   │   └── all.html            公式スケジュールHTML（2018〜2024年・手動配置）
│   └── youtube_videos.json     CEDECチャンネル動画リスト（APIキャッシュ）
├── .claude/                    Claude Code 設定（コミット対象）
│   ├── settings.json           パーミッション設定
│   └── skills/
│       ├── new-year/           新年度対応スキル（`/new-year` で起動）
│       └── update-timetable/   タイムテーブル更新スキル（`/update-timetable` で起動）
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

## 年度別対応

新しい年度の CEDEC データを追加する手順。Claude Code を使う場合は `/new-year {year}` でも実行できる（手順定義: [.claude/skills/new-year/SKILL.md](.claude/skills/new-year/SKILL.md)）。

### 1. 公式データの準備

**2025年以降（JSON方式・標準）は本手順は不要。** `npm run generate:json {year}` 実行時に、公式
`session/timetable.json` / `cancel.json` を条件付き取得（If-Modified-Since）し
`web_data_original/{year}/timetable.json` / `cancel.json` に自動キャッシュする（`scripts/lib/timetable_source.ts`）。

2024年以前（`YEAR_CONFIGS` で `format` を指定する旧HTML方式）のみ、CEDEC公式スケジュールページのHTMLを
ブラウザで保存し、以下のパスに手動で配置する（`web_data_original/` は git 管理外）。

- **2011〜2017年（日別ファイル形式）**: `web_data_original/{year}/day1.html`〜`day3.html`
- **2018〜2024年（1ファイル形式）**: `web_data_original/{year}/all.html`

### 2. 年度別設定の追加（2ファイル必須）

年度別設定は **次の2ファイル両方** に追加する。片方だけでは動作しない。

#### 2-1. `src/lib/cedec.ts` の `SCHEDULE_SETTING`

配列の**先頭**に新年度の設定を追加する。新規作成時は `cedil_tag_no` を**指定しない**（理由は下記）。

```typescript
{ year: "2026", first_date: "MMDD" },
```

| パラメータ     | 説明                                                     |
| -------------- | -------------------------------------------------------- |
| `year`         | 開催年度                                                 |
| `first_date`   | 初日の日付（MMDD形式）例: `"0820"`                       |
| `cedil_tag_no` | CEDiL検索タグID（任意）。未設定なら CEDiL 連携をスキップ |
| `dev_night`    | Developers' Night 設定（任意、下記参照）                 |

公式サイトURLは `getDomain(year)` が `https://cedec.cesa.or.jp/{year}/` として自動導出するため設定不要。

> **`cedil_tag_no` は新規作成時には指定しない。**
> CEDiL検索タグIDは、セッション資料がCEDiLに登録される会期中〜翌週ごろになって、CEDiLのURLから判明する。
> 新年度の追加時点ではまだ分からないため**省略する**。省略した年度は `generate:cedil` の対象外となり `cedil.json` も生成されない。判明後の手順は「8. CEDiLタグの更新」を参照。

Developers' Night がある場合は `dev_night` を追加する（`day_index`=1・`start_time`=`"19:30"`・`end_time`=`"21:30"` は自動補完）。

```typescript
{
  year: "2026", first_date: "MMDD",
  dev_night: { rel_path: "event/developer/", room_no: "多目的ホール" },
},
```

#### 2-2. `scripts/generate_json.ts` の `YEAR_CONFIGS`

パース方式の設定を追加する。**`format` を省略すると JSON 方式（2025年以降の標準）になる。**

```typescript
"2026": { live: "timetable/free_lives/" },
```

| キー          | 説明                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `format`      | 旧HTML方式で使うパーサー名。**JSON方式（2025年以降）は指定しない。** HTMLが前年と同形式なら既存の `format_YYYY` を再利用 |
| `split_files` | 旧HTML方式で日別ファイル形式（`day1.html` 等）のとき `true`。JSON方式では不要                                            |
| `live`        | YouTube Live配信ページのパス（任意）。`getDomain(year)` からの相対パス                                                   |

公式サイトが JSON 方式に対応していない、または公式HTMLのフォーマットが前年と異なる場合のみ、
`format` を指定した旧HTML方式で対応する。その場合 `scripts/parsers/format_{year}.ts` を新規作成し、
`generate_json.ts` で import して `FormatName` 型と `parseByFormat` の `switch` に分岐を追加する。

### 3. 取得日時の記録

**2025年以降（JSON方式）は自動記録のため本手順は不要。** `generate_json.ts` が取得日時を
`schedule.json` の `fetched` フィールドに自動で埋め込み、UIの「データ取得日時」表示に使われる。

2024年以前（旧HTML方式）のみ、`src/lib/cedec.ts` の `CASH_SETTING` に、公式HTMLを取得した日時を
手動で記録する。

```typescript
"2024": { time: "2024/xx/xx xx:xx" },
```

### 4. YouTube動画リストの生成（任意）

会期後セッションに動画URLを付与する場合、CEDECチャンネルの動画一覧を取得する（要 `.env` の `YOUTUBE_API_KEY`）。

```bash
npm run generate:youtube             # キャッシュがあれば再利用
npm run generate:youtube -- --force  # 強制再取得
```

結果は `web_data_original/youtube_videos.json` にキャッシュされ、`generate:json` 実行時に自動参照される。

### 5. JSONの生成

```bash
npm run generate:json {year}    # public/web_data/{year}/schedule.json を生成
npm run generate:cedil {year}   # public/web_data/{year}/cedil.json を生成（cedil_tag_no 設定時のみ）
```

`cedil_tag_no` が未設定の年度は `generate:cedil` でスキップされ、`cedil.json` は生成されない。新規作成直後はこの状態が正常で、`generate:json` のみ実行すればよい。

### 6. 非公式イベントの追加（custom.ts、任意）

`src/lib/custom.ts` に懇親会等の非公式イベントを追加する。

```typescript
"2026": {
  events: [
    {
      title:      "イベント名",
      room_no:    "会場名",
      day_index:  2,                  // 1〜3（CEDECの開催日）
      start_time: "19:00",
      end_time:   "21:00",
      html:       '<a href="..." target="_blank">詳細</a>',
      hash_tag:   "ハッシュタグ",       // 任意: XリンクとXアイコンが自動生成される
    },
  ],
},
```

### 7. 動作確認

`npm run dev` で開発サーバーを起動し、追加した年度がサイドメニューから選択でき、スケジュールが正しく表示されることを確認する。

### 8. CEDiLタグの更新（会期中〜翌週ごろ）

セッション資料がCEDiLに登録されると検索タグIDが判明する。CEDiLの年度別検索ページのURL（`https://cedil.cesa.or.jp/cedil_sessions/search_tag/{tag}` 形式）から末尾の `{tag}` を読み取る。

判明したら `SCHEDULE_SETTING` の該当年度に `cedil_tag_no` を追記し、`npm run generate:cedil {year}` を実行して `cedil.json` を生成・資料リンクを付与する。

## 更新履歴

- 2026年 Excelダウンロード機能を追加（お気に入り状態を反映・カテゴリ色を背景に表示）
- 2026年 カテゴリ色を2026年公式サイトの配色に更新
- 2026年 2025・2026年のデータ取得を公式 `session/timetable.json` 直読み方式に切り替え（HTML描画とダウンロード用JSONが同一データのため。条件付き取得・取得日時の自動記録に対応）
- 2026年 `cedil_tag_no` を任意化し、新年度追加〜CEDiLタグ判明までのワークフローを整備
- 2026年 UIレイヤー分離リファクタリング（デザイントークン統一・cva バリアント導入）
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
