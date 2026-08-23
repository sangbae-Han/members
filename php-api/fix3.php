<?php
require_once __DIR__ . '/config.php';
header('Content-Type: text/html; charset=utf-8');

$pdo = getDB();

echo "<pre style='font-family:monospace;padding:2rem;background:#1a1a2e;color:#69f0ae;font-size:.9rem'>";

// 각 테이블 컬럼 확인
foreach (['jil_members','jil_discipline','jil_mutual_aid'] as $tbl) {
    $cols = $pdo->query("SHOW COLUMNS FROM $tbl")->fetchAll(PDO::FETCH_ASSOC);
    echo "=== $tbl ===\n";
    foreach ($cols as $c) echo "  {$c['Field']} ({$c['Type']})\n";
    echo "\n";
}

// jil_members 첫 행 실제 데이터
$row = $pdo->query("SELECT * FROM jil_members LIMIT 1")->fetch(PDO::FETCH_ASSOC);
echo "=== jil_members 첫 행 ===\n";
foreach ($row as $k=>$v) {
    $display = strlen((string)$v) > 50 ? substr($v,0,50).'...' : $v;
    echo "  $k = $display\n";
}
echo "</pre>";
