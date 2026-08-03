// フェーズ1（縦の関係：メンター⇄メンティー）のドメイン型定義
// 将来のフェーズ2（横のつながり・コミュニティ化）を見据え、
// CheckIn には visibility（公開範囲）を最初から持たせている。

export type SelectionStatus =
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

export const STATUS_LABEL: Record<SelectionStatus, string> = {
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
