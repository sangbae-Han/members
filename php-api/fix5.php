<?php
require_once __DIR__ . '/config.php';
header('Content-Type: text/html; charset=utf-8');

$pdo = getDB();
echo "<pre style='font-family:monospace;padding:2rem;background:#1a1a2e;color:#69f0ae;font-size:.9rem'>";

// jil_admins 실제 컬럼 확인
$cols = $pdo->query("SHOW COLUMNS FROM jil_admins")->fetchAll(PDO::FETCH_ASSOC);
echo "=== jil_admins 컬럼 ===\n";
foreach ($cols as $c) echo "  {$c['Field']} ({$c['Type']})\n";

$colNames = array_column($cols, 'Field');

// is_super_admin → isSuperAdmin 변환
if (in_array('is_super_admin', $colNames) && !in_array('isSuperAdmin', $colNames)) {
    $pdo->exec("ALTER TABLE jil_admins CHANGE is_super_admin isSuperAdmin TINYINT(1) DEFAULT 0");
    echo "\n✅ is_super_admin → isSuperAdmin 변경 완료\n";
} elseif (in_array('isSuperAdmin', $colNames)) {
    echo "\n✅ isSuperAdmin 이미 정상\n";
} else {
    echo "\n⚠️ 예상 외 컬럼명: " . implode(', ', $colNames) . "\n";
}

// 테스트
try {
    $rows = $pdo->query("SELECT id, password, name, isSuperAdmin FROM jil_admins")->fetchAll();
    echo "✅ get_admins 테스트 성공: " . count($rows) . "명\n";
    foreach ($rows as $r) echo "  [{$r['id']}] {$r['name']} super={$r['isSuperAdmin']}\n";
} catch (Exception $e) {
    echo "❌ 오류: " . $e->getMessage() . "\n";
}

echo "\n완료! → <a href='../index.html' style='color:#4fc3f7'>앱으로 이동 후 Ctrl+Shift+R</a>";
echo "</pre>";
