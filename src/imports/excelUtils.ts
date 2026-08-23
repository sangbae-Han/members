import * as XLSX from "xlsx";
import type { Member, SpecialEquipment, GarageRegion, MemberGrade, MemberStatus, VehicleType } from "./types";

// ── Export ────────────────────────────────────────────────────────────────────

function memberToRow(m: Member) {
  return {
    이름: m.name,
    차량번호: m.vehicleNumber,
    회원구분: m.grade,
    활동상태: m.status,
    차고지: m.garage,
    전화번호: m.phone,
    가입일: m.joinDate,
    차종: m.vehicleType,
    특장: m.specialEquipments.join(", "),
  };
}

export function exportMembersToExcel(members: Member[]) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: 회원목록
  const memberRows = members.map(memberToRow);
  const ws1 = XLSX.utils.json_to_sheet(memberRows);
  ws1["!cols"] = [
    { wch: 10 }, { wch: 16 }, { wch: 8 }, { wch: 8 },
    { wch: 8 }, { wch: 16 }, { wch: 12 }, { wch: 8 }, { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "회원목록");

  // Sheet 2: 징계내역
  const disciplineRows = members.flatMap((m) =>
    m.disciplineRecords.map((d) => ({
      이름: m.name,
      차량번호: m.vehicleNumber,
      일자: d.date,
      내역: d.content,
      징계내역: d.disciplineDetail,
      시작일: d.startDate,
      종료일: d.endDate,
    }))
  );
  const ws2 = XLSX.utils.json_to_sheet(
    disciplineRows.length ? disciplineRows : [{ 이름: "", 차량번호: "", 일자: "", 내역: "", 징계내역: "", 시작일: "", 종료일: "" }]
  );
  ws2["!cols"] = [{ wch: 10 }, { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, "징계내역");

  // Sheet 3: 상조현황
  const aidRows = members.flatMap((m) =>
    m.mutualAidRecords.map((a) => ({
      이름: m.name,
      차량번호: m.vehicleNumber,
      일자: a.date,
      상조내역: a.aidDetail,
      지원금액: a.amount,
    }))
  );
  const ws3 = XLSX.utils.json_to_sheet(
    aidRows.length ? aidRows : [{ 이름: "", 차량번호: "", 일자: "", 상조내역: "", 지원금액: "" }]
  );
  ws3["!cols"] = [{ wch: 10 }, { wch: 16 }, { wch: 12 }, { wch: 30 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws3, "상조현황");

  const filename = `회원목록_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ── Import ────────────────────────────────────────────────────────────────────

const VALID_GRADES: MemberGrade[] = ["일반", "두레"];
const VALID_STATUSES: MemberStatus[] = ["활성", "비활성"];
const VALID_VEHICLE_TYPES: VehicleType[] = ["1톤", "1.2톤"];
const VALID_GARAGES: GarageRegion[] = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];
const VALID_EQUIPMENTS: SpecialEquipment[] = ["리프트", "무진동", "유해", "위험물", "보세"];

export interface ImportResult {
  members: Member[];
  warnings: string[];
}

export function importMembersFromExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const warnings: string[] = [];

        // Parse 회원목록 sheet
        const ws = wb.Sheets["회원목록"];
        if (!ws) {
          reject(new Error("'회원목록' 시트를 찾을 수 없습니다."));
          return;
        }

        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (rows.length === 0) {
          reject(new Error("회원 데이터가 없습니다."));
          return;
        }

        const members: Member[] = rows.map((row, i) => {
          const rowNum = i + 2;
          const name = String(row["이름"] ?? "").trim();
          const vehicleNumber = String(row["차량번호"] ?? "").trim();
          const phone = String(row["전화번호"] ?? "").trim();

          if (!name) warnings.push(`${rowNum}행: 이름이 없습니다.`);
          if (!vehicleNumber) warnings.push(`${rowNum}행: 차량번호가 없습니다.`);

          const gradeRaw = String(row["회원구분"] ?? "").trim() as MemberGrade;
          const grade = VALID_GRADES.includes(gradeRaw) ? gradeRaw : "일반";
          if (gradeRaw && !VALID_GRADES.includes(gradeRaw))
            warnings.push(`${rowNum}행 (${name}): 회원구분 '${gradeRaw}' → '일반'으로 처리`);

          const statusRaw = String(row["활동상태"] ?? "").trim() as MemberStatus;
          const status = VALID_STATUSES.includes(statusRaw) ? statusRaw : "활성";
          if (statusRaw && !VALID_STATUSES.includes(statusRaw))
            warnings.push(`${rowNum}행 (${name}): 활동상태 '${statusRaw}' → '활성'으로 처리`);

          const garageRaw = String(row["차고지"] ?? "").trim() as GarageRegion;
          const garage = VALID_GARAGES.includes(garageRaw) ? garageRaw : "서울";

          const vehicleTypeRaw = String(row["차종"] ?? "").trim() as VehicleType;
          const vehicleType = VALID_VEHICLE_TYPES.includes(vehicleTypeRaw) ? vehicleTypeRaw : "1톤";

          const equipStr = String(row["특장"] ?? "").trim();
          const specialEquipments = equipStr
            ? equipStr.split(/[,，]/).map((s) => s.trim()).filter((s): s is SpecialEquipment => VALID_EQUIPMENTS.includes(s as SpecialEquipment))
            : [];

          const joinDate = String(row["가입일"] ?? "").trim();

          return {
            id: String(Date.now()) + String(i),
            name,
            vehicleNumber,
            grade,
            status,
            garage,
            phone,
            joinDate,
            vehicleType,
            specialEquipments,
            vehiclePhoto: "",
            disciplineRecords: [],
            mutualAidRecords: [],
          };
        });

        resolve({ members, warnings });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsArrayBuffer(file);
  });
}
