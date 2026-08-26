-- =========================================================
-- scripts/017_sus_responses_fix.sql
-- Reconciles the live `sus_surveys` table with the tracked schema
-- (`sus_responses`) that app/api/sus/route.ts and
-- lib/research/usage-reports.ts already query against. The live table
-- had drifted from 009_sus_form.sql (created directly in Supabase under
-- a different name/shape), which broke the SUS survey feature entirely.
-- Zero data loss: table had 0 rows when this migration was applied.
-- =========================================================

-- 1. Rename table to match app code / 009_sus_form.sql
alter table if exists public.sus_surveys rename to sus_responses;

-- 2. Rename created_at -> submitted_at
alter table public.sus_responses rename column created_at to submitted_at;

-- 3. Convert sus_score from a plain writable numeric into a STORED
--    GENERATED column. Postgres does not support
--    ALTER COLUMN ... ADD GENERATED for stored generated columns,
--    so it must be dropped and re-added.
alter table public.sus_responses drop column if exists sus_score;

alter table public.sus_responses add column sus_score numeric(5,2) generated always as (
  ((q1-1) + (5-q2) + (q3-1) + (5-q4) + (q5-1) + (5-q6) + (q7-1) + (5-q8) + (q9-1) + (5-q10)) * 2.5
) stored;

comment on table public.sus_responses is
  'System Usability Scale responses, one row per submission per user. Users need streak >= 1 and level >= 1 to submit.';

-- 4. Cosmetic rename of inherited index names (no-op safe)
alter index if exists sus_surveys_pkey rename to sus_responses_pkey;
alter index if exists idx_sus_surveys_user_id rename to sus_responses_user_id_idx;
drop index if exists idx_sus_surveys_created_at;

-- 5. Recreate RLS policies under canonical names, already using the
--    performance-safe (select auth.uid()) pattern so this table never
--    needs to be touched by a later RLS-performance pass. A single
--    combined SELECT policy (rather than two overlapping ones) avoids
--    the "multiple permissive policies" advisor warning.
drop policy if exists "Users can insert own sus_surveys" on public.sus_responses;
drop policy if exists "Users can view own sus_surveys" on public.sus_responses;
drop policy if exists "users can insert own sus" on public.sus_responses;
drop policy if exists "users can read own sus" on public.sus_responses;
drop policy if exists "service role can read all sus" on public.sus_responses;
drop policy if exists "users can read own or service role reads all sus" on public.sus_responses;

create policy "users can insert own sus" on public.sus_responses
  for insert with check ((select auth.uid()) = user_id);

create policy "users can read own or service role reads all sus" on public.sus_responses
  for select using (
    (select auth.uid()) = user_id
    or (select auth.role()) = 'service_role'
  );

create index if not exists sus_responses_user_id_idx on public.sus_responses(user_id);
