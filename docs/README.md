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

| #   | フェーズ                                       | 要点                                                                                                                 | 記録                                        |
| --- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | プチ仕様駆動開発の導入 ✅                      | `docs/` 配下でフェーズ単位に開発の背景・決定事項を記録する運用を開始                                                 | [phase1/](phase1-spec-driven-workflow/)     |
| 2   | 招待セッション表示 ✅                          | 2025年以降のJSON方式で招待系セッションを判定し、Room表示の横にバッジ表示                                             | [phase2/](phase2-invited-session-badge/)    |
| 3   | README.md 最新化 ✅                            | 「年度別対応」セクションをJSON方式（2025〜）の実装に合わせて修正                                                     | [phase3/](phase3-readme-json-flow-update/)  |
| 4   | devcontainer で Fable 5 を選択可能に（進行中） | `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` が feature flag 取得を止め、`/model` 一覧からモデルが消えていた問題を修正 | [phase4/](phase4-devcontainer-fable-model/) |
| 5   | shadcn/ui プリミティブ統合 ✅                  | 手書きボタン・二重実装オーバーレイ・散在マジック値を shadcn/ui（Radix）プリミティブとトークンに統合                  | [phase5/](phase5-shadcn-ui-primitives/)     |
| 6   | テストのコ・ロケーション化とコード配置整理 ✅  | テストを対象ソース隣へ移動し、命名の実態不一致・デッドコード・lint 警告を解消                                        | [phase6/](phase6-test-colocation-cleanup/)  |
| 7   | React Compiler 導入 ✅                         | 手動 `useMemo` を撤廃し React Compiler に最適化を委譲、抑制していた react-hooks 系警告を根本解消                     | [phase7/](phase7-react-compiler-adoption/)  |
| 8   | 依存パッケージの安全なアップデート（進行中）   | パッチ／マイナー更新（next 16.2.10 ほか）を適用。TypeScript 7 / ESLint 10 は上流未対応で見送り                       | [phase8/](phase8-dependency-updates/)       |
| 9   | CEDiL フェッチ抑止 ✅                          | `cedil_tag_no` 未指定年度（2026 等）で `cedil.json` への 404 リクエストが出る不具合を、フェッチ前の設定分岐で解消    | [phase9/](phase9-cedil-fetch-guard/)        |
