import { createClient } from "./supabase/client";
import type {
  CheckIn,
  Company,
  SelectionStatus,
  StruggleTag,
  Temperature,
} from "./types";

export interface Profile {
  id: string; // auth.users.id と同じ
  name: string;
  role: "mentor" | "mentee";
  grade: string | null;
  avatar_color: string;
  invite_code: string | null;
}

const AVATAR_COLORS = ["#C99A3D", "#5B7B5A", "#A64B4B", "#4C6B8A", "#8A5C9B"];

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ---------- 認証 ----------

export async function signUpWithPassword(email: string, password: string, redirectTo: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
  return data;
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

// ---------- プロフィール ----------

export async function getProfile(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function createProfile(params: {
  userId: string;
  name: string;
  role: "mentor" | "mentee";
  grade: string;
  mentorInviteCode?: string;
}) {
  const supabase = createClient();
  const { userId, name, role, grade, mentorInviteCode } = params;

  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      name,
      role,
      grade,
      avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      invite_code: role === "mentor" ? generateInviteCode() : null,
    })
    .select()
    .single();
  if (error) throw error;

  if (role === "mentee" && mentorInviteCode) {
    const { data: mentor } = await supabase
      .from("profiles")
      .select("id")
      .eq("invite_code", mentorInviteCode.trim().toUpperCase())
      .eq("role", "mentor")
      .maybeSingle();

    if (mentor) {
      await supabase.from("mentor_mentee_relations").insert({
        mentor_id: mentor.id,
        mentee_id: userId,
      });
    } else {
      throw new Error("招待コードに一致するメンターが見つかりませんでした（プロフィールは作成されています）");
    }
  }

  return profile as Profile;
}

// ---------- メンターとの紐付け ----------

export interface LinkedMentor {
  relationId: string;
  mentor: Profile;
}

export async function getMentorsForMentee(menteeId: string): Promise<LinkedMentor[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mentor_mentee_relations")
    .select("id, mentor_id, profiles!mentor_mentee_relations_mentor_id_fkey(*)")
    .eq("mentee_id", menteeId);
  if (error) throw error;
  return (data ?? [])
    .filter((row) => (row as unknown as { profiles: Profile | null }).profiles !== null)
    .map((row) => ({
      relationId: row.id as string,
      mentor: (row as unknown as { profiles: Profile }).profiles,
    }));
}

export async function linkMentorByInviteCode(menteeId: string, inviteCode: string) {
  const supabase = createClient();
  const { data: mentor, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("invite_code", inviteCode.trim().toUpperCase())
    .eq("role", "mentor")
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!mentor) throw new Error("招待コードに一致するメンターが見つかりませんでした");

  const { error } = await supabase
    .from("mentor_mentee_relations")
    .insert({ mentor_id: mentor.id, mentee_id: menteeId });
  if (error) {
    if (isUniqueViolation(error)) throw new Error("すでにそのメンターと繋がっています");
    throw error;
  }
}

export async function unlinkMentor(relationId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("mentor_mentee_relations").delete().eq("id", relationId);
  if (error) throw error;
}

