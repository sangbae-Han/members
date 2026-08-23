<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

define('DB_HOST', 'db.cargowing.gabia.io');
define('DB_PORT', 3306);
define('DB_USER', 'cargowing');
define('DB_PASS', 'cargodb13687413!');
define('DB_NAME', 'jeonillyeondb');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}

function initDB(): void {
    $pdo = getDB();
    $pdo->exec("CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(50) PRIMARY KEY,
        memberNo VARCHAR(20),
        name VARCHAR(50) NOT NULL,
        phone VARCHAR(20),
        region VARCHAR(20),
        branch VARCHAR(50),
        carNo VARCHAR(30),
        joinDate VARCHAR(20),
        status VARCHAR(20) DEFAULT 'active',
        address TEXT,
        birthDate VARCHAR(20),
        notes TEXT,
        createdAt VARCHAR(20)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS funeral_records (
        id VARCHAR(50) PRIMARY KEY,
        memberId VARCHAR(50),
        memberName VARCHAR(50),
        type VARCHAR(10),
        deceasedName VARCHAR(50),
        relation VARCHAR(30),
        date VARCHAR(20),
        amount INT DEFAULT 0,
        notes TEXT,
        createdAt VARCHAR(20)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
}

function jsonResponse($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getBody(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

initDB();
