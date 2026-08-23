import type { Member } from "@/types";

export interface ParsedQuery {
  text: string;
  garage: string[];
  grade: string[];
  status: string[];
  vehicleType: string[];
  specialEquipments: string[];
  tags: { label: string; color: string }[];
}

const GARAGE_MAP: Record<string, string> = {
  서울: "서울", 부산: "부산", 대구: "대구", 인천: "인천",
  광주: "광주", 대전: "대전", 울산: "울산", 세종: "세종",
  경기: "경기", 강원: "강원", 충북: "충북", 충남: "충남",
  전북: "전북", 전남: "전남", 경북: "경북", 경남: "경남", 제주: "제주",
};

const GRADE_MAP: Record<string, string> = {
  일반: "일반", 두레: "두레",
};

const STATUS_MAP: Record<string, string> = {
  활성: "활성", 비활성: "비활성", 휴면: "비활성", 탈퇴: "비활성",
};

const VEHICLE_MAP: Record<string, string> = {
  "1톤": "1톤", "1.2톤": "1.2톤", "일점이": "1.2톤", 소형: "1톤", 대형: "1.2톤",
};

const EQUIPMENT_MAP: Record<string, string> = {
  리프트: "리프트", 무진동: "무진동", 유해: "유해", 위험물: "위험물", 보세: "보세",
  위험: "위험물", 진동: "무진동",
};

const TAG_COLORS: Record<string, string> = {
  garage: "bg-blue-100 text-blue-700",
  grade: "bg-purple-100 text-purple-700",
  status: "bg-emerald-100 text-emerald-700",
  vehicleType: "bg-orange-100 text-orange-700",
  specialEquipment: "bg-red-100 text-red-600",
};

export function parseQuery(raw: string): ParsedQuery {
  const result: ParsedQuery = {
    text: "",
    garage: [],
    grade: [],
    status: [],
    vehicleType: [],
    specialEquipments: [],
    tags: [],
  };

  if (!raw.trim()) return result;

  let remaining = raw;

  for (const [key, value] of Object.entries(GARAGE_MAP)) {
    if (remaining.includes(key)) {
      if (!result.garage.includes(value)) {
        result.garage.push(value);
        result.tags.push({ label: `📍 ${value}`, color: TAG_COLORS.garage });
      }
      remaining = remaining.replace(key, "");
    }
  }

  for (const [key, value] of Object.entries(GRADE_MAP)) {
    if (remaining.includes(key)) {
      if (!result.grade.includes(value)) {
        result.grade.push(value);
        result.tags.push({ label: `👤 ${value}`, color: TAG_COLORS.grade });
      }
      remaining = remaining.replace(key, "");
    }
  }

  for (const [key, value] of Object.entries(STATUS_MAP)) {
    if (remaining.includes(key)) {
      if (!result.status.includes(value)) {
        result.status.push(value);
        result.tags.push({ label: `● ${value}`, color: TAG_COLORS.status });
      }
      remaining = remaining.replace(key, "");
    }
  }

  for (const [key, value] of Object.entries(VEHICLE_MAP)) {
    if (remaining.includes(key)) {
      if (!result.vehicleType.includes(value)) {
        result.vehicleType.push(value);
        result.tags.push({ label: `🚛 ${value}`, color: TAG_COLORS.vehicleType });
      }
      remaining = remaining.replace(key, "");
    }
  }

  for (const [key, value] of Object.entries(EQUIPMENT_MAP)) {
    if (remaining.includes(key)) {
      if (!result.specialEquipments.includes(value)) {
        result.specialEquipments.push(value);
        result.tags.push({ label: `🔧 ${value}`, color: TAG_COLORS.specialEquipment });
      }
      remaining = remaining.replace(key, "");
    }
  }

  result.text = remaining.replace(/\s+/g, " ").trim();

  return result;
}

export function filterByParsedQuery(members: Member[], q: ParsedQuery): Member[] {
  return members.filter((m) => {
    if (q.garage.length && !q.garage.includes(m.garage)) return false;
    if (q.grade.length && !q.grade.includes(m.grade)) return false;
    if (q.status.length && !q.status.includes(m.status)) return false;
    if (q.vehicleType.length && !q.vehicleType.includes(m.vehicleType)) return false;
    if (q.specialEquipments.length && !q.specialEquipments.every((eq) => m.specialEquipments.includes(eq as never))) return false;
    if (q.text) {
      const t = q.text.toLowerCase();
      const match =
        m.name.includes(t) ||
        m.vehicleNumber.includes(t) ||
        m.phone.includes(t);
      if (!match) return false;
    }
    return true;
  });
}

export const SUGGESTIONS = [
  "부산 두레",
  "울산 위험물",
  "리프트 활성",
  "1.2톤 경남",
  "비활성",
  "보세 두레",
  "제주 1톤",
];
