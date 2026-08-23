<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$d = getBody();
$id = $d['id'] ?? '';
$pw = $d['password'] ?? '';

if ($id === 'admin' && $pw === 'jilreon2024') {
    jsonResponse(['ok' => true]);
} else {
    jsonResponse(['ok' => false, 'message' => '아이디 또는 비밀번호가 올바르지 않습니다.'], 401);
}
