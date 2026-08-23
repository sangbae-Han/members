import { useState, useRef } from "react";
import { X, Check, Camera, Search } from "lucide-react";
import type { Member, VehicleType, MemberGrade, MemberStatus, GarageRegion, SpecialEquipment } from "../types";

interface Props { member: Member | null; onClose: () => void; onSave: (m: Member) => void; }

const GARAGE_OPTIONS: { value: GarageRegion; label: string }[] = [
  { value: "서울", label: "서울특별시" }, { value: "부산", label: "부산광역시" },
  { value: "대구", label: "대구광역시" }, { value: "인천", label: "인천광역시" },
  { value: "광주", label: "광주광역시" }, { value: "대전", label: "대전광역시" },
  { value: "울산", label: "울산광역시" }, { value: "세종", label: "세종특별자치시" },
  { value: "경기", label: "경기도" }, { value: "강원", label: "강원특별자치도" },
  { value: "충북", label: "충청북도" }, { value: "충남", label: "충청남도" },
  { value: "전북", label: "전북특별자치도" }, { value: "전남", label: "전라남도" },
  { value: "경북", label: "경상북도" }, { value: "경남", label: "경상남도" },
  { value: "제주", label: "제주특별자치도" },
];
const SPECIAL_EQUIPMENTS: SpecialEquipment[] = ["리프트", "무진동", "유해", "위험물", "보세"];
const inputClass = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function MemberModal({ member, onClose, onSave }: Props) {
  const isEdit = !!member;
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Omit<Member, "id">>(() => member ? { ...member } : {
    name: "", vehicleNumber: "", grade: "일반", status: "활성", garage: "서울",
    phone: "", joinDate: new Date().toISOString().slice(0, 10),
    vehicleType: "1톤", specialEquipments: [], vehiclePhoto: "",
    roadAddress: "", mailingAddress: "",
    disciplineRecords: [], mutualAidRecords: [],
  });
  const [photoPreview, setPhotoPreview] = useState(member?.vehiclePhoto ?? "");

  const set = <K extends keyof typeof form>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  const toggleEq = (eq: SpecialEquipment) =>
    setForm(f => ({
      ...f,
      specialEquipments: f.specialEquipments.includes(eq)
        ? f.specialEquipments.filter(e => e !== eq)
        : [...f.specialEquipments, eq],
    }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    setForm(f => ({ ...f, vehiclePhoto: url }));
  };

  const openAddressSearch = () => {
    const run = () => {
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => {
          const road = data.roadAddress || data.autoRoadAddress || "";
          setForm(f => ({ ...f, roadAddress: road }));
        },
      }).open();
    };
    if ((window as any).daum?.Postcode) {
      run();
    } else {
      const s = document.createElement("script");
      s.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      s.onload = run;
      document.head.appendChild(s);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.vehicleNumber.trim() || !form.phone.trim()) {
      alert("이름, 차량번호, 전화번호는 필수입니다."); return;
    }
    onSave({ ...form, id: member?.id ?? String(Date.now()) });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h3 className="font-semibold text-foreground">{isEdit ? "회원 수정" : "회원 등록"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <form id="modal-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label="이름" required>
              <input className={inputClass} value={form.name} onChange={set("name")} placeholder="홍길동" />
            </Field>
            <Field label="차량번호" required>
              <input className={inputClass} value={form.vehicleNumber} onChange={set("vehicleNumber")} placeholder="부산95아5094" />
            </Field>
            <Field label="전화번호" required>
              <input className={inputClass} value={form.phone} onChange={set("phone")} placeholder="010-0000-0000" />
            </Field>
            <Field label="가입일">
              <input type="date" className={inputClass} value={form.joinDate} onChange={set("joinDate")} />
            </Field>
            <Field label="회원구분">
              <div className="flex gap-4 pt-1">
                {(["일반", "두레"] as MemberGrade[]).map(g => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="grade" value={g} checked={form.grade === g}
                      onChange={() => setForm(f => ({ ...f, grade: g }))} className="accent-primary" />
                    <span className="text-sm text-foreground">{g}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="활동상태">
              <div className="flex gap-4 pt-1">
                {(["활성", "비활성"] as MemberStatus[]).map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="status" value={s} checked={form.status === s}
                      onChange={() => setForm(f => ({ ...f, status: s }))} className="accent-primary" />
                    <span className="text-sm text-foreground">{s}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="차고지">
              <select className={inputClass} value={form.garage}
                onChange={e => setForm(f => ({ ...f, garage: e.target.value as GarageRegion }))}>
                {GARAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="차종">
              <div className="flex gap-4 pt-1">
                {(["1톤", "1.2톤"] as VehicleType[]).map(v => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="vehicleType" value={v} checked={form.vehicleType === v}
                      onChange={() => setForm(f => ({ ...f, vehicleType: v }))} className="accent-primary" />
                    <span className="text-sm text-foreground">{v}</span>
                  </label>
                ))}
              </div>
            </Field>

            <div className="col-span-2">
              <Field label="도로명 주소">
                <div className="flex gap-2">
                  <input className={inputClass} value={form.roadAddress} readOnly placeholder="아래 [주소 검색] 버튼을 눌러 선택하세요" />
                  <button type="button" onClick={openAddressSearch}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 shrink-0 whitespace-nowrap">
                    <Search size={13} /> 주소 검색
                  </button>
                </div>
              </Field>
            </div>

            <div className="col-span-2">
              <Field label="우편물 수령지">
                <input className={inputClass} value={form.mailingAddress} onChange={set("mailingAddress")}
                  placeholder="우편물을 받을 주소 (도로명 주소와 다를 경우 직접 입력)" />
              </Field>
            </div>

            <div className="col-span-2">
              <Field label="특장">
                <div className="flex flex-wrap gap-2 pt-1">
                  {SPECIAL_EQUIPMENTS.map(eq => {
                    const checked = form.specialEquipments.includes(eq);
                    return (
                      <button key={eq} type="button" onClick={() => toggleEq(eq)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${checked ? "bg-primary/10 border-primary text-primary" : "bg-muted border-border text-muted-foreground hover:border-primary/50"}`}>
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${checked ? "bg-primary border-primary" : "border-border bg-white"}`}>
                          {checked && <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                        {eq}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            <div className="col-span-2">
              <Field label="차량 사진">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                {photoPreview ? (
                  <div className="relative rounded-lg overflow-hidden">
                    <img src={photoPreview} alt="차량 사진" className="w-full h-40 object-cover" />
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-lg">변경</button>
                      <button type="button" onClick={() => { setPhotoPreview(""); setForm(f => ({ ...f, vehiclePhoto: "" })); }}
                        className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-lg">삭제</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-muted/50 transition-colors">
                    <Camera size={24} className="opacity-40" />
                    <span className="text-xs">클릭하여 사진 업로드</span>
                  </button>
                )}
              </Field>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted">취소</button>
          <button form="modal-form" type="submit" className="flex items-center gap-1.5 px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
            <Check size={14} /> {isEdit ? "수정 완료" : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
