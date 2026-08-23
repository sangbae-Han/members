<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDB();

if ($method === 'GET') {
    $rows = $pdo->query("SELECT * FROM funeral_records ORDER BY date DESC")->fetchAll();
    jsonResponse($rows);
}

if ($method === 'POST') {
    $d = getBody();
    $sql = "INSERT INTO funeral_records (id,memberId,memberName,type,deceasedName,relation,date,amount,notes,createdAt)
            VALUES (:id,:memberId,:memberName,:type,:deceasedName,:relation,:date,:amount,:notes,:createdAt)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id'           => $d['id'],
        ':memberId'     => $d['memberId'] ?? '',
        ':memberName'   => $d['memberName'] ?? '',
        ':type'         => $d['type'] ?? '장제',
        ':deceasedName' => $d['deceasedName'] ?? '',
        ':relation'     => $d['relation'] ?? '',
        ':date'         => $d['date'] ?? date('Y-m-d'),
        ':amount'       => (int)($d['amount'] ?? 0),
        ':notes'        => $d['notes'] ?? '',
        ':createdAt'    => $d['createdAt'] ?? date('Y-m-d'),
    ]);
    jsonResponse(['ok' => true]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (!$id) jsonResponse(['error' => 'id required'], 400);
    $pdo->prepare("DELETE FROM funeral_records WHERE id=?")->execute([$id]);
    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
