import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import logo from "@/imports/logo2.png";
import type { Admin } from "../components/LoginScreen";

interface Props { admins: Admin[]; onLogin: (id: string) => void; }

export function WebLogin({ admins, onLogin }: Props) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const admin = admins.find((a) => a.id === id && a.password === pw);
    if (admin) { onLogin(admin.id); }
    else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      setShake(true); setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col items-center justify-center w-1/2 px-16 gap-8">
        <img src={logo} alt="전일련 로고" className="w-48 h-48 rounded-full object-cover ring-4 ring-white/20 shadow-2xl" />
        <div className="text-center">
          <h1 className="text-white text-4xl font-bold mb-3">전일련</h1>
          <p className="text-blue-200 text-lg">회원관리 시스템</p>
          <p className="text-blue-300 text-sm mt-2">전국화물 1톤 윙탑연합</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-xs">
          {[["회원 관리", "체계적인 회원 정보 관리"], ["징계/상조", "내역 통합 관리"], ["AI 검색", "자연어 스마트 검색"]].map(([t, d]) => (
            <div key={t} className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-semibold text-xs">{t}</p>
              <p className="text-blue-200 text-xs mt-1 leading-tight">{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <img src={logo} alt="전일련 로고" className="w-20 h-20 rounded-full object-cover mb-3" />
            <h1 className="text-foreground text-2xl font-bold">전일련 회원관리 시스템</h1>
          </div>

          <h2 className="text-foreground text-2xl font-bold mb-1">로그인</h2>
          <p className="text-muted-foreground text-sm mb-8">관리자 계정으로 로그인해 주세요.</p>

          <form onSubmit={handleSubmit} className={`space-y-4 ${shake ? "animate-[shake_0.4s_ease]" : ""}`}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">관리자 ID</label>
              <input
                value={id} onChange={(e) => { setId(e.target.value); setError(""); }}
                placeholder="아이디 입력"
                className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-input-background text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">비밀번호</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={pw} onChange={(e) => { setPw(e.target.value); setError(""); }}
                  placeholder="비밀번호 입력"
                  className="w-full border border-border rounded-lg px-4 py-3 pr-11 text-sm bg-input-background text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
            <button type="submit" className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
              <LogIn size={16} /> 로그인
            </button>
          </form>

          <p className="text-center text-muted-foreground text-xs mt-8">전일련 회원관리 시스템 v1.0</p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)}
        }
      `}</style>
    </div>
  );
}
