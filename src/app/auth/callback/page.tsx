"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/data";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // supabase-jsがURLからセッションを検出するのを少し待つ
      for (let i = 0; i < 20; i++) {
        const user = await getCurrentUser();
        if (user) {
          if (cancelled) return;
          try {
            const profile = await getProfile(user.id);
            if (profile) {
              router.replace(profile.role === "mentor" ? "/mentor" : "/mentee");
            } else {
              const role = params.get("role") === "mentor" ? "mentor" : "mentee";
              router.replace(`/onboarding?role=${role}`);
            }
          } catch {
            setError("プロフィールの確認に失敗しました");
          }
          return;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      if (!cancelled) {
        setError("ログインに失敗しました。もう一度リンクを送信し直してください。");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router, params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-6">
      <p className="text-sm text-[var(--slate)]">
        {error ?? "ログイン処理中です..."}
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}
