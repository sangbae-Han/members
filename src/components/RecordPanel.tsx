import { useState } from "react";
import { Plus, X, Check, AlertTriangle, HeartHandshake, Pencil, Trash2 } from "lucide-react";
import type { AidCategory, DisciplineRecord, MutualAidRecord } from "@/types";

export const AID_CATEGORIES: AidCategory[] = ["장례", "결혼", "입학축하금", "출산", "생일", "기타"];

export const AID_CATEGORY_COLORS: Record<AidCategory, string> = {
  장례: "bg-gray-100 text-gray-700",
  결혼: "bg-pink-100 text-pink-700",
  입학축하금: "bg-green-100 text-green-700",
  출산: "bg-yellow-100 text-yellow-700",
  생일: "bg-purple-100 text-purple-700",
  기타: "bg-slate-100 text-slate-600",
};

const inputClass =
  "w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-muted-foreground block mb-1" style={{ fontSize: "11px" }}>{label}</label>
      {children}
    </div>
  );
}

// ── Discipline ────────────────────────────────────────────────────────────────

const emptyDiscipline = (): Omit<DisciplineRecord, "id"> => ({
  date: new Date().toISOString().slice(0, 10),
  content: "",
  disciplineDetail: "",
  startDate: "",
  endDate: "",
});

interface DisciplinePanelProps {
  records: DisciplineRecord[];
  onChange: (records: DisciplineRecord[]) => void;
}

