# Phase 16 タスク

## 1. データ由来の描画不具合

- [x] `sub_category` の重複を生成側で除去する（2011 年データの `["GD","GD"]` 等）
- [x] `npm run generate:json` で該当年度を再生成し重複が消えることを確認

## 2. テストの補強

- [x] SessionCell: 「Live配信予定」バッジ（Phase 11）のテストを追加
- [x] SessionCell: キャンセル表記セッションの淡色表示のテストを追加
- [x] useScheduleData: `cedil_tag_no` 未設定年度で CEDiL を fetch しない（Phase 9）テストを追加
- [x] schedule/ScheduleView 相当: LT データが無い年度で `dayIndex = -1` が Day1 にフォールバックする
      ロジックのテストを追加
- [x] 参照ゼロの `getSessionTitle` を削除

## 3. ドキュメント同期

- [x] `AGENTS.md`: フォルダ構成の `src/__tests__/` を実態（コ・ロケーション + `src/test/setup.ts`）へ修正
- [x] `AGENTS.md`: 開発コマンドにテスト系（`npm test` / `test:run` / `test:coverage`）を追記
- [x] `AGENTS.md` / `README.md`: LT タブ（Phase 14）を機能一覧・データフロー・状態表に反映
- [x] `README.md`: 年度別設定の表に `room_overrides` を追記
- [x] `README.md`: `.claude/skills/` 一覧（phase-new / phase-compress）・`generate_cedil.config.sample.php` を追記
- [x] `SECURITY.md`: `dangerouslySetInnerHTML` の例外に `cedec.ts` の `events` / `dev_night` を明記
- [x] `SECURITY.md`: CEDiL 更新トークン設定ファイルの扱いを追記
- [x] `docs/README.md`: Phase 4・8 のステータスを実態に合わせる

## 4. リファクタリング

- [x] `exportExcel.ts` のカラム・時刻軸導出を `buildScheduleViewModel` に寄せる
- [x] カテゴリ色を1テーブルに集約し、未使用の `INT` を削除
- [x] ストアの `toggleHideSpec` / `toggleFavorite` の共通化
- [x] `RoomColumn.roomName` の意味を明確化し、`col.roomName ?? col.name` の二重記述を解消
      （併せて、お気に入りモードで各セルの会場が「お気に入り 1」と表示される不具合を修正）
- [x] `ScheduleView` の `activeDayIndex` 判定を素直な条件に書き換え
- [x] 内部専用関数の不要な `export` を外す
- [x] `FILL_LIGHTEN_RATE` の存在しない一時ファイル参照コメントを削除

## 共通

- [x] `npm run lint` / `npm run format:check` / `npm run test:run` が通ることを確認
- [x] 個人情報チェック（更新した Git 追跡ファイルに実値が混入していないか）
