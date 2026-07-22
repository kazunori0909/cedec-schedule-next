# Phase 12 実測メモ（Biome 移行 + TS7）

## 検証環境

- Biome `2.5.5` / TypeScript `7.0.2` / Next `16.2.10` / Node 22（devcontainer）。

## 各チェックの結果（TS7 + Biome）

| チェック                         | 結果      | 備考                                                    |
| -------------------------------- | --------- | ------------------------------------------------------- |
| `tsc --noEmit`（TS7）            | ✅ exit 0 | プロジェクトコードは TS7 でクリーン                     |
| `biome lint`                     | ✅ exit 0 | 下記の修正・抑制・ルール無効化を適用後                  |
| `biome format`（format:check）   | ✅ exit 0 | CSS は `tailwindDirectives: true` で解析可能に          |
| `biome check`（lint-staged 用）  | ✅ exit 0 | `organizeImports` assist を off にして churn 回避       |
| `vitest run`                     | ✅ 176件  | esbuild 変換のため TS 版に非依存                        |
| `next build`（型チェック有効）   | ❌ 失敗   | **Biome とは無関係の Next 側ブロッカー**（下記）        |
| `next build`（型チェック無効化） | ✅ 成功   | `typescript.ignoreBuildErrors: true` + 別途 `typecheck` |

## 最重要の発見: Next 16 のビルド時型チェックが TS7 の別ブロッカー

- ESLint（typescript-eslint）を Biome に置き換えても、`next build` は
  `Running TypeScript ...` の工程で
  `The "id" argument must be of type string. Received undefined` → worker exit 1 で失敗する
  （Phase 8 の失敗が正確に再現）。
- 原因は typescript-eslint ではなく **Next 16 stable 自身のビルド時型チェッカー**が
  TS7（Go ネイティブ版）のパッケージ構成を認識できないこと。Next はまず
  「TypeScript 未インストール」と誤検知して再インストールを試み、その後ワーカーがクラッシュする。
- 回避: `next.config.ts` の `typescript.ignoreBuildErrors: true` で **ビルド内型チェックを無効化**し、
  型安全は独立した `npm run typecheck`（`tsc --noEmit`、TS7 で通過）で担保する。
  canary + `experimental.useTypeScriptCli` は Phase 8 同様に採用しない。
- 結論: **Biome 化は「ESLint が TS7 非対応」ブロッカーを解消するが、TS7 を完全採用するには
  Next の型チェックを外部化する妥協が必要**。Next stable が TS7 を正式サポートすれば解消する。

## Biome 導入で必要だった設定・修正

### biome.json の要点

- `css.parser.tailwindDirectives: true` — `@theme` 等の Tailwind v4 構文を CSS パーサが受理。
- `assist.actions.source.organizeImports: "off"` — 従来 import 並べ替えを行っていなかったため、
  移行時の churn（+ staged ファイルだけ並べ替わる不整合）を避けて無効化。将来オプトイン可。
- `linter.rules.style.noNonNullAssertion: "off"` — 非null表明（`!`）を 13 箇所で意図的に使用。
  ESLint では未強制だったため無効化して挙動維持。
- `linter.rules.suspicious.noArrayIndexKey: "off"` — 静的配列の index キー。従来許容のため無効化。

### コード修正（正当な指摘のみ）

- `useIterableCallbackReturn` ×3（schedule.ts ×2 / useYearParam.ts）: `forEach` を波括弧化。
- `noGlobalIsNan` ×4（schedule.ts）: `parseInt` の結果に適用しているため `Number.isNaN` へ（等価）。
- `useLiteralKeys` / `useTemplate` / `useOptionalChain`: Biome の safe fix を適用。
- `noUnusedFunctionParameters`（legacy_extract.ts）: 未使用の `$` を `_$` に（Biome は `_` 接頭辞を無視）。
- `useButtonType`（テスト）: `<button type="button">`。

### インライン抑制（`biome-ignore`）

- `noDangerouslySetInnerHtml`（SessionCell.tsx）: custom.ts 由来のハードコード HTML のみ（SECURITY.md の明示例外）。
  ※ JSX の `&&` 直後ではなく**対象属性の直前**に置かないと抑制が効かない（要注意）。
- CategoryBadge の a11y（`useKeyWithClickEvents` / `noStaticElementInteractions`）: クリック可能な
  フィルタバッジ。要素の直前に 2 行並べて抑制。

## Biome 移行で失う lint カバレッジ（許容済み）

- `@next/eslint-plugin-next` 相当（`no-img-element` 等の Next 固有検査）は Biome に無い。
- React Compiler 連携の hooks 診断（eslint-plugin-react-hooks の Suppression skip）は無い。
  Biome の `useHookAtTopLevel` / `useExhaustiveDependencies` で rules-of-hooks / deps はカバー。
- Markdown の整形（旧 `prettier --write` の md 対象）は Biome 非対応。docs の表整形は手動になる。

## 再訪の合図

- Next stable が TS7 を正式サポート（`Running TypeScript` 工程がクラッシュしなくなる）したら
  `ignoreBuildErrors` を外せる。
- `@next/eslint-plugin-next` 相当ルールが必要になったら、Biome プラグイン or 最小 ESLint の併用を再検討。
