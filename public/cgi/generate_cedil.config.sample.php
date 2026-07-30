<?php
/**
 * generate_cedil.config.sample.php
 *
 * generate_cedil.php の URL 実行で要求する秘密トークンの設定サンプル。
 *
 * 使い方:
 *   1. このファイルを generate_cedil.config.php にコピーする
 *      （generate_cedil.config.php は .gitignore 済み。コミットしない）
 *   2. 'key' を十分に長いランダム文字列に置き換える
 *      例: php -r "echo bin2hex(random_bytes(24)), PHP_EOL;"
 *   3. 呼び出し時に ?key=<その値> を付ける
 *      /cgi/generate_cedil.php?key=xxxxxxxx&year=2026
 *
 * 注意:
 *   - このサンプルには実際のトークンを書かない（プレースホルダのみ）。
 *   - CLI（cron/ローカル）実行ではトークンは不要。
 */

return [
    'key' => 'REPLACE_WITH_A_LONG_RANDOM_TOKEN',
];
