<?php
define('SECRET', 'jil_upload_2024');
if (($_GET['secret'] ?? '') !== SECRET) { http_response_code(403); exit('Forbidden'); }

$target = $_GET['target'] ?? '';
$allowed = [
    'app.js'     => __DIR__ . '/../assets/app.js',
    'app.css'    => __DIR__ . '/../assets/app.css',
    'api.php'    => __DIR__ . '/api.php',
    'config.php' => __DIR__ . '/config.php',
];

if (!isset($allowed[$target])) { http_response_code(400); exit('Unknown target'); }

$content = file_get_contents('php://input');
if (strlen($content) < 10) { http_response_code(400); exit('Empty content'); }

file_put_contents($allowed[$target], $content);
echo json_encode(['ok' => true, 'file' => $target, 'bytes' => strlen($content)]);
