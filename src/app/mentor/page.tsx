"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge, TagChip, TemperatureTag } from "@/components/badges";
import {
  getCurrentUser,
  getMenteesForMentor,
  getProfile,
  signOut,
  type MenteeWithData,
  type Profile,
} from "@/lib/data";
import { TAG_LABEL, type StruggleTag } from "@/lib/types";

const STALE_DAYS = 7;

function daysSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function MentorPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [rowsData, setRowsData] = useState<MenteeWithData[]>([]);
  const [tagFilter, setTagFilter] = useState<StruggleTag | "all">("all");
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/login?role=mentor");
        return;
      }
      const p = await getProfile(user.id);
      if (!p) {
        router.replace("/onboarding?role=mentor");
        return;
      }
      if (p.role !== "mentor") {
        router.replace("/mentee");
        return;
      }
      setProfile(p);
      refresh(p.id);
    })();
  }, [router]);

  async function refresh(mentorId: string) {
    setLoading(true);
    try {
      const mentees = await getMenteesForMentor(mentorId);
      setRowsData(mentees);
      setSelectedMenteeId((prev) => prev ?? mentees[0]?.profile.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  const rows = useMemo(() => {
    return rowsData.map(({ profile: menteeProfile, companies, checkIns }) => {
      const mostUrgentTemp = companies.some((c) => c.temperature === "urgent")
        ? "urgent"
        : companies.some((c) => c.temperature === "unsure")
        ? "unsure"
        : "good";

      const lastUpdate = companies.reduce(
        (latest, c) => (!latest || c.updatedAt > latest ? c.updatedAt : latest),
        ""
      );
      const staleDays = lastUpdate ? daysSince(lastUpdate) : 999;
      const needsFollowUp = mostUrgentTemp === "urgent" || staleDays >= STALE_DAYS;
      const allTags = checkIns.flatMap((ci) => ci.tags);
      const sortedCheckIns = [...checkIns].sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1
      );

      return {
        mentee: menteeProfile,
        companies,
        checkIns: sortedCheckIns,
        mostUrgentTemp: mostUrgentTemp as "good" | "unsure" | "urgent",
        staleDays,
        needsFollowUp,
        allTags,
      };
    });
  }, [rowsData]);

  const filteredRows = rows.filter((r) =>
    tagFilter === "all" ? true : r.allTags.includes(tagFilter)
  );
  const sortedRows = [...filteredRows].sort((a, b) => {
    if (a.needsFollowUp !== b.needsFollowUp) return a.needsFollowUp ? -1 : 1;
    return b.staleDays - a.staleDays;
  });
  const selected = rows.find((r) => r.mentee.id === selectedMenteeId) ?? sortedRows[0];

  if (!profile || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
        <p className="text-sm text-[var(--slate)]">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] pb-24">
      <header className="border-b border-[var(--line)] bg-[var(--paper-raised)]/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display text-lg text-[var(--ink)]">
            航路
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--slate)]">メンター・ダッシュボード</span>
            <Link href="/feed" className="text-xs text-[var(--slate)] underline hover:text-[var(--ink)]">
              みんなの記録
            </Link>
            <span className="rounded-full bg-[var(--ink)] px-3 py-1 text-xs text-white">
              {profile.name}
            </span>
            <button
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
              className="text-xs text-[var(--slate)] underline hover:text-[var(--ink)]"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-8">
        {error && (
          <p className="mb-4 rounded-md border border-[var(--berry)] bg-[var(--berry-soft)] p-3 text-xs text-[var(--berry)]">
            {error}
          </p>
        )}

        {profile.invite_code && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-[var(--gold)] bg-[var(--gold-soft)]/30 px-4 py-3">
            <div>
              <p className="text-xs font-medium text-[var(--ink-soft)]">後輩を招待するコード</p>
              <p className="font-display text-lg tracking-wider text-[var(--ink)]">
                {profile.invite_code}
              </p>
            </div>
            <p className="max-w-xs text-right text-[11px] text-[var(--slate)]">
              このコードを後輩に共有してください。後輩はメール登録後のプロフィール作成画面で入力すると、あなたに紐づきます。
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-[var(--ink)]">担当メンティーの航路</h1>
            <p className="mt-1 text-xs text-[var(--slate)]">
              要フォローの後輩を上位に表示しています
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={tagFilter === "all"} onClick={() => setTagFilter("all")}>
              すべて
            </FilterChip>
            {(Object.keys(TAG_LABEL) as StruggleTag[]).map((tag) => (
              <FilterChip key={tag} active={tagFilter === tag} onClick={() => setTagFilter(tag)}>
                #{TAG_LABEL[tag]}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
          <section className="space-y-3">
            {sortedRows.map((row) => (
              <button
                key={row.mentee.id}
                onClick={() => setSelectedMenteeId(row.mentee.id)}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  selected?.mentee.id === row.mentee.id
                    ? "border-[var(--gold)] bg-white"
                    : "border-[var(--line)] bg-white/60 hover:border-[var(--gold-soft)]"
                } ${row.needsFollowUp ? "ring-1 ring-[var(--berry)]/40" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: row.mentee.avatar_color }}
                    >
                      {row.mentee.name[0]}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[var(--ink)]">{row.mentee.name}</p>
                      <p className="text-[11px] text-[var(--slate)]">{row.mentee.grade}</p>
                    </div>
                  </div>
                  {row.needsFollowUp && (
                    <span className="rounded-full bg-[var(--berry-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--berry)]">
                      要フォロー
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {row.companies.map((c) => (
                    <span
                      key={c.id}
                      className="rounded border border-[var(--line)] bg-[var(--paper)] px-2 py-0.5 text-[11px] text-[var(--ink-soft)]"
                    >
                      {c.name}
                    </span>
                  ))}
                  {row.companies.length === 0 && (
                    <span className="text-[11px] text-[var(--slate)]">まだ企業登録なし</span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <TemperatureTag temp={row.mostUrgentTemp} />
                  <span className="text-[11px] text-[var(--slate)]">
                    {row.staleDays >= 999
                      ? "更新なし"
                      : row.staleDays === 0
                      ? "今日"
                      : `${row.staleDays}日前`}
                  </span>
                </div>
              </button>
            ))}
            {sortedRows.length === 0 && (
              <p className="text-sm text-[var(--slate)]">
                まだ後輩が紐づいていません。上の招待コードを共有してみましょう。
              </p>
            )}
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-white p-6">
            {selected ? (
              <>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: selected.mentee.avatar_color }}
                  >
                    {selected.mentee.name[0]}
                  </span>
                  <div>
                    <p className="font-display text-lg text-[var(--ink)]">
                      {selected.mentee.name}
                    </p>
                    <p className="text-xs text-[var(--slate)]">{selected.mentee.grade}</p>
                  </div>
                </div>

                <div className="course-rule my-5" />

                <p className="text-xs font-medium text-[var(--ink-soft)]">企業ステータス</p>
                <ul className="mt-2 space-y-2">
                  {selected.companies.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between rounded-md border border-[var(--line)] bg-[var(--paper)] px-3 py-2"
                    >
                      <div>
                        <p className="text-sm text-[var(--ink)]">{c.name}</p>
                        <p className="text-[11px] text-[var(--slate)]">{c.industry}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={c.status} />
                        <TemperatureTag temp={c.temperature} />
                      </div>
                    </li>
                  ))}
                  {selected.companies.length === 0 && (
                    <p className="text-xs text-[var(--slate)]">まだ企業データがありません。</p>
                  )}
                </ul>

                <p className="mt-5 text-xs font-medium text-[var(--ink-soft)]">最近の記録</p>
                <ul className="mt-2 space-y-2">
                  {selected.checkIns.map((ci) => (
                    <li key={ci.id} className="rounded-md border border-[var(--line)] p-3">
                      <div className="flex flex-wrap gap-1">
                        {ci.tags.map((t) => (
                          <TagChip key={t} tag={t} />
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-[var(--ink)]">{ci.note}</p>
                    </li>
                  ))}
                  {selected.checkIns.length === 0 && (
                    <p className="text-xs text-[var(--slate)]">まだ記録がありません。</p>
                  )}
                </ul>
              </>
            ) : (
              <p className="text-sm text-[var(--slate)]">左からメンティーを選んでください。</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition ${
        active
          ? "border-[var(--ink)] bg-[var(--ink)] text-white"
          : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--ink-soft)]"
      }`}
    >
      {children}
    </button>
  );
}
