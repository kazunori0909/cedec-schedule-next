# Phase 4 で判明した挙動・制約

## `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` が止める通信

CLI バイナリの実装を確認したところ、この環境変数がセットされていると Claude Code は内部で
"essential-traffic" モードに切り替わる（`DISABLE_TELEMETRY` / `DO_NOT_TRACK` と同じ判定関数で扱われ、
この 3 つの中では最も包括的）。止まるのは次の通信。

- テレメトリ（利用状況の統計送信）
- エラーレポート（クラッシュレポート送信）
- 自動アップデートのチェック（`DISABLE_AUTOUPDATER` と重複）
- **feature flag / リモート設定の取得（GrowthBook・Statsig）** ← 新モデルが一覧に出ない原因

止まらないのは Claude API への推論リクエスト本体（会話・ツール実行結果）。"essential" なので影響を受けない。

副作用として `/design-sync` もこの変数がセットされていると使えない（バイナリ内に専用のエラーメッセージ
「DesignSync is unavailable while nonessential network traffic is restricted」がある）。
今後 feature flag でゲートされる新機能は同様に見えなくなる可能性がある。

## 新モデルの一覧表示は feature flag でゲートされる

CLI バイナリの文字列を調べると `fable5_launch_show` / `fable5LaunchShow` というゲート名が存在する。
フラグを取得できないとデフォルトの off が適用され、`/model` の一覧からモデルが消える。
ただしモデルへのアクセス権自体はあるため、`claude --model fable -p "..."` と明示指定すれば
（ピッカーを経由しないので）正常に応答する。「使えない」のではなく「一覧に出ない」状態。

Fable 5 が選択可能になったのは Claude Code v2.1.170 以降。

## devcontainer feature はイメージビルド時にしか走らない

`ghcr.io/anthropics/devcontainer-features/claude-code` は options を持たず（バージョン指定不可）、
内部で `npm install -g @anthropic-ai/claude-code`（latest）を実行するだけ。
`.devcontainer/devcontainer-lock.json` が固定しているのは **feature 自体のバージョン（1.0.5）**であって
CLI のバージョンではない。

feature の実行はイメージビルド時のみなので、Docker のレイヤーキャッシュが効いている限り
CLI は「最後にキャッシュなしでビルドした日の latest」で凍結される。`DISABLE_AUTOUPDATER=1` と
組み合わさると自己更新もしないため、放置すると古いまま固定される。

一方 VS Code 拡張（`anthropic.claude-code`）は VS Code が自動更新するため、CLI と拡張のバージョンが
ずれていく（調査時点で CLI 2.1.201 / 拡張 2.1.207）。

対策として `postCreateCommand`（= `setup.sh`）で `npm install -g @anthropic-ai/claude-code@latest` を
実行する。`postCreateCommand` はコンテナ作成のたびに走るためキャッシュの影響を受けない。
グローバルインストール先（`/usr/local/lib/node_modules`）は root 所有だが、Dockerfile で node ユーザーに
パスワードなし sudo を付与済みのため `sudo npm install -g` で更新できる（動作確認済み）。

## `~/.claude` は Docker ボリュームなのでホストと設定が別

`devcontainer.json` の `mounts` で `/home/node/.claude` に名前付きボリュームをマウントしているため、
コンテナ内の Claude Code 設定・認証情報はホスト側（`~/.claude`）と完全に別物。
ホストでモデルを切り替えてもコンテナには反映されない。
