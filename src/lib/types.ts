// フェーズ1（縦の関係：メンター⇄エンター）のドメイン型定義
// 将来のフェーズ2（横のつながり・コミュニティ化）を見据え、
// CheckIn には visibility（公開範囲）を最初から持たせている。

// 選考ステータス：あらかじめ用意した候補に加えて、自由入力の文字列も許容する
export type PresetStatus =
  | "researching" // 企業研究中
  | "es_writing" // ES作成中
  | "es_submitted" // ES提出済み
  | "web_test" // Webテスト
  | "interview_1" // 一次面接
  | "interview_2" // 二次面接
  | "interview_final" // 最終面接
  | "offer" // 内定
  | "declined" // 辞退
  | "rejected"; // 不採用

export type SelectionStatus = PresetStatus | (string & {});

export type Temperature = "good" | "unsure" | "urgent";
// good = 順調 / unsure = やや不安 / urgent = かなり焦ってる

export type StruggleTag =
  | "es"
  | "web_test"
  | "interview"
  | "industry_choice"
  | "motivation"
  | "schedule";

export type CheckInVisibility = "mentor_only" | "group" | "public";

export interface Company {
  id: string;
  menteeId: string;
  name: string;
  industry: string;
  status: SelectionStatus;
  nextDeadline?: string; // ISO date string
  temperature: Temperature;
  updatedAt: string; // ISO datetime string
}

export interface CheckIn {
  id: string;
  menteeId: string;
  companyId?: string;
  note: string;
  tags: StruggleTag[];
  visibility: CheckInVisibility;
  createdAt: string;
}

export interface MentorNote {
  id: string;
  mentorId: string;
  menteeId: string;
  note: string;
  createdAt: string;
}

export interface Mentee {
  id: string;
  name: string;
  grade: string; // 例: 26卒
  avatarColor: string;
}

export const STATUS_LABEL: Record<PresetStatus, string> = {
  researching: "企業研究中",
  es_writing: "ES作成中",
  es_submitted: "ES提出済み",
  web_test: "Webテスト",
  interview_1: "一次面接",
  interview_2: "二次面接",
  interview_final: "最終面接",
  offer: "内定",
  declined: "辞退",
  rejected: "不採用",
};

const PRESET_STATUS_SET = new Set(Object.keys(STATUS_LABEL));

export function isPresetStatus(status: string): status is PresetStatus {
  return PRESET_STATUS_SET.has(status);
}

// 自由入力のステータスなら、そのままの文字列を表示する
export function getStatusLabel(status: SelectionStatus): string {
  return isPresetStatus(status) ? STATUS_LABEL[status] : status;
}

export const TAG_LABEL: Record<StruggleTag, string> = {
  es: "ES",
  web_test: "Webテスト",
  interview: "面接",
  industry_choice: "業界選定",
  motivation: "モチベ低下",
  schedule: "スケジュール",
};

export const TEMPERATURE_LABEL: Record<Temperature, string> = {
  good: "順調",
  unsure: "やや不安",
  urgent: "かなり焦ってる",
};
