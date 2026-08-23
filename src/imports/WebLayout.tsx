import { useState, lazy, Suspense } from "react";
import { Users, ShieldCheck, LogOut, Menu, X, BarChart3, HeartHandshake, Wifi, WifiOff, Loader2, Database, FolderDown } from "lucide-react";
import logo from "@/imports/logo2.png";
import type { Member } from "../components/types";
import type { Admin } from "../components/LoginScreen";
import type { ApiStatus } from "../utils/apiClient";
import { hasApi } from "../utils/apiClient";
import { MemberTable } from "./MemberTable";
import { MemberModal } from "./MemberModal";
import { AdminPanel } from "./AdminPanel";
import { Dashboard } from "./Dashboard";
import { MutualAidManager } from "./MutualAidManager";
const GabiaDownload = lazy(() => import("./GabiaDownload").then(m => ({ default: m.GabiaDownload })));

interface Props {
  members: Member[];
  admins: Admin[];
  loggedInId: string;
  apiStatus: ApiStatus;
  onLogout: () => void;
  onUpdateMembers: (next: Member[] | ((p: Member[]) => Member[])) => void;
  onImport: (imported: Member[], mode: "replace" | "merge") => void;
  onAdminSave: (admins: Admin[]) => void;
}

type Page = "dashboard" | "members" | "mutualaid" | "admins" | "gabia";

const NAV_ITEMS: { page: Page; label: string; icon: React.ReactNode; superOnly?: boolean }[] = [
  { page: "dashboard", label: "대시보드",   icon: <BarChart3 size={18} /> },
  { page: "members",   label: "회원 관리",  icon: <Users size={18} /> },
  { page: "mutualaid", label: "상조 관리",  icon: <HeartHandshake size={18} /> },
  { page: "admins",    label: "관리자 관리", icon: <ShieldCheck size={18} />, superOnly: true },
  { page: "gabia",     label: "가비아 배포", icon: <FolderDown size={18} />, superOnly: true },
];

function ApiStatusBadge({ status }: { status: ApiStatus }) {
  if (!hasApi) return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
      <Database size={11} /> 로컬저장
    </div>
  );
  if (status === "checking") return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-500 text-xs">
      <Loader2 size={11} className="animate-spin" /> DB 연결중
    </div>
  );
  if (status === "connected") return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs">
      <Wifi size={11} /> 가비아 DB
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs">
      <WifiOff size={11} /> 오프라인
    </div>
  );
}

export function WebLayout({ members, admins, loggedInId, apiStatus, onLogout, onUpdateMembers, onImport, onAdminSave }: Props) {
  const [page, setPage] = useState<Page>("members");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalMember, setModalMember] = useState<Member | null | "new">(null);
  const [detailMember, setDetailMember] = useState<Member | null>(null);

  const isSuperAdmin = loggedInId === "9999";
  const currentAdmin = admins.find(a => a.id === loggedInId);

  function handleSave(saved: Member) {
    const exists = members.some(m => m.id === saved.id);
    if (exists) onUpdateMembers(p => p.map(m => m.id === saved.id ? saved : m));
    else onUpdateMembers(p => [saved, ...p]);
    setModalMember(null);
    if (detailMember?.id === saved.id) setDetailMember(saved);
  }

  function handleDelete(id: string) {
    onUpdateMembers(p => p.filter(m => m.id !== id));
    setDetailMember(null);
  }

  function handleBulkDelete(ids: string[]) {
    onUpdateMembers(p => p.filter(m => !ids.includes(m.id)));
  }

  function handleUpdate(updated: Member) {
    onUpdateMembers(p => p.map(m => m.id === updated.id ? updated : m));
    setDetailMember(updated);
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full" style={{ background: "var(--sidebar)" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <img src={logo} alt="전일련" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20 shrink-0" />
        <div>
          <p className="text-white font-bold text-sm leading-tight">전일련</p>
          <p className="text-blue-300 text-xs leading-tight">회원관리 시스템</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.filter(n => !n.superOnly || isSuperAdmin).map(item => (
          <button
            key={item.page}
            onClick={() => { setPage(item.page); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              page === item.page
                ? "text-foreground font-semibold"
                : "text-blue-200 hover:text-white hover:bg-white/10"
            }`}
            style={page === item.page ? { background: "var(--sidebar-primary)", color: "var(--sidebar-primary-foreground)" } : {}}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 mb-2">
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-accent-foreground">{currentAdmin?.name?.slice(0,1) ?? "A"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{currentAdmin?.name}</p>
            <p className="text-blue-300 text-xs">ID: {loggedInId}</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 text-sm transition-colors">
          <LogOut size={16} /> 로그아웃
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-56 shrink-0 flex-col border-r border-border">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-56 flex flex-col">
            <Sidebar />
          </div>
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-white">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-card border-b border-border px-6 py-3.5 flex items-center gap-4 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <Menu size={20} />
          </button>
          <h2 className="font-bold text-foreground text-base">
            {NAV_ITEMS.find(n => n.page === page)?.label}
          </h2>
          <div className="ml-auto flex items-center gap-3">
            <ApiStatusBadge status={apiStatus} />
            <span className="text-muted-foreground text-xs hidden sm:block">
              전일련 회원관리 시스템
            </span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">{currentAdmin?.name?.slice(0,1) ?? "A"}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {page === "dashboard" && (
            <Dashboard members={members} />
          )}
          {page === "members" && (
            <MemberTable
              members={members}
              onAdd={() => setModalMember("new")}
              onEdit={(m) => setModalMember(m)}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              onImport={onImport}
              onSelect={(m) => setDetailMember(m)}
              selectedMember={detailMember}
              onUpdate={handleUpdate}
              isSuperAdmin={isSuperAdmin}
            />
          )}
          {page === "mutualaid" && (
            <MutualAidManager members={members} />
          )}
          {page === "admins" && isSuperAdmin && (
            <AdminPanel admins={admins} currentAdminId={loggedInId} onSave={onAdminSave} />
          )}
          {page === "gabia" && isSuperAdmin && (
            <Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground text-sm">로딩 중...</div>}>
              <GabiaDownload />
            </Suspense>
          )}
        </main>
      </div>

      {/* Member add/edit modal */}
      {modalMember !== null && (
        <MemberModal
          member={modalMember === "new" ? null : modalMember}
          onClose={() => setModalMember(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
