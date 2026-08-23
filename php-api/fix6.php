<?php
require_once __DIR__ . '/config.php';
header('Content-Type: text/html; charset=utf-8');

$pdo = getDB();
echo "<pre style='font-family:monospace;padding:2rem;background:#1a1a2e;color:#69f0ae;font-size:.9rem'>";

// is_super → isSuperAdmin 변경
try {
    $pdo->exec("ALTER TABLE jil_admins CHANGE is_super isSuperAdmin TINYINT(1) DEFAULT 0");
    echo "✅ jil_admins.is_super → isSuperAdmin 변경 완료\n\n";
} catch (Exception $e) {
    echo "⚠️ ALTER 오류: " . $e->getMessage() . "\n\n";
}

// 확인
try {
    $rows = $pdo->query("SELECT id, password, name, isSuperAdmin FROM jil_admins")->fetchAll();
    echo "✅ get_admins 테스트 성공 (" . count($rows) . "명)\n";
    foreach ($rows as $r) echo "  [{$r['id']}] {$r['name']} super={$r['isSuperAdmin']}\n";
    if (count($rows) === 0) {
        // 기본 관리자 추가
        $pdo->exec("INSERT INTO jil_admins (id,password,name,isSuperAdmin) VALUES ('9999','9999','최고관리자',1)");
        echo "✅ 기본 관리자(9999) 추가 완료\n";
    }
} catch (Exception $e) {
    echo "❌ 오류: " . $e->getMessage() . "\n";
}

echo "\n완료! → <a href='../index.html' style='color:#4fc3f7'>앱으로 이동 후 Ctrl+Shift+R</a>";
echo "</pre>";
