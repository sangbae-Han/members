import { useRef, useState } from "react";
import { Plus, Search, Trash2, Download, Upload, Sparkles, X, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, Truck } from "lucide-react";
import type { Member } from "../types";
import { exportMembersToExcel, importMembersFromExcel } from "../utils/excelUtils";
import { parseQuery, filterByParsedQuery, SUGGESTIONS } from "../utils/smartSearch";
import { MemberDetailPanel } from "./MemberDetailPanel";

interface Props {
  members: Member[];
  onAdd: () => void;
  onEdit: (m: Member) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onImport: (imported: Member[], mode: "replace" | "merge") => void;
  onSelect: (m: Member | null) => void;
  selectedMember: Member | null;
  onUpdate: (m: Member) => void;
  isSuperAdmin?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  활성: "bg-emerald-100 text-emerald-700",
  비활성: "bg-red-100 text-red-600",
};
const GRADE_COLORS: Record<string, string> = {
  일반: "bg-slate-100 text-slate-600",
  두레: "bg-blue-100 text-blue-700",
};
const VEHICLE_COLORS: Record<string, string> = {
  "1톤": "bg-violet-100 text-violet-700",
  "1.2톤": "bg-orange-100 text-orange-700",
};

function ImportModal({ count, warnings, onReplace, onMerge, onCancel }: { count: number; warnings: string[]; onReplace: () => void; onMerge: () => void; onCancel: () => void; }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 size={20} className="text-emerald-500" />
          <h3 className="font-semibold text-foreground">엑셀 가져오기</h3>
        </div>
        <p className="text-foreground text-sm mb-3"><span className="font-bold text-primary">{count}명</span>의 회원 데이터를 읽었습니다.</p>
        {warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle size={13} className="text-amber-600" />
              <span className="text-amber-700 font-medium text-xs">주의 {warnings.length}건</span>
            </div>
            {warnings.map((w, i) => <p key={i} className="text-amber-600 text-xs">{w}</p>)}
          </div>
        )}
        <p className="text-muted-foreground text-xs mb-4">적용 방식을 선택해 주세요.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 border border-border text-foreground py-2.5 rounded-lg text-sm hover:bg-muted">취소</button>
          <button onClick={onMerge} className="flex-1 bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-600">추가</button>
          <button onClick={onReplace} className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">교체</button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 15;

