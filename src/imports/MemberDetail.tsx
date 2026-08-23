import { useState } from "react";
import { ArrowLeft, Edit2, Trash2, Phone, Truck, MapPin, Users, Tag, AlertTriangle, HeartHandshake, CalendarDays } from "lucide-react";
import type { Member, DisciplineRecord, MutualAidRecord } from "./types";
import { DisciplinePanel, MutualAidPanel } from "./RecordPanel";

interface MemberDetailProps {
  member: Member;
  onBack: () => void;
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  onUpdate: (member: Member) => void;
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

const equipmentColors: Record<string, string> = {
  리프트: "bg-orange-100 text-orange-700",
  무진동: "bg-sky-100 text-sky-700",
  유해: "bg-red-100 text-red-600",
  위험물: "bg-red-100 text-red-700",
  보세: "bg-violet-100 text-violet-700",
};

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-border last:border-0">
      <div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="text-muted-foreground mb-1" style={{ fontSize: "11px" }}>{label}</p>
        {children}
      </div>
    </div>
  );
}

type Tab = "info" | "discipline" | "mutualaid";

export function MemberDetail({ member, onBack, onEdit, onDelete, onUpdate }: MemberDetailProps) {
  const [tab, setTab] = useState<Tab>("info");

  const handleDelete = () => {
    if (window.confirm(`${member.name} 회원을 삭제하시겠습니까?`)) {
      onDelete(member.id);
    }
  };

  const handleDisciplineChange = (records: DisciplineRecord[]) => {
    onUpdate({ ...member, disciplineRecords: records });
  };

  const handleMutualAidChange = (records: MutualAidRecord[]) => {
    onUpdate({ ...member, mutualAidRecords: records });
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "info", label: "기본정보", icon: <Users size={13} /> },
    {
      key: "discipline",
      label: "징계",
      icon: <AlertTriangle size={13} />,
      badge: member.disciplineRecords.length || undefined,
    },
    {
      key: "mutualaid",
      label: "상조",
      icon: <HeartHandshake size={13} />,
      badge: member.mutualAidRecords.length || undefined,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-primary px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h2 className="text-white">회원 상세</h2>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(member)}
              className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center"
            >
              <Edit2 size={16} className="text-white" />
            </button>
            <button
              onClick={handleDelete}
              className="w-9 h-9 bg-red-400/60 rounded-full flex items-center justify-center"
            >
              <Trash2 size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white font-semibold">{member.name.slice(0, 1)}</span>
          </div>
          <div>
            <h3 className="text-white">{member.name}</h3>
            <div className="flex gap-1.5 mt-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full ${gradeColors[member.grade]}`}>{member.grade}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[member.status]}`}>{member.status}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${vehicleTypeColors[member.vehicleType]}`}>{member.vehicleType}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/10 rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors relative ${
                tab === t.key
                  ? "bg-white text-primary"
                  : "text-blue-200"
              }`}
            >
              {t.icon}
              {t.label}
              {t.badge ? (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center ${
                  t.key === "discipline" ? "bg-red-500" : "bg-blue-500"
                }`} style={{ fontSize: "9px" }}>
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        {tab === "info" && (
          <div className="space-y-3">
            {member.vehiclePhoto && (
              <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
                <img src={member.vehiclePhoto} alt={`${member.name} 차량`} className="w-full h-44 object-cover" />
                <p className="text-center text-muted-foreground py-2" style={{ fontSize: "11px" }}>차량 사진</p>
              </div>
            )}
            <div className="bg-card rounded-2xl px-4 shadow-sm">
              <InfoRow icon={<Truck size={14} />} label="차량번호">
                <p className="text-foreground text-sm font-medium">{member.vehicleNumber}</p>
              </InfoRow>
              <InfoRow icon={<Phone size={14} />} label="전화번호">
                <p className="text-foreground text-sm">{member.phone}</p>
              </InfoRow>
              <InfoRow icon={<Users size={14} />} label="회원구분 · 활동상태">
                <div className="flex gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${gradeColors[member.grade]}`}>{member.grade}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[member.status]}`}>{member.status}</span>
                </div>
              </InfoRow>
              <InfoRow icon={<CalendarDays size={14} />} label="가입일">
                <p className="text-foreground text-sm">{member.joinDate || "미입력"}</p>
              </InfoRow>
              <InfoRow icon={<MapPin size={14} />} label="차고지">
                <p className="text-foreground text-sm">{member.garage}</p>
              </InfoRow>
              <InfoRow icon={<Truck size={14} />} label="차종">
                <span className={`text-xs px-2 py-0.5 rounded-full ${vehicleTypeColors[member.vehicleType]}`}>{member.vehicleType}</span>
              </InfoRow>
              <InfoRow icon={<Tag size={14} />} label="특장">
                {member.specialEquipments.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {member.specialEquipments.map((eq) => (
                      <span key={eq} className={`text-xs px-2 py-0.5 rounded-full ${equipmentColors[eq] ?? "bg-slate-100 text-slate-600"}`}>
                        {eq}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">없음</p>
                )}
              </InfoRow>
            </div>
            <button onClick={() => onEdit(member)} className="w-full bg-primary text-white py-4 rounded-2xl font-medium text-sm">
              정보 수정
            </button>
          </div>
        )}

        {tab === "discipline" && (
          <DisciplinePanel
            records={member.disciplineRecords}
            onChange={handleDisciplineChange}
          />
        )}

        {tab === "mutualaid" && (
          <MutualAidPanel
            records={member.mutualAidRecords}
            onChange={handleMutualAidChange}
          />
        )}
      </div>
    </div>
  );
}
