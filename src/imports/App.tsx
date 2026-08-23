import { useState, useEffect, useRef } from "react";
import type { Member, DisciplineRecord, MutualAidRecord, SpecialEquipment } from "./components/types";
import { WebLogin } from "./web/WebLogin";
import { WebLayout } from "./web/WebLayout";
import type { Admin } from "./components/LoginScreen";
import {
  hasApi, apiPing,
  apiGetMembers, apiSaveMembers,
  apiGetAdmins,  apiSaveAdmins,
  type ApiStatus,
} from "./utils/apiClient";

// ── Storage keys ──────────────────────────────────────────────────────────────
const MEMBER_KEY = "member-management-data";
const ADMIN_KEY  = "member-mgmt-admins";

// ── 샘플 초기 데이터 (API·localStorage 모두 비어있을 때) ──────────────────────
const INITIAL_MEMBERS: Member[] = [
  {
    id: "1", name: "김민준", vehicleNumber: "부산95아5094", grade: "두레", status: "활성",
    garage: "부산", phone: "010-1234-5678", joinDate: "2021-03-15", vehicleType: "1톤",
    specialEquipments: ["리프트", "무진동"], vehiclePhoto: "", roadAddress: "", mailingAddress: "",
    disciplineRecords: [{ id: "d1", date: "2024-03-10", content: "경고", disciplineDetail: "화물 취급 부주의로 인한 손상 사고", startDate: "2024-03-10", endDate: "2024-03-17" }],
    mutualAidRecords: [{ id: "a1", date: "2023-11-05", category: "장례", aidDetail: "부친상 조의금 지원", amount: 100000 }],
  },
  {
    id: "2", name: "이서연", vehicleNumber: "울산12나3456", grade: "일반", status: "활성",
    garage: "울산", phone: "010-9876-5432", joinDate: "2022-07-20", vehicleType: "1.2톤",
    specialEquipments: ["위험물", "유해"], vehiclePhoto: "", roadAddress: "", mailingAddress: "",
    disciplineRecords: [], mutualAidRecords: [],
  },
  {
    id: "3", name: "박도현", vehicleNumber: "경남34가7890", grade: "일반", status: "비활성",
    garage: "경남", phone: "010-5555-7777", joinDate: "2020-11-01", vehicleType: "1톤",
    specialEquipments: ["보세"], vehiclePhoto: "", roadAddress: "", mailingAddress: "",
    disciplineRecords: [{ id: "d2", date: "2023-08-20", content: "정직", disciplineDetail: "무단 결근 3회 누적", startDate: "2023-08-20", endDate: "2023-09-20" }],
    mutualAidRecords: [],
  },
  {
    id: "4", name: "최유진", vehicleNumber: "부산78바2211", grade: "두레", status: "활성",
    garage: "부산", phone: "010-3333-4444", joinDate: "2019-05-10", vehicleType: "1.2톤",
    specialEquipments: ["리프트", "위험물", "보세"], vehiclePhoto: "", roadAddress: "", mailingAddress: "",
    disciplineRecords: [],
    mutualAidRecords: [
      { id: "a2", date: "2024-01-15", category: "결혼", aidDetail: "결혼 축의금 지원", amount: 50000 },
      { id: "a3", date: "2024-06-02", category: "출산", aidDetail: "출산 축하금 지원", amount: 50000 },
    ],
  },
  {
    id: "5", name: "정하은", vehicleNumber: "대구56다1122", grade: "일반", status: "활성",
    garage: "대구", phone: "010-7777-2222", joinDate: "2024-02-14", vehicleType: "1톤",
    specialEquipments: [], vehiclePhoto: "", roadAddress: "", mailingAddress: "", disciplineRecords: [], mutualAidRecords: [],
  },
  {
    id: "6", name: "강지훈", vehicleNumber: "경북90사4433", grade: "일반", status: "비활성",
    garage: "경북", phone: "010-1111-8888", joinDate: "2023-09-01", vehicleType: "1.2톤",
    specialEquipments: ["유해"], vehiclePhoto: "", roadAddress: "", mailingAddress: "", disciplineRecords: [], mutualAidRecords: [],
  },
  {
    id: "7", name: "윤수아", vehicleNumber: "부산61마9900", grade: "두레", status: "활성",
    garage: "부산", phone: "010-6666-3333", joinDate: "2022-04-05", vehicleType: "1톤",
    specialEquipments: ["무진동"], vehiclePhoto: "", roadAddress: "", mailingAddress: "", disciplineRecords: [], mutualAidRecords: [],
  },
];

const DEFAULT_ADMINS: Admin[] = [
  { id: "9999", password: "9999", name: "최고관리자", isSuperAdmin: true },
];

