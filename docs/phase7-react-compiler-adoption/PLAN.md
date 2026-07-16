# Phase 7: React Compiler 導入

## 課題

- Next 16 + React 19.2 では React Compiler（安定版 1.0.0）が利用可能になったが、
  導入時に `react-hooks` 系ルールを `eslint-disable` しているコンポーネントは
  Compiler が最適化を拒否する（`Suppression` skip）ことが判明した
- 既存コードには以下の箇所で react-hooks 系の抑制コメントが残っていた
  - rehydrate effect（`setHydrated` を依存配列から除外した `exhaustive-deps` 抑制）
  - URL の `?year=` を effect で読んで setState するパターン（`set-state-in-effect`）
  - `useCurrentTimeRow` の時計購読（同上）
- `ScheduleView`・`ScheduleTable` に手動 `useMemo` が計 5 箇所残っており、
  Compiler によるメモ化と手動メモ化が二重になる

## 方針

抑制コメントを残したまま Compiler を有効化するのではなく、**抑制の根本原因をコード側で解消**する。
babel-plugin-react-compiler のロガーで実際のコンパイル結果を検証しながら進める。

- `next.config.ts` に `reactCompiler: true` を追加、`babel-plugin-react-compiler@1.0.0` を導入
- rehydrate effect は `setHydrated`（Zustand の安定参照）を依存配列に含めることで抑制を除去
- URL の `?year=` 購読を `useSyncExternalStore` ベースの専用フック `useYearParam` に切り出し、
  「effect で URL を読んで setState」パターン自体をなくす。`setYearParam` が URL 書き換えを担い、
  `ScheduleView` の `handleYearChange`／`onYearChange` prop 受け渡しが不要になる
  （副産物として popstate 購読により戻る/進むでの年度切り替えにも追従）
- `useCurrentTimeRow` も同様に `useSyncExternalStore` 化。スナップショットを丸めた分（プリミティブ）
  にすることで同じ時間帯は再レンダー自体が発生しないようにする
- 手動 `useMemo` を全削除。`useRoomColumns` は state を持たない導出計算だったため hook をやめ、
  `lib/schedule.ts` の純関数 `buildScheduleViewModel` に変換。メモ化は呼び出し元
  （コンパイル済みコンポーネント）で Compiler が担う
- 上記の是正により `set-state-in-effect` に抵触する箇所がコードから無くなったため、
  Phase 6 で warn に格下げしていたルールを既定の error に戻す
- AGENTS.md に Compiler 運用方針（手動メモ化禁止、react-hooks 系 eslint-disable 禁止）を明文化

## 決定事項ログ

### 2026-07-16: 抑制除去を伴う本格導入を採用

- 抑制コメントを残したまま Compiler だけ有効化する案は取らず、各抑制の根本原因を
  コード側で解消する方針とした。理由は抑制が残ると該当コンポーネントが Compiler の
  最適化対象から外れ（`Suppression` skip）、導入効果が限定的になるため
- `ExcelDownloadButton.tsx` の `try/finally` のみ Compiler 未対応構文により最適化対象外。
  これは Compiler 有効化時点からの既存の制限であり、今回のスコープ外・動作に影響なし
