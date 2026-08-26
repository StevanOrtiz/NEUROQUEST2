-- =========================================================
-- scripts/009_sus_form.sql
-- SUS (System Usability Scale) Form Storage
-- Run AFTER 007_streak.sql
-- =========================================================

create table if not exists public.sus_responses (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  -- 10 SUS questions, scored 1-5
  q1  int not null check (q1  between 1 and 5),
  q2  int not null check (q2  between 1 and 5),
  q3  int not null check (q3  between 1 and 5),
  q4  int not null check (q4  between 1 and 5),
  q5  int not null check (q5  between 1 and 5),
  q6  int not null check (q6  between 1 and 5),
  q7  int not null check (q7  between 1 and 5),
  q8  int not null check (q8  between 1 and 5),
  q9  int not null check (q9  between 1 and 5),
  q10 int not null check (q10 between 1 and 5),
  -- Computed SUS score: ((q1-1)+(5-q2)+(q3-1)+(5-q4)+(q5-1)+(5-q6)+(q7-1)+(5-q8)+(q9-1)+(5-q10)) * 2.5
  sus_score       numeric(5,2) generated always as (
    ((q1-1) + (5-q2) + (q3-1) + (5-q4) + (q5-1) + (5-q6) + (q7-1) + (5-q8) + (q9-1) + (5-q10)) * 2.5
  ) stored,
  submitted_at    timestamptz  not null default now()
);

comment on table public.sus_responses is 'System Usability Scale responses, one row per submission per user. Users need streak >= 1 and level >= 1 to submit.';

-- RLS
alter table public.sus_responses enable row level security;

-- Users can insert their own responses
create policy "users can insert own sus" on public.sus_responses
  for insert with check (auth.uid() = user_id);

-- Users can read their own responses
create policy "users can read own sus" on public.sus_responses
  for select using (auth.uid() = user_id);

-- Admins / service role can read all
create policy "service role can read all sus" on public.sus_responses
  for select using (auth.role() = 'service_role');

-- Index for fast per-user lookups
create index if not exists sus_responses_user_id_idx on public.sus_responses(user_id);
