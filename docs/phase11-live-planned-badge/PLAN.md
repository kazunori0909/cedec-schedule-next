# Phase 11: Live配信予定バッジ

## 課題

`scripts/lib/live.ts` の `fetchLiveSessions` は、公式 LIVE ページ
（`timetable/free_lives/`）から `session_id → YouTube URL` のマッピングを構築し、
セッションセルに YouTube リンクを付与している。

しかし公式サイトは会期前、**配信予定のセッションを一覧に載せつつ YouTube リンクを
まだ掲載していない**期間がある（2026 の LIVE ページ現状：セッションカード 41 件が
存在する一方で YouTube URL を持つ `.p-session__time-item` は 0 件）。

現行実装は URL が取れないセッションを一切マークしないため、
「配信予定だがリンク未確定」のセッションが利用者に伝わらない。
公式のリンク掲載を待つ間も、**Live 配信予定であること自体は明記したい**。

## 方針

LIVE ページのセッションカード（`a.c-guide-card__link`）に載っているセッションは
「配信予定」と解釈できる。これを URL の有無と分けて扱う。

1. `fetchLiveSessions` の戻り値を `{ urls, planned }` に拡張する。
   - `urls`: 従来どおり `session_id → YouTube URL`（`.p-session__time-item` から解決）
   - `planned`: LIVE ページに載っている全 `session_id`（配信予定の集合）
2. **新パラメータは足さず、既存 `live` フィールドにセンチネル値 `LIVE_URL_PENDING`（`"pending"`）を入れる。**
   `postprocessSessions` で「配信予定に含まれ、かつ live/youtube URL 未確定、かつ会期前」の
   セッションの `live` にセンチネルを設定する（URL があれば YouTube リンクを出すので不要。
   会期後は無意味なので付けない）。
3. `getYoutubeURL` はセンチネルを href に返さないよう除外し、
   判定用ヘルパー `isLiveUrlPending()` を追加する。
4. フロント（`SessionCell`）で、YouTube リンクが出せない場合の fallback として
   `isLiveUrlPending()` が真なら「Live配信予定」バッジを表示する。

### なぜ新パラメータではなくセンチネルか

当初 `Session` に `live_planned?: boolean` を足す案だったが、schedule.json のフィールドを
増やさない方針に合わせ、URL 置き場である既存 `live` にセンチネル文字列を入れる方式にした。
`live` は元々「配信リンク」を表すので、「リンクは未確定だが配信予定」を同じ枠で表現でき、
型・出力・フロントの参照箇所を増やさずに済む。センチネルは URL ではないため
`safeExternalUrl` で自然に弾かれ、href に漏れない。

### センチネルの適用範囲を絞る理由

「配信予定リストの全セッション」ではなく「配信予定かつリンク未確定（会期前）」に限定する。
こうすると JSON が最小になり、`live === LIVE_URL_PENDING` の意味が「URL 掲載待ちの配信予定」に
一意化され、フロントは `isLiveUrlPending()` が真なら無条件でバッジを出すだけでよくなる。

## 決定事項ログ

### 2026-07-21: 表示ラベルと出力条件

- バッジ文言は「Live配信予定」。YouTube リンクが出せないときのみ表示する。
- 配信予定は「配信予定 && live/youtube URL なし && 会期前」でのみ記録する。

### 2026-07-21: 新パラメータではなくセンチネルで表現（ユーザー承認）

- schedule.json は「Live の URL しか持たない」ため、生成時に判定した「配信予定かつ
  URL 未確定」を JSON に運ぶ必要がある。フィールドを増やさない方針に沿い、
  既存 `live` にセンチネル値 `LIVE_URL_PENDING = "pending"` を入れる方式を採用した。
