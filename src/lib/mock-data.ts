import type { CheckIn, Company, Mentee } from "./types";

// Supabase接続前のプロトタイプ用ダミーデータ。
// schema.sql のテーブル構造と対応させてあるので、
// 接続後はこのファイルをSupabaseからのfetchに置き換えるだけでよい。

export const mentees: Mentee[] = [
  { id: "m1", name: "佐藤 遥", grade: "26卒", avatarColor: "#C99A3D" },
  { id: "m2", name: "田中 湊", grade: "26卒", avatarColor: "#5B7B5A" },
  { id: "m3", name: "鈴木 陽菜", grade: "27卒", avatarColor: "#A64B4B" },
  { id: "m4", name: "高橋 蓮", grade: "26卒", avatarColor: "#4C6B8A" },
];

export const companies: Company[] = [
  {
    id: "c1",
    menteeId: "m1",
    name: "アルタイル商事",
    industry: "総合商社",
    status: "interview_2",
    nextDeadline: "2026-08-08",
    temperature: "unsure",
    updatedAt: "2026-08-01T09:00:00+09:00",
  },
  {
    id: "c2",
    menteeId: "m1",
    name: "リンデン製薬",
    industry: "メーカー",
    status: "es_writing",
    nextDeadline: "2026-08-05",
    temperature: "urgent",
    updatedAt: "2026-07-24T21:00:00+09:00",
  },
  {
    id: "c3",
    menteeId: "m2",
    name: "ノヴァ・システムズ",
    industry: "IT",
    status: "interview_final",
    nextDeadline: "2026-08-06",
    temperature: "good",
    updatedAt: "2026-08-02T18:30:00+09:00",
  },
  {
    id: "c4",
    menteeId: "m3",
    name: "青海コンサルティング",
    industry: "コンサル",
    status: "researching",
    temperature: "unsure",
    updatedAt: "2026-07-20T12:00:00+09:00",
  },
  {
    id: "c5",
    menteeId: "m4",
    name: "はまなす銀行",
    industry: "金融",
    status: "web_test",
    nextDeadline: "2026-08-04",
    temperature: "good",
    updatedAt: "2026-08-02T08:00:00+09:00",
  },
  {
    id: "c6",
    menteeId: "m4",
    name: "常盤フーズ",
    industry: "食品メーカー",
    status: "es_submitted",
    temperature: "good",
    updatedAt: "2026-07-30T10:00:00+09:00",
  },
];

export const checkIns: CheckIn[] = [
  {
    id: "ci1",
    menteeId: "m1",
    companyId: "c2",
    note: "ガクチカの軸がまだ定まらなくて書き直し中。締切が近くて焦ってる。",
    tags: ["es", "motivation"],
    visibility: "mentor_only",
    createdAt: "2026-08-02T22:10:00+09:00",
  },
  {
    id: "ci2",
    menteeId: "m2",
    companyId: "c3",
    note: "最終面接、逆質問の準備だけ残ってる。手応えはある。",
    tags: ["interview"],
    visibility: "mentor_only",
    createdAt: "2026-08-02T19:00:00+09:00",
  },
  {
    id: "ci3",
    menteeId: "m3",
    note: "コンサルと商社で迷い中。軸が定まらず何から手をつけていいか分からない。",
    tags: ["industry_choice"],
    visibility: "mentor_only",
    createdAt: "2026-07-20T13:00:00+09:00",
  },
];