export function DisciplinePanel({ records, onChange }: DisciplinePanelProps) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyDiscipline());

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAdd = () => {
    if (!form.content.trim()) return;
    onChange([...records, { ...form, id: String(Date.now()) }]);
    setAdding(false);
    setForm(emptyDiscipline());
  };

  const handleEditSave = () => {
    if (!editingId || !form.content.trim()) return;
    onChange(records.map((r) => (r.id === editingId ? { ...form, id: editingId } : r)));
    setEditingId(null);
    setForm(emptyDiscipline());
  };

  const startEdit = (r: DisciplineRecord) => {
    setEditingId(r.id);
    setAdding(false);
    setForm({ date: r.date, content: r.content, disciplineDetail: r.disciplineDetail, startDate: r.startDate, endDate: r.endDate });
  };

  const cancel = () => { setAdding(false); setEditingId(null); setForm(emptyDiscipline()); };

  const handleDelete = (id: string) => {
    if (!window.confirm("이 징계 내역을 삭제하시겠습니까?")) return;
    onChange(records.filter((r) => r.id !== id));
  };

  const isFormOpen = adding || !!editingId;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-500" />
          <span className="text-foreground font-medium text-sm">징계 내역</span>
          {records.length > 0 && (
            <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">{records.length}</span>
          )}
        </div>
        {!isFormOpen && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-primary text-xs px-2.5 py-1.5 bg-primary/10 rounded-lg"
          >
            <Plus size={12} /> 추가
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-3 space-y-3">
          <p className="text-red-700 font-medium" style={{ fontSize: "12px" }}>
            {editingId ? "징계 수정" : "징계 추가"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="일자">
              <input type="date" className={inputClass} value={form.date} onChange={set("date")} />
            </Field>
            <Field label="내역">
              <input className={inputClass} value={form.content} onChange={set("content")} placeholder="경고, 정직 등" />
            </Field>
          </div>
          <Field label="징계내역">
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={form.disciplineDetail}
              onChange={set("disciplineDetail")}
              placeholder="징계 상세 내용을 입력하세요..."
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="시작일">
              <input type="date" className={inputClass} value={form.startDate} onChange={set("startDate")} />
            </Field>
            <Field label="종료일">
              <input type="date" className={inputClass} value={form.endDate} onChange={set("endDate")} />
            </Field>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={editingId ? handleEditSave : handleAdd}
              className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1"
            >
              <Check size={14} /> {editingId ? "수정 완료" : "저장"}
            </button>
            <button
              onClick={cancel}
              className="px-4 bg-white border border-border text-muted-foreground py-2.5 rounded-xl text-sm"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {records.length === 0 && !isFormOpen ? (
        <div className="text-center py-8 text-muted-foreground" style={{ fontSize: "13px" }}>
          징계 내역이 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r.id} className="bg-card border border-red-100 rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">
                    {r.content}
                  </span>
                  <span className="text-muted-foreground ml-2" style={{ fontSize: "11px" }}>{r.date}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(r)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-primary">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-red-500">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              {r.disciplineDetail && (
                <p className="text-foreground text-sm mb-2">{r.disciplineDetail}</p>
              )}
              {(r.startDate || r.endDate) && (
                <p className="text-muted-foreground" style={{ fontSize: "11px" }}>
                  기간: {r.startDate} ~ {r.endDate}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Mutual Aid ────────────────────────────────────────────────────────────────

const emptyAid = (): Omit<MutualAidRecord, "id"> => ({
  date: new Date().toISOString().slice(0, 10),
  category: "기타",
  aidDetail: "",
  amount: 0,
});

interface MutualAidPanelProps {
  records: MutualAidRecord[];
  onChange: (records: MutualAidRecord[]) => void;
}

export function MutualAidPanel({ records, onChange }: MutualAidPanelProps) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyAid());

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: key === "amount" ? Number(e.target.value) : e.target.value }));

  const handleAdd = () => {
    if (!form.aidDetail.trim()) return;
    onChange([...records, { ...form, id: String(Date.now()) }]);
    setAdding(false);
    setForm(emptyAid());
  };

  const handleEditSave = () => {
    if (!editingId || !form.aidDetail.trim()) return;
    onChange(records.map((r) => (r.id === editingId ? { ...form, id: editingId } : r)));
    setEditingId(null);
    setForm(emptyAid());
  };

  const startEdit = (r: MutualAidRecord) => {
    setEditingId(r.id);
    setAdding(false);
    setForm({ date: r.date, category: r.category ?? "기타", aidDetail: r.aidDetail, amount: r.amount });
  };

  const cancel = () => { setAdding(false); setEditingId(null); setForm(emptyAid()); };

  const handleDelete = (id: string) => {
    if (!window.confirm("이 상조 내역을 삭제하시겠습니까?")) return;
    onChange(records.filter((r) => r.id !== id));
  };

  const isFormOpen = adding || !!editingId;
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <HeartHandshake size={14} className="text-blue-500" />
          <span className="text-foreground font-medium text-sm">상조 현황</span>
          {records.length > 0 && (
            <span className="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full">{records.length}</span>
          )}
        </div>
        {!isFormOpen && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-primary text-xs px-2.5 py-1.5 bg-primary/10 rounded-lg"
          >
            <Plus size={12} /> 추가
          </button>
        )}
      </div>

      {records.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-3 flex justify-between items-center">
          <span className="text-blue-600 text-sm">총 지원금액</span>
          <span className="text-blue-700 font-semibold text-sm">{totalAmount.toLocaleString()}원</span>
        </div>
      )}

      {isFormOpen && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-3 space-y-3">
          <p className="text-blue-700 font-medium" style={{ fontSize: "12px" }}>
            {editingId ? "상조 수정" : "상조 추가"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="일자">
              <input type="date" className={inputClass} value={form.date} onChange={set("date")} />
            </Field>
            <Field label="구분">
              <select className={inputClass} value={form.category} onChange={set("category")}>
                {AID_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="상조내역">
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={form.aidDetail}
              onChange={set("aidDetail")}
              placeholder="상조 상세 내용..."
            />
          </Field>
          <Field label="지원금액 (원)">
            <input
              type="number"
              className={inputClass}
              value={form.amount}
              onChange={set("amount")}
              placeholder="0"
            />
          </Field>
          <div className="flex gap-2 pt-1">
            <button
              onClick={editingId ? handleEditSave : handleAdd}
              className="flex-1 bg-blue-500 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1"
            >
              <Check size={14} /> {editingId ? "수정 완료" : "저장"}
            </button>
            <button
              onClick={cancel}
              className="px-4 bg-white border border-border text-muted-foreground py-2.5 rounded-xl text-sm"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {records.length === 0 && !isFormOpen ? (
        <div className="text-center py-8 text-muted-foreground" style={{ fontSize: "13px" }}>
          상조 내역이 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r.id} className="bg-card border border-blue-100 rounded-2xl p-4">
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${AID_CATEGORY_COLORS[r.category ?? "기타"]}`}>
                    {r.category ?? "기타"}
                  </span>
                  <span className="text-muted-foreground" style={{ fontSize: "11px" }}>{r.date}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(r)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-primary">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-red-500">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <p className="text-foreground text-sm mb-1">{r.aidDetail}</p>
              <p className="text-blue-600 font-semibold text-sm">{r.amount.toLocaleString()}원</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
