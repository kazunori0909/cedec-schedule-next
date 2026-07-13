# Phase 4: devcontainer で Fable 5 を選択できるようにする（バグフィックス）

## 課題

devcontainer で開発しているとき、Claude Code の `/model` 一覧に Fable 5 が表示されず選択できない。
ホスト（macOS）側の Claude Code では選択できるため、devcontainer 固有の問題。

調査で判明した原因と、副次的に見つかった問題:

1. **`CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`（直接原因）**
   `.devcontainer/devcontainer.json` の `containerEnv` に設定されていた。この環境変数がセットされると
   Claude Code は "essential-traffic" モードに入り、テレメトリ・エラーレポート・自動更新チェックに加えて
   **feature flag / リモート設定の取得（GrowthBook・Statsig）も停止する**。
   新モデルの一覧表示は feature flag でゲートされており（CLI バイナリ内に `fable5_launch_show` の
   ゲート名を確認）、フラグを取得できないとデフォルトの off が使われてモデル一覧から消える。
   モデルへのアクセス権自体はあり、コンテナ内で `claude --model fable -p ...` と明示指定すれば
   正常に応答することを確認済み（＝「使えない」のではなく「一覧に出ない」）。

2. **CLI バージョンのイメージキャッシュ固定（潜在的な問題）**
   `ghcr.io/anthropics/devcontainer-features/claude-code` は内部で
   `npm install -g @anthropic-ai/claude-code`（バージョン指定なし = latest）を実行するが、これが走るのは
   **イメージビルド時のみ**。加えて `DISABLE_AUTOUPDATER=1` で自己更新も止めているため、CLI は
   「最後にキャッシュなしでイメージをビルドした日」のバージョンで凍結される。
   実際、7/4 ビルドのイメージは CLI 2.1.201 のままで、VS Code 拡張（2.1.207・VS Code が自動更新）と
   バージョンがずれていた。今回は両方とも Fable 対応版（2.1.170 以降）だったため直接原因ではないが、
   次に新モデルが出たときは今度こそこれが原因で使えなくなる。

## 方針

### 1. `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` を、より粒度の細かい 2 変数に置き換える

| 案                                                        | 採否   | 理由                                                                            |
| --------------------------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| A. `DISABLE_TELEMETRY` + `DISABLE_ERROR_REPORTING` に置換 | 採用   | テレメトリ・エラーレポートの送信は止めたまま、feature flag の取得だけ復活させる |
| B. 単純に削除                                             | 不採用 | テレメトリ・エラーレポートも有効に戻ってしまう                                  |
| C. 変数は維持し `settings.json` の `model` で直接指定     | 不採用 | 新モデルが出るたび同じ手当てが必要。`/design-sync` 等も使えないままになる       |

なお `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` は Claude API への推論リクエスト本体（会話内容）には
影響しない。止まるのは匿名の利用統計・エラーレポート・自動更新チェック・feature flag 取得のみ。

### 2. `postCreateCommand`（`setup.sh`）で CLI を毎回最新化する

`postCreateCommand` はイメージ層がキャッシュされていてもコンテナ作成のたびに実行されるため、
ここで `npm install -g @anthropic-ai/claude-code@latest` を走らせればバージョン固定を回避できる。
`DISABLE_AUTOUPDATER=1` は維持する（グローバルインストール先が root 所有のため自己更新は失敗する。
更新タイミングを postCreate に一本化した方が挙動が読みやすい）。
ネットワーク断で `setup.sh` 全体が落ちないよう、失敗時は警告を出して継続する。

## 決定事項ログ

### 2026-07-13: 環境変数は削除ではなく置き換える

- ユーザーの選択により、案 B（単純削除）ではなく案 A（`DISABLE_TELEMETRY=1` +
  `DISABLE_ERROR_REPORTING=1` への置き換え）を採用。
- 理由: Fable を一覧に出すために必要なのは feature flag の取得のみであり、テレメトリ・エラーレポートの
  送信まで有効に戻す必要はないため。
