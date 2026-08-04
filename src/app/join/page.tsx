"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  createMentorProfile,
  createMenteeProfile,
  loginWithCode,
  type Profile,
} from "@/lib/data";
import { saveSession } from "@/lib/session";

function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = params.get("role") === "mentor" ? "mentor" : "mentee";

  const [mode, setMode] = useState<"register" | "login">("register");
  const [role, setRole] = useState<"mentee" | "mentor">(initialRole);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("26卒");
  const [inviteCode, setInviteCode] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProfile, setCreatedProfile] = useState<Profile | null>(null);

  function goToApp(profile: Profile) {
    saveSession({ id: profile.id, name: profile.name, role: profile.role });
    router.push(profile.role === "mentor" ? "/mentor" : "/mentee");
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const profile =
        role === "mentor"
          ? await createMentorProfile(name.trim(), grade.trim())
          : await createMenteeProfile(name.trim(), grade.trim(), inviteCode.trim() || undefined);
      // すぐには遷移せず、ログインコードを見せる
      setCreatedProfile(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const profile = await loginWithCode(loginCode);
      goToApp(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  // 登録直後：ログインコードを表示する画面
  if (createdProfile) {
    return (
      <div className="min-h-screen bg-[var(--paper)] px-6 py-16">
        <div className="mx-auto max-w-md">
          <Link href="/" className="font-display text-lg text-[var(--ink)]">
            航路
          </Link>
          <h1 className="font-display mt-6 text-2xl text-[var(--ink)]">登録できました</h1>
          <p className="mt-2 text-sm text-[var(--slate)]">
            以下の「ログインコード」を必ず控えてください。次回から、このコードだけで同じアカウントに戻れます（スマホからでもOKです）。
          </p>

          <div className="mt-6 rounded-lg border border-[var(--gold)] bg-[var(--gold-soft)]/30 p-5 text-center">
            <p className="text-xs font-medium text-[var(--ink-soft)]">あなたのログインコード</p>
            <p className="font-display mt-2 text-3xl tracking-[0.2em] text-[var(--ink)]">
              {createdProfile.login_code}
            </p>
          </div>

          {createdProfile.role === "mentor" && (
            <div className="mt-4 rounded-lg border border-[var(--line)] bg-white p-5 text-center">
              <p className="text-xs font-medium text-[var(--ink-soft)]">後輩を招待するコード</p>
              <p className="font-display mt-2 text-2xl tracking-[0.2em] text-[var(--ink)]">
                {createdProfile.invite_code}
              </p>
              <p className="mt-2 text-[11px] text-[var(--slate)]">
                こちらは後輩に共有する別のコードです（ログインコードとは違います）
              </p>
            </div>
          )}

          <button
            onClick={() => goToApp(createdProfile)}
            className="mt-6 w-full rounded-md bg-[var(--ink)] py-2.5 text-sm font-medium text-white transition hover:bg-[var(--ink-soft)]"
          >
            控えました。始める →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] px-6 py-16">
      <div className="mx-auto max-w-md">
        <Link href="/" className="font-display text-lg text-[var(--ink)]">
          航路
        </Link>
        <h1 className="font-display mt-6 text-2xl text-[var(--ink)]">
          {mode === "register" ? "はじめる" : "おかえりなさい"}
        </h1>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
              mode === "register"
                ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                : "border-[var(--line)] text-[var(--ink-soft)]"
            }`}
          >
            はじめて使う
          </button>
          <button
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
              mode === "login"
                ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                : "border-[var(--line)] text-[var(--ink-soft)]"
            }`}
          >
            ログインコードで戻る
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="mt-6 space-y-5">
            <label className="block">
              <span className="text-xs font-medium text-[var(--ink-soft)]">ログインコード</span>
              <input
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                placeholder="例：AB12CD"
                className="mt-1 w-full rounded-md border border-[var(--line)] bg-white p-2.5 text-sm uppercase outline-none focus:border-[var(--gold)]"
                required
              />
            </label>
            {error && <p className="text-sm text-[var(--berry)]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[var(--ink)] py-2.5 text-sm font-medium text-white transition hover:bg-[var(--ink-soft)] disabled:opacity-60"
            >
              {loading ? "確認中..." : "ログイン"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="mt-6 space-y-5">
            <div>
              <p className="text-xs font-medium text-[var(--ink-soft)]">あなたの役割</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole("mentee")}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
                    role === "mentee"
                      ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                      : "border-[var(--line)] text-[var(--ink-soft)]"
                  }`}
                >
                  メンティー
                </button>
                <button
                  type="button"
                  onClick={() => setRole("mentor")}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
                    role === "mentor"
                      ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                      : "border-[var(--line)] text-[var(--ink-soft)]"
                  }`}
                >
                  メンター
                </button>
              </div>
            </div>

            <label className="block">
              <span className="text-xs font-medium text-[var(--ink-soft)]">名前</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：佐藤 遥"
                className="mt-1 w-full rounded-md border border-[var(--line)] bg-white p-2.5 text-sm outline-none focus:border-[var(--gold)]"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-[var(--ink-soft)]">学年（任意）</span>
              <input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="例：26卒"
                className="mt-1 w-full rounded-md border border-[var(--line)] bg-white p-2.5 text-sm outline-none focus:border-[var(--gold)]"
              />
            </label>

            {role === "mentee" && (
              <label className="block">
                <span className="text-xs font-medium text-[var(--ink-soft)]">
                  メンターの招待コード（あれば）
                </span>
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="例：AB12CD"
                  className="mt-1 w-full rounded-md border border-[var(--line)] bg-white p-2.5 text-sm uppercase outline-none focus:border-[var(--gold)]"
                />
                <span className="mt-1 block text-[11px] text-[var(--slate)]">
                  後で追加することもできます。
                </span>
              </label>
            )}

            {error && <p className="text-sm text-[var(--berry)]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[var(--ink)] py-2.5 text-sm font-medium text-white transition hover:bg-[var(--ink-soft)] disabled:opacity-60"
            >
              {loading ? "作成中..." : "はじめる"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}
