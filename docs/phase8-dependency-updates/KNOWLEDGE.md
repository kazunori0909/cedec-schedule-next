# Phase 8 実測メモ（検証ブランチでの調査結果）

## TypeScript 7.0.2 を導入したときの挙動

検証ブランチで `typescript@7.0.2`（`latest`）を導入して実測した結果:

| チェック             | 結果          | 備考                                                             |
| -------------------- | ------------- | ---------------------------------------------------------------- |
| `tsc --noEmit`       | ✅ exit 0     | プロジェクトのコード自体は TS7 でクリーン                        |
| `test:run`（vitest） | ✅ 168件通過  | vitest は esbuild 変換で tsc 非依存                              |
| `lint`（ESLint）     | ❌ クラッシュ | `TypeError: Cannot read properties of undefined (reading 'Cjs')` |
| `build`（Next 16）   | ❌ 失敗       | `The "id" argument must be of type string` → worker exit 1       |

- 原因: TS7 はネイティブ（Go）版でパッケージ exports が刷新され、メインエントリ `.` は
  `version.cjs` のみ、実 API は `./unstable/*` へ移設。TS の JS API を読むツール
  （`typescript-eslint` / `@typescript-eslint/typescript-estree` / `ts-api-utils`）が壊れる。
- `typescript-eslint` の peer は最新 8.64.0・canary でも `typescript: >=4.8.4 <6.1.0`。
  TS 6.1 すら未対応。
- npm も TS7 を `invalid`（peer 違反）として扱う。

### 記事の並行運用パターン（採用せず）

<https://zenn.dev/saltyshiomix/articles/503456dc818946> の手法は実在し成立する:

- `typescript` の実体を `@typescript/typescript6@6.0.2`（bin `tsc6`）に差し替えて lint を延命。
- v7 は別名エイリアス（`npm:typescript@^7.0.2`, bin `tsc`）で並走。
- Next のビルド型チェックは **canary（16.3.0-canary.88 時点）+ `experimental.useTypeScriptCli`** が必要。

不採用の理由: 公開する静的サイトに Next canary を常用するリスクが、小規模リポジトリでの
`tsc` 高速化メリットに釣り合わない。lint / 型認識部分は結局 v6 のままで恩恵が限定的。

## ESLint 10.7.0 を導入したときの挙動

- `lint` がクラッシュ:
  `TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function`
- 原因: `eslint-config-next` が内包する `eslint-plugin-react@7.37.5`（最新）が、ESLint 10 で
  削除された旧 API `context.getFilename()` を呼ぶ。peer も `eslint: ...|| ^9.7` 止まり。
- 設定は既に flat config（`eslint.config.mjs`）なので、そこの移行作業は不要。
- ESLint 10 の Node 要件は `^20.19.0 || ^22.13.0 || >=24`（devcontainer の Node が 22.13 未満だと不可）。

## 再訪の合図（次回チェックするコマンド）

- TypeScript 7: `npm view typescript-eslint peerDependencies.typescript` の上限が `<7.x` 以上へ。
  あわせて Next stable が `useTypeScriptCli` を正式化したか。
- ESLint 10: `npm view eslint-plugin-react peerDependencies.eslint` が `^10` を含むか
  （＝ `eslint-config-next` の追随）。