function isUniqueViolation(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

// ---------- 企業・チェックイン ----------

export async function getCompaniesForMentee(menteeId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("mentee_id", menteeId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToCompany);
}

export async function addCompany(menteeId: string, name: string, industry: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .insert({ mentee_id: menteeId, name, industry })
    .select()
    .single();
  if (error) throw error;
  return rowToCompany(data);
}

export async function updateCompany(
  companyId: string,
  patch: Partial<{ status: SelectionStatus; temperature: Temperature }>
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("companies")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", companyId);
  if (error) throw error;
}

export async function getCheckInsForMentee(menteeId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("check_ins")
    .select("*")
    .eq("mentee_id", menteeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToCheckIn);
}

export async function addCheckIn(
  menteeId: string,
  note: string,
  tags: StruggleTag[],
  companyId?: string,
  visibility: "mentor_only" | "public" = "mentor_only"
) {
  const supabase = createClient();
  const { error } = await supabase.from("check_ins").insert({
    mentee_id: menteeId,
    company_id: companyId ?? null,
    note,
    tags,
    visibility,
  });
  if (error) throw error;
}

// ---------- 公開フィード（フェーズ2） ----------

export interface FeedItem {
  checkIn: CheckIn;
  author: Profile;
  companyName: string | null;
  cheerCount: number;
  iCheered: boolean;
  comments: FeedComment[];
}

export interface FeedComment {
  id: string;
  checkInId: string;
  profileId: string;
  authorName: string;
  authorAvatarColor: string;
  body: string;
  createdAt: string;
}

export async function getPublicFeed(currentUserId: string): Promise<FeedItem[]> {
  const supabase = createClient();
  const { data: checkInRows, error } = await supabase
    .from("check_ins")
    .select("*, profiles!check_ins_mentee_id_fkey(*), companies(name)")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const checkInIds = (checkInRows ?? []).map((r) => r.id as string);
  if (checkInIds.length === 0) return [];

  const [{ data: reactionRows }, { data: commentRows }] = await Promise.all([
    supabase.from("reactions").select("*").in("check_in_id", checkInIds),
    supabase
      .from("comments")
      .select("*, profiles(name, avatar_color)")
      .in("check_in_id", checkInIds)
      .order("created_at", { ascending: true }),
  ]);

  return (checkInRows ?? []).map((row) => {
    const author = (row as unknown as { profiles: Profile }).profiles;
    const companyName = (row as unknown as { companies: { name: string } | null }).companies?.name ?? null;
    const relatedReactions = (reactionRows ?? []).filter((r) => r.check_in_id === row.id);
    const relatedComments = (commentRows ?? [])
      .filter((c) => c.check_in_id === row.id)
      .map((c) => {
        const p = (c as unknown as { profiles: { name: string; avatar_color: string } }).profiles;
        return {
          id: c.id as string,
          checkInId: c.check_in_id as string,
          profileId: c.profile_id as string,
          authorName: p?.name ?? "不明",
          authorAvatarColor: p?.avatar_color ?? "#C99A3D",
          body: c.body as string,
          createdAt: c.created_at as string,
        };
      });

    return {
      checkIn: rowToCheckIn(row),
      author,
      companyName,
      cheerCount: relatedReactions.length,
      iCheered: relatedReactions.some((r) => r.profile_id === currentUserId),
      comments: relatedComments,
    };
  });
}

export async function toggleCheer(checkInId: string, profileId: string, currentlyCheered: boolean) {
  const supabase = createClient();
  if (currentlyCheered) {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("check_in_id", checkInId)
      .eq("profile_id", profileId)
      .eq("kind", "cheer");
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("reactions")
      .insert({ check_in_id: checkInId, profile_id: profileId, kind: "cheer" });
    if (error) throw error;
  }
}

export async function addComment(checkInId: string, profileId: string, body: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("comments")
    .insert({ check_in_id: checkInId, profile_id: profileId, body });
  if (error) throw error;
}

export interface MenteeWithData {
  profile: Profile;
  companies: Company[];
  checkIns: CheckIn[];
}

export async function getMenteesForMentor(mentorId: string): Promise<MenteeWithData[]> {
  const supabase = createClient();
  const { data: relations, error } = await supabase
    .from("mentor_mentee_relations")
    .select("mentee_id, profiles!mentor_mentee_relations_mentee_id_fkey(*)")
    .eq("mentor_id", mentorId);
  if (error) throw error;

  const menteeIds = (relations ?? []).map((r) => r.mentee_id as string);
  if (menteeIds.length === 0) return [];

  const [{ data: companyRows }, { data: checkInRows }] = await Promise.all([
    supabase.from("companies").select("*").in("mentee_id", menteeIds),
    supabase.from("check_ins").select("*").in("mentee_id", menteeIds),
  ]);

  return (relations ?? [])
    .filter((r) => (r as unknown as { profiles: Profile | null }).profiles !== null)
    .map((r) => {
      const profile = (r as unknown as { profiles: Profile }).profiles;
      return {
        profile,
        companies: (companyRows ?? [])
          .filter((c) => c.mentee_id === r.mentee_id)
          .map(rowToCompany),
        checkIns: (checkInRows ?? [])
          .filter((c) => c.mentee_id === r.mentee_id)
          .map(rowToCheckIn),
      };
    });
}

function rowToCompany(row: Record<string, unknown>): Company {
  return {
    id: row.id as string,
    menteeId: row.mentee_id as string,
    name: row.name as string,
    industry: (row.industry as string) ?? "",
    status: row.status as SelectionStatus,
    nextDeadline: (row.next_deadline as string) ?? undefined,
    temperature: row.temperature as Temperature,
    updatedAt: row.updated_at as string,
  };
}

function rowToCheckIn(row: Record<string, unknown>): CheckIn {
  return {
    id: row.id as string,
    menteeId: row.mentee_id as string,
    companyId: (row.company_id as string) ?? undefined,
    note: row.note as string,
    tags: (row.tags as StruggleTag[]) ?? [],
    visibility: row.visibility as CheckIn["visibility"],
    createdAt: row.created_at as string,
  };
}
