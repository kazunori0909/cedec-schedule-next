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
  Rust 版では使えない。代わりに以下で「コンパイラが適用されていること」を確認する。
  - ビルド成果物（`out/_next/static/chunks/`）に `react/compiler-runtime`（`c` 関数によるメモキャッシュ）が
    含まれるかを置き換え前後で比較
  - React DevTools の「Memo ✨」バッジで主要コンポーネント（ScheduleTable・SessionCell 等）を目視確認
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
  `^9.7` 止まりのまま（Phase 8 から状況に変化なし）。

### Step 5: 16.4 の最適化機能の評価

本サイトは `output: "export"` の静的サイトのため、サーバー側の機能は対象外とし、
ビルド成果物とローカル開発の改善に効くものを評価する。
最適化の効果は、置き換え前（16.3.3・Babel 版）に `out/` のサイズを測っておき、比較して判断する。

| 機能                                                          | 扱い                                                                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 本番バンドル縮小（CSS 短縮名・export mangling・共通 runtime） | 自動適用。サイズ差を計測して記録                                                                                    |
| `turbopackLazyDynamicImports`                                 | 評価。exceljs を `import()` しているため dev の初回コンパイル短縮が見込める                                         |
| `turbopackGc`                                                 | 評価。長時間の dev セッションのキャッシュ肥大を抑える                                                               |
| Turbopack Bundle Analyzer                                     | サイズ比較・肥大要因の確認に使う（設定変更なし）                                                                    |
| Cache Components / `ensureStatic`                             | `output: "export"` との両立可否を確認。データは実行時 fetch で `'use cache'` の対象がなく、メリットが薄ければ見送る |
| `turbopackPluginRuntimeStrategy`                              | 見送り。Node 24.13.1 以降は Node のバグにより child process へ戻されるため効果なし                                  |
| `agentFeedback`                                               | 見送り。テレメトリ必須だが devcontainer で `DISABLE_TELEMETRY` を設定している                                       |

### 参考 PR（scrum-fest-archive#109）への合わせ込み

（GitHub CLI 認証後に PR 内容を確認して追記する）

## 決定事項ログ

### 2026-10-21: Next.js 16.4.2 へ更新し、React Compiler を Rust 版へ置き換える

- ユーザー指示により、脆弱性対応に加えて Next.js 16.4.2 への更新と 16.4 の最適化を行う。
- React Compiler は `experimental.turbopackRustReactCompiler` による Rust 版へ置き換え、
  `babel-plugin-react-compiler` を削除する。
- 前ブランチ（`chore/deps-update-2026-08`）の更新分も本フェーズのブランチに含めてよい。

### 2026-10-21: TypeScript 7 は見送り

- 7.1 の正式版が未リリースで、`typescript-eslint` が対応していないため（ユーザー承認）。