// ── localStorage helpers ──────────────────────────────────────────────────────
function normalizeMember(m: Partial<Member> & { id: string }): Member {
  return {
    id: m.id, name: m.name ?? "", vehicleNumber: m.vehicleNumber ?? "",
    grade: m.grade ?? "일반", status: m.status ?? "활성", garage: m.garage ?? "서울",
    phone: m.phone ?? "", joinDate: m.joinDate ?? "", vehicleType: m.vehicleType ?? "1톤",
    specialEquipments: (m.specialEquipments ?? []) as SpecialEquipment[],
    vehiclePhoto: m.vehiclePhoto ?? "",
    roadAddress: m.roadAddress ?? "",
    mailingAddress: m.mailingAddress ?? "",
    disciplineRecords: (m.disciplineRecords ?? []) as DisciplineRecord[],
    mutualAidRecords: (m.mutualAidRecords ?? []) as MutualAidRecord[],
  };
}

function loadMembersLocal(): Member[] {
  try {
    const raw = localStorage.getItem(MEMBER_KEY) ?? sessionStorage.getItem(MEMBER_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p) && p.length) return p.map(normalizeMember);
    }
  } catch {}
  return INITIAL_MEMBERS;
}

function saveMembersLocal(list: Member[]) {
  const json = JSON.stringify(list);
  try { localStorage.setItem(MEMBER_KEY, json); } catch {}
  try { sessionStorage.setItem(MEMBER_KEY, json); } catch {}
}

function loadAdminsLocal(): Admin[] {
  try {
    const raw = localStorage.getItem(ADMIN_KEY) ?? sessionStorage.getItem(ADMIN_KEY);
    if (raw) { const p = JSON.parse(raw) as Admin[]; if (Array.isArray(p) && p.length) return p; }
  } catch {}
  return DEFAULT_ADMINS;
}

function saveAdminsLocal(list: Admin[]) {
  const json = JSON.stringify(list);
  try { localStorage.setItem(ADMIN_KEY, json); } catch {}
  try { sessionStorage.setItem(ADMIN_KEY, json); } catch {}
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [members,     setMembers]     = useState<Member[]>(loadMembersLocal);
  const [admins,      setAdmins]      = useState<Admin[]>(loadAdminsLocal);
  const [loggedInId,  setLoggedInId]  = useState("");
  const [apiStatus,   setApiStatus]   = useState<ApiStatus>(hasApi ? "checking" : "idle");
  const apiInitDone = useRef(false);

  const isLoggedIn = loggedInId !== "";

  // ── 앱 시작 시 가비아 API에서 데이터 로드 ──────────────────────────────────
  useEffect(() => {
    if (!hasApi || apiInitDone.current) return;
    apiInitDone.current = true;
    setApiStatus("checking");

    (async () => {
      const alive = await apiPing();
      if (!alive) { setApiStatus("offline"); return; }

      try {
        const [apiMembers, apiAdmins] = await Promise.all([
          apiGetMembers(),
          apiGetAdmins(),
        ]);

        if (Array.isArray(apiMembers) && apiMembers.length > 0) {
          const normalized = (apiMembers as Array<Partial<Member> & { id: string }>).map(normalizeMember);
          setMembers(normalized);
          saveMembersLocal(normalized);
        } else if (Array.isArray(apiMembers) && apiMembers.length === 0) {
          // DB가 비어있으면 샘플 데이터를 DB에 초기 저장
          await apiSaveMembers(INITIAL_MEMBERS);
        }

        if (Array.isArray(apiAdmins) && apiAdmins.length > 0) {
          setAdmins(apiAdmins as Admin[]);
          saveAdminsLocal(apiAdmins as Admin[]);
        } else if (Array.isArray(apiAdmins) && apiAdmins.length === 0) {
          await apiSaveAdmins(DEFAULT_ADMINS);
        }

        setApiStatus("connected");
      } catch {
        setApiStatus("offline");
      }
    })();
  }, []);

  // ── 데이터 저장 (localStorage + API 동시) ─────────────────────────────────
  function updateMembers(next: Member[] | ((p: Member[]) => Member[])) {
    setMembers((prev) => {
      const updated = typeof next === "function" ? next(prev) : next;
      saveMembersLocal(updated);
      if (hasApi && apiStatus === "connected") {
        apiSaveMembers(updated).catch(() => {});
      }
      return updated;
    });
  }

  function handleAdminSave(updated: Admin[]) {
    setAdmins(updated);
    saveAdminsLocal(updated);
    if (hasApi && apiStatus === "connected") {
      apiSaveAdmins(updated).catch(() => {});
    }
  }

  function handleImport(imported: Member[], mode: "replace" | "merge") {
    if (mode === "replace") updateMembers(imported);
    else updateMembers((p) => [...p, ...imported]);
  }

  if (!isLoggedIn) {
    return <WebLogin admins={admins} onLogin={setLoggedInId} />;
  }

  return (
    <WebLayout
      members={members}
      admins={admins}
      loggedInId={loggedInId}
      apiStatus={apiStatus}
      onLogout={() => setLoggedInId("")}
      onUpdateMembers={updateMembers}
      onImport={handleImport}
      onAdminSave={handleAdminSave}
    />
  );
}
