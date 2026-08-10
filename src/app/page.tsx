"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getProfile } from "@/lib/data";

export default function Home() {
  const router = useRouter();
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

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
        <p className="text-sm text-[var(--slate)]">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="mx-auto max-w-5xl px-6 pt-16 pb-10 text-center">
        <p className="text-xs tracking-[0.3em] text-[var(--slate)]">SHUKATSU LOGBOOK</p>
        <h1 className="font-display mt-4 text-5xl font-semibold text-[var(--ink)] sm:text-6xl">
          航路
        </h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[var(--ink-soft)]">
          就活は、ひとりで進む航海。
          <br />
          毎日の記録が航海日誌になり、メンターはそれを見て、
          必要なときに舵を取る手を貸す。
        </p>
      </header>

      <div className="mx-auto max-w-3xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Link
            href="/login?role=mentee"
            className="group relative rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-8 transition hover:border-[var(--gold)] hover:shadow-[0_8px_24px_-12px_rgba(22,35,61,0.25)]"
          >
            <span className="text-xs tracking-[0.2em] text-[var(--gold)]">MENTEE</span>
            <h2 className="font-display mt-3 text-2xl text-[var(--ink)]">記録する</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--slate)]">
              企業ごとの進捗と、今の気持ちを一言だけ。
              <br />
              30秒の記録が、あなたの航海日誌になる。
            </p>
            <span className="mt-6 inline-flex items-center text-sm font-medium text-[var(--ink)] group-hover:text-[var(--gold)]">
              エンターとして開く →
            </span>
          </Link>

          <Link
            href="/login?role=mentor"
            className="group relative rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] p-8 transition hover:border-[var(--gold)] hover:shadow-[0_8px_24px_-12px_rgba(22,35,61,0.25)]"
          >
            <span className="text-xs tracking-[0.2em] text-[var(--gold)]">MENTOR</span>
            <h2 className="font-display mt-3 text-2xl text-[var(--ink)]">見守る</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--slate)]">
              後輩たちの航路をひと目で俯瞰し、
              <br />
              声をかけるべきタイミングに気づく。
            </p>
            <span className="mt-6 inline-flex items-center text-sm font-medium text-[var(--ink)] group-hover:text-[var(--gold)]">
              メンターとして開く →
            </span>
          </Link>
        </div>

        <p className="mt-10 text-center text-xs text-[var(--slate)]">
          <Link href="/terms" className="underline">
            利用規約
          </Link>
          {" ・ "}
          <Link href="/privacy" className="underline">
            プライバシーポリシー
          </Link>
        </p>
      </div>
    </div>
  );
}
