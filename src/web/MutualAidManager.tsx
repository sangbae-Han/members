import { useState } from "react";
import { Search, HeartHandshake, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Member, AidCategory } from "../types";
import { AID_CATEGORIES, AID_CATEGORY_COLORS } from "../components/RecordPanel";

interface Props { members: Member[]; }

interface FlatRecord {
  memberId: string;
  memberName: string;
  vehicleNumber: string;
  recordId: string;
  date: string;
  year: string;
  category: AidCategory;
  aidDetail: string;
  amount: number;
}

const PAGE_SIZE = 15;

export function MutualAidManager({ members }: Props) {
  const [filterYear, setFilterYear] = useState("전체");
  const [filterCategory, setFilterCategory] = useState<AidCategory | "전체">("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const allRecords: FlatRecord[] = members.flatMap(m =>
    m.mutualAidRecords.map(r => ({
      memberId: m.id,
      memberName: m.name,
      vehicleNumber: m.vehicleNumber,
      recordId: r.id,
      date: r.date,
      year: r.date?.slice(0, 4) ?? "",
      category: (r.category ?? "기타") as AidCategory,
      aidDetail: r.aidDetail,
      amount: r.amount,
    }))
  ).sort((a, b) => b.date.localeCompare(a.date));

  const years = ["전체", ...Array.from(new Set(allRecords.map(r => r.year))).filter(Boolean).sort((a, b) => b.localeCompare(a))];

  const filtered = allRecords.filter(r => {
    if (filterYear !== "전체" && r.year !== filterYear) return false;
    if (filterCategory !== "전체" && r.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      if (!r.memberName.includes(q) && !r.aidDetail.includes(q) && !r.vehicleNumber.includes(q)) return false;
    }
    return true;
  });

  const totalAmount = filtered.reduce((s, r) => s + r.amount, 0);
  const categoryStats = AID_CATEGORIES.map(cat => ({
    category: cat,
    count: filtered.filter(r => r.category === cat).length,
    amount: filtered.filter(r => r.category === cat).reduce((s, r) => s + r.amount, 0),
  })).filter(s => s.count > 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <p className="text-muted-foreground text-xs mb-1">조회 건수</p>
          <p className="text-2xl font-bold text-primary">{filtered.length}건</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <p className="text-muted-foreground text-xs mb-1">총 지원금액</p>
          <p className="text-2xl font-bold text-blue-600">{totalAmount.toLocaleString()}원</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm col-span-2">
          <p className="text-muted-foreground text-xs mb-2">항목별 현황</p>
          <div className="flex flex-wrap gap-2">
            {categoryStats.length === 0
              ? <span className="text-muted-foreground text-xs">없음</span>
              : categoryStats.map(s => (
                <div key={s.category} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${AID_CATEGORY_COLORS[s.category]}`}>
                  <span className="font-medium">{s.category}</span>
                  <span>{s.count}건</span>
                  <span className="opacity-70">· {s.amount.toLocaleString()}원</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="회원명, 내역 검색..."
            className="w-full bg-muted border border-border rounded-lg pl-9 pr-8 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>
        <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setPage(1); }}
          className="bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
          {years.map(y => <option key={y} value={y}>{y === "전체" ? "전체 연도" : `${y}년`}</option>)}
        </select>
        <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value as AidCategory | "전체"); setPage(1); }}
          className="bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="전체">전체 항목</option>
          {AID_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(filterYear !== "전체" || filterCategory !== "전체" || searchQuery) && (
          <button onClick={() => { setFilterYear("전체"); setFilterCategory("전체"); setSearchQuery(""); setPage(1); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted">
            <X size={12} /> 필터 초기화
          </button>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs">일자</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs">구분</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs">회원명</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs">차량번호</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs">상조내역</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium text-xs">지원금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-muted-foreground">
                  <HeartHandshake size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">상조 내역이 없습니다</p>
                </td></tr>
              ) : paginated.map(r => (
                <tr key={r.recordId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 text-muted-foreground text-xs whitespace-nowrap font-mono">{r.date}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${AID_CATEGORY_COLORS[r.category]}`}>{r.category}</span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-foreground whitespace-nowrap">{r.memberName}</td>
                  <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs whitespace-nowrap">{r.vehicleNumber}</td>
                  <td className="px-5 py-3.5 text-foreground">{r.aidDetail}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-blue-600 whitespace-nowrap">{r.amount.toLocaleString()}원</td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t border-border bg-muted/30">
                  <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-foreground">합계</td>
                  <td className="px-5 py-3 text-right font-bold text-blue-700 text-sm">{totalAmount.toLocaleString()}원</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="border-t border-border px-5 py-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">전체 {filtered.length}건 · {currentPage}/{totalPages} 페이지</p>
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
  );
}
