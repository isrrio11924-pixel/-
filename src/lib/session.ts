// 認証なしの簡易版。プロフィールIDと役割をブラウザのlocalStorageに保存するだけ。
// 本格運用する際はSupabase Authに置き換える。

export interface Session {
  id: string;
  name: string;
  role: "mentor" | "mentee";
}

const KEY = "kouro_session";

export function saveSession(session: Session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
