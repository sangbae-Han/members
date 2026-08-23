import { useState } from "react";
import { Plus, Trash2, ShieldCheck, User, Check, X, Eye, EyeOff } from "lucide-react";
import type { Admin } from "../store";

interface Props { admins: Admin[]; currentAdminId: string; onSave: (admins: Admin[]) => void; }

const inputClass = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

export function AdminPanel({ admins, currentAdminId, onSave }: Props) {
  const [list, setList] = useState<Admin[]>(admins);
  const [adding, setAdding] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = () => {
    setError("");
    if (!newId.trim() || !newName.trim() || !newPw.trim()) { setError("모든 항목을 입력해 주세요."); return; }
    if (list.some(a => a.id === newId.trim())) { setError("이미 존재하는 ID입니다."); return; }
    const next = [...list, { id: newId.trim(), name: newName.trim(), password: newPw.trim(), isSuperAdmin: false }];
    setList(next); onSave(next);
    setAdding(false); setNewId(""); setNewName(""); setNewPw("");
  };

  const handleDelete = (id: string) => {
    if (id === "9999") return;
    if (!confirm(`관리자 ${id}를 삭제하시겠습니까?`)) return;
    const next = list.filter(a => a.id !== id);
    setList(next); onSave(next);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">관리자 관리</h2>
          <p className="text-muted-foreground text-sm">ID 9999만 관리자를 추가/삭제할 수 있습니다.</p>
        </div>
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus size={15} /> 관리자 추가
        </button>
      </div>

      {adding && (
        <div className="bg-card border-2 border-primary/30 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground text-sm">신규 관리자 추가</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">관리자 ID</label>
              <input className={inputClass} value={newId} onChange={e => { setNewId(e.target.value); setError(""); }} placeholder="ID" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">이름</label>
              <input className={inputClass} value={newName} onChange={e => setNewName(e.target.value)} placeholder="홍길동" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">비밀번호</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} className={`${inputClass} pr-8`} value={newPw}
                  onChange={e => setNewPw(e.target.value)} placeholder="비밀번호" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
              <Check size={14} /> 추가
            </button>
            <button onClick={() => { setAdding(false); setError(""); setNewId(""); setNewName(""); setNewPw(""); }}
              className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted">
              <X size={14} /> 취소
            </button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs">구분</th>
              <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs">이름</th>
              <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs">ID</th>
              <th className="w-16 px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map(admin => (
              <tr key={admin.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${admin.isSuperAdmin ? "bg-amber-100" : "bg-blue-50"}`}>
                      {admin.isSuperAdmin ? <ShieldCheck size={14} className="text-amber-600" /> : <User size={14} className="text-blue-500" />}
                    </div>
                    {admin.isSuperAdmin
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">최고관리자</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">일반관리자</span>}
                  </div>
                </td>
                <td className="px-5 py-3.5 font-medium text-foreground">
                  {admin.name}
                  {admin.id === currentAdminId && <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">나</span>}
                </td>
                <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{admin.id}</td>
                <td className="px-5 py-3.5">
                  {!admin.isSuperAdmin && (
                    <button onClick={() => handleDelete(admin.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
