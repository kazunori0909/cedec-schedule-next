<?php
/**
 * generate_cedil.php
 *
 * CEDiL サイトを年度別イベントIDでクロールし、web_data/{year}/cedil.json を最新化する。
 * XServer 等の PHP 実行環境に配置し、URL 呼び出し（またはサーバー cron の CLI 実行）で使う。
 *
 * Next アプリは cedil.json を実行時に fetch するため、この JSON を差し替えれば
 * 再ビルド・再デプロイなしで反映される。
 *
 * 使い方:
 *   URL（公開）: /cgi/generate_cedil.php?key=<トークン>[&year=2025]
 *     - year 未指定 … 年度テーブルの最新年度のみ取得
 *     - year=2025   … テーブルにイベントIDがあればその年度を取得
 *     - ?key= は必須。設定ファイルの 'key' と一致しなければ 403（下の $CONFIG_CANDIDATES 参照）
 *   CLI（cron/ローカル）: php generate_cedil.php [2025]
 *     - トークン不要（サーバーアクセス自体が前提）。year 未指定なら最新年度
 *
 * 配置:  <webroot>/cgi/generate_cedil.php
 * 出力:  <webroot>/web_data/{year}/cedil.json（アプリの fetch パス /web_data/{year}/cedil.json と一致）
 *
 * セキュリティ:
 *   - 年度は年度テーブルのキー完全一致のみ許可（allowlist）。書き込み先は既知年度から
 *     導出する固定パスのみで、任意 event / パストラバーサルは受け付けない。
 *   - URL 経由は秘密トークン（?key=）必須。全年度一括（all）は提供しない（濫用による
 *     CEDiL / サーバー負荷を避けるため。複数年度が必要なら年度ごとに実行する）。
 */

// 年度 → CEDiL イベントID。src/lib/cedec.ts の SCHEDULE_SETTING（`cedil_tag_no`）と対応（新しい年度を先頭に）。
// 2026 年のサイトリニューアルで URL は search_tag/{id} → search?event={id} に変わったが、
// ID の値は旧タグ番号と同一（旧 URL も同じ ID の新 URL へ 301 される）。
$YEAR_EVENT = [
    '2026' => 760,
    '2025' => 756,
    '2024' => 752,
    '2023' => 748,
    '2022' => 743,
    '2021' => 740,
    '2020' => 728,
    '2019' => 720,
    '2018' => 717,
    '2017' => 713,
    '2016' => 712,
    '2015' => 709,
    '2014' => 9,
    '2013' => 8,
    '2012' => 4,
    '2011' => 6,
];

const CEDIL_BASE   = 'https://cedil.cesa.or.jp/cedil_sessions/search';
const FETCH_DELAY  = 1;   // ページ間の待機（秒）。並列・連続取得はしない
const HTTP_TIMEOUT = 30;  // 1 リクエストのタイムアウト（秒）
const USER_AGENT   = 'cedec-schedule-cedil-updater/1.0';

// エラー内容（パス等）が応答に混ざらないよう画面出力を無効化する
ini_set('display_errors', '0');

$isCli = (PHP_SAPI === 'cli');

// URL 経由で要求する秘密トークン。コミットしない設定ファイル（`return ['key' => '...'];`）から読む。
// このスクリプトの親ディレクトリを上へ順に辿り、最初に見つかった cedil_config.php を使う。
// サイトを公開ディレクトリ直下に置く場合もサブディレクトリ配下に置く場合も、
// 階層の深さを気にせず「公開ディレクトリの外」に設定を置けるようにするため上へ辿る。
//   例: <webroot>/cedec_schedule/cgi/generate_cedil.php なら
//       <webroot>/cedec_schedule/ → <webroot>/ → <webroot の親>/ の順に探す
// どこにも無い／key が空なら URL 経由の呼び出しはすべて 403（fail-safe）。
$CONFIG_CANDIDATES = [];
$dir = __DIR__;
for ($i = 0; $i < 5; $i++) {
    $parent = dirname($dir);
    if ($parent === $dir) {
        break; // ルートに到達
    }
    $dir = $parent;
    $CONFIG_CANDIDATES[] = $dir . '/cedil_config.php';
}
$EXPECTED_KEY = '';
foreach ($CONFIG_CANDIDATES as $configPath) {
    if (!is_readable($configPath)) {
        continue;
    }
    $config = @include $configPath;
    if (is_array($config) && isset($config['key']) && is_string($config['key'])) {
        $EXPECTED_KEY = $config['key'];
        break;
    }
}

/** 指定イベントIDの検索結果を全ページ巡回し、[{title, url}] を返す */
function fetchCedilList(int $event): array
{
    $list = [];
    $page = 1;
    while ($page !== null) {
        $html = fetchPage($event, $page);
        if ($html === null) {
            break;
        }
        $page = parsePage($html, $list);
        if ($page !== null) {
            sleep(FETCH_DELAY);
        }
    }
    return $list;
}

/** 1 ページ取得（失敗時は null） */
function fetchPage(int $event, int $page): ?string
{
    $url = CEDIL_BASE . '?event=' . $event . '&page=' . $page;
    $ctx = stream_context_create([
        'http' => [
            'method'  => 'GET',
            'timeout' => HTTP_TIMEOUT,
            'header'  => "User-Agent: " . USER_AGENT . "\r\n",
        ],
    ]);
    $html = @file_get_contents($url, false, $ctx);
    return $html === false ? null : $html;
}

