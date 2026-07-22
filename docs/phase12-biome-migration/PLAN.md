# Phase 12: Biome 移行と TypeScript 7 対応（不採用・知見記録）

> **結論: 不採用。** Biome 化で「ESLint（typescript-eslint）が TS7 非対応」ブロッカーは
> 解消できたが、TS7 を通すには `next build` 内の型チェック無効化（`ignoreBuildErrors: true`）
> という妥協が別途必要になることが実測で判明。この妥協は許容できないため移行は見送り、
> 実装ブランチ（`feature/biome-migration`）は破棄した。判断材料として本記録だけを残す。
> 実測の詳細は [KNOWLEDGE.md](KNOWLEDGE.md) を参照。

## 課題

1. TypeScript 7.0（Go ネイティブ版、2026-07-08 GA）へ上げたいが、`typescript-eslint`
   が TS7 のプログラマティック API 非対応（安定 API は TS 7.1 待ち、issue #12518 は
   "not planned" クローズ、peer も `typescript <6.1.0`）。ESLint 経路を残す限り TS7 は
   入れられない（Phase 8 の見送り判断の根拠）。
2. `eslint-config-next` が `typescript-eslint` を内包するため、ESLint を使い続ける限り
   この制約は解消できない。

## 方針

- **案A（採用）: Biome へ全面移行**。ESLint + Prettier を廃止し、lint / format を
  Biome に一本化する。Biome は独自 Rust パーサで TS コンパイラ API に依存しないため、
  TypeScript のバージョンに縛られず TS7 と共存できる。これにより TS7 のブロッカーが外れる。
- 案B（不採用）: ハイブリッド（Biome + TS6 alias で ESLint 温存 + TS7 alias 並走）。
  安全網は最大だが構成が複雑で、Next build に canary / `useTypeScriptCli` が要る懸念があり
  見送り（Phase 8 と同じ理由）。
- 案C（不採用）: TS 7.1 + typescript-eslint 対応待ち。作業ゼロだが TS7 は入らない。

### 移行で失う lint カバレッジ（許容前提）

- `@next/eslint-plugin-next` 相当（`no-img-element` / `no-html-link-for-pages` 等）が
  Biome に無い。
- `eslint-plugin-react-hooks@7`（React Compiler 診断）と完全同等のルールは無い。
  Biome の `useHookAtTopLevel` / `useExhaustiveDependencies` で rules-of-hooks /
  exhaustive-deps 相当はカバーするが、Compiler 専用診断は失う。
- 現状コードに `eslint-disable` はゼロ・違反もゼロのため実害は小さいが、将来の安全網は薄くなる。

### 採用可否の判断（移行後に評価）

本ブランチは「試して、ダメなら破棄」の位置づけ。移行後に lint / tsc / test / build /
format:check がすべて通り、失うルールの影響が許容範囲だと確認できた場合のみ採用する。

## 決定事項ログ

### 2026-07-22: Biome 全面移行を試行するブランチを作成

- ユーザー承認のもと、`feature/biome-migration` で案A（全面移行）を実装。
- 恒久採用は移行後の実測（各チェック通過・失うルールの影響評価）を見てから判断する。
  不採用ならブランチごと破棄する。

### 2026-07-22: 不採用に決定（ブランチ破棄）

- 実測で lint / typecheck / format / test は TS7 + Biome ですべて通過したが、
  `next build` は Next 16 stable 自身のビルド時型チェッカーが TS7 を認識できずクラッシュ。
  通すには `next.config.ts` に `typescript.ignoreBuildErrors: true`（ビルド内型チェック無効化）が必要。
- **ユーザー判断: ビルド内型チェックの無効化は許容できない**ため移行は不採用。
  実装ブランチを破棄し、docs（PLAN / KNOWLEDGE）のみ知見として main に残す。
- 再訪の合図は KNOWLEDGE.md 参照（Next stable の TS7 正式対応を待つ）。
