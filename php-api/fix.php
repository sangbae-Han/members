<?php
require_once __DIR__ . '/config.php';
header('Content-Type: text/html; charset=utf-8');

$pdo = getDB();
$log = [];

// jil_discipline 컬럼 확인 및 수정
$cols = $pdo->query("SHOW COLUMNS FROM jil_discipline")->fetchAll(PDO::FETCH_COLUMN);
$log[] = "jil_discipline 컬럼: " . implode(', ', $cols);

if (in_array('member_id', $cols) && !in_array('memberId', $cols)) {
    $pdo->exec("ALTER TABLE jil_discipline CHANGE member_id memberId VARCHAR(50) NOT NULL");
    $log[] = "✅ jil_discipline.member_id → memberId 변경 완료";
} elseif (in_array('memberId', $cols)) {
    $log[] = "✅ jil_discipline.memberId 이미 정상";
} else {
    $log[] = "⚠️ 예상 외 구조: " . implode(', ', $cols);
}

// jil_mutual_aid 컬럼 확인 및 수정
$cols2 = $pdo->query("SHOW COLUMNS FROM jil_mutual_aid")->fetchAll(PDO::FETCH_COLUMN);
$log[] = "jil_mutual_aid 컬럼: " . implode(', ', $cols2);

if (in_array('member_id', $cols2) && !in_array('memberId', $cols2)) {
    $pdo->exec("ALTER TABLE jil_mutual_aid CHANGE member_id memberId VARCHAR(50) NOT NULL");
    $log[] = "✅ jil_mutual_aid.member_id → memberId 변경 완료";
} elseif (in_array('memberId', $cols2)) {
    $log[] = "✅ jil_mutual_aid.memberId 이미 정상";
} else {
    $log[] = "⚠️ 예상 외 구조: " . implode(', ', $cols2);
}

// 테스트: get_members 첫 1행
try {
    $row = $pdo->query("SELECT id, memberId FROM jil_discipline LIMIT 1")->fetch();
    $log[] = "✅ 조회 테스트 성공: " . json_encode($row, JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    $log[] = "❌ 조회 테스트 실패: " . $e->getMessage();
}

echo "<pre style='font-family:monospace;padding:2rem;background:#1a1a2e;color:#69f0ae;font-size:1rem'>";
echo implode("\n", $log);
echo "\n\n완료! 이 페이지를 닫고 앱으로 이동하세요.";
echo "</pre>";
