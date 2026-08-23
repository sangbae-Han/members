import type { Member } from "./types";

export interface Admin {
  id: string;
  password: string;
  name: string;
  isSuperAdmin: boolean;
}

const KEYS = {
  members: "jil_members",
  admins: "jil_admins",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const DEFAULT_ADMINS: Admin[] = [
  { id: "9999", password: "9999", name: "최고관리자", isSuperAdmin: true },
  { id: "admin", password: "1234", name: "관리자", isSuperAdmin: false },
];

export function getMembers(): Member[] {
  return load<Member[]>(KEYS.members, []);
}

export function saveMembers(members: Member[]): void {
  save(KEYS.members, members);
}

export function getAdmins(): Admin[] {
  return load<Admin[]>(KEYS.admins, DEFAULT_ADMINS);
}

export function saveAdmins(admins: Admin[]): void {
  save(KEYS.admins, admins);
}
