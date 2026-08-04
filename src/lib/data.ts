import { createClient } from "./supabase/client";
import type {
  CheckIn,
  Company,
  SelectionStatus,
  StruggleTag,
  Temperature,
} from "./types";

export interface Profile {
  id: string;
  name: string;
  role: "mentor" | "mentee";
  grade: string | null;
  avatar_color: string;
  invite_code: string | null;
  login_code: string | null;
}

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const AVATAR_COLORS = ["#C99A3D", "#5B7B5A", "#A64B4B", "#4C6B8A", "#8A5C9B"];

export async function createMentorProfile(name: string, grade: string) {
  const supabase = createClient();
  const invite_code = generateInviteCode();
  const login_code = generateInviteCode();
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      name,
      role: "mentor",
      grade,
      avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      invite_code,
      login_code,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function createMenteeProfile(
  name: string,
  grade: string,
  mentorInviteCode?: string
) {
  const supabase = createClient();
  const login_code = generateInviteCode();
  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      name,
      role: "mentee",
      grade,
      avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      login_code,
    })
    .select()
    .single();
  if (error) throw error;

  if (mentorInviteCode) {
    const { data: mentor } = await supabase
      .from("profiles")
      .select("id")
      .eq("invite_code", mentorInviteCode.trim().toUpperCase())
      .eq("role", "mentor")
      .maybeSingle();

    if (mentor) {
      await supabase.from("mentor_mentee_relations").insert({
        mentor_id: mentor.id,
        mentee_id: profile.id,
      });
    } else {
      throw new Error("招待コードに一致するメンターが見つかりませんでした");
    }
  }

  return profile as Profile;
}

export async function loginWithCode(code: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("login_code", code.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("ログインコードが見つかりませんでした");
  return data as Profile;
}

export async function getProfile(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Profile;
}

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
  companyId?: string
) {
  const supabase = createClient();
  const { error } = await supabase.from("check_ins").insert({
    mentee_id: menteeId,
    company_id: companyId ?? null,
    note,
    tags,
  });
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

  return (relations ?? []).map((r) => {
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
