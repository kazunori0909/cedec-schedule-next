# Phase 19 ナレッジ

## ベースライン計測（Next 16.3.3・Babel 版 React Compiler）

`rm -rf .next out && npm run build`（devcontainer・Node 24）で計測。

| 項目                                                     | 値                   |
| -------------------------------------------------------- | -------------------- |
| ビルド時間                                               | 19 秒                |
| `out/` 合計（`web_data` 除く）                           | 2,006,272 B          |
| `out/_next/static/chunks/` 合計                          | 1,717,349 B（11 本） |
| JS チャンク連結の gzip -9                                | 481,737 B            |
| 最大チャンク（exceljs と推定・動的 import）              | 930,904 B            |
| `react.memo_cache_sentinel` 出現数（コンパイル済み目安） | 24                   |

- `react.memo_cache_sentinel` は React Compiler がメモキャッシュの初期化判定に出力するシンボル。
  Rust 版へ置き換えたあとも同程度の数が出ていれば、コンパイラが適用されていると判断できる。

## devcontainer: gh 設定ボリュームの所有者

- 名前付きボリュームを `/home/node/.config/gh` にマウントすると、イメージ側にディレクトリがない場合は
  root 所有で作られ、node ユーザーの `gh auth login` が認証情報（`hosts.yml`）を保存できない。
- Dockerfile でディレクトリを事前作成して `chown node:node` しておけば、初回マウント時に所有者が引き継がれる。
  再ビルド前の暫定対処は `sudo chown node:node /home/node/.config/gh`。
