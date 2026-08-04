"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge, TagChip, TemperatureTag } from "@/components/badges";
import {
  addCheckIn,
  addCompany,
  getCheckInsForMentee,
  getCompaniesForMentee,
  updateCompany,
} from "@/lib/data";
import { clearSession, loadSession, type Session } from "@/lib/session";
import {
  STATUS_LABEL,
  TAG_LABEL,
  type CheckIn,
  type Company,
  type SelectionStatus,
  type StruggleTag,
  type Temperature,
} from "@/lib/types";

const STATUS_OPTIONS: SelectionStatus[] = [
  "researching",
  "es_writing",
  "es_submitted",
  "web_test",
  "interview_1",
  "interview_2",
  "interview_final",
  "offer",
  "declined",
  "rejected",
];

const TAG_OPTIONS: StruggleTag[] = [
  "es",
  "web_test",
  "interview",
  "industry_choice",
  "motivation",
  "schedule",
];

export default function MenteePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [myCheckIns, setMyCheckIns] = useState<CheckIn[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<StruggleTag[]>([]);
  const [saved, setSaved] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyIndustry, setNewCompanyIndustry] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s || s.role !== "mentee") {
      router.replace("/join?role=mentee");
      return;
    }
    setSession(s);
    refresh(s.id);
  }, [router]);

  async function refresh(menteeId: string) {
    setLoading(true);
    try {
      const [c, ci] = await Promise.all([
        getCompaniesForMentee(menteeId),
        getCheckInsForMentee(menteeId),
      ]);
      setCompanies(c);
      setMyCheckIns(ci);
      setActiveCompanyId((prev) => prev ?? c[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  const activeCompany = companies.find((c) => c.id === activeCompanyId) ?? null;

  function toggleTag(tag: StruggleTag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleStatusChange(status: SelectionStatus) {
    if (!activeCompany || !session) return;
    await updateCompany(activeCompany.id, { status });
    refresh(session.id);
  }

  async function handleTempChange(temp: Temperature) {
    if (!activeCompany || !session) return;
    await updateCompany(activeCompany.id, { temperature: temp });
    refresh(session.id);
  }

  async function handleSubmit() {
    if (!note.trim() || !session) return;
    await addCheckIn(session.id, note.trim(), selectedTags, activeCompany?.id);
    setNote("");
    setSelectedTags([]);
    setSaved(true);
    refresh(session.id);
    setTimeout(() => setSaved(false), 2200);
  }

  async function handleAddCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!newCompanyName.trim() || !session) return;
    const created = await addCompany(session.id, newCompanyName.trim(), newCompanyIndustry.trim());
    setNewCompanyName("");
    setNewCompanyIndustry("");
    setShowAddForm(false);
    await refresh(session.id);
    setActiveCompanyId(created.id);
  }

  if (!session || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
        <p className="text-sm text-[var(--slate)]">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] pb-24">
      <TopBar name={session.name} role="mentee" />

      {error && (
        <div className="mx-auto mt-4 max-w-5xl px-6">
          <p className="rounded-md border border-[var(--berry)] bg-[var(--berry-soft)] p-3 text-xs text-[var(--berry)]">
            {error}
          </p>
        </div>
      )}

      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 pt-8 lg:grid-cols-[1.1fr_1.4fr]">
        {/* 左：企業一覧 */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-[var(--ink)]">企業一覧</h2>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="text-xs font-medium text-[var(--gold)] hover:underline"
            >
              {showAddForm ? "キャンセル" : "+ 企業を追加"}
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddCompany}
              className="mt-3 space-y-2 rounded-md border border-[var(--line)] bg-white p-3"
            >
              <input
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="企業名"
                className="w-full rounded border border-[var(--line)] p-2 text-sm outline-none focus:border-[var(--gold)]"
                required
              />
              <input
                value={newCompanyIndustry}
                onChange={(e) => setNewCompanyIndustry(e.target.value)}
                placeholder="業界（任意）"
                className="w-full rounded border border-[var(--line)] p-2 text-sm outline-none focus:border-[var(--gold)]"
              />
              <button
                type="submit"
                className="w-full rounded-md bg-[var(--ink)] py-2 text-xs font-medium text-white"
              >
                追加する
              </button>
            </form>
          )}

          <p className="mt-3 text-xs text-[var(--slate)]">タップして選考状況を更新</p>
          <div className="mt-3 space-y-3">
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCompanyId(c.id)}
                className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                  activeCompanyId === c.id
                    ? "border-[var(--gold)] bg-white shadow-[0_6px_16px_-10px_rgba(201,154,61,0.6)]"
                    : "border-[var(--line)] bg-white/60 hover:border-[var(--gold-soft)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--ink)]">{c.name}</span>
                  <TemperatureTag temp={c.temperature} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-[var(--slate)]">{c.industry}</span>
                  <StatusBadge status={c.status} />
                </div>
              </button>
            ))}
            {companies.length === 0 && !showAddForm && (
              <p className="text-sm text-[var(--slate)]">
                まだ企業が登録されていません。「+ 企業を追加」から始めましょう。
              </p>
            )}
          </div>
        </section>

        {/* 右：チェックイン */}
        <section className="rounded-lg border border-[var(--line)] bg-white p-6">
          {activeCompany ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--slate)]">{activeCompany.industry}</p>
                  <h2 className="font-display text-xl text-[var(--ink)]">{activeCompany.name}</h2>
                </div>
                <StatusBadge status={activeCompany.status} />
              </div>

              <div className="course-rule my-5" />

              <div>
                <p className="text-xs font-medium text-[var(--ink-soft)]">選考ステータス</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        activeCompany.status === s
                          ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                          : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--ink-soft)]"
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-medium text-[var(--ink-soft)]">今の温度感</p>
                <div className="mt-2 flex gap-2">
                  {(["good", "unsure", "urgent"] as Temperature[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleTempChange(t)}
                      className={`flex-1 rounded-md border px-3 py-2 text-xs transition ${
                        activeCompany.temperature === t
                          ? "border-[var(--gold)] bg-[var(--gold-soft)]/40"
                          : "border-[var(--line)] hover:border-[var(--gold-soft)]"
                      }`}
                    >
                      <TemperatureTag temp={t} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-medium text-[var(--ink-soft)]">
                  今日のひとこと（メンターに届きます）
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="例：ESの自己PRが書けなくて手が止まってる…"
                  rows={3}
                  className="mt-2 w-full rounded-md border border-[var(--line)] bg-[var(--paper)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold)]"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`rounded border px-2 py-1 text-[11px] transition ${
                        selectedTags.includes(tag)
                          ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                          : "border-[var(--line)] text-[var(--slate)]"
                      }`}
                    >
                      #{TAG_LABEL[tag]}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleSubmit}
                  className="mt-4 w-full rounded-md bg-[var(--ink)] py-2.5 text-sm font-medium text-white transition hover:bg-[var(--ink-soft)]"
                >
                  {saved ? "記録しました ✓" : "航海日誌に記録する"}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--slate)]">左の企業を選んでください。</p>
          )}

          <div className="course-rule my-6" />

          <div>
            <p className="text-xs font-medium text-[var(--ink-soft)]">これまでの記録</p>
            <ul className="mt-3 space-y-3">
              {myCheckIns.map((ci) => (
                <li key={ci.id} className="rounded-md border border-[var(--line)] bg-[var(--paper)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--slate)]">
                      {formatDateTime(ci.createdAt)}
                    </span>
                    <div className="flex gap-1">
                      {ci.tags.map((t) => (
                        <TagChip key={t} tag={t} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink)]">{ci.note}</p>
                </li>
              ))}
              {myCheckIns.length === 0 && (
                <p className="text-xs text-[var(--slate)]">まだ記録がありません。</p>
              )}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

function TopBar({ name, role }: { name: string; role: "mentee" | "mentor" }) {
  const router = useRouter();
  return (
    <header className="border-b border-[var(--line)] bg-[var(--paper-raised)]/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg text-[var(--ink)]">
          航路
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--slate)]">
            {role === "mentee" ? "メンティー" : "メンター"}
          </span>
          <span className="rounded-full bg-[var(--ink)] px-3 py-1 text-xs text-white">{name}</span>
          <button
            onClick={() => {
              clearSession();
              router.push("/join");
            }}
            className="text-xs text-[var(--slate)] underline hover:text-[var(--ink)]"
          >
            切り替える
          </button>
        </div>
      </div>
    </header>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}
