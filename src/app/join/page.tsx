"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createMentorProfile, createMenteeProfile } from "@/lib/data";
import { saveSession } from "@/lib/session";

function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = params.get("role") === "mentor" ? "mentor" : "mentee";

  const [role, setRole] = useState<"mentee" | "mentor">(initialRole);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("26卒");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (role === "mentor") {
        const profile = await createMentorProfile(name.trim(), grade.trim());
        saveSession({ id: profile.id, name: profile.name, role: "mentor" });
        router.push("/mentor");
      } else {
        const profile = await createMenteeProfile(
          name.trim(),
          grade.trim(),
          inviteCode.trim() || undefined
        );
        saveSession({ id: profile.id, name: profile.name, role: "mentee" });
        router.push("/mentee");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] px-6 py-16">
      <div className="mx-auto max-w-md">
        <Link href="/" className="font-display text-lg text-[var(--ink)]">
          航路
        </Link>
        <h1 className="font-display mt-6 text-2xl text-[var(--ink)]">はじめる</h1>
        <p className="mt-2 text-sm text-[var(--slate)]">
          パスワードは不要です。名前だけ入力してください。
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
