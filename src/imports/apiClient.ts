// 가비아 MySQL API 클라이언트
// VITE_API_URL 환경변수에 백엔드 서버 URL을 설정하세요
//
// Node.js 서버 사용 시:  VITE_API_URL=http://localhost:3001
// PHP 백엔드 사용 시:    VITE_API_URL=https://your-domain.com/api/api.php?action=
//
// 설정이 없으면 localStorage 전용 모드로 자동 전환됩니다.

// 환경변수가 없으면 현재 도메인에서 api/api.php 자동 감지
function detectApiBase(): string {
  const env = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
  if (env.trim()) return env.trim().replace(/\/$/, "");
  // 브라우저에서 실행 중이고 api/api.php가 같은 경로에 있으면 자동 사용
  if (typeof window !== "undefined") {
    const base = window.location.href.replace(/\/[^/]*$/, "");
    return `${base}/api/api.php`;
  }
  return "";
}

export const API_BASE = detectApiBase();
export const hasApi   = API_BASE !== "";

export type ApiStatus = "idle" | "checking" | "connected" | "offline";

// PHP 모드 감지: URL에 '?action=' 또는 'api.php' 포함
const IS_PHP = API_BASE.includes("api.php") || API_BASE.includes("?action=");

function buildUrl(resource: string, phpAction?: string): string {
  if (IS_PHP) {
    // PHP: GET /api.php?action=get_members
    const base = API_BASE.includes("?") ? API_BASE.split("?")[0] : API_BASE;
    return `${base}?action=${phpAction ?? resource}`;
  }
  // Node.js: GET /api/members
  return `${API_BASE}/api/${resource}`;
}

async function request<T>(resource: string, phpAction?: string, body?: unknown): Promise<T> {
  const url   = buildUrl(resource, phpAction);
  const init: RequestInit = body !== undefined
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    : { method: "GET" };

  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPing(): Promise<boolean> {
  if (!hasApi) return false;
  try {
    const r = await request<{ ok: boolean }>("ping", "ping");
    return r.ok === true;
  } catch {
    return false;
  }
}

export async function apiGetMembers(): Promise<unknown[]> {
  if (!hasApi) return [];
  const data = await request<unknown>("members", "get_members");
  return Array.isArray(data) ? data : [];
}

export async function apiSaveMembers(members: unknown[]): Promise<void> {
  if (!hasApi) return;
  await request<unknown>("members", "save_members", members);
}

export async function apiGetAdmins(): Promise<unknown[]> {
  if (!hasApi) return [];
  const data = await request<unknown>("admins", "get_admins");
  return Array.isArray(data) ? data : [];
}

export async function apiSaveAdmins(admins: unknown[]): Promise<void> {
  if (!hasApi) return;
  await request<unknown>("admins", "save_admins", admins);
}
