import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import logo from "@/imports/logo2.png";

interface LoginScreenProps {
  onLogin: (adminId: string) => void;
  admins: Admin[];
}

export interface Admin {
  id: string;
  password: string;
  name: string;
  isSuperAdmin: boolean;
}

export function LoginScreen({ onLogin, admins }: LoginScreenProps) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const admin = admins.find((a) => a.id === id && a.password === password);
    if (admin) {
      setError("");
      onLogin(admin.id);
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="flex flex-col h-full bg-primary">
      {/* Top section */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8">
        {/* Logo */}
        <div className="w-48 h-48 rounded-full overflow-hidden mb-5 shadow-xl ring-4 ring-white/30">
          <img src={logo} alt="전일련 로고" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-white text-2xl font-semibold mb-1">전일련 회원관리 시스템</h1>
        <p className="text-blue-200 text-sm">관리자 로그인</p>
      </div>

      {/* Login card */}
      <div className="bg-background rounded-t-3xl px-6 pt-8 pb-10">
        <form onSubmit={handleLogin} className={`space-y-4 ${shake ? "animate-[shake_0.4s_ease]" : ""}`}>
          {/* ID */}
          <div>
            <label className="text-muted-foreground block mb-1.5" style={{ fontSize: "12px" }}>관리자 ID</label>
            <input
              type="text"
              inputMode="numeric"
              value={id}
              onChange={(e) => { setId(e.target.value); setError(""); }}
              placeholder="아이디 입력"
              maxLength={20}
              className="w-full bg-muted border border-border rounded-2xl px-4 py-3.5 text-foreground text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-muted-foreground block mb-1.5" style={{ fontSize: "12px" }}>비밀번호</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                inputMode="numeric"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="비밀번호 입력"
                maxLength={20}
                className="w-full bg-muted border border-border rounded-2xl px-4 py-3.5 pr-12 text-foreground text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-xs text-center">{error}</p>
          )}

          {/* Login button */}
          <button
            type="submit"
            className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 mt-2 active:opacity-90 transition-opacity"
          >
            <LogIn size={18} />
            로그인
          </button>
        </form>

        <p className="text-center text-muted-foreground mt-6" style={{ fontSize: "11px" }}>
          전일련 회원관리 시스템 v1.0
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
