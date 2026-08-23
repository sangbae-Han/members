import { Users, TrendingUp, AlertTriangle, HeartHandshake } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { Member } from "../types";

interface Props { members: Member[]; }

export function Dashboard({ members }: Props) {
  const active = members.filter(m => m.status === "활성").length;
  const inactive = members.filter(m => m.status === "비활성").length;
  const dure = members.filter(m => m.grade === "두레").length;
  const totalDiscipline = members.reduce((s, m) => s + m.disciplineRecords.length, 0);
  const totalAid = members.reduce((s, m) => s + m.mutualAidRecords.reduce((a, r) => a + r.amount, 0), 0);

  const garageMap: Record<string, number> = {};
  members.forEach(m => { garageMap[m.garage] = (garageMap[m.garage] ?? 0) + 1; });
  const garageData = Object.entries(garageMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const ton1 = members.filter(m => m.vehicleType === "1톤").length;
  const ton12 = members.filter(m => m.vehicleType === "1.2톤").length;
  const pieData = [
    { name: "1톤", value: ton1 },
    { name: "1.2톤", value: ton12 },
  ];
  const PIE_COLORS = ["#1a3a5c", "#f59e0b"];

  const eqMap: Record<string, number> = {};
  members.forEach(m => m.specialEquipments.forEach(eq => { eqMap[eq] = (eqMap[eq] ?? 0) + 1; }));
  const eqData = Object.entries(eqMap).map(([name, value]) => ({ name, value }));

  const STATS = [
    { label: "전체 회원", value: members.length, icon: <Users size={20} />, color: "text-primary", bg: "bg-primary/10" },
    { label: "활성 회원", value: active, icon: <TrendingUp size={20} />, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "징계 내역", value: totalDiscipline, icon: <AlertTriangle size={20} />, color: "text-red-500", bg: "bg-red-50" },
    { label: "상조 지원 합계", value: `${totalAid.toLocaleString()}원`, icon: <HeartHandshake size={20} />, color: "text-blue-500", bg: "bg-blue-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="bg-card rounded-xl p-5 border border-border shadow-sm">
            <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              {s.icon}
            </div>
            <p className="text-muted-foreground text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="font-semibold text-foreground mb-4 text-sm">차고지별 회원 현황</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={garageData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="회원수" fill="#1a3a5c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="font-semibold text-foreground mb-4 text-sm">차종 비율</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: PIE_COLORS[i] }} />
                <span className="text-xs text-muted-foreground">{d.name} ({d.value}명)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="font-semibold text-foreground mb-4 text-sm">특장 보유 현황</h3>
          <div className="space-y-2.5">
            {eqData.length === 0 ? (
              <p className="text-muted-foreground text-sm">데이터 없음</p>
            ) : eqData.map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-sm text-foreground w-14">{d.name}</span>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${members.length ? (d.value / members.length) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">{d.value}명</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="font-semibold text-foreground mb-4 text-sm">회원 구분 현황</h3>
          <div className="space-y-3">
            {[
              { label: "일반 회원", value: members.length - dure, color: "bg-slate-400" },
              { label: "두레 회원", value: dure, color: "bg-primary" },
              { label: "활성", value: active, color: "bg-emerald-500" },
              { label: "비활성", value: inactive, color: "bg-red-400" },
            ].map(d => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="text-sm text-foreground w-16">{d.label}</span>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div className={`h-full ${d.color} rounded-full`} style={{ width: members.length ? `${(d.value / members.length) * 100}%` : "0%" }} />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">{d.value}명</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
