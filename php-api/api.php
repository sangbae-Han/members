<?php
/**
 * 전일련 회원관리 API
 * config.php의 getDB() 사용 (기존 연결 방식 유지)
 */
require_once __DIR__ . '/config.php';

function db(): PDO { return getDB(); }

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
        postalCode       VARCHAR(10)           DEFAULT '',
        roadAddress      TEXT                  DEFAULT '',
        addressDetail    TEXT                  DEFAULT '',
        mailingAddress   TEXT                  DEFAULT ''
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

    // 기존 테이블에 컬럼 없으면 추가
    foreach (['postalCode VARCHAR(10) DEFAULT "" AFTER vehiclePhoto',
              'addressDetail TEXT DEFAULT "" AFTER roadAddress'] as $col) {
        try { $pdo->exec("ALTER TABLE jil_members ADD COLUMN $col"); } catch(Exception $e){}
    }
}

function out($data): void {
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function ok($data = null): void { out(['ok' => true, 'data' => $data]); }

function fail(string $msg, int $code = 400): void {
    http_response_code($code);
    out(['ok' => false, 'error' => $msg]);
}

function body(): array {
    $d = json_decode(file_get_contents('php://input'), true);
    return is_array($d) ? $d : [];
}

function getMembers(): array {
    $pdo     = db();
    $members = $pdo->query("SELECT * FROM jil_members ORDER BY name")->fetchAll();
    if (empty($members)) return [];

    $discMap = $aidMap = [];
    foreach ($pdo->query("SELECT * FROM jil_discipline")->fetchAll() as $r)
        $discMap[$r['memberId']][] = $r;
    foreach ($pdo->query("SELECT * FROM jil_mutual_aid")->fetchAll() as $r)
        $aidMap[$r['memberId']][] = $r;

    $result = [];
    foreach ($members as $m) {
        $id = $m['id'];
        $eq = [];
        if (!empty($m['specialEquipments'])) {
            $decoded = json_decode($m['specialEquipments'], true);
            $eq = is_array($decoded) ? $decoded : array_filter(explode(',', $m['specialEquipments']));
        }
        $disc = array_map(fn($r) => [
            'id'=>$r['id'],'date'=>$r['date'],'content'=>$r['content'],
            'disciplineDetail'=>$r['disciplineDetail'],'startDate'=>$r['startDate'],'endDate'=>$r['endDate']
        ], $discMap[$id] ?? []);
        $aid = array_map(fn($r) => [
            'id'=>$r['id'],'date'=>$r['date'],'category'=>$r['category'],
            'aidDetail'=>$r['aidDetail'],'amount'=>(int)$r['amount']
        ], $aidMap[$id] ?? []);

        $result[] = [
            'id'=>$id,'name'=>$m['name'],'vehicleNumber'=>$m['vehicleNumber'],
            'grade'=>$m['grade'],'status'=>$m['status'],'garage'=>$m['garage'],
            'phone'=>$m['phone'],'joinDate'=>$m['joinDate'],'vehicleType'=>$m['vehicleType'],
            'specialEquipments'=>array_values($eq),'vehiclePhoto'=>$m['vehiclePhoto'],
            'postalCode'=>$m['postalCode']??'','roadAddress'=>$m['roadAddress'],
            'addressDetail'=>$m['addressDetail']??'','mailingAddress'=>$m['mailingAddress'],
            'disciplineRecords'=>$disc,'mutualAidRecords'=>$aid,
        ];
    }
    return $result;
}

function saveMembers(array $members): void {
    $pdo = db();
    $mSql = "INSERT INTO jil_members
        (id,name,vehicleNumber,grade,status,garage,phone,joinDate,vehicleType,
         specialEquipments,vehiclePhoto,postalCode,roadAddress,addressDetail,mailingAddress)
        VALUES (:id,:name,:vehicleNumber,:grade,:status,:garage,:phone,:joinDate,:vehicleType,
         :specialEquipments,:vehiclePhoto,:postalCode,:roadAddress,:addressDetail,:mailingAddress)
        ON DUPLICATE KEY UPDATE
          name=VALUES(name),vehicleNumber=VALUES(vehicleNumber),grade=VALUES(grade),
          status=VALUES(status),garage=VALUES(garage),phone=VALUES(phone),
          joinDate=VALUES(joinDate),vehicleType=VALUES(vehicleType),
          specialEquipments=VALUES(specialEquipments),vehiclePhoto=VALUES(vehiclePhoto),
          postalCode=VALUES(postalCode),roadAddress=VALUES(roadAddress),
          addressDetail=VALUES(addressDetail),mailingAddress=VALUES(mailingAddress)";
    $mStmt = $pdo->prepare($mSql);

    $dStmt = $pdo->prepare("INSERT INTO jil_discipline
        (id,memberId,date,content,disciplineDetail,startDate,endDate)
        VALUES (:id,:memberId,:date,:content,:disciplineDetail,:startDate,:endDate)
        ON DUPLICATE KEY UPDATE date=VALUES(date),content=VALUES(content),
          disciplineDetail=VALUES(disciplineDetail),startDate=VALUES(startDate),endDate=VALUES(endDate)");

    $aStmt = $pdo->prepare("INSERT INTO jil_mutual_aid
        (id,memberId,date,category,aidDetail,amount)
        VALUES (:id,:memberId,:date,:category,:aidDetail,:amount)
        ON DUPLICATE KEY UPDATE date=VALUES(date),category=VALUES(category),
          aidDetail=VALUES(aidDetail),amount=VALUES(amount)");

    $mIds = $dIds = $aIds = [];
    $pdo->beginTransaction();
    try {
        foreach ($members as $m) {
            $id = $m['id'] ?? ''; if (!$id) continue;
            $mIds[] = $id;
            $mStmt->execute([
                ':id'=>$id,':name'=>$m['name']??'',':vehicleNumber'=>$m['vehicleNumber']??'',
                ':grade'=>$m['grade']??'일반',':status'=>$m['status']??'활성',':garage'=>$m['garage']??'서울',
                ':phone'=>$m['phone']??'',':joinDate'=>$m['joinDate']??'',':vehicleType'=>$m['vehicleType']??'1톤',
                ':specialEquipments'=>json_encode($m['specialEquipments']??[],JSON_UNESCAPED_UNICODE),
                ':vehiclePhoto'=>$m['vehiclePhoto']??'',':postalCode'=>$m['postalCode']??'',
                ':roadAddress'=>$m['roadAddress']??'',':addressDetail'=>$m['addressDetail']??'',
                ':mailingAddress'=>$m['mailingAddress']??'',
            ]);
            foreach ($m['disciplineRecords']??[] as $r) {
                $rid=$r['id']??''; if(!$rid) continue; $dIds[]=$rid;
                $dStmt->execute([':id'=>$rid,':memberId'=>$id,':date'=>$r['date']??'',
                    ':content'=>$r['content']??'',':disciplineDetail'=>$r['disciplineDetail']??'',
                    ':startDate'=>$r['startDate']??'',':endDate'=>$r['endDate']??'']);
            }
            foreach ($m['mutualAidRecords']??[] as $r) {
                $rid=$r['id']??''; if(!$rid) continue; $aIds[]=$rid;
                $aStmt->execute([':id'=>$rid,':memberId'=>$id,':date'=>$r['date']??'',
                    ':category'=>$r['category']??'기타',':aidDetail'=>$r['aidDetail']??'',
                    ':amount'=>(int)($r['amount']??0)]);
            }
        }
        if ($mIds) {
            $ph = implode(',', array_fill(0, count($mIds), '?'));
            $pdo->prepare("DELETE FROM jil_members WHERE id NOT IN ($ph)")->execute($mIds);
        } else { $pdo->exec("DELETE FROM jil_members"); }
        if ($dIds) {
            $ph = implode(',', array_fill(0, count($dIds), '?'));
            $pdo->prepare("DELETE FROM jil_discipline WHERE id NOT IN ($ph)")->execute($dIds);
        } else { $pdo->exec("DELETE FROM jil_discipline"); }
        if ($aIds) {
            $ph = implode(',', array_fill(0, count($aIds), '?'));
            $pdo->prepare("DELETE FROM jil_mutual_aid WHERE id NOT IN ($ph)")->execute($aIds);
        } else { $pdo->exec("DELETE FROM jil_mutual_aid"); }
        $pdo->commit();
    } catch (Exception $e) { $pdo->rollBack(); throw $e; }
}

// ── 실행 ─────────────────────────────────────────────────────────────────────
try { initTables(); } catch (Exception $e) { fail('DB 오류: ' . $e->getMessage(), 500); }

$action = $_GET['action'] ?? '';
switch ($action) {

    case 'ping':
        $tables = db()->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        out(['ok'=>true,'version'=>'6.0','time'=>date('c'),'tables'=>$tables]);

    case 'get_regions':
        try { out(db()->query("SELECT * FROM regions ORDER BY id")->fetchAll()); }
        catch (Exception $e) { out([]); }

    case 'get_members':
        out(getMembers());

    case 'save_members':
        $data = body(); if (!is_array($data)) fail('배열 필요');
        saveMembers($data); ok();

    case 'get_admins':
        $rows = db()->query("SELECT id,password,name,isSuperAdmin FROM jil_admins")->fetchAll();
        out(array_map(fn($r)=>[
            'id'=>$r['id'],'password'=>$r['password'],'name'=>$r['name'],
            'isSuperAdmin'=>(bool)$r['isSuperAdmin']
        ], $rows));

    case 'save_admins':
        $admins = body(); if (!is_array($admins)) fail('배열 필요');
        $pdo = db();
        $stmt = $pdo->prepare("INSERT INTO jil_admins (id,password,name,isSuperAdmin)
            VALUES (:id,:password,:name,:isSuperAdmin)
            ON DUPLICATE KEY UPDATE password=VALUES(password),name=VALUES(name),isSuperAdmin=VALUES(isSuperAdmin)");
        $inIds = [];
        $pdo->beginTransaction();
        try {
            foreach ($admins as $a) {
                $stmt->execute([':id'=>$a['id'],':password'=>$a['password'],
                    ':name'=>$a['name'],':isSuperAdmin'=>$a['isSuperAdmin']?1:0]);
                $inIds[] = $a['id'];
            }
            if ($inIds) {
                $ph = implode(',', array_fill(0, count($inIds), '?'));
                $pdo->prepare("DELETE FROM jil_admins WHERE id NOT IN ($ph)")->execute($inIds);
            }
            $pdo->commit();
        } catch (Exception $e) { $pdo->rollBack(); throw $e; }
        ok();

    default:
        fail('Unknown action: ' . $action, 404);
}
