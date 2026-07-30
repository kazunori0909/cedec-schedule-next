# Phase 17 で判明した挙動・制約

## 本番サイトは公開ディレクトリのサブディレクトリに置かれている

XServer 上の実際の配置は次のとおり。

```
/home/<account>/<domain>/
├── cedil_config.php                        ← トークン設定（Web 公開されない）
└── public_html/                            ← 公開ディレクトリ
    └── cedec_schedule/                     ← サイト本体はここ（/cedec_schedule/ で公開）
        ├── cgi/generate_cedil.php
        └── web_data/{year}/cedil.json
```

そのため「スクリプトの2階層上＝公開ディレクトリの親」という前提は成り立たない
（2階層上は `public_html` そのもの）。設定ファイルの探索は階層の深さに依存しない
「親ディレクトリを上へ辿る」方式にした。

`generate_cedil.php` が `cedil.json` を書き出す先は `dirname(__DIR__) . '/web_data/{year}'`
＝ `public_html/cedec_schedule/web_data/{year}`。こちらはサイト本体からの相対位置なので
サブディレクトリ配置でも正しく機能する。

## XServer の PHP には open_basedir が設定されていない

PHP 8.3.30 (fpm-fcgi) で `ini_get('open_basedir')` は空。公開ディレクトリの外にある
設定ファイルを PHP から読める。共有ホスティングでは open_basedir で公開ディレクトリ配下に
制限されている場合があり、その環境では「公開ディレクトリ外に設定を置く」方式は使えない。

## 403 の切り分けは診断スクリプトが早い

トークン不一致・設定ファイル未検出のどちらも fail-safe で 403 を返すため、応答からは
原因を切り分けられない（これは意図した設計）。実際の原因は「設定ファイルの名前が
旧名 `generate_cedil.config.php` のままだった」ことだったが、判明までに数往復かかった。

同階層に使い捨ての診断スクリプトを置き、次を表示させると一度で確定できる。

- `__DIR__` と `open_basedir`
- 探索候補パスごとの `file_exists` / `is_readable`
- 各階層に実在する該当ファイル名（`glob('*cedil*')`）
- 読めた場合の `strlen($config['key'])` と、サンプルのプレースホルダのままか

**トークンの値そのものは出力しない**こと、確認後に**サーバーから必ず削除**することが前提。
