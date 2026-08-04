"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TagChip } from "@/components/badges";
import {
  addComment,
  getCurrentUser,
  getPublicFeed,
  getProfile,
  toggleCheer,
  type FeedItem,
  type Profile,
} from "@/lib/data";

export default function FeedPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const p = await getProfile(user.id);
      if (!p) {
        router.replace("/onboarding");
        return;
      }
      setProfile(p);
      refresh(p.id);
    })();
  }, [router]);

  async function refresh(userId: string) {
    setLoading(true);
    try {
      const feed = await getPublicFeed(userId);
      setItems(feed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheer(item: FeedItem) {
    if (!profile) return;
    // 楽観的に見た目を先に更新
    setItems((prev) =>
      prev.map((i) =>
        i.checkIn.id === item.checkIn.id
          ? {
              ...i,
              iCheered: !i.iCheered,
              cheerCount: i.cheerCount + (i.iCheered ? -1 : 1),
            }
          : i
      )
    );
    try {
      await toggleCheer(item.checkIn.id, profile.id, item.iCheered);
    } catch {
      refresh(profile.id);
    }
  }

  async function handleAddComment(checkInId: string) {
    if (!profile) return;
    const body = (commentDrafts[checkInId] ?? "").trim();
    if (!body) return;
    await addComment(checkInId, profile.id, body);
    setCommentDrafts((prev) => ({ ...prev, [checkInId]: "" }));
    refresh(profile.id);
  }

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
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display text-lg text-[var(--ink)]">
            航路
          </Link>
          <Link
            href={profile.role === "mentor" ? "/mentor" : "/mentee"}
            className="text-xs text-[var(--slate)] underline hover:text-[var(--ink)]"
          >
            自分のページに戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pt-8">
        <h1 className="font-display text-2xl text-[var(--ink)]">みんなの記録</h1>
        <p className="mt-1 text-xs text-[var(--slate)]">
          「共有する」を選んで投稿された記録です。応援したり、コメントしたりできます。
        </p>

        {error && (
          <p className="mt-4 rounded-md border border-[var(--berry)] bg-[var(--berry-soft)] p-3 text-xs text-[var(--berry)]">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <article key={item.checkIn.id} className="rounded-lg border border-[var(--line)] bg-white p-5">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: item.author.avatar_color }}
                >
                  {item.author.name[0]}
                </span>
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">{item.author.name}</p>
                  <p className="text-[11px] text-[var(--slate)]">
                    {item.author.role === "mentor" ? "メンター" : "メンティー"}
                    {item.companyName ? ` ・ ${item.companyName}` : ""}
                    {" ・ "}
                    {formatDateTime(item.checkIn.createdAt)}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">{item.checkIn.note}</p>

              <div className="mt-2 flex flex-wrap gap-1">
                {item.checkIn.tags.map((t) => (
                  <TagChip key={t} tag={t} />
                ))}
              </div>

              <div className="mt-4 flex items-center gap-4 border-t border-[var(--line)] pt-3">
                <button
                  onClick={() => handleCheer(item)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                    item.iCheered
                      ? "border-[var(--gold)] bg-[var(--gold-soft)]/40 text-[var(--gold)]"
                      : "border-[var(--line)] text-[var(--slate)] hover:border-[var(--gold-soft)]"
                  }`}
                >
                  🎉 応援する {item.cheerCount > 0 && item.cheerCount}
                </button>
                <button
                  onClick={() =>
                    setOpenComments((prev) => ({
                      ...prev,
                      [item.checkIn.id]: !prev[item.checkIn.id],
                    }))
                  }
                  className="text-xs text-[var(--slate)] underline hover:text-[var(--ink)]"
                >
                  コメント {item.comments.length > 0 && `(${item.comments.length})`}
                </button>
              </div>

              {openComments[item.checkIn.id] && (
                <div className="mt-3 space-y-2 border-t border-[var(--line)] pt-3">
                  {item.comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-2">
                      <span
                        className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                        style={{ backgroundColor: c.authorAvatarColor }}
                      >
                        {c.authorName[0]}
                      </span>
                      <div className="rounded-md bg-[var(--paper)] px-3 py-1.5">
                        <p className="text-[11px] font-medium text-[var(--ink-soft)]">{c.authorName}</p>
                        <p className="text-sm text-[var(--ink)]">{c.body}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input
                      value={commentDrafts[item.checkIn.id] ?? ""}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({ ...prev, [item.checkIn.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddComment(item.checkIn.id);
                      }}
                      placeholder="コメントする"
                      className="flex-1 rounded-md border border-[var(--line)] px-3 py-1.5 text-sm outline-none focus:border-[var(--gold)]"
                    />
                    <button
                      onClick={() => handleAddComment(item.checkIn.id)}
                      className="rounded-md bg-[var(--ink)] px-3 py-1.5 text-xs font-medium text-white"
                    >
                      送信
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}

          {items.length === 0 && (
            <p className="text-sm text-[var(--slate)]">
              まだ共有された記録がありません。記録画面で「みんなの記録にも共有する」をオンにすると、ここに表示されます。
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}
