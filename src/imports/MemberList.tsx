import { useRef, useState } from "react";
import { Search, Plus, ChevronRight, Truck, Download, Upload, X, AlertCircle, CheckCircle2, Sparkles, Trash2, CheckSquare, Square, LogOut, ShieldCheck } from "lucide-react";
import logo from "@/imports/logo2.png";
import type { Member } from "./types";
import { exportMembersToExcel, importMembersFromExcel } from "./excelUtils";
import { parseQuery, filterByParsedQuery, SUGGESTIONS, type ParsedQuery } from "./smartSearch";

interface MemberListProps {
  members: Member[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (member: Member) => void;
  onAdd: () => void;
  filterGrade: string;
  onFilterChange: (grade: string) => void;
  onImport: (members: Member[], mode: "replace" | "merge") => void;
  onBulkDelete: (ids: string[]) => void;
  currentAdminId: string;
  onLogout: () => void;
  onAdminManager: () => void;
}

const gradeColors: Record<string, string> = {
  일반: "bg-slate-100 text-slate-600",
  두레: "bg-blue-100 text-blue-700",
};
const statusColors: Record<string, string> = {
  활성: "bg-emerald-100 text-emerald-700",
  비활성: "bg-red-100 text-red-600",
};
const vehicleTypeColors: Record<string, string> = {
  "1톤": "bg-emerald-100 text-emerald-700",
  "1.2톤": "bg-purple-100 text-purple-700",
};

// ── Import modal ──────────────────────────────────────────────────────────────
interface ImportModalProps {
  count: number;
  warnings: string[];
  onReplace: () => void;
  onMerge: () => void;
  onCancel: () => void;
}

function ImportModal({ count, warnings, onReplace, onMerge, onCancel }: ImportModalProps) {
  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full bg-card rounded-t-3xl px-5 pt-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <span className="font-medium text-foreground">가져오기 완료</span>
          </div>
          <button onClick={onCancel}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <p className="text-foreground text-sm mb-3">
          <span className="font-semibold text-primary">{count}명</span>의 회원 데이터를 읽었습니다.
        </p>
        {warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 max-h-32 overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertCircle size={13} className="text-amber-600" />
              <span className="text-amber-700 font-medium" style={{ fontSize: "12px" }}>주의 {warnings.length}건</span>
            </div>
            {warnings.map((w, i) => (
              <p key={i} className="text-amber-600" style={{ fontSize: "11px" }}>{w}</p>
            ))}
          </div>
        )}
        <p className="text-muted-foreground text-xs mb-4">불러온 데이터를 어떻게 적용하시겠습니까?</p>
        <div className="space-y-2">
          <button onClick={onReplace} className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-medium">기존 목록 교체</button>
          <button onClick={onMerge} className="w-full bg-emerald-500 text-white py-3.5 rounded-xl text-sm font-medium">기존 목록에 추가</button>
          <button onClick={onCancel} className="w-full bg-muted text-muted-foreground py-3.5 rounded-xl text-sm">취소</button>
        </div>
      </div>
    </div>
  );
}

// ── Bulk delete confirm modal ─────────────────────────────────────────────────
interface BulkDeleteModalProps {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function BulkDeleteModal({ count, onConfirm, onCancel }: BulkDeleteModalProps) {
  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full bg-card rounded-t-3xl px-5 pt-5 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div>
            <p className="font-medium text-foreground">일괄 삭제</p>
            <p className="text-muted-foreground text-xs mt-0.5">선택한 {count}명을 삭제합니다</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
          <p className="text-red-600 text-sm">삭제된 데이터는 복구할 수 없습니다.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 bg-muted text-muted-foreground py-3.5 rounded-xl text-sm">취소</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 text-white py-3.5 rounded-xl text-sm font-medium">
            {count}명 삭제
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function MemberList({
  members, searchQuery, onSearchChange, onSelect, onAdd,
  filterGrade, onFilterChange, onImport, onBulkDelete,
  currentAdminId, onLogout, onAdminManager,
}: MemberListProps) {
  const importRef = useRef<HTMLInputElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [importState, setImportState] = useState<{ members: Member[]; warnings: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aiMode, setAiMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const filters = ["전체", "일반", "두레", "활성", "비활성"];

  const parsed: ParsedQuery = aiMode
    ? parseQuery(searchQuery)
    : { text: searchQuery, garage: [], grade: [], status: [], vehicleType: [], specialEquipments: [], tags: [] };

  const filtered = aiMode
    ? filterByParsedQuery(
        filterGrade === "전체" ? members : members.filter((m) => m.grade === filterGrade || m.status === filterGrade),
        parsed
      )
    : members.filter((m) => {
        const q = searchQuery.trim();
        const matchSearch = !q || m.name.includes(q) || m.vehicleNumber.includes(q) || m.phone.includes(q) || m.garage.includes(q);
        const matchFilter = filterGrade === "전체" || m.grade === filterGrade || m.status === filterGrade;
        return matchSearch && matchFilter;
      });

  const allSelected = filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((m) => m.id)));
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    onBulkDelete(Array.from(selectedIds));
    setShowDeleteModal(false);
    exitSelectMode();
  };

