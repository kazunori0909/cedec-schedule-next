# Phase 19: Next.js 16.4 アップデートと最適化

## 課題

1. `next@16.3.3` に critical の脆弱性がある（16.3.8 未満が該当）。ほかに undici（cheerio・jsdom 経由）・
   vite（vitest 経由）・sharp・source-map-js・brace-expansion の high が `npm audit` で検出されている。
2. Next.js 16.4（2026-10-06 リリース、最新 16.4.2）で React 19.3 同梱・Turbopack の本番バンドル縮小・
   Rust 版 React Compiler の高速化などが入ったが、未追従。
3. React Compiler は Phase 7 で Babel 版（`babel-plugin-react-compiler`）として導入しており、
   Next.js が推奨し始めた Rust 版（Turbopack ネイティブ）に置き換えられていない。
4. 前ブランチ `chore/deps-update-2026-08` の更新（Node 24 / Next 16.3.3 / jsdom 30・devcontainer への
   GitHub CLI 追加）が未マージのまま残っている。

## 方針

前ブランチの 2 コミットと devcontainer の未コミット差分は本フェーズのブランチ
（`feature/phase19-nextjs-16-4`）に取り込み、1 本の PR にまとめる。
脆弱性解消 → コンパイラ置き換え → 最適化の順に、各ステップで
lint / tsc / test / build / format:check を通してからコミットする。

### Step 1: Next.js 16.4.2 / React 19.3 への更新（脆弱性 critical 解消）

| パッケージ                      | 変更                                  |
| ------------------------------- | ------------------------------------- |
| next / eslint-config-next       | 16.3.3 → 16.4.2（next は exact ピン） |
| react / react-dom               | 19.2.8 → 19.3.1（exact ピン）         |
| @types/react / @types/react-dom | 19.2.x → 19.3.0                       |

- `npx next@canary upgrade --agent=latest` の移行ガイド・codemod の提示内容を確認し、必要なものだけ適用する。
- `experimental.agentUpgrade` は既定値（`'security'`）のまま。脆弱性リマインドだけ受ける。

### Step 2: Rust 版 React Compiler への置き換え

```ts
// next.config.ts
reactCompiler: true,
experimental: {
  turbopackRustReactCompiler: true,
},
```

- `babel-plugin-react-compiler` を devDependencies から削除する（Rust 版は Turbopack 内蔵のため不要）。
- Turbopack 専用オプションのため、`next build` / `next dev` が Turbopack で動いていることを確認する。
- **検証方法の置き換え**: Phase 7 は Babel プラグインのロガーで `Suppression` skip の有無を見ていたが、
  Rust 版では使えない。代わりに 16.4.2 の Babel 版と Rust 版で同じビルドを 2 回行い、以下を比較する。
  - `out/_next/static/chunks/` の JS が**バイト単位で一致**するか（参考 PR では一致した。
    差が出てよいのはビルド ID を埋め込む HTML と RSC ペイロードだけ）
  - `react.memo_cache_sentinel` の出現数が同じか（コンパイラが効いている目安）
  - ビルド全体と Compiled 工程の所要時間（環境で ±4 秒ほどぶれるため複数回測る）
- lint 側の React Compiler ルールは `eslint-plugin-react-hooks@7`（eslint-config-next 同梱）が
  独自に持つため影響しない。AGENTS.md の「eslint-disable 禁止」方針は維持する。
- experimental 扱いのため、問題が出た場合は `turbopackRustReactCompiler` を外せば Babel 版へ戻せるよう、
  切り戻し手順を KNOWLEDGE.md に残す（その場合は `babel-plugin-react-compiler` を再追加）。

### Step 3: 残りの脆弱性対応

- `npm audit fix`（非破壊）で undici / vite / sharp / source-map-js / brace-expansion を解消する。
- `eslint-config-next` 経由（fast-glob → micromatch → braces）は、16.4.2 へ上げたあとに再確認する。
  audit の提示する「14.2.35 へのダウングレード」は誤った修正なので採らない。
- `uuid`（exceljs 経由、moderate）は Phase 8 と同じく前方修正がなく、該当 API を通らないため見送る。

### Step 4: その他の依存更新

- レンジ内のマイナー／パッチ更新: radix-ui 1.8・lucide-react・tailwind-merge・jsdom 30.1・
  lint-staged・prettier・tsx・@testing-library/user-event・@types/node（24 系のまま）。
- **Vitest 5**（vitest / @vitest/coverage-v8 4.1 → 5.0.5）: peer 上は導入可能。破壊的変更を確認し、
  `vitest.config.ts`（projects 構成）が無修正で動くか実測して採否を決める。

#### 見送り

- **TypeScript 7**: 7.1 は beta / dev 版のみで正式版がまだない。`typescript-eslint` の peer も
  `typescript <6.1.0` のままで lint が通らない。6.0.x に据え置く。
  再検討の目安: TypeScript 7.1 の正式版が出て、`typescript-eslint` の peer が 7 系を含むようになったとき。
- **ESLint 10**: `eslint-config-next@16.4.2` が同梱する `eslint-plugin-react@7.37.5` の peer が
  `^9.7` 止まりのまま（Phase 8 から状況に変化なし）。参考 PR のリポジトリのように、`eslint-config-next` をやめて
  個別プラグインに組み替えれば回避できるが、規模が大きいため別フェーズで検討する。

