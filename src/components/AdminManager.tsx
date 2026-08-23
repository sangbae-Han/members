import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, ShieldCheck, User, Check, X } from "lucide-react";
import type { Admin } from "@/store";

interface AdminManagerProps {
  admins: Admin[];
  currentAdminId: string;
  onBack: () => void;
  onSave: (admins: Admin[]) => void;
}

const inputClass =
  "w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

export function AdminManager({ admins, currentAdminId, onBack, onSave }: AdminManagerProps) {
  const [list, setList] = useState<Admin[]>(admins);
  const [adding, setAdding] = useState(false);
  const [newId, setNewId] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newName, setNewName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const isSuperAdmin = currentAdminId === "9999";

  const handleAdd = () => {
    setError("");
    if (!newId.trim() || !newPw.trim() || !newName.trim()) {
      setError("모든 항목을 입력해 주세요.");
      return;
    }
    if (list.some((a) => a.id === newId.trim())) {
      setError("이미 존재하는 ID입니다.");
      return;
    }
    const next = [
      ...list,
      { id: newId.trim(), password: newPw.trim(), name: newName.trim(), isSuperAdmin: false },
    ];
    setList(next);
    onSave(next);
    setAdding(false);
    setNewId(""); setNewPw(""); setNewName("");
  };

  const handleDelete = (id: string) => {
    if (id === "9999") return;
    if (!window.confirm(`관리자 ${id}를 삭제하시겠습니까?`)) return;
    const next = list.filter((a) => a.id !== id);
    setList(next);
    onSave(next);
  };

  const cancelAdd = () => {
    setAdding(false);
    setNewId(""); setNewPw(""); setNewName(""); setError("");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-primary px-5 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h2 className="text-white">관리자 관리</h2>
          {isSuperAdmin && !adding ? (
            <button
              onClick={() => setAdding(true)}
              className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center"
            >
              <Plus size={18} className="text-white" />
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-8">
        {adding && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
            <p className="text-blue-700 font-medium text-sm">신규 관리자 추가</p>
            <div>
              <label className="text-muted-foreground block mb-1" style={{ fontSize: "11px" }}>관리자 ID</label>
              <input
                className={inputClass}
                value={newId}
                onChange={(e) => { setNewId(e.target.value); setError(""); }}
                placeholder="숫자 또는 영문"
              />
            </div>
            <div>
              <label className="text-muted-foreground block mb-1" style={{ fontSize: "11px" }}>이름</label>
              <input
                className={inputClass}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="text-muted-foreground block mb-1" style={{ fontSize: "11px" }}>비밀번호</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className={`${inputClass} pr-10`}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="비밀번호"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1"
              >
                <Check size={14} /> 추가
              </button>
              <button
                onClick={cancelAdd}
                className="px-4 bg-white border border-border text-muted-foreground py-2.5 rounded-xl text-sm"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          {list.map((admin, i) => (
            <div
              key={admin.id}
              className={`flex items-center gap-3 px-4 py-4 ${i < list.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                admin.isSuperAdmin ? "bg-amber-100" : "bg-blue-50"
              }`}>
                {admin.isSuperAdmin
                  ? <ShieldCheck size={18} className="text-amber-600" />
                  : <User size={18} className="text-blue-500" />
                }
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-sm">{admin.name}</span>
                  {admin.isSuperAdmin && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">최고관리자</span>
                  )}
                  {admin.id === currentAdminId && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">나</span>
                  )}
                </div>
                <p className="text-muted-foreground" style={{ fontSize: "12px" }}>ID: {admin.id}</p>
              </div>
              {isSuperAdmin && !admin.isSuperAdmin && (
                <button
                  onClick={() => handleDelete(admin.id)}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {!isSuperAdmin && (
          <div className="bg-muted rounded-2xl px-4 py-3 text-center">
            <p className="text-muted-foreground text-xs">관리자 추가/삭제는 최고관리자(9999)만 가능합니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
