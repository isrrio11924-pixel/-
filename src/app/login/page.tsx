"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getProfile, sendMagicLink } from "@/lib/data";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get("role") === "mentor" ? "mentor" : "mentee";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?role=${role}`;
      await sendMagicLink(email.trim(), redirectTo);
      setSent(true);
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

  return (
    <div className="min-h-screen bg-[var(--paper)] px-6 py-16">
      <div className="mx-auto max-w-md">
        <Link href="/" className="font-display text-lg text-[var(--ink)]">
          航路
        </Link>
        <h1 className="font-display mt-6 text-2xl text-[var(--ink)]">ログイン</h1>
        <p className="mt-2 text-sm text-[var(--slate)]">
          登録済みの方も初めての方も、メールアドレスにログイン用のリンクをお送りします。パスワードは不要です。
        </p>

        {sent ? (
          <div className="mt-8 rounded-lg border border-[var(--gold)] bg-[var(--gold-soft)]/30 p-5">
            <p className="text-sm text-[var(--ink)]">
              <strong>{email}</strong> 宛にログイン用のリンクを送りました。
            </p>
            <p className="mt-2 text-xs text-[var(--slate)]">
              メールを確認して、中のリンクをタップしてください（届かない場合は迷惑メールフォルダもご確認ください）。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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

            {error && <p className="text-sm text-[var(--berry)]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[var(--ink)] py-2.5 text-sm font-medium text-white transition hover:bg-[var(--ink-soft)] disabled:opacity-60"
            >
              {loading ? "送信中..." : "ログインリンクを送る"}
            </button>

            <p className="text-center text-xs text-[var(--slate)]">
              {role === "mentor" ? (
                <Link href="/login?role=mentee" className="underline">
                  メンティーとして始めたい方はこちら
                </Link>
              ) : (
                <Link href="/login?role=mentor" className="underline">
                  メンターとして始めたい方はこちら
                </Link>
              )}
            </p>
          </form>
        )}
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
