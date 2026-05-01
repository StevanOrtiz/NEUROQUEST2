-- =========================================================
-- TABLE: adhd_screening_results
-- Stores ASRS-inspired ADHD screening results for authenticated users.
-- This is a screening aid, not a medical diagnosis.
-- =========================================================

create table if not exists public.adhd_screening_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  instrument text not null,
  source_url text not null,
  answers jsonb not null,
  positive_count int not null check (positive_count between 0 and 6),
  total_score int not null check (total_score between 0 and 24),
  result_level text not null check (result_level in ('low', 'moderate', 'elevated')),
  recommendation text not null,
  created_at timestamptz not null default now()
);

alter table public.adhd_screening_results enable row level security;

create policy "adhd_screening_select_own" on public.adhd_screening_results
  for select using (auth.uid() = user_id);

create policy "adhd_screening_insert_own" on public.adhd_screening_results
  for insert with check (auth.uid() = user_id);

create index if not exists adhd_screening_results_user_created_idx
  on public.adhd_screening_results (user_id, created_at desc);

create unique index if not exists adhd_screening_results_user_unique_idx
  on public.adhd_screening_results (user_id);
