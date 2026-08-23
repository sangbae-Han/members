import { ArrowLeft, Check, Camera, X } from "lucide-react";
import { useState, useRef } from "react";
import type { Member, VehicleType, MemberGrade, MemberStatus, GarageRegion, SpecialEquipment } from "./types";

interface MemberFormProps {
  member?: Member | null;
  onBack: () => void;
  onSave: (member: Member) => void;
}

const GARAGE_OPTIONS: { value: GarageRegion; label: string }[] = [
  { value: "서울", label: "서울특별시" },
  { value: "부산", label: "부산광역시" },
  { value: "대구", label: "대구광역시" },
  { value: "인천", label: "인천광역시" },
  { value: "광주", label: "광주광역시" },
  { value: "대전", label: "대전광역시" },
  { value: "울산", label: "울산광역시" },
  { value: "세종", label: "세종특별자치시" },
  { value: "경기", label: "경기도" },
  { value: "강원", label: "강원특별자치도" },
  { value: "충북", label: "충청북도" },
  { value: "충남", label: "충청남도" },
  { value: "전북", label: "전북특별자치도" },
  { value: "전남", label: "전라남도" },
  { value: "경북", label: "경상북도" },
  { value: "경남", label: "경상남도" },
  { value: "제주", label: "제주특별자치도" },
];
const VEHICLE_TYPES: VehicleType[] = ["1톤", "1.2톤"];
const SPECIAL_EQUIPMENTS: SpecialEquipment[] = ["리프트", "무진동", "유해", "위험물", "보세"];

const emptyForm: Omit<Member, "id"> = {
  name: "",
  vehicleNumber: "",
  grade: "일반",
  status: "활성",
  garage: "서울",
  phone: "",
  joinDate: new Date().toISOString().slice(0, 10),
  vehicleType: "1톤",
  specialEquipments: [],
  vehiclePhoto: "",
  disciplineRecords: [],
  mutualAidRecords: [],
};

const inputClass =
  "w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-muted-foreground block mb-1.5" style={{ fontSize: "12px" }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function MemberForm({ member, onBack, onSave }: MemberFormProps) {
  const [form, setForm] = useState<Omit<Member, "id">>(member ? { ...member } : { ...emptyForm });
  const [photoPreview, setPhotoPreview] = useState<string>(member?.vehiclePhoto ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof typeof form>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const toggleEquipment = (eq: SpecialEquipment) => {
    setForm((f) => ({
      ...f,
      specialEquipments: f.specialEquipments.includes(eq)
        ? f.specialEquipments.filter((e) => e !== eq)
        : [...f.specialEquipments, eq],
    }));
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    setForm((f) => ({ ...f, vehiclePhoto: url }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.vehicleNumber.trim() || !form.phone.trim()) {
      alert("이름, 차량번호, 전화번호는 필수입니다.");
      return;
    }
    onSave({ ...form, id: member?.id ?? String(Date.now()) });
  };

  const isEdit = !!member;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-primary px-5 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h2 className="text-white">{isEdit ? "회원 수정" : "회원 등록"}</h2>
          <button
            type="submit"
            form="member-form"
            className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center"
          >
            <Check size={18} className="text-white" />
          </button>
        </div>
      </div>

      <form
        id="member-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-8"
      >
        {/* 기본 정보 */}
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-4">
          <p className="text-foreground font-medium" style={{ fontSize: "13px" }}>기본 정보</p>

          <Field label="이름" required>
            <input
              className={inputClass}
              value={form.name}
              onChange={set("name")}
              placeholder="홍길동"
            />
          </Field>

          <Field label="차량번호" required>
            <input
              className={inputClass}
              value={form.vehicleNumber}
              onChange={set("vehicleNumber")}
              placeholder="부산95아5094"
            />
          </Field>

          <Field label="전화번호" required>
            <input
              className={inputClass}
              value={form.phone}
              onChange={set("phone")}
              placeholder="010-0000-0000"
            />
          </Field>
          <Field label="가입일">
            <input
              type="date"
              className={inputClass}
              value={form.joinDate}
              onChange={set("joinDate")}
            />
          </Field>
        </div>

        {/* 회원 구분 */}
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-4">
          <p className="text-foreground font-medium" style={{ fontSize: "13px" }}>회원 구분 및 차고지</p>

          <Field label="회원구분">
            <div className="flex gap-4">
              {(["일반", "두레"] as MemberGrade[]).map((g) => (
                <label key={g} className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setForm((f) => ({ ...f, grade: g }))}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                      form.grade === g
                        ? "border-primary bg-primary"
                        : "border-border bg-white"
                    }`}
                  >
                    {form.grade === g && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm text-foreground">{g}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="활동상태">
            <div className="flex gap-4">
              {(["활성", "비활성"] as MemberStatus[]).map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                      form.status === s
                        ? s === "활성"
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-red-500 bg-red-500"
                        : "border-border bg-white"
                    }`}
                  >
                    {form.status === s && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm text-foreground">{s}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="차고지">
            <select
              className={inputClass}
              value={form.garage}
              onChange={(e) => setForm((f) => ({ ...f, garage: e.target.value as GarageRegion }))}
            >
              {GARAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* 차종 */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-foreground font-medium mb-4" style={{ fontSize: "13px" }}>차종</p>
          <div className="flex gap-6">
            {VEHICLE_TYPES.map((vt) => (
              <label key={vt} className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setForm((f) => ({ ...f, vehicleType: vt }))}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                    form.vehicleType === vt
                      ? "border-primary bg-primary"
                      : "border-border bg-white"
                  }`}
                >
                  {form.vehicleType === vt && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-sm text-foreground">{vt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 특장 */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-foreground font-medium mb-4" style={{ fontSize: "13px" }}>특장</p>
          <div className="flex flex-wrap gap-2">
            {SPECIAL_EQUIPMENTS.map((eq) => {
              const checked = form.specialEquipments.includes(eq);
              return (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleEquipment(eq)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-colors text-sm ${
                    checked
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      checked ? "bg-primary border-primary" : "border-border bg-white"
                    }`}
                  >
                    {checked && (
                      <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  {eq}
                </button>
              );
            })}
          </div>
        </div>

        {/* 차량 사진 */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-foreground font-medium mb-3" style={{ fontSize: "13px" }}>차량 사진</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhoto}
          />
          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={photoPreview} alt="차량 사진" className="w-full h-44 object-cover" />
              <button
                type="button"
                onClick={() => {
                  setPhotoPreview("");
                  setForm((f) => ({ ...f, vehiclePhoto: "" }));
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-36 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground active:bg-muted transition-colors"
            >
              <Camera size={28} className="opacity-40" />
              <span style={{ fontSize: "12px" }}>탭하여 사진 업로드</span>
            </button>
          )}
          {photoPreview && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-2 w-full text-center text-primary py-2 rounded-xl bg-primary/10 text-sm"
            >
              사진 변경
            </button>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-white py-4 rounded-2xl font-medium text-sm active:opacity-90 transition-opacity"
        >
          {isEdit ? "수정 완료" : "회원 등록"}
        </button>
      </form>
    </div>
  );
}
