# CEDEC Schedule 開発ドキュメント

このディレクトリには、開発フェーズごとの計画・作業記録を格納する。
プロジェクトの技術構成・コマンド一覧は [AGENTS.md](../AGENTS.md) を、開発ルールは
[CLAUDE.md](../CLAUDE.md) を参照。

各フェーズは `docs/phase<N>-<slug>/` に以下を持つ:

- `PLAN.md` — 設計上の選択とその理由
- `TASKS.md` — 作業チェックリスト
- `KNOWLEDGE.md`（任意）— 実機操作・外部サービス調査で判明した挙動・制約

新規フェーズの追加は `/phase-new`、完了済みフェーズの [phases.md](phases.md) への圧縮は
`/phase-compress`（ユーザーが明示的に指示したときのみ）で行う。

## 開発フェーズ記録

| #   | フェーズ                                      | 要点                                                                                                                                             | 記録                                             |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| 1   | プチ仕様駆動開発の導入 ✅                     | `docs/` 配下でフェーズ単位に開発の背景・決定事項を記録する運用を開始                                                                             | [phase1/](phase1-spec-driven-workflow/)          |
| 2   | 招待セッション表示 ✅                         | 2025年以降のJSON方式で招待系セッションを判定し、Room表示の横にバッジ表示                                                                         | [phase2/](phase2-invited-session-badge/)         |
| 3   | README.md 最新化 ✅                           | 「年度別対応」セクションをJSON方式（2025〜）の実装に合わせて修正                                                                                 | [phase3/](phase3-readme-json-flow-update/)       |
| 4   | devcontainer で Fable 5 を選択可能に ✅       | `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` が feature flag 取得を止め、`/model` 一覧からモデルが消えていた問題を修正                             | [phase4/](phase4-devcontainer-fable-model/)      |
| 5   | shadcn/ui プリミティブ統合 ✅                 | 手書きボタン・二重実装オーバーレイ・散在マジック値を shadcn/ui（Radix）プリミティブとトークンに統合                                              | [phase5/](phase5-shadcn-ui-primitives/)          |
| 6   | テストのコ・ロケーション化とコード配置整理 ✅ | テストを対象ソース隣へ移動し、命名の実態不一致・デッドコード・lint 警告を解消                                                                    | [phase6/](phase6-test-colocation-cleanup/)       |
| 7   | React Compiler 導入 ✅                        | 手動 `useMemo` を撤廃し React Compiler に最適化を委譲、抑制していた react-hooks 系警告を根本解消                                                 | [phase7/](phase7-react-compiler-adoption/)       |
| 8   | 依存パッケージの安全なアップデート ✅         | パッチ／マイナー更新（next 16.2.10 ほか）を適用。TypeScript 7 / ESLint 10 は上流未対応で見送り                                                   | [phase8/](phase8-dependency-updates/)            |
| 9   | CEDiL フェッチ抑止 ✅                         | `cedil_tag_no` 未指定年度（2026 等）で `cedil.json` への 404 リクエストが出る不具合を、フェッチ前の設定分岐で解消                                | [phase9/](phase9-cedil-fetch-guard/)             |
| 10  | レスポンシブ時のヘッダー最適化 ✅             | 狭幅端末でヘッダー高が増える問題に対し、Excel DL ラベルの表現変更（PC も統一）とタイトルの一行化（フォント縮小）で対応                           | [phase10/](phase10-responsive-header-layout/)    |
| 11  | Live配信予定バッジ ✅                         | 公式 LIVE ページに載るが配信 URL 未掲載のセッションの `live` にセンチネルを入れ、「Live配信予定」を明記                                          | [phase11/](phase11-live-planned-badge/)          |
| 12  | Biome 移行と TS7 対応 ❌不採用                | Biome 化で ESLint の TS7 非対応は解消するが、`next build` の型チェック無効化が別途必要と判明し不採用。知見のみ記録                               | [phase12/](phase12-biome-migration/)             |
| 13  | CEDiL ライトニングトーク除外 ✅               | 公式タイムテーブルに載らずセッションに紐付かないライトニングトーク資料を、一覧の「形式」で判定し `cedil.json` から除外（Phase 14 で解除）        | [phase13/](phase13-cedil-lightning-talk-filter/) |
| 14  | ライトニングトークタブ ✅                     | 公式 `timetable.json` の LT 枠 `children` を展開し、日 × 会場を横断する LT 専用タブを追加                                                        | [phase14/](phase14-lightning-talk-tab/)          |
| 15  | CEDiL 更新用 PHP エンドポイント ✅            | `public/cgi/generate_cedil.php` を URL/cron で叩き、再ビルドなしで `cedil.json` を最新化。旧 `generate_cedil.ts` は廃止（アプリ無改修・XServer） | [phase15/](phase15-cedil-php-endpoint/)          |
| 16  | テスト・ドキュメント・重複の整理 ✅           | Phase 9〜15 で溜まったテストの不足・ドキュメントの実態ズレ・導出ロジックの重複をまとめて解消                                                     | [phase16/](phase16-test-docs-refactor/)          |
| 17  | トークン設定の配置と Excel の LT（進行中）    | CEDiL 更新トークンを webroot 外から読むようにし、Excel 出力に LT シートを追加                                                                    | [phase17/](phase17-cedil-config-excel-lt/)       |
