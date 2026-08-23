<?php
/**
 * 전일련 회원관리 API  (정규화 버전)
 * jil_members / jil_admins / jil_discipline / jil_mutual_aid 테이블 사용
 * 배포 경로: /wings_html/api/api.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// ── DB 연결 ───────────────────────────────────────────────────────────────────
define('DB_HOST', 'db.cargowing.gabia.io');
define('DB_PORT', 3306);
define('DB_USER', 'cargowing');
define('DB_PASS', 'cargodb13687413!');
define('DB_NAME', 'jeonillyeondb');

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host='.DB_HOST.';port='.DB_PORT.';dbname='.DB_NAME.';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}

// ── 테이블 생성 (없을 때만) ───────────────────────────────────────────────────
function initTables(): void {
    $pdo = db();
    $pdo->exec("CREATE TABLE IF NOT EXISTS jil_members (
        id               VARCHAR(50)  PRIMARY KEY,
        name             VARCHAR(50)  NOT NULL DEFAULT '',
        vehicleNumber    VARCHAR(30)  NOT NULL DEFAULT '',
        grade            VARCHAR(10)  NOT NULL DEFAULT '일반',
        status           VARCHAR(10)  NOT NULL DEFAULT '활성',
        garage           VARCHAR(10)  NOT NULL DEFAULT '서울',
        phone            VARCHAR(20)           DEFAULT '',
        joinDate         VARCHAR(20)           DEFAULT '',
        vehicleType      VARCHAR(10)  NOT NULL DEFAULT '1톤',
        specialEquipments TEXT                 DEFAULT '',
        vehiclePhoto     MEDIUMTEXT            DEFAULT '',
        roadAddress      TEXT                  DEFAULT '',
        mailingAddress   TEXT                  DEFAULT '',
        updatedAt        DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS jil_discipline (
        id               VARCHAR(50)  PRIMARY KEY,
        memberId         VARCHAR(50)  NOT NULL,
        date             VARCHAR(20)           DEFAULT '',
        content          VARCHAR(100)          DEFAULT '',
        disciplineDetail TEXT                  DEFAULT '',
        startDate        VARCHAR(20)           DEFAULT '',
        endDate          VARCHAR(20)           DEFAULT '',
        INDEX idx_member (memberId)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS jil_mutual_aid (
        id               VARCHAR(50)  PRIMARY KEY,
        memberId         VARCHAR(50)  NOT NULL,
        date             VARCHAR(20)           DEFAULT '',
        category         VARCHAR(20)           DEFAULT '기타',
        aidDetail        TEXT                  DEFAULT '',
        amount           INT                   DEFAULT 0,
        INDEX idx_member (memberId)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS jil_admins (
        id               VARCHAR(50)  PRIMARY KEY,
        password         VARCHAR(100) NOT NULL DEFAULT '',
        name             VARCHAR(50)           DEFAULT '',
        isSuperAdmin     TINYINT(1)            DEFAULT 0
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
}

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────
function body(): array {
    $raw = file_get_contents('php://input');
    $d   = json_decode($raw, true);
    return is_array($d) ? $d : [];
}

function out($data): void {
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function ok($data = null): void {
    out(['ok' => true, 'data' => $data]);
}

function fail(string $msg, int $code = 400): void {
    http_response_code($code);
    out(['ok' => false, 'error' => $msg]);
}

// ── 회원 전체 조회 (discipline + mutual_aid 포함) ──────────────────────────
function getMembers(): array {
    $pdo = db();

    $members = $pdo->query("SELECT * FROM jil_members ORDER BY name")->fetchAll();

    if (empty($members)) return [];

    // discipline 레코드
    $discAll = $pdo->query("SELECT * FROM jil_discipline")->fetchAll();
    $discMap = [];
    foreach ($discAll as $r) $discMap[$r['memberId']][] = $r;

    // mutual_aid 레코드
    $aidAll = $pdo->query("SELECT * FROM jil_mutual_aid")->fetchAll();
    $aidMap = [];
    foreach ($aidAll as $r) $aidMap[$r['memberId']][] = $r;

    $result = [];
    foreach ($members as $m) {
        $id = $m['id'];
        // specialEquipments: JSON 문자열 → 배열
        $eq = [];
        if (!empty($m['specialEquipments'])) {
            $decoded = json_decode($m['specialEquipments'], true);
            $eq = is_array($decoded) ? $decoded : array_filter(explode(',', $m['specialEquipments']));
        }

        $discRecords = [];
        foreach (($discMap[$id] ?? []) as $r) {
            $discRecords[] = [
                'id'               => $r['id'],
                'date'             => $r['date'],
                'content'          => $r['content'],
                'disciplineDetail' => $r['disciplineDetail'],
                'startDate'        => $r['startDate'],
                'endDate'          => $r['endDate'],
            ];
        }

        $aidRecords = [];
        foreach (($aidMap[$id] ?? []) as $r) {
            $aidRecords[] = [
                'id'        => $r['id'],
                'date'      => $r['date'],
                'category'  => $r['category'],
                'aidDetail' => $r['aidDetail'],
                'amount'    => (int)$r['amount'],
            ];
        }

        $result[] = [
            'id'                => $id,
            'name'              => $m['name'],
            'vehicleNumber'     => $m['vehicleNumber'],
            'grade'             => $m['grade'],
            'status'            => $m['status'],
            'garage'            => $m['garage'],
            'phone'             => $m['phone'],
            'joinDate'          => $m['joinDate'],
            'vehicleType'       => $m['vehicleType'],
            'specialEquipments' => array_values($eq),
            'vehiclePhoto'      => $m['vehiclePhoto'],
            'roadAddress'       => $m['roadAddress'],
            'mailingAddress'    => $m['mailingAddress'],
            'disciplineRecords' => $discRecords,
            'mutualAidRecords'  => $aidRecords,
        ];
    }
    return $result;
}

// ── 회원 전체 저장 (upsert + 삭제된 것 제거) ────────────────────────────────
function saveMembers(array $members): void {
    $pdo = db();

    $memberSql = "INSERT INTO jil_members
        (id,name,vehicleNumber,grade,status,garage,phone,joinDate,vehicleType,specialEquipments,vehiclePhoto,roadAddress,mailingAddress)
        VALUES (:id,:name,:vehicleNumber,:grade,:status,:garage,:phone,:joinDate,:vehicleType,:specialEquipments,:vehiclePhoto,:roadAddress,:mailingAddress)
        ON DUPLICATE KEY UPDATE
          name=VALUES(name), vehicleNumber=VALUES(vehicleNumber), grade=VALUES(grade),
          status=VALUES(status), garage=VALUES(garage), phone=VALUES(phone),
          joinDate=VALUES(joinDate), vehicleType=VALUES(vehicleType),
          specialEquipments=VALUES(specialEquipments), vehiclePhoto=VALUES(vehiclePhoto),
          roadAddress=VALUES(roadAddress), mailingAddress=VALUES(mailingAddress)";
    $mStmt = $pdo->prepare($memberSql);

    $discSql = "INSERT INTO jil_discipline (id,memberId,date,content,disciplineDetail,startDate,endDate)
        VALUES (:id,:memberId,:date,:content,:disciplineDetail,:startDate,:endDate)
        ON DUPLICATE KEY UPDATE
          date=VALUES(date), content=VALUES(content), disciplineDetail=VALUES(disciplineDetail),
          startDate=VALUES(startDate), endDate=VALUES(endDate)";
    $dStmt = $pdo->prepare($discSql);

    $aidSql = "INSERT INTO jil_mutual_aid (id,memberId,date,category,aidDetail,amount)
        VALUES (:id,:memberId,:date,:category,:aidDetail,:amount)
        ON DUPLICATE KEY UPDATE
          date=VALUES(date), category=VALUES(category),
          aidDetail=VALUES(aidDetail), amount=VALUES(amount)";
    $aStmt = $pdo->prepare($aidSql);

    $incomingIds   = [];
    $incomingDiscIds = [];
    $incomingAidIds  = [];

    $pdo->beginTransaction();
    try {
        foreach ($members as $m) {
            $id = $m['id'] ?? '';
            if (!$id) continue;
            $incomingIds[] = $id;

            $mStmt->execute([
                ':id'               => $id,
                ':name'             => $m['name']              ?? '',
                ':vehicleNumber'    => $m['vehicleNumber']     ?? '',
                ':grade'            => $m['grade']             ?? '일반',
                ':status'           => $m['status']            ?? '활성',
                ':garage'           => $m['garage']            ?? '서울',
                ':phone'            => $m['phone']             ?? '',
                ':joinDate'         => $m['joinDate']          ?? '',
                ':vehicleType'      => $m['vehicleType']       ?? '1톤',
                ':specialEquipments'=> json_encode($m['specialEquipments'] ?? [], JSON_UNESCAPED_UNICODE),
                ':vehiclePhoto'     => $m['vehiclePhoto']      ?? '',
                ':roadAddress'      => $m['roadAddress']       ?? '',
                ':mailingAddress'   => $m['mailingAddress']    ?? '',
            ]);

            foreach (($m['disciplineRecords'] ?? []) as $r) {
                $rid = $r['id'] ?? '';
                if (!$rid) continue;
                $incomingDiscIds[] = $rid;
                $dStmt->execute([
                    ':id'               => $rid,
                    ':memberId'         => $id,
                    ':date'             => $r['date']             ?? '',
                    ':content'          => $r['content']          ?? '',
                    ':disciplineDetail' => $r['disciplineDetail'] ?? '',
                    ':startDate'        => $r['startDate']        ?? '',
                    ':endDate'          => $r['endDate']          ?? '',
                ]);
            }

            foreach (($m['mutualAidRecords'] ?? []) as $r) {
                $rid = $r['id'] ?? '';
                if (!$rid) continue;
                $incomingAidIds[] = $rid;
                $aStmt->execute([
                    ':id'        => $rid,
                    ':memberId'  => $id,
                    ':date'      => $r['date']      ?? '',
                    ':category'  => $r['category']  ?? '기타',
                    ':aidDetail' => $r['aidDetail']  ?? '',
                    ':amount'    => (int)($r['amount'] ?? 0),
                ]);
            }
        }

        // 삭제된 회원/레코드 제거
        if (!empty($incomingIds)) {
            $ph = implode(',', array_fill(0, count($incomingIds), '?'));
            $pdo->prepare("DELETE FROM jil_members WHERE id NOT IN ($ph)")->execute($incomingIds);
        } else {
            $pdo->exec("DELETE FROM jil_members");
        }

        if (!empty($incomingDiscIds)) {
            $ph = implode(',', array_fill(0, count($incomingDiscIds), '?'));
            $pdo->prepare("DELETE FROM jil_discipline WHERE id NOT IN ($ph)")->execute($incomingDiscIds);
        } else {
            $pdo->exec("DELETE FROM jil_discipline");
        }

        if (!empty($incomingAidIds)) {
            $ph = implode(',', array_fill(0, count($incomingAidIds), '?'));
            $pdo->prepare("DELETE FROM jil_mutual_aid WHERE id NOT IN ($ph)")->execute($incomingAidIds);
        } else {
            $pdo->exec("DELETE FROM jil_mutual_aid");
        }

        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// ── 라우팅 ───────────────────────────────────────────────────────────────────
try {
    initTables();
} catch (Exception $e) {
    fail('DB 초기화 실패: ' . $e->getMessage(), 500);
}

$action = $_GET['action'] ?? '';

switch ($action) {

    case 'ping':
        $tables = db()->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        ok(['version' => '5.0', 'time' => date('c'), 'tables' => $tables]);

    case 'get_members':
        out(getMembers());

    case 'save_members':
        $data = body();
        if (!is_array($data)) fail('배열이어야 합니다');
        saveMembers($data);
        ok();

    case 'get_admins':
        $rows = db()->query("SELECT id, password, name, isSuperAdmin FROM jil_admins")->fetchAll();
        $result = array_map(fn($r) => [
            'id'          => $r['id'],
            'password'    => $r['password'],
            'name'        => $r['name'],
            'isSuperAdmin'=> (bool)$r['isSuperAdmin'],
        ], $rows);
        out($result);

    case 'save_admins':
        $admins = body();
        if (!is_array($admins)) fail('배열이어야 합니다');
        $pdo = db();
        $stmt = $pdo->prepare("INSERT INTO jil_admins (id,password,name,isSuperAdmin)
            VALUES (:id,:password,:name,:isSuperAdmin)
            ON DUPLICATE KEY UPDATE password=VALUES(password), name=VALUES(name), isSuperAdmin=VALUES(isSuperAdmin)");
        $inIds = [];
        $pdo->beginTransaction();
        try {
            foreach ($admins as $a) {
                $stmt->execute([
                    ':id'          => $a['id'],
                    ':password'    => $a['password'],
                    ':name'        => $a['name'],
                    ':isSuperAdmin'=> $a['isSuperAdmin'] ? 1 : 0,
                ]);
                $inIds[] = $a['id'];
            }
            if (!empty($inIds)) {
                $ph = implode(',', array_fill(0, count($inIds), '?'));
                $pdo->prepare("DELETE FROM jil_admins WHERE id NOT IN ($ph)")->execute($inIds);
            }
            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        ok();

    default:
        fail('알 수 없는 action: ' . $action, 404);
}
