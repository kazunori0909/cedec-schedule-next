# Phase 5 で判明した挙動・制約

## Radix UI / shadcn

- **PopoverTrigger はクリックでトグルする**ため、「ホバーで開く + タップでも開く」を両立する
  用途（InfoTooltip）では使えない。タップ時は mouseenter → click の順にイベントが発火し、
  ホバーで開いた直後のクリックで閉じてしまう（実タッチデバイスでも再現する）。
  → `PopoverAnchor` + controlled open にし、アンカー上の pointerdown は
  `onPointerDownOutside` で `preventDefault()` して「外側クリック」扱いを抑止する
- **Radix Dialog（Sheet）はモーダル表示中に body へ `pointer-events: none` を設定する**。
  Testing Library の userEvent はこれを検知して操作を拒否するため、テストでは
  `userEvent.setup({ pointerEventsCheck: 0 })` が必要
- Radix Dialog は Content 内に `Title` が必須、`Description` がないと警告が出る。
  視覚的に不要な場合は `sr-only` の `SheetDescription` を置く

## jsdom

- Radix / floating-ui が参照する以下の API は jsdom に存在せずモックが必要
  （`src/__tests__/setup.ts` に追加済み）:
  `ResizeObserver` / `hasPointerCapture` / `setPointerCapture` /
  `releasePointerCapture` / `scrollIntoView`

## Playwright での目視確認

- Sheet は開くアニメーションが 500ms あるため、`waitForSelector` 直後に screenshot すると
  パネルが画面外（スライドイン開始位置）で写らない。撮影前に 700ms 程度待つ
- `npm run dev` + Playwright（`/tmp` に一時インストール、`--no-sandbox`）で
  デスクトップ 1400px / モバイル 390px の両ビューを確認できる
