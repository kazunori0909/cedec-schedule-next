<?php
/**
 * cedil_config.sample.php
 *
 * public/cgi/generate_cedil.php の URL 実行で要求する秘密トークンの設定サンプル。
 * このサンプル自体もリポジトリルート（= 実物を置く場所と同じ階層）に置く。
 * public/ に置くと `next build` で out/ へコピーされ Web 公開されてしまうため。
 *
 * 設置場所:
 *   generate_cedil.php は自分の親ディレクトリを上へ順に辿って cedil_config.php を探し、
 *   最初に見つかったものを使う（ファイル名はこの1つだけ）。
 *
 *   置き場所は「公開ディレクトリの外」。Web 公開されず、`next build` が public/ を out/ へ
 *   コピーする対象にも入らないため、デプロイ成果物にトークンが混ざらない。
 *     例1) サイトを公開ディレクトリ直下に置く場合
 *          スクリプト: /home/<account>/<domain>/public_html/cgi/generate_cedil.php
 *          設定ファイル: /home/<account>/<domain>/cedil_config.php
 *     例2) サイトをサブディレクトリに置く場合
 *          スクリプト: /home/<account>/<domain>/public_html/<sub>/cgi/generate_cedil.php
 *          設定ファイル: /home/<account>/<domain>/cedil_config.php（上へ辿って見つかる）
 *
 *   ローカルではリポジトリルートの cedil_config.php が同じ位置づけになる（.gitignore 済み）。
 *
 * 使い方:
 *   1. このファイルを上記の場所に cedil_config.php としてコピーする
 *      （ローカルなら `cp cedil_config.sample.php cedil_config.php`）
 *   2. 'key' を十分に長いランダム文字列に置き換える
 *      例: php -r "echo bin2hex(random_bytes(24)), PHP_EOL;"
 *   3. 呼び出し時に ?key=<その値> を付ける
 *      /cgi/generate_cedil.php?key=xxxxxxxx&year=2026
 *
 * 注意:
 *   - このサンプルには実際のトークンを書かない（プレースホルダのみ）。
 *   - CLI（cron/ローカル）実行ではトークンは不要。
 *   - 設定ファイルが無い／key が空のうちは、URL 経由の呼び出しはすべて 403 になる。
 */

return [
    'key' => 'REPLACE_WITH_A_LONG_RANDOM_TOKEN',
];
