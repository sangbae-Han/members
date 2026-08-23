<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDB();

if ($method === 'GET') {
    $rows = $pdo->query("SELECT * FROM members ORDER BY createdAt DESC")->fetchAll();
    jsonResponse($rows);
}

if ($method === 'POST') {
    $d = getBody();
    $sql = "INSERT INTO members (id,memberNo,name,phone,region,branch,carNo,joinDate,status,address,birthDate,notes,createdAt)
            VALUES (:id,:memberNo,:name,:phone,:region,:branch,:carNo,:joinDate,:status,:address,:birthDate,:notes,:createdAt)
            ON DUPLICATE KEY UPDATE
            memberNo=VALUES(memberNo), name=VALUES(name), phone=VALUES(phone),
            region=VALUES(region), branch=VALUES(branch), carNo=VALUES(carNo),
            joinDate=VALUES(joinDate), status=VALUES(status), address=VALUES(address),
            birthDate=VALUES(birthDate), notes=VALUES(notes)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id'        => $d['id'],
        ':memberNo'  => $d['memberNo'] ?? '',
        ':name'      => $d['name'],
        ':phone'     => $d['phone'] ?? '',
        ':region'    => $d['region'] ?? '',
        ':branch'    => $d['branch'] ?? '',
        ':carNo'     => $d['carNo'] ?? '',
        ':joinDate'  => $d['joinDate'] ?? '',
        ':status'    => $d['status'] ?? 'active',
        ':address'   => $d['address'] ?? '',
        ':birthDate' => $d['birthDate'] ?? '',
        ':notes'     => $d['notes'] ?? '',
        ':createdAt' => $d['createdAt'] ?? date('Y-m-d'),
    ]);
    jsonResponse(['ok' => true]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (!$id) jsonResponse(['error' => 'id required'], 400);
    $pdo->prepare("DELETE FROM members WHERE id=?")->execute([$id]);
    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
