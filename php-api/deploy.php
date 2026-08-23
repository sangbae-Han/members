<?php
define('DEPLOY_PASS', 'jil2024');

$files = [
    'app.js'     => ['https://raw.githubusercontent.com/sangbae-Han/members/deploy/dist/assets/app.js',  __DIR__ . '/../assets/app.js'],
    'app.css'    => ['https://raw.githubusercontent.com/sangbae-Han/members/deploy/dist/assets/app.css', __DIR__ . '/../assets/app.css'],
    'api.php'    => ['https://raw.githubusercontent.com/sangbae-Han/members/deploy/php-api/api.php',     __DIR__ . '/api.php'],
    'config.php' => ['https://raw.githubusercontent.com/sangbae-Han/members/deploy/php-api/config.php',  __DIR__ . '/config.php'],
];

header('Content-Type: text/html; charset=utf-8');

$pass = $_GET['pass'] ?? '';
if ($pass !== DEPLOY_PASS) { ?>
<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>배포</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0f4f8}
.box{background:#fff;padding:2rem;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.12);text-align:center;min-width:320px}
h2{margin:0 0 1.5rem;color:#1e3a5f}input{width:100%;padding:.75rem;border:1px solid #ddd;border-radius:8px;font-size:1rem;box-sizing:border-box;margin-bottom:1rem}
button{width:100%;padding:.75rem;background:#1e3a5f;color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer}</style>
</head><body><div class="box">
<h2>전일련 배포 관리자</h2>
<form method="get"><input type="password" name="pass" placeholder="배포 비밀번호 입력">
<button type="submit">배포 실행</button></form>
</div></body></html>
<?php exit; }

// 단일 파일만 배포하는 경우
$only = $_GET['file'] ?? '';

echo '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>배포</title>
<style>body{font-family:sans-serif;padding:2rem;max-width:640px;margin:auto;background:#f0f4f8}
.box{background:#fff;border-radius:12px;padding:2rem;box-shadow:0 4px 24px rgba(0,0,0,.12)}
h2{color:#1e3a5f;margin-top:0}.ok{color:#16a34a}.err{color:#dc2626}.log{font-family:monospace;font-size:.9rem;line-height:2}
</style></head><body><div class="box"><h2>전일련 배포</h2><div class="log">';

function fetchUrl($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT      => 'Mozilla/5.0',
        ]);
        $content = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);
        if ($content === false || strlen($content) < 10) return [false, "curl 오류: $err"];
        return [$content, ''];
    }
    if (ini_get('allow_url_fopen')) {
        $ctx = stream_context_create(['http'=>['timeout'=>30,'header'=>"User-Agent: Mozilla/5.0\r\n"]]);
        $content = @file_get_contents($url, false, $ctx);
        if ($content === false || strlen($content) < 10) return [false, 'file_get_contents 실패'];
        return [$content, ''];
    }
    return [false, 'curl과 allow_url_fopen 모두 비활성화'];
}

$allOk = true;
$list = $only && isset($files[$only]) ? [$only => $files[$only]] : $files;

foreach ($list as $name => [$url, $dest]) {
    echo "▶ <b>$name</b> 다운로드 중... ";
    ob_flush(); flush();
    [$content, $errMsg] = fetchUrl($url);
    if ($content === false) {
        echo '<span class="err">실패: ' . htmlspecialchars($errMsg) . '</span><br>';
        $allOk = false;
        continue;
    }
    $dir = dirname($dest);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    if (file_put_contents($dest, $content) === false) {
        echo '<span class="err">저장 실패 (권한 오류)</span><br>';
        $allOk = false;
        continue;
    }
    $kb = round(strlen($content)/1024, 1);
    echo '<span class="ok">완료 (' . $kb . ' KB)</span><br>';
    ob_flush(); flush();
}

echo '<br>';
if ($allOk) {
    echo '<strong class="ok">✅ 배포 완료!</strong><br><br>';
    echo '<a href="../index.html" style="color:#1e3a5f;font-weight:bold">→ 앱으로 이동</a>';
} else {
    echo '<strong class="err">⚠️ 실패. PHP 정보를 확인합니다...</strong><br><br>';
    echo 'curl 사용 가능: ' . (function_exists('curl_init') ? '<span class="ok">예</span>' : '<span class="err">아니오</span>') . '<br>';
    echo 'allow_url_fopen: ' . (ini_get('allow_url_fopen') ? '<span class="ok">ON</span>' : '<span class="err">OFF</span>') . '<br>';
    echo 'PHP 버전: ' . PHP_VERSION . '<br>';
}
echo '</div></div></body></html>';