/**
 * a.c-session-card を抽出して $list に追記し、次ページ番号を返す（無ければ null）。
 * DOM + XPath で解析する。セレクタは 2026 年のサイトリニューアル後の構造に対応。
 *
 *   <a href=".../view/3408?event=760" class="c-session-card">
 *     <h3 class="c-session-card__title">タイトル</h3>
 */
function parsePage(string $html, array &$list): ?int
{
    $dom = new DOMDocument();
    // 文字化け防止のため UTF-8 を明示。不正マークアップの警告は抑制する
    libxml_use_internal_errors(true);
    $dom->loadHTML('<?xml encoding="UTF-8">' . $html);
    libxml_clear_errors();
    $xpath = new DOMXPath($dom);

    $cards = $xpath->query('//a' . cls('c-session-card'));
    foreach ($cards as $card) {
        $titleEl = $xpath->query('.//*' . cls('c-session-card__title'), $card)->item(0);
        if ($titleEl === null) {
            continue;
        }
        // タイトルは trim 後、改行・半角/全角スペースを除去（アプリ側 normalizeTitle と揃える）
        $title = preg_replace('/[\n 　]/u', '', trim($titleEl->textContent));

        // href は絶対 URL。検索条件の ?event= が付くため取り除き、セッション詳細 URL だけを残す
        $url = ($card instanceof DOMElement) ? strtok($card->getAttribute('href'), '?') : '';

        $list[] = ['title' => $title, 'url' => $url];
    }

    // 次ページ: .c-pagination__arrow.--next。最終ページでは a ではなく disabled な button になる
    $next = $xpath->query('//a' . cls('c-pagination__arrow') . cls('--next'))->item(0);
    if (!($next instanceof DOMElement)) {
        return null;
    }
    $query = parse_url($next->getAttribute('href'), PHP_URL_QUERY);
    if (!is_string($query)) {
        return null;
    }
    parse_str($query, $params);
    $page = isset($params['page']) && is_string($params['page']) ? (int) $params['page'] : 0;
    return $page > 0 ? $page : null;
}

/** class を空白境界で含むことを表す XPath 述語（`c-session-card-list` 等の部分一致を避ける） */
function cls(string $name): string
{
    return "[contains(concat(' ', normalize-space(@class), ' '), ' " . $name . " ')]";
}

/** 1 年度分を取得して cedil.json を書き出す。結果サマリを返す */
function processYear(string $year, int $event): array
{
    $list = fetchCedilList($event);
    $result = [
        'list'        => $list,
        'update_date' => gmdate('Y-m-d\TH:i:s.000\Z'),
    ];

    $dir = dirname(__DIR__) . '/web_data/' . $year;
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    $path = $dir . '/cedil.json';
    $json = json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $ok = ($json !== false) && (@file_put_contents($path, $json) !== false);

    // update_date を返して、キャッシュではなく実行された応答であることを確認できるようにする
    return ['year' => $year, 'count' => count($list), 'ok' => $ok, 'update_date' => $result['update_date']];
}

// ---- 認証（URL 経由のみ）------------------------------------------------------
if (!$isCli) {
    header('Content-Type: application/json; charset=utf-8');
    // 更新エンドポイントのため、ブラウザ／プロキシ／サーバー高速化に応答をキャッシュさせない
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');

    $providedKey = (isset($_GET['key']) && is_string($_GET['key'])) ? $_GET['key'] : '';
    // 設定漏れ（トークン未設定）は fail-safe で拒否する。timing 安全に比較する。
    if ($EXPECTED_KEY === '' || !hash_equals($EXPECTED_KEY, $providedKey)) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'forbidden'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// ---- 引数解決 ----------------------------------------------------------------
// year は「未指定＝最新年度」または「テーブルに実在する年度キー」のみ許可。
// 配列など文字列以外は不正値として弾く（all 等の一括指定は提供しない）。
$arg = '';
$argInvalid = false;
if ($isCli) {
    $arg = isset($argv[1]) ? trim((string) $argv[1]) : '';
} elseif (!isset($_GET['year'])) {
    $arg = '';
} elseif (is_string($_GET['year'])) {
    $arg = trim($_GET['year']);
} else {
    // year が配列等（?year[]=... など）
    $argInvalid = true;
}

$targets = [];
$error   = null;

if ($argInvalid) {
    $error = 'invalid year';
} elseif ($arg === '') {
    // 引数なし: 最新年度（テーブル先頭）のみ
    $latest = array_key_first($YEAR_EVENT);
    $targets[$latest] = $YEAR_EVENT[$latest];
} elseif (isset($YEAR_EVENT[$arg])) {
    $targets[$arg] = $YEAR_EVENT[$arg];
} else {
    // 不正な入力値は応答に反映しない（情報漏えい・ノイズ回避）
    $error = 'invalid year';
}

// ---- 実行 --------------------------------------------------------------------
if ($error !== null) {
    if (!$isCli) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => $error], JSON_UNESCAPED_UNICODE);
    } else {
        fwrite(STDERR, "[ERROR] {$error}\n");
        exit(1);
    }
    exit;
}

$results = [];
foreach ($targets as $year => $event) {
    $r = processYear((string) $year, (int) $event);
    $results[] = $r;
    if ($isCli) {
        $status = $r['ok'] ? 'OK' : 'FAILED';
        echo "[{$status}] {$year} (event={$event}): {$r['count']} 件\n";
    }
}

if (!$isCli) {
    $allOk = array_reduce($results, fn($c, $r) => $c && $r['ok'], true);
    echo json_encode(['ok' => $allOk, 'results' => $results], JSON_UNESCAPED_UNICODE);
}
