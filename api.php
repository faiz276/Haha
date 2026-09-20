<?php
/* ================================================================
   POLLAPPP — Simple JSON backend
   Stores app data as a JSON file inside /data (auto-created next to
   this script). No database required.
   ================================================================ */

// ---- Change this to something private only you know ----
// The front-end (index.html) must use the SAME value.
define('API_KEY', 'change-me-please');

header('Content-Type: application/json');

// ---- Paths ----
$dataDir  = __DIR__ . '/data';
$dataFile = $dataDir . '/state.json';

// ---- Auto-create the data folder (and lock it down) on first run ----
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}
// Block direct web access to anything inside /data
$htaccess = $dataDir . '/.htaccess';
if (!file_exists($htaccess)) {
    file_put_contents($htaccess, "Require all denied\nDeny from all\n");
}
// Blank index so folder can never be listed even if .htaccess is ignored
$indexStub = $dataDir . '/index.php';
if (!file_exists($indexStub)) {
    file_put_contents($indexStub, "<?php http_response_code(403); ?>");
}

// ---- Simple shared-key check (matches the key hardcoded in index.html) ----
$sentKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if (!hash_equals(API_KEY, $sentKey)) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // ---- Load ----
    if (file_exists($dataFile)) {
        $fp = fopen($dataFile, 'r');
        flock($fp, LOCK_SH);
        $contents = stream_get_contents($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        echo $contents ?: 'null';
    } else {
        echo 'null'; // no server data yet — front-end falls back to localStorage
    }
    exit;
}

if ($method === 'POST') {
    // ---- Save ----
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw);
    if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }
    // Refuse to overwrite good saved data with an empty/near-empty payload
    // (e.g. a request that fired before the app finished loading its state).
    // A real save always has a students array; treat a missing/empty one
    // as suspicious if we already have saved data on disk.
    if (
        file_exists($dataFile) && filesize($dataFile) > 2 &&
        (!isset($decoded->students) || !is_array($decoded->students) || count($decoded->students) === 0) &&
        (($existing = json_decode(file_get_contents($dataFile))) && !empty($existing->students))
    ) {
        http_response_code(409);
        echo json_encode(['error' => 'Refusing to overwrite existing students with an empty save']);
        exit;
    }

    // Atomic-ish write with locking to avoid corrupted data on
    // overlapping requests.
    $fp = fopen($dataFile, 'c');
    if (!$fp) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not open data file']);
        exit;
    }
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, $raw);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    echo json_encode(['ok' => true, 'saved_at' => date('c')]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
