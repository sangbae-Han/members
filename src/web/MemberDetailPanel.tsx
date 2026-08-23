import { useState } from "react";
import { X, Edit2, Trash2, Phone, Truck, MapPin, Users, Tag, CalendarDays } from "lucide-react";
import type { Member, DisciplineRecord, MutualAidRecord } from "../types";
import { DisciplinePanel, MutualAidPanel } from "../components/RecordPanel";

interface Props {
  member: Member;
  onEdit: (m: Member) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onUpdate: (m: Member) => void;
}

type Tab = "info" | "discipline" | "mutualaid";

const GRADE_COLORS: Record<string, string> = { 일반: "bg-slate-100 text-slate-600", 두레: "bg-blue-100 text-blue-700" };
const STATUS_COLORS: Record<string, string> = { 활성: "bg-emerald-100 text-emerald-700", 비활성: "bg-red-100 text-red-600" };
const EQ_COLORS: Record<string, string> = {
  리프트: "bg-orange-100 text-orange-700", 무진동: "bg-sky-100 text-sky-700",
  유해: "bg-red-100 text-red-600", 위험물: "bg-red-100 text-red-700", 보세: "bg-violet-100 text-violet-700",
};

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-0">
      <div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
        <div className="text-foreground text-sm">{children}</div>
      </div>
    </div>
  );
}

export function MemberDetailPanel({ member, onEdit, onDelete, onClose, onUpdate }: Props) {
  const [tab, setTab] = useState<Tab>("info");

  const handleDelete = () => {
    if (confirm(`${member.name} 회원을 삭제하시겠습니까?`)) onDelete(member.id);
  };

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "info", label: "기본정보" },
    { key: "discipline", label: "징계", badge: member.disciplineRecords.length || undefined },
    { key: "mutualaid", label: "상조", badge: member.mutualAidRecords.length || undefined },
  ];

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
      <div className="bg-primary px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(member)} className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
              <Edit2 size={13} className="text-white" />
            </button>
            <button onClick={handleDelete} className="w-7 h-7 bg-red-400/50 rounded-lg flex items-center justify-center hover:bg-red-400/70 transition-colors">
              <Trash2 size={13} className="text-white" />
            </button>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30">
            <X size={13} className="text-white" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">{member.name.slice(0, 1)}</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{member.name}</p>
            <div className="flex gap-1 mt-1 flex-wrap">
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${GRADE_COLORS[member.grade]}`}>{member.grade}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[member.status]}`}>{member.status}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-3 bg-white/10 rounded-lg p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors relative ${tab === t.key ? "bg-white text-primary" : "text-blue-200 hover:text-white"}`}>
              {t.label}
              {t.badge ? (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center ${t.key === "discipline" ? "bg-red-500" : "bg-blue-500"}`}
                  style={{ fontSize: "9px" }}>{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "info" && (
          <div>
            <Row icon={<Truck size={13} />} label="차량번호">
              <span className="font-mono font-medium">{member.vehicleNumber}</span>
            </Row>
            <Row icon={<Phone size={13} />} label="전화번호">{member.phone}</Row>
            <Row icon={<CalendarDays size={13} />} label="가입일">{member.joinDate || "미입력"}</Row>
            <Row icon={<MapPin size={13} />} label="차고지">{member.garage}</Row>
            <Row icon={<Users size={13} />} label="차종">
              <span className="px-2 py-0.5 rounded-full text-xs bg-violet-100 text-violet-700">{member.vehicleType}</span>
            </Row>
            <Row icon={<Tag size={13} />} label="특장">
              {member.specialEquipments.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {member.specialEquipments.map(eq => (
                    <span key={eq} className={`px-1.5 py-0.5 rounded-full text-xs ${EQ_COLORS[eq] ?? "bg-slate-100 text-slate-600"}`}>{eq}</span>
                  ))}
                </div>
              ) : <span className="text-muted-foreground">없음</span>}
            </Row>
            {member.vehiclePhoto && (
              <div className="mt-3 rounded-lg overflow-hidden">
                <img src={member.vehiclePhoto} alt="차량 사진" className="w-full h-36 object-cover" />
              </div>
            )}
          </div>
        )}
        {tab === "discipline" && (
          <DisciplinePanel
            records={member.disciplineRecords}
            onChange={(records: DisciplineRecord[]) => onUpdate({ ...member, disciplineRecords: records })}
          />
        )}
        {tab === "mutualaid" && (
          <MutualAidPanel
            records={member.mutualAidRecords}
            onChange={(records: MutualAidRecord[]) => onUpdate({ ...member, mutualAidRecords: records })}
          />
        )}
      </div>
    </div>
  );
}
