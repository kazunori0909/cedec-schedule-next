# Phase 6: テストのコ・ロケーション化とコード配置・命名の整理

## 課題

1. **テストとソースの距離** — `src/__tests__/` 配下に対象ソースの階層をミラーする形でテストが
   置かれており、対象ファイルと同居していないため見通しが悪い
2. **配置と実態の不一致** — `categoryBadgeVariants` は名前・置き場（`ui/`）が CVA バリアントを
   示唆するが、実態はカラーマップ + リゾルバであり、利用元も `CategoryBadge.tsx` のみ
3. **デッドコード** — `getCategoryClass` / `SPEC_CLASS` はプロダクションから呼ばれておらず、
   参照元が自身のテストのみになっていた
4. **任意値の残存** — 時刻列に `text-[11px]` が唯一残っており、
   「フォントサイズは `@theme` トークンを使う」規約（Phase 5 で追加）に抵触
5. **lint 警告** — 外部状態（ブラウザ URL・時計）と effect 内 setState を同期する箇所で
   `set-state-in-effect` の警告が抑制コメント付きで残っていた

## 方針

挙動変更をせず、構成・命名・デッドコードの整理と lint 警告解消のみに限定するリファクタリング。

- `src/__tests__/` の階層ミラーを解消し、各テストを対象ソースの隣へ移動。共通セットアップは
  `src/test/setup.ts` に集約。scripts のテストも `parsers/`・`lib/` の対象ファイル隣へ
- `vitest.config.ts` の include を `**/*.test.*` パターンへ更新し、coverage からテスト自体を除外
- `categoryBadgeVariants` → `categoryBadgeColors` に改名し `ui/` から `CategoryBadge.tsx` の隣へ移動。
  `ui/` は shadcn プリミティブと CVA の `*Variants.ts` 専用とし、CLAUDE.md の UI 規約と実態を一致させる
- 未使用の `getCategoryClass` / `SPEC_CLASS` を関数・定数・テストごと削除
- 時刻列の `text-[11px]` を `text-2xs` トークンへ置換
- `set-state-in-effect` の抑制 2 件は、警告そのものを消すのではなく意図をコメントで明記した上で
  局所的に無効化（根本解消は Phase 7 で実施）

## 決定事項ログ

### 2026-07-16: スコープを構成整理に限定

- 挙動変更を伴うリファクタリングとは分離し、コ・ロケーション配置・命名・デッドコード削除・
  lint 警告解消のみをこのフェーズで扱う