  const handleExport = () => { exportMembersToExcel(members); setShowMenu(false); };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    setShowMenu(false);
    setError(null);
    try {
      const result = await importMembersFromExcel(file);
      setImportState(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "파일을 읽을 수 없습니다.");
    } finally {
      setImporting(false);
    }
  };

  const handleImportConfirm = (mode: "replace" | "merge") => {
    if (!importState) return;
    onImport(importState.members, mode);
    setImportState(null);
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="bg-primary px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-1">
            <img src={logo} alt="전일련 로고" className="w-18 h-18 rounded-full object-cover ring-2 ring-white/30 shrink-0" style={{ width: "72px", height: "72px" }} />
            <div>
              <p className="text-blue-200 leading-tight" style={{ fontSize: "10px" }}>전일련 회원관리 시스템</p>
              <h1 className="text-white leading-tight" style={{ fontSize: "17px" }}>회원 관리</h1>
            </div>
          </div>
          <div className="flex gap-2">
            {!selectMode ? (
              <>
                {/* 선택 모드 진입 */}
                <button
                  onClick={() => setSelectMode(true)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <CheckSquare size={18} className="text-white" />
                </button>
                {/* 통합 메뉴 */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu((v) => !v)}
                    className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                  >
                    <Download size={18} className="text-white" />
                  </button>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                      <div className="absolute right-0 top-12 z-40 bg-card rounded-2xl shadow-xl border border-border overflow-hidden w-48">
                        <button onClick={handleExport} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-foreground hover:bg-muted border-b border-border">
                          <Download size={15} className="text-primary" /> 엑셀 내보내기
                        </button>
                        <button onClick={() => { importRef.current?.click(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-foreground hover:bg-muted border-b border-border">
                          <Upload size={15} className="text-emerald-600" /> 엑셀 가져오기
                        </button>
                        {currentAdminId === "9999" && (
                          <button onClick={() => { onAdminManager(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-foreground hover:bg-muted border-b border-border">
                            <ShieldCheck size={15} className="text-amber-500" /> 관리자 관리
                          </button>
                        )}
                        <button onClick={() => { onLogout(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-500 hover:bg-muted">
                          <LogOut size={15} className="text-red-400" /> 로그아웃
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button onClick={onAdd} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Plus size={20} className="text-white" />
                </button>
              </>
            ) : (
              /* 선택 모드 헤더 */
              <button
                onClick={exitSelectMode}
                className="flex items-center gap-1.5 bg-white/20 rounded-full px-4 py-2 text-white text-sm"
              >
                <X size={14} /> 취소
              </button>
            )}
          </div>
        </div>

        {/* 선택 모드 툴바 */}
        {selectMode ? (
          <div className="flex items-center justify-between bg-white/15 rounded-xl px-4 py-2.5">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-white text-sm">
              {allSelected
                ? <CheckSquare size={16} className="text-white" />
                : <Square size={16} className="text-blue-200" />
              }
              {allSelected ? "전체 해제" : `전체 선택 (${filtered.length}명)`}
            </button>
            <button
              onClick={() => someSelected && setShowDeleteModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                someSelected
                  ? "bg-red-500 text-white"
                  : "bg-white/10 text-blue-300"
              }`}
            >
              <Trash2 size={14} />
              {someSelected ? `${selectedIds.size}명 삭제` : "삭제"}
            </button>
          </div>
        ) : (
          /* 검색바 */
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" />
            <input
              value={searchQuery}
              onChange={(e) => { onSearchChange(e.target.value); setShowSuggestions(false); }}
              onFocus={() => setShowSuggestions(aiMode && !searchQuery)}
              placeholder={aiMode ? '예: "부산 두레 리프트"' : "이름, 차량번호, 전화번호 검색..."}
              className="w-full bg-white/15 text-white placeholder-blue-300 pl-9 pr-16 py-2.5 rounded-xl text-sm outline-none focus:bg-white/25 transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button onClick={() => { onSearchChange(""); setShowSuggestions(false); }}>
                  <X size={14} className="text-blue-300" />
                </button>
              )}
              <button
                onClick={() => { setAiMode((v) => !v); onSearchChange(""); setShowSuggestions(false); }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  aiMode ? "bg-white text-primary" : "bg-white/20 text-blue-200"
                }`}
              >
                <Sparkles size={11} /> AI
              </button>
            </div>
          </div>
        )}

        {/* AI 태그 */}
        {!selectMode && aiMode && parsed.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {parsed.tags.map((tag, i) => (
              <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${tag.color}`}>{tag.label}</span>
            ))}
            {parsed.text && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">"{parsed.text}"</span>
            )}
          </div>
        )}

        {/* 추천 검색어 */}
        {!selectMode && aiMode && showSuggestions && (
          <div className="mt-2 bg-white/15 rounded-xl overflow-hidden">
            <p className="text-blue-200 px-3 pt-2 pb-1" style={{ fontSize: "10px" }}>추천 검색어</p>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => { onSearchChange(s); setShowSuggestions(false); }}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 border-t border-white/10">
                <Sparkles size={11} className="inline mr-1.5 text-blue-300" />{s}
              </button>
            ))}
          </div>
        )}
      </div>

      <input ref={importRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 px-4 -mt-3 mb-3">
        {[
          { label: "전체", value: members.length, color: "text-primary" },
          { label: "활성", value: members.filter((m) => m.status === "활성").length, color: "text-emerald-600" },
          { label: "비활성", value: members.filter((m) => m.status === "비활성").length, color: "text-red-500" },
          { label: "두레", value: members.filter((m) => m.grade === "두레").length, color: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-3 shadow-sm text-center">
            <p className={`font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-muted-foreground" style={{ fontSize: "11px" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      {!selectMode && !aiMode && (
        <div className="px-4 flex gap-2 mb-3 overflow-x-auto">
          {filters.map((f) => (
            <button key={f} onClick={() => onFilterChange(f)}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors shrink-0 ${
                filterGrade === f ? "bg-primary text-white" : "bg-card text-muted-foreground border border-border"
              }`}>
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <div className="px-4 mb-2 flex items-center gap-2">
        <p className="text-muted-foreground text-xs">{filtered.length}명</p>
        {selectMode && someSelected && (
          <span className="text-red-500 text-xs font-medium">{selectedIds.size}명 선택됨</span>
        )}
        {!selectMode && aiMode && (
          <span className="text-xs text-primary flex items-center gap-1"><Sparkles size={10} /> AI 검색 중</span>
        )}
        {importing && <span className="text-primary text-xs animate-pulse">파일 처리 중...</span>}
        {error && <span className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={11} />{error}</span>}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            {aiMode ? <Sparkles size={32} className="mb-3 opacity-30" /> : <Search size={32} className="mb-3 opacity-30" />}
            <p className="text-sm">검색 결과가 없습니다</p>
          </div>
        ) : (
          filtered.map((member) => {
            const isSelected = selectedIds.has(member.id);
            return (
              <button
                key={member.id}
                onClick={() => selectMode ? toggleSelect(member.id) : onSelect(member)}
                className={`w-full bg-card rounded-2xl shadow-sm flex items-center gap-3 active:bg-muted transition-all text-left overflow-hidden ${
                  selectMode && isSelected ? "ring-2 ring-red-400 bg-red-50" : ""
                }`}
              >
                {/* 선택 모드: 체크박스 */}
                {selectMode ? (
                  <div className="w-16 h-16 flex items-center justify-center shrink-0">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "border-red-500 bg-red-500" : "border-border bg-white"
                    }`}>
                      {isSelected && (
                        <svg viewBox="0 0 10 8" className="w-3 h-2.5" fill="none">
                          <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                ) : member.vehiclePhoto ? (
                  <img src={member.vehiclePhoto} alt={member.vehicleNumber} className="w-16 h-16 object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-muted flex items-center justify-center shrink-0">
                    <Truck size={24} className="text-muted-foreground opacity-40" />
                  </div>
                )}

                <div className="flex-1 min-w-0 py-3 pr-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-medium text-foreground text-sm">{member.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${gradeColors[member.grade]}`}>{member.grade}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[member.status]}`}>{member.status}</span>
                  </div>
                  <p className="text-muted-foreground mb-1" style={{ fontSize: "12px" }}>
                    {member.vehicleNumber} · {member.garage}
                  </p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${vehicleTypeColors[member.vehicleType]}`}>
                      {member.vehicleType}
                    </span>
                    {member.specialEquipments.slice(0, 2).map((eq) => (
                      <span key={eq} className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{eq}</span>
                    ))}
                    {member.specialEquipments.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{member.specialEquipments.length - 2}</span>
                    )}
                  </div>
                </div>
                {!selectMode && <ChevronRight size={16} className="text-muted-foreground shrink-0 mr-3" />}
              </button>
            );
          })
        )}
      </div>

      {importState && (
        <ImportModal
          count={importState.members.length}
          warnings={importState.warnings}
          onReplace={() => handleImportConfirm("replace")}
          onMerge={() => handleImportConfirm("merge")}
          onCancel={() => setImportState(null)}
        />
      )}

      {showDeleteModal && (
        <BulkDeleteModal
          count={selectedIds.size}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
