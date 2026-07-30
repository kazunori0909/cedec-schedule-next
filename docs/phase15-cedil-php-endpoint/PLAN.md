# Phase 15: CEDiL 更新用 PHP エンドポイント

## 課題

CEDiL は会期中に何度も資料が追加される。現在の更新フローは
「ローカルで `npm run generate:cedil` → `next build` → `out/` を再デプロイ」で、
1 ファイル（`cedil.json`）を差し替えるためだけに毎回ビルド＋再デプロイが必要になっている。
リアーキテクト前は、Web サーバー上の PHP を URL で叩くだけで特定年度の `cedil.json` を
最新化できていた。

## 方針

**リアーキ前の PHP 方式を復活させる。** アプリ（Next/TS）は `cedil.json` を実行時に
`fetch`（`cache: "no-store"`、src/lib/cedil.ts）で読むため、ホスト上のこの 1 ファイルを
差し替えれば再ビルド・再デプロイなしで反映される。そこへ CEDiL を取得して同じパスへ
書き出す PHP を置き、URL 呼び出し（またはサーバー cron の CLI）で最新化する。

- 配置は `public/cgi/generate_cedil.php`。`next build` で `out/cgi/…` にコピーされ、
  `out/` を上げ直すデプロイに同梱される（XServer 側で PHP が実行される）。
- 書き込み先は `dirname(__DIR__)/web_data/{year}/cedil.json`＝アプリの fetch パス
  `/web_data/{year}/cedil.json` と一致。
- **アプリ（TypeScript）側は無改修。**
- 年度 → タグ番号のテーブルを PHP 内に保持し、引数で挙動を切り替える:
  - 引数なし … テーブル最新年度（先頭）のみ取得
  - `year=2025` 等 … テーブルにあればその年度を取得、無ければ 400 / exit 1
  - `year=all` … テーブル全年度を取得
- URL クエリ（`?year=`）と CLI 第 1 引数（cron 用）の両方を受け付ける。

### 現行 TS（scripts/generate_cedil.ts）との対応

出力を現行 TS に合わせる（正はあくまで TS 側）。突き合わせ済みの一致点:

- 取得 URL・ページネーション（`.page_change span.active` の次の span）
- `.session_list` → `h2` テキスト（trim 後 `[\n 　]` 除去）＋ `h2` 内 `a[href]`
- h2 があれば無条件に list へ追加（空タイトルもスキップしない）
- 出力は `{ list, update_date }` を `JSON.stringify` 相当（`JSON_UNESCAPED_UNICODE |
JSON_UNESCAPED_SLASHES`・圧縮）で書き出し
- 取得失敗時は途中までの list をそのまま書き出す

差分（意図的）:

- 年度→タグの供給元。TS は `SCHEDULE_SETTING` を import、PHP は自前テーブルを保持
  （PHP から TS を参照できないため。利便性優先の割り切り）。
- `update_date` の値（生成時刻）と ms 表記（PHP は `.000` 固定）。アプリは `new Date()` で
  解釈するため影響なし。

### 検討した代替案（不採用）

| 案                                    | 不採用理由                                                                                         |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Cloudflare Workers（TS でライブ配信） | TS 統一・即時反映は利点だが、外部サービス追加とアプリ改修が必要。XServer だけで完結する PHP を優先 |
| GitHub Actions（既存 TS を流用）      | 既存コード流用の利点はあるが、デプロイ自動化の整備が重く反映も数分。手離れは cron で代替可能       |
| サーバー cron で Node                 | XServer は Node 非対応のため不可                                                                   |

## 決定事項ログ

### 2026-07-30: PHP エンドポイント方式を採用

- ホストが XServer（PHP・cron 可、Node 非対応）で確定したため、追加サービス・アプリ改修が
  不要な PHP 方式を採用。TypeScript としての保守性より、更新の利便性を優先する方針
  （ユーザー承認済み）。

### 2026-07-30: 配置は public/cgi/・年度テーブルは PHP 内に保持

- `public/` 直下を汚さないため `public/cgi/` 配下に配置（ユーザー指定）。
- 年度→タグは PHP 内テーブルで保持し、引数（未指定＝最新 / 年度指定 / `all`）で対象を切り替える
  （ユーザー指定）。

### 2026-07-30: 旧 TS スクリプト（generate_cedil.ts）を廃止

- XServer 実機で PHP 経由の `cedil.json` 更新を確認できたため、`scripts/generate_cedil.ts` を削除。
  CEDiL 生成は PHP に一本化する（ユーザー指示）。
- 影響範囲を調査し、共有物は残すことを確認: `cheerio` 依存（generate_json ほかで使用）、
  `scripts/lib/paths.ts` の `outputDir`（generate_json で使用）、`SCHEDULE_SETTING.cedil_tag_no`
  （アプリの CEDiL fetch 抑止・資料リンク付与で使用）。
- 年度→タグ番号は **cedec.ts（アプリ用）と generate_cedil.php（生成用）の 2 箇所** で保持する
  構成になる。新年度のタグ判明時は両方へ追記する（README「8. CEDiLタグの更新」に明記）。
- ローカル生成手段は `php public/cgi/generate_cedil.php {year}`（CLI）に一本化。
  開発環境に php が必要になるが、利便性優先の割り切りとして許容。

### 2026-07-30: 公開エンドポイントのセキュリティ強化

URL 公開に伴い、書き込み＋外部クロールを行う公開エンドポイントとして多層防御を追加した。

- **アクセス制御 = 秘密トークン `?key=`**（ユーザー選択）。コミットしない
  `generate_cedil.config.php`（`.sample` を配布・`.gitignore` 済み）の `'key'` と `hash_equals`
  で照合。未設定時は fail-safe で 403（保護なしの誤デプロイを防ぐ）。CLI/cron はサーバー
  アクセス自体が前提のためトークン不要。
- **全年度一括（`all`）を撤廃**（ユーザー選択）。重いクロールの公開トリガーを塞ぐ。複数年度が
  必要なときは年度ごとに手動実行する。
- 入力ハードニング: `year` は文字列以外（`?year[]=` 等の配列）を拒否、テーブルキー完全一致のみ許可、
  エラー応答に入力値を反映しない、`display_errors` を off。
- `all`・表外年度・配列・トークン欠如/不一致を php CLI と組み込みサーバーで検証済み
  （403 / 400 / exit1 を確認、正常系 200 も確認）。
