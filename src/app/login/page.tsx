"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getCurrentUser,
  getProfile,
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/data";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get("role") === "mentor" ? "mentor" : "mentee";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupDone, setSignupDone] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        setChecking(false);
        return;
      }
      const profile = await getProfile(user.id);
      if (profile) {
        router.replace(profile.role === "mentor" ? "/mentor" : "/mentee");
      } else {
        setChecking(false);
      }
    })();
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      await signInWithPassword(email.trim(), password);
      const user = await getCurrentUser();
      if (!user) throw new Error("ログインに失敗しました");
      const profile = await getProfile(user.id);
      router.push(profile ? (profile.role === "mentor" ? "/mentor" : "/mentee") : `/onboarding?role=${role}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message === "Invalid login credentials"
            ? "メールアドレスかパスワードが違います"
            : err.message
          : "エラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (password.length < 6) {
      setError("パスワードは6文字以上にしてください");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?role=${role}`;
      await signUpWithPassword(email.trim(), password, redirectTo);
      setSignupDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
        <p className="text-sm text-[var(--slate)]">読み込み中...</p>
      </div>
    );
  }

  if (signupDone) {
    return (
      <div className="min-h-screen bg-[var(--paper)] px-6 py-16">
        <div className="mx-auto max-w-md">
          <Link href="/" className="font-display text-lg text-[var(--ink)]">
            航路
          </Link>
          <h1 className="font-display mt-6 text-2xl text-[var(--ink)]">確認メールを送りました</h1>
          <div className="mt-6 rounded-lg border border-[var(--gold)] bg-[var(--gold-soft)]/30 p-5">
            <p className="text-sm text-[var(--ink)]">
              <strong>{email}</strong> 宛に確認メールを送りました。
            </p>
            <p className="mt-2 text-xs text-[var(--slate)]">
              メール内のリンクをタップすると、登録が完了します（迷惑メールフォルダも確認してみてください）。次回からはメールアドレスとパスワードでログインできます。
            </p>
          </div>
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
          {mode === "login" ? "ログイン" : "新規登録"}
        </h1>

        <div className="mt-5 flex gap-2">
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
            ログイン
          </button>
          <button
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
              mode === "signup"
                ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                : "border-[var(--line)] text-[var(--ink-soft)]"
            }`}
          >
            新規登録
          </button>
        </div>

        <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="mt-6 space-y-5">
          <label className="block">
            <span className="text-xs font-medium text-[var(--ink-soft)]">メールアドレス</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-white p-2.5 text-sm outline-none focus:border-[var(--gold)]"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-[var(--ink-soft)]">パスワード</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "6文字以上" : "パスワード"}
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-white p-2.5 text-sm outline-none focus:border-[var(--gold)]"
              required
            />
          </label>

          {error && <p className="text-sm text-[var(--berry)]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[var(--ink)] py-2.5 text-sm font-medium text-white transition hover:bg-[var(--ink-soft)] disabled:opacity-60"
          >
            {loading ? "処理中..." : mode === "login" ? "ログイン" : "登録する"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
