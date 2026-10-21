# Phase 19 ナレッジ

## ベースライン計測（Next 16.3.3・Babel 版 React Compiler）

`rm -rf .next out && npm run build`（devcontainer・Node 24）で計測。

| 項目                                                     | 値                   |
| -------------------------------------------------------- | -------------------- |
| ビルド時間                                               | 19 秒                |
| `out/` 合計（`web_data` 除く）                           | 2,006,272 B          |
| `out/_next/static/chunks/` 合計                          | 1,717,349 B（11 本） |
| JS チャンク連結の gzip -9                                | 481,737 B            |
| 最大チャンク（exceljs と推定・動的 import）              | 930,904 B            |
| `react.memo_cache_sentinel` 出現数（コンパイル済み目安） | 24                   |

- `react.memo_cache_sentinel` は React Compiler がメモキャッシュの初期化判定に出力するシンボル。
  Rust 版へ置き換えたあとも同程度の数が出ていれば、コンパイラが適用されていると判断できる。

## 16.4.2 での計測（Babel 版 → Rust 版）

`.next` と `out` を消してから `npm run build` を各 2 回。ビルド時間は 1 回ごとに数秒ぶれる。サイズは毎回同じ。

| 構成             | 全体（秒） | Compiled（秒） | JS 合計     | JS（gzip -9） | sentinel |
| ---------------- | ---------- | -------------- | ----------- | ------------- | -------- |
| 16.3.3・Babel 版 | 19         | 11.7           | 1,717,349 B | 481,737 B     | 24       |
| 16.4.2・Babel 版 | 13.2〜14.3 | 7.6〜8.2       | 1,679,079 B | 485,582 B     | 24       |
| 16.4.2・Rust 版  | 12.4〜15.3 | 5.9            | 1,679,079 B | 485,582 B     | 24       |

- 16.3.3 → 16.4.2 で JS 合計は約 38 KB 減（チャンク 11 本 → 10 本）だが、gzip 後は約 4 KB 増。
  参考 PR と同じく、単一ページ・CSS Modules 未使用のサイトでは 16.4 の「バンドル縮小」はほぼ出ない
- 16.3.3 の計測は 1 回のみで、`npm install` 直後の負荷を含む可能性がある（全体時間の差は割り引いて見る）

## Rust 版 React Compiler は Babel 版と同じ JS を出す

- `_next/static/chunks/` の JS が**バイト単位で一致**した。差が出るのはビルド ID を埋め込む HTML と RSC ペイロード
  （`__next.*.txt`）とビルド ID ディレクトリだけ
- `babel-plugin-react-compiler` を依存から外しても `build`・`dev` とも動く。Vitest は React Compiler を通さず、
  ESLint の Compiler 系ルールは `eslint-plugin-react-hooks` が自前でコンパイラを同梱しているため影響しない
- ビルドログに `Experiments (use with caution): ✓ turbopackRustReactCompiler` が出る

## `next dev` が AGENTS.md にブロックを追記する

- 16.4 の `next dev` は、AGENTS.md に `<!-- BEGIN:nextjs-agent-rules -->` ブロックが無ければ末尾に追記する
  （ログ: `Generated AGENTS.md for AI agents. Set agentRules: false in next.config to disable.`）
- 消しても `next dev` のたびに再生成されるため、コミットして差分を出さないようにした

## `next dev` のテレメトリ

- devcontainer の `DISABLE_TELEMETRY` は Next.js には効かず、`next dev` 初回に匿名テレメトリの告知が出た。
  止めるには `NEXT_TELEMETRY_DISABLED=1` が必要

## devcontainer: gh 設定ボリュームの所有者

- 名前付きボリュームを `/home/node/.config/gh` にマウントすると、イメージ側にディレクトリがない場合は
  root 所有で作られ、node ユーザーの `gh auth login` が認証情報（`hosts.yml`）を保存できない。
- Dockerfile でディレクトリを事前作成して `chown node:node` しておけば、初回マウント時に所有者が引き継がれる。
  再ビルド前の暫定対処は `sudo chown node:node /home/node/.config/gh`。

## `npm audit` の残り（12 件 → 7 件）

`npm audit fix`（非破壊）で undici（cheerio・jsdom 経由）・vite（vitest 経由）・sharp・source-map-js・
brace-expansion を解消した（lock ファイルだけの変更）。残りはどれも公開物（`out/`）に入らないか、該当 API を通らない。

- `braces`（`eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` 経由、high）—
  入っている 3.0.3 が最新で修正版がまだ無い（残りの high 5 件はこれとその上流）。lint 時だけの依存。
  `npm audit fix --force` の提案は eslint-config-next を 14 系へ**下げる**もので採れない
- `uuid`（exceljs 経由、moderate）— exceljs 4.4.0 が最新で前方修正が無い（提案は 3.4.0 への**ダウングレード**）。
  該当するのは `buf` 引数付きの v3/v5/v6 で、exceljs の利用経路では通らない（Phase 8 と同じ判断）