### Step 5: 16.4 の効果の計測と、採らない新機能

本サイトは `output: "export"` の単一ページで、データは実行時に `schedule.json` を fetch する。
サーバーで取るデータも遷移もないため、16.4 の新機能は設定で有効にするものを採らず、
自動で入る改善（本番バンドル縮小）の効果だけを計測して記録する。
比較元は Step 0 のベースライン（16.3.3・Babel 版、KNOWLEDGE.md）。

参考 PR では「共通ランタイムは複数ルートで効く仕組み・CSS Modules 未使用」のためバンドル縮小は出なかった
（gzip で +1.5 KB）。本サイトも同じ構成のため同様の結果が見込まれるが、実測して記録する。

#### 16.4 の新機能で採らないもの

| 機能                                              | 採らない理由                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| Cache Components・`partialPrefetching`            | 静的エクスポートでキャッシュ対象のサーバーデータが無い               |
| `ensureStatic`                                    | `cacheComponents` が前提。静的であることは `output: "export"` が保証 |
| `navigation()` / `prefetch()`                     | 遷移もサーバー処理も無い                                             |
| `turbopackLazyDynamicImports`                     | 開発時だけの効果で、`next/dynamic` は対象外のことがある              |
| `turbopackGc`                                     | 開発時だけの効果。dev セッションが短く、キャッシュ肥大の問題も無い   |
| `turbopackPluginRuntimeStrategy: 'workerThreads'` | Node 24.13.1 以降は Node の不具合で子プロセスに戻される              |
| `agentFeedback`                                   | Next.js のテレメトリ有効化が前提                                     |
| `agentUpgrade`                                    | 既定の `'security'` のままで足りる                                   |

Cache Components は Next.js 17 で既定になる予告がある。17 への移行時はこの表から読み直す。

### 参考 PR（scrum-fest-archive#109・同オーナーの別リポジトリ）への合わせ込み

同じ 16.4 対応を先行して行った PR。以下を揃える。

- Rust 版 React Compiler の**採否判断の根拠**（JS のバイト一致・`memo_cache_sentinel` 数・Compiled 工程の時間）と
  計測の取り方（`.next` を消してから `next build`、複数回測る）
- 「採らない新機能」の表（上記。`turbopackGc` は本リポジトリで追加）
- `next.config.ts` の `reactCompiler` の上に、Rust 版を使う理由と本フェーズ PLAN への参照をコメントで残す
- AGENTS.md の技術スタックを「React Compiler 有効・Rust 版」に更新する
- 切り戻し手順（`experimental.turbopackRustReactCompiler` を消し、`babel-plugin-react-compiler` を入れ直す）を
  決定事項ログに残す
- `next dev` が AGENTS.md に書き込む `nextjs-agent-rules` ブロックはそのままコミットする
  （本リポジトリには元々無かったが、16.4 の `next dev` が末尾に追記した。消しても毎回再生成される）

PR と異なる点:

- バージョンは 16.4.1 ではなく、その後に出た **16.4.2** に上げる。本リポジトリの `next` は exact ピンのまま
- 先方は ESLint 10 化を個別プラグインへの組み替えで別フェーズ（Phase 73）として進めている。
  本フェーズでは扱わず、ESLint 10 は見送りのまま（下記）

## 決定事項ログ

### 2026-10-21: Next.js 16.4.2 へ更新し、React Compiler を Rust 版へ置き換える

- ユーザー指示により、脆弱性対応に加えて Next.js 16.4.2 への更新と 16.4 の最適化を行う。
- React Compiler は `experimental.turbopackRustReactCompiler` による Rust 版へ置き換え、
  `babel-plugin-react-compiler` を削除する。
- 前ブランチ（`chore/deps-update-2026-08`）の更新分も本フェーズのブランチに含めてよい。

### 2026-10-21: TypeScript 7 は見送り

- 7.1 の正式版が未リリースで、`typescript-eslint` が対応していないため（ユーザー承認）。

### 2026-10-21: 参考 PR（scrum-fest-archive#109）に方針を揃える

- Rust 版 React Compiler の採否根拠（JS のバイト一致・`memo_cache_sentinel` 数・Compiled 工程の時間）と、
  16.4 の新機能を設定では有効にしない判断（表）を参考 PR に合わせる（ユーザー指示）。
- 新機能の評価として予定していた `turbopackLazyDynamicImports`・`turbopackGc`・Cache Components は、
  参考 PR と同じ理由で採らない表に移した。

### 2026-10-21: Rust 版 React Compiler を採用し、`babel-plugin-react-compiler` を外す

- 16.4.2 の Babel 版と比べ、出力 JS（`_next/static/chunks/`）がバイト単位で一致し、
  `memo_cache_sentinel` もどちらも 24 箇所。Compiled 工程は 7.6〜8.2 秒 → 5.9 秒（計測は KNOWLEDGE.md）。
  挙動が変わらず速くなるため、experimental でも採る。
- 戻すときは `next.config.ts` の `experimental.turbopackRustReactCompiler` を消し、
  `npm install -D babel-plugin-react-compiler` で入れ直す。