export function MemberTable({ members, onAdd, onEdit, onDelete, onBulkDelete, onImport, onSelect, selectedMember, onUpdate, isSuperAdmin }: Props) {
  const [q, setQ] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState("전체");
  const [filterGrade, setFilterGrade] = useState("전체");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [importState, setImportState] = useState<{ members: Member[]; warnings: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parsed = aiMode ? parseQuery(q) : { text: q, garage: [], grade: [], status: [], vehicleType: [], specialEquipments: [], tags: [] };

  const filtered = (() => {
    let list = aiMode ? filterByParsedQuery(members, parsed) : members.filter(m => {
      const t = q.trim();
      return !t || m.name.includes(t) || m.vehicleNumber.includes(t) || m.phone.includes(t) || m.garage.includes(t);
    });
    if (filterStatus !== "전체") list = list.filter(m => m.status === filterStatus);
    if (filterGrade !== "전체") list = list.filter(m => m.grade === filterGrade);
    return list;
  })();

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const allSelected = paginated.length > 0 && paginated.every(m => selectedIds.has(m.id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds(prev => { const n = new Set(prev); paginated.forEach(m => n.delete(m.id)); return n; });
    else setSelectedIds(prev => { const n = new Set(prev); paginated.forEach(m => n.add(m.id)); return n; });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    setImporting(true);
    try { setImportState(await importMembersFromExcel(file)); } catch {}
    setImporting(false);
  };

  const confirmImport = (mode: "replace" | "merge") => {
    if (importState) {
      onImport(importState.members, mode);
      setImportState(null);
    }
  };

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Toolbar */}
        <div className="bg-card rounded-xl border border-border p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1); setShowSuggestions(false); }}
              onFocus={() => setShowSuggestions(aiMode && !q)}
              placeholder={aiMode ? '예: "부산 두레 리프트"' : "이름, 차량번호, 전화번호, 차고지 검색..."}
              className="w-full bg-muted border border-border rounded-lg pl-9 pr-10 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {q && <button onClick={() => { setQ(""); setShowSuggestions(false); }}><X size={13} className="text-muted-foreground" /></button>}
              <button
                onClick={() => { setAiMode(v => !v); setQ(""); }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${aiMode ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                <Sparkles size={10} /> AI
              </button>
            </div>
            {aiMode && showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                <p className="text-muted-foreground text-xs px-3 py-2 border-b border-border">추천 검색어</p>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => { setQ(s); setShowSuggestions(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2">
                    <Sparkles size={11} className="text-primary" />{s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="전체">전체 상태</option>
            <option value="활성">활성</option>
            <option value="비활성">비활성</option>
          </select>
          <select value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setPage(1); }}
            className="bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="전체">전체 구분</option>
            <option value="일반">일반</option>
            <option value="두레">두레</option>
          </select>

          <div className="flex items-center gap-2 ml-auto">
            {selectedIds.size > 0 && (
              <button onClick={() => { if (confirm(`선택한 ${selectedIds.size}명을 삭제하시겠습니까?`)) { onBulkDelete(Array.from(selectedIds)); setSelectedIds(new Set()); } }}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
                <Trash2 size={14} /> {selectedIds.size}명 삭제
              </button>
            )}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
            <button onClick={() => exportMembersToExcel(members)}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted">
              <Download size={14} /> 내보내기
            </button>
            {isSuperAdmin && (
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted">
                <Upload size={14} /> {importing ? "처리중..." : "가져오기"}
              </button>
            )}
            <button onClick={onAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
              <Plus size={14} /> 회원 등록
            </button>
          </div>
        </div>

        {aiMode && parsed.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {parsed.tags.map((t, i) => <span key={i} className={`text-xs px-2 py-1 rounded-full ${t.color}`}>{t.label}</span>)}
          </div>
        )}

        {/* Table */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
                  </th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">이름</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">차량번호</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">전화번호</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">차고지</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">구분</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">상태</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">차종</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">특장</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">가입일</th>
                  <th className="w-16 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-16 text-muted-foreground">
                    <Truck size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">회원이 없습니다</p>
                  </td></tr>
                ) : paginated.map(m => (
                  <tr key={m.id} onClick={() => onSelect(m)}
                    className={`hover:bg-muted/50 cursor-pointer transition-colors ${selectedMember?.id === m.id ? "bg-primary/5" : ""}`}>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(m.id)}
                        onChange={() => setSelectedIds(prev => { const n = new Set(prev); n.has(m.id) ? n.delete(m.id) : n.add(m.id); return n; })}
                        className="rounded" />
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{m.name}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap">{m.vehicleNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{m.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{m.garage}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${GRADE_COLORS[m.grade]}`}>{m.grade}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[m.status]}`}>{m.status}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${VEHICLE_COLORS[m.vehicleType]}`}>{m.vehicleType}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {m.specialEquipments.slice(0, 2).map(eq => (
                          <span key={eq} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{eq}</span>
                        ))}
                        {m.specialEquipments.length > 2 && <span className="text-xs text-muted-foreground">+{m.specialEquipments.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{m.joinDate}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => onEdit(m)} className="text-xs text-primary hover:underline px-2 py-1 rounded hover:bg-primary/10">수정</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">전체 {filtered.length}명 · {currentPage}/{totalPages} 페이지</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                const p = start + i;
                return p <= totalPages ? (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs ${p === currentPage ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground"}`}>
                    {p}
                  </button>
                ) : null;
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedMember && (
        <div className="w-80 shrink-0">
          <MemberDetailPanel
            member={selectedMember}
            onEdit={onEdit}
            onDelete={onDelete}
            onClose={() => onSelect(null)}
            onUpdate={onUpdate}
          />
        </div>
      )}

      {importState && (
        <ImportModal count={importState.members.length} warnings={importState.warnings}
          onReplace={() => confirmImport("replace")} onMerge={() => confirmImport("merge")}
          onCancel={() => setImportState(null)} />
      )}
    </div>
  );
}
