-- 航路（Kouro）データベーススキーマ
-- フェーズ1: メンター⇄メンティーの縦の関係
-- フェーズ2: 横のつながり（コミュニティ化）を見据え、
--            check_ins.visibility と groups を最初から用意している。

create extension if not exists "uuid-ossp";

-- ユーザー（Supabase Authのauth.usersを拡張するプロフィールテーブル）
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('mentor', 'mentee')),
  grade text, -- 例: 26卒（メンティーのみ）
  avatar_color text default '#C99A3D',
  created_at timestamptz not null default now()
);

-- メンター⇄メンティーの関係（多対多を許容：1メンティーに複数メンターも可）
create table mentor_mentee_relations (
  id uuid primary key default uuid_generate_v4(),
  mentor_id uuid not null references profiles(id) on delete cascade,
  mentee_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (mentor_id, mentee_id)
);

-- フェーズ2用：グループ（同じメンター配下、同学年など）
create table groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table group_members (
  group_id uuid not null references groups(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  primary key (group_id, profile_id)
);

-- 企業エントリ
create table companies (
  id uuid primary key default uuid_generate_v4(),
  mentee_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  industry text,
  status text not null default 'researching' check (
    status in (
      'researching', 'es_writing', 'es_submitted', 'web_test',
      'interview_1', 'interview_2', 'interview_final',
      'offer', 'declined', 'rejected'
    )
  ),
  next_deadline date,
  temperature text not null default 'good' check (temperature in ('good', 'unsure', 'urgent')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- チェックイン（メンティーの一言記録）
create table check_ins (
  id uuid primary key default uuid_generate_v4(),
  mentee_id uuid not null references profiles(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  note text not null,
  tags text[] not null default '{}',
  -- フェーズ2で使用：公開範囲。フェーズ1では常にmentor_only
  visibility text not null default 'mentor_only' check (
    visibility in ('mentor_only', 'group', 'public')
  ),
  created_at timestamptz not null default now()
);

-- メンターが後輩ごとに残す所感・アドバイス（本人には非公開）
create table mentor_notes (
  id uuid primary key default uuid_generate_v4(),
  mentor_id uuid not null references profiles(id) on delete cascade,
  mentee_id uuid not null references profiles(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

-- フェーズ2用：リアクション（応援スタンプ等）
create table reactions (
  id uuid primary key default uuid_generate_v4(),
  check_in_id uuid not null references check_ins(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  kind text not null default 'cheer',
  created_at timestamptz not null default now(),
  unique (check_in_id, profile_id, kind)
);

-- Row Level Security（最低限の方針。要件が固まったら調整すること）
alter table profiles enable row level security;
alter table companies enable row level security;
alter table check_ins enable row level security;
alter table mentor_notes enable row level security;

-- 自分のプロフィールは自分で見れる
create policy "profiles_self_select" on profiles
  for select using (auth.uid() = id);

-- メンティーは自分の企業データを読み書きできる
create policy "companies_owner" on companies
  for all using (auth.uid() = mentee_id);

-- 担当メンターは自分の担当メンティーの企業データを閲覧できる
create policy "companies_mentor_read" on companies
  for select using (
    exists (
      select 1 from mentor_mentee_relations r
      where r.mentee_id = companies.mentee_id and r.mentor_id = auth.uid()
    )
  );

-- チェックインも同様の方針
create policy "check_ins_owner" on check_ins
  for all using (auth.uid() = mentee_id);

create policy "check_ins_mentor_read" on check_ins
  for select using (
    exists (
      select 1 from mentor_mentee_relations r
      where r.mentee_id = check_ins.mentee_id and r.mentor_id = auth.uid()
    )
  );

-- メンターノートは書いたメンター本人のみ閲覧可（メンティーには見せない）
create policy "mentor_notes_owner" on mentor_notes
  for all using (auth.uid() = mentor_id);
