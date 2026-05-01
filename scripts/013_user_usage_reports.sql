-- =========================================================
-- TABLE: user_usage_reports
-- Baseline and day-3 research snapshots for before/after analysis.
-- Stores aggregated metrics only; no full PDF text or secrets.
-- =========================================================

create table if not exists public.user_usage_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  report_type text not null check (report_type in ('baseline', 'day3')),
  streak_day int,
  period_start timestamptz,
  period_end timestamptz not null default now(),
  metrics jsonb not null default '{}'::jsonb,
  comparisons jsonb,
  created_at timestamptz not null default now(),
  constraint user_usage_reports_user_type_unique unique (user_id, report_type)
);

alter table public.user_usage_reports enable row level security;

create policy "user_usage_reports_select_own" on public.user_usage_reports
  for select using (auth.uid() = user_id);

create policy "user_usage_reports_insert_own" on public.user_usage_reports
  for insert with check (auth.uid() = user_id);

create index if not exists user_usage_reports_type_created_idx
  on public.user_usage_reports (report_type, created_at desc);

create index if not exists user_usage_reports_user_created_idx
  on public.user_usage_reports (user_id, created_at desc);
