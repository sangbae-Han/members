<?php
require_once __DIR__ . '/config.php';
header('Content-Type: text/html; charset=utf-8');

$newApi = <<<'PHPEOF'
<?php
require_once __DIR__ . '/config.php';
function db(): PDO { return getDB(); }

function initTables(): void {
    $pdo = db();
    $pdo->exec("CREATE TABLE IF NOT EXISTS jil_members (
        id              VARCHAR(50)   PRIMARY KEY,
        name            VARCHAR(50)   NOT NULL DEFAULT '',
        vehicle_number  VARCHAR(30)   NOT NULL DEFAULT '',
        grade           VARCHAR(10)   NOT NULL DEFAULT '일반',
        status          VARCHAR(10)   NOT NULL DEFAULT '활성',
        garage          VARCHAR(10)   NOT NULL DEFAULT '서울',
        phone           VARCHAR(20)            DEFAULT '',
        join_date       VARCHAR(20)            DEFAULT '',
        vehicle_type    VARCHAR(10)   NOT NULL DEFAULT '1톤',
        special_equips  VARCHAR(200)           DEFAULT '',
        road_address    VARCHAR(200)           DEFAULT '',
        address_detail  TEXT                   DEFAULT '',
        mailing_address VARCHAR(200)           DEFAULT '',
        vehicle_photo   MEDIUMTEXT             DEFAULT '',
        postal_code     VARCHAR(10)            DEFAULT ''
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS jil_discipline (
        id               VARCHAR(50) PRIMARY KEY,
        memberId         VARCHAR(50) NOT NULL,
        date             VARCHAR(20)          DEFAULT '',
        content          VARCHAR(200)         DEFAULT '',
        discipline_detail VARCHAR(500)        DEFAULT '',
        start_date       VARCHAR(20)          DEFAULT '',
        end_date         VARCHAR(20)          DEFAULT '',
        INDEX idx_member (memberId)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS jil_mutual_aid (
        id        VARCHAR(50) PRIMARY KEY,
        memberId  VARCHAR(50) NOT NULL,
        date      VARCHAR(20)        DEFAULT '',
        category  VARCHAR(20)        DEFAULT '기타',
        aid_detail VARCHAR(500)      DEFAULT '',
        amount    INT                DEFAULT 0,
        INDEX idx_member (memberId)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS jil_admins (
        id           VARCHAR(50) PRIMARY KEY,
        password     VARCHAR(100) NOT NULL DEFAULT '',
        name         VARCHAR(50)           DEFAULT '',
        isSuperAdmin TINYINT(1)            DEFAULT 0
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
}

function out($data): void { echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
function ok($data=null): void { out(['ok'=>true,'data'=>$data]); }
function fail(string $msg, int $code=400): void { http_response_code($code); out(['ok'=>false,'error'=>$msg]); }
function body(): array { $d=json_decode(file_get_contents('php://input'),true); return is_array($d)?$d:[]; }

function getMembers(): array {
    $pdo = db();
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
        $rawEq = $m['special_equips'] ?? '';
        $eq = [];
        if ($rawEq) {
            $decoded = json_decode($rawEq, true);
            $eq = is_array($decoded) ? $decoded : array_filter(array_map('trim', explode(',', $rawEq)));
        }
        $disc = array_map(fn($r) => [
            'id'               => $r['id'],
            'date'             => $r['date'],
            'content'          => $r['content'],
            'disciplineDetail' => $r['discipline_detail'] ?? '',
            'startDate'        => $r['start_date'] ?? '',
            'endDate'          => $r['end_date'] ?? '',
        ], $discMap[$id] ?? []);
        $aid = array_map(fn($r) => [
            'id'        => $r['id'],
            'date'      => $r['date'],
            'category'  => $r['category'],
            'aidDetail' => $r['aid_detail'] ?? '',
            'amount'    => (int)($r['amount'] ?? 0),
        ], $aidMap[$id] ?? []);

        $result[] = [
            'id'                => $id,
            'name'              => $m['name'] ?? '',
            'vehicleNumber'     => $m['vehicle_number'] ?? '',
            'grade'             => $m['grade'] ?? '일반',
            'status'            => $m['status'] ?? '활성',
            'garage'            => $m['garage'] ?? '서울',
            'phone'             => $m['phone'] ?? '',
            'joinDate'          => $m['join_date'] ?? '',
            'vehicleType'       => $m['vehicle_type'] ?? '1톤',
            'specialEquipments' => array_values($eq),
            'vehiclePhoto'      => $m['vehicle_photo'] ?? '',
            'postalCode'        => $m['postal_code'] ?? '',
            'roadAddress'       => $m['road_address'] ?? '',
            'addressDetail'     => $m['address_detail'] ?? '',
            'mailingAddress'    => $m['mailing_address'] ?? '',
            'disciplineRecords' => $disc,
            'mutualAidRecords'  => $aid,
        ];
    }
    return $result;
}

function saveMembers(array $members): void {
    $pdo = db();
    $mStmt = $pdo->prepare("INSERT INTO jil_members
        (id,name,vehicle_number,grade,status,garage,phone,join_date,vehicle_type,
         special_equips,vehicle_photo,postal_code,road_address,address_detail,mailing_address)
        VALUES (:id,:name,:vehicle_number,:grade,:status,:garage,:phone,:join_date,:vehicle_type,
         :special_equips,:vehicle_photo,:postal_code,:road_address,:address_detail,:mailing_address)
        ON DUPLICATE KEY UPDATE
          name=VALUES(name),vehicle_number=VALUES(vehicle_number),grade=VALUES(grade),
          status=VALUES(status),garage=VALUES(garage),phone=VALUES(phone),
          join_date=VALUES(join_date),vehicle_type=VALUES(vehicle_type),
          special_equips=VALUES(special_equips),vehicle_photo=VALUES(vehicle_photo),
          postal_code=VALUES(postal_code),road_address=VALUES(road_address),
          address_detail=VALUES(address_detail),mailing_address=VALUES(mailing_address)");

    $dStmt = $pdo->prepare("INSERT INTO jil_discipline
        (id,memberId,date,content,discipline_detail,start_date,end_date)
        VALUES (:id,:memberId,:date,:content,:discipline_detail,:start_date,:end_date)
        ON DUPLICATE KEY UPDATE date=VALUES(date),content=VALUES(content),
          discipline_detail=VALUES(discipline_detail),start_date=VALUES(start_date),end_date=VALUES(end_date)");

    $aStmt = $pdo->prepare("INSERT INTO jil_mutual_aid
        (id,memberId,date,category,aid_detail,amount)
        VALUES (:id,:memberId,:date,:category,:aid_detail,:amount)
        ON DUPLICATE KEY UPDATE date=VALUES(date),category=VALUES(category),
          aid_detail=VALUES(aid_detail),amount=VALUES(amount)");

    $mIds = $dIds = $aIds = [];
    $pdo->beginTransaction();
    try {
        foreach ($members as $m) {
            $id = $m['id'] ?? ''; if (!$id) continue;
            $mIds[] = $id;
            $mStmt->execute([
                ':id'=>$id,':name'=>$m['name']??'',
                ':vehicle_number'=>$m['vehicleNumber']??'',
                ':grade'=>$m['grade']??'일반',':status'=>$m['status']??'활성',
                ':garage'=>$m['garage']??'서울',':phone'=>$m['phone']??'',
                ':join_date'=>$m['joinDate']??'',':vehicle_type'=>$m['vehicleType']??'1톤',
                ':special_equips'=>json_encode($m['specialEquipments']??[],JSON_UNESCAPED_UNICODE),
                ':vehicle_photo'=>$m['vehiclePhoto']??'',
                ':postal_code'=>$m['postalCode']??'',
                ':road_address'=>$m['roadAddress']??'',
                ':address_detail'=>$m['addressDetail']??'',
                ':mailing_address'=>$m['mailingAddress']??'',
            ]);
            foreach ($m['disciplineRecords']??[] as $r) {
                $rid=$r['id']??''; if(!$rid) continue; $dIds[]=$rid;
                $dStmt->execute([':id'=>$rid,':memberId'=>$id,':date'=>$r['date']??'',
                    ':content'=>$r['content']??'',':discipline_detail'=>$r['disciplineDetail']??'',
                    ':start_date'=>$r['startDate']??'',':end_date'=>$r['endDate']??'']);
            }
            foreach ($m['mutualAidRecords']??[] as $r) {
                $rid=$r['id']??''; if(!$rid) continue; $aIds[]=$rid;
                $aStmt->execute([':id'=>$rid,':memberId'=>$id,':date'=>$r['date']??'',
                    ':category'=>$r['category']??'기타',':aid_detail'=>$r['aidDetail']??'',
                    ':amount'=>(int)($r['amount']??0)]);
            }
        }
        if ($mIds) {
            $ph=implode(',',array_fill(0,count($mIds),'?'));
            $pdo->prepare("DELETE FROM jil_members WHERE id NOT IN ($ph)")->execute($mIds);
        } else { $pdo->exec("DELETE FROM jil_members"); }
        if ($dIds) {
            $ph=implode(',',array_fill(0,count($dIds),'?'));
            $pdo->prepare("DELETE FROM jil_discipline WHERE id NOT IN ($ph)")->execute($dIds);
        } else { $pdo->exec("DELETE FROM jil_discipline"); }
        if ($aIds) {
            $ph=implode(',',array_fill(0,count($aIds),'?'));
            $pdo->prepare("DELETE FROM jil_mutual_aid WHERE id NOT IN ($ph)")->execute($aIds);
        } else { $pdo->exec("DELETE FROM jil_mutual_aid"); }
        $pdo->commit();
    } catch (Exception $e) { $pdo->rollBack(); throw $e; }
}

try { initTables(); } catch (Exception $e) { fail('DB 오류: '.$e->getMessage(),500); }

$action = $_GET['action'] ?? '';
switch ($action) {
    case 'ping':
        $tables = db()->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        out(['ok'=>true,'version'=>'8.0','time'=>date('c'),'tables'=>$tables]);

    case 'get_regions':
        try { out(db()->query("SELECT * FROM regions ORDER BY id")->fetchAll()); }
        catch (Exception $e) { out([]); }

    case 'get_members':
        out(getMembers());

    case 'save_members':
        $data=body(); if(!is_array($data)) fail('배열 필요');
        saveMembers($data); ok();

    case 'get_admins':
        $rows=db()->query("SELECT id,password,name,isSuperAdmin FROM jil_admins")->fetchAll();
        out(array_map(fn($r)=>['id'=>$r['id'],'password'=>$r['password'],'name'=>$r['name'],'isSuperAdmin'=>(bool)$r['isSuperAdmin']],$rows));

    case 'save_admins':
        $admins=body(); if(!is_array($admins)) fail('배열 필요');
        $pdo=db();
        $stmt=$pdo->prepare("INSERT INTO jil_admins (id,password,name,isSuperAdmin)
            VALUES (:id,:password,:name,:isSuperAdmin)
            ON DUPLICATE KEY UPDATE password=VALUES(password),name=VALUES(name),isSuperAdmin=VALUES(isSuperAdmin)");
        $inIds=[];
        $pdo->beginTransaction();
        try {
            foreach ($admins as $a) {
                $stmt->execute([':id'=>$a['id'],':password'=>$a['password'],':name'=>$a['name'],':isSuperAdmin'=>$a['isSuperAdmin']?1:0]);
                $inIds[]=$a['id'];
            }
            if ($inIds) {
                $ph=implode(',',array_fill(0,count($inIds),'?'));
                $pdo->prepare("DELETE FROM jil_admins WHERE id NOT IN ($ph)")->execute($inIds);
            }
            $pdo->commit();
        } catch (Exception $e) { $pdo->rollBack(); throw $e; }
        ok();

    default:
        fail('Unknown action: '.$action,404);
}
PHPEOF;

$pdo = getDB();

// api.php 교체
$dest = __DIR__ . '/api.php';
if (file_put_contents($dest, $newApi) === false) {
    die("<pre style='color:red'>❌ api.php 저장 실패</pre>");
}

echo "<pre style='font-family:monospace;padding:2rem;background:#1a1a2e;color:#69f0ae;font-size:.9rem'>";
echo "✅ api.php v8.0 설치 완료\n\n";

// 즉시 검증
$cnt = $pdo->query("SELECT COUNT(*) FROM jil_members")->fetchColumn();
echo "📊 현재 회원 수: {$cnt}명\n";

$row = $pdo->query("SELECT id, name, vehicle_number, join_date FROM jil_members ORDER BY name LIMIT 3")->fetchAll();
echo "첫 3명:\n";
foreach ($row as $r) {
    echo "  [{$r['id']}] {$r['name']} / {$r['vehicle_number']} / {$r['join_date']}\n";
}

echo "\n✅ get_members 테스트...\n";
$members = $pdo->query("SELECT * FROM jil_members LIMIT 1")->fetch();
echo "  name={$members['name']}, vehicle_number={$members['vehicle_number']}\n";
echo "  special_equips={$members['special_equips']}\n\n";

echo "완료! → <a href='../index.html' style='color:#4fc3f7'>앱으로 이동</a>\n";
echo "</pre>";
