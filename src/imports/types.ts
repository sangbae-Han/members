export type VehicleType = "1톤" | "1.2톤";
export type MemberGrade = "일반" | "두레";
export type MemberStatus = "활성" | "비활성";
export type GarageRegion =
  | "서울" | "부산" | "대구" | "인천" | "광주" | "대전" | "울산" | "세종"
  | "경기" | "강원" | "충북" | "충남" | "전북" | "전남" | "경북" | "경남" | "제주";
export type SpecialEquipment = "리프트" | "무진동" | "유해" | "위험물" | "보세";

export interface DisciplineRecord {
  id: string;
  date: string;
  content: string;
  disciplineDetail: string;
  startDate: string;
  endDate: string;
}

export type AidCategory = "장례" | "결혼" | "입학축하금" | "출산" | "생일" | "기타";

export interface MutualAidRecord {
  id: string;
  date: string;
  category: AidCategory;
  aidDetail: string;
  amount: number;
}

export interface Member {
  id: string;
  name: string;
  vehicleNumber: string;
  grade: MemberGrade;
  status: MemberStatus;
  garage: GarageRegion;
  phone: string;
  joinDate: string;
  vehicleType: VehicleType;
  specialEquipments: SpecialEquipment[];
  vehiclePhoto: string;
  roadAddress: string;
  mailingAddress: string;
  disciplineRecords: DisciplineRecord[];
  mutualAidRecords: MutualAidRecord[];
}
