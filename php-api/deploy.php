<?php
// 자동 배포 스크립트 - 브라우저에서 실행하면 최신 파일을 GitHub에서 자동 다운로드
define('DEPLOY_PASS', 'jil2024');

$files = [
    'https://raw.githubusercontent.com/sangbae-Han/members/deploy/dist/assets/app.js'  => __DIR__ . '/../assets/app.js',
    'https://raw.githubusercontent.com/sangbae-Han/members/deploy/dist/assets/app.css' => __DIR__ . '/../assets/app.css',
    'https://raw.githubusercontent.com/sangbae-Han/members/deploy/deploy/php-api/api.php'    => __DIR__ . '/api.php',
    'https://raw.githubusercontent.com/sangbae-Han/members/deploy/php-api/config.php'  => __DIR__ . '/config.php',
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
<form method="get">
<input type="password" name="pass" placeholder="배포 비밀번호 입력">
<button type="submit">배포 실행</button>
</form>
</div></body></html>
<?php exit; }

echo '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>배포 중...</title>
<style>body{font-family:sans-serif;padding:2rem;max-width:600px;margin:auto;background:#f0f4f8}
.box{background:#fff;border-radius:12px;padding:2rem;box-shadow:0 4px 24px rgba(0,0,0,.12)}
h2{color:#1e3a5f;margin-top:0}.ok{color:#16a34a}.err{color:#dc2626}.log{font-family:monospace;font-size:.9rem;line-height:1.8}
</style></head><body><div class="box"><h2>전일련 배포</h2><div class="log">';

$allOk = true;
foreach ($files as $url => $dest) {
    $name = basename($dest);
    echo "▶ $name 다운로드 중... ";
    flush();

    $ctx = stream_context_create(['http' => [
        'timeout' => 30,
        'header'  => "User-Agent: Mozilla/5.0\r\n",
    ]]);
    $content = @file_get_contents($url, false, $ctx);

    if ($content === false || strlen($content) < 100) {
        echo '<span class="err">실패 (' . strlen($content ?: '') . ' bytes)</span><br>';
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

    $kb = round(strlen($content) / 1024, 1);
    echo '<span class="ok">완료 (' . $kb . ' KB)</span><br>';
    flush();
}

if ($allOk) {
    echo '<br><strong class="ok">✅ 배포 완료!</strong><br><br>';
    echo '<a href="../index.html" style="color:#1e3a5f">→ 앱으로 이동</a>';
} else {
    echo '<br><strong class="err">⚠️ 일부 파일 배포 실패. 위 오류를 확인하세요.</strong>';
}

echo '</div></div></body></html>';
