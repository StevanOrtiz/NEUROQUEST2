-- =========================================================
-- scripts/007_streak.sql
-- Daily Streak System for NEUROQUEST2
-- Run AFTER 001_profiles.sql
-- =========================================================

-- ── 1. Add streak columns to profiles ────────────────────
alter table public.profiles
  add column if not exists current_streak   int         not null default 0,
  add column if not exists longest_streak   int         not null default 0,
  add column if not exists last_activity_date date       null,
  add column if not exists streak_updated_at timestamptz null;

comment on column public.profiles.current_streak    is 'Number of consecutive days the user completed at least one quiz or study module';
comment on column public.profiles.longest_streak    is 'All-time longest streak achieved by this user';
comment on column public.profiles.last_activity_date is 'UTC date of the last qualifying activity (quiz/module completion)';
comment on column public.profiles.streak_updated_at  is 'Timestamp of the last streak write — used for idempotency';

-- ── 2. Server-side function: update_user_streak() ────────
-- Called by both API routes (game/answer and subjects/complete-quiz)
-- after a session is finished. SECURITY DEFINER so it can write to
-- profiles without a direct UPDATE grant. Derives the user from
-- auth.uid() internally (no p_user_id param) so it can never be called
-- with someone else's id — EXECUTE is revoked from anon/public and
-- granted only to authenticated.
--
-- Logic:
--   • TODAY  = current_date in UTC
--   • If last_activity_date IS NULL            → first ever activity, streak = 1
--   • If last_activity_date = TODAY            → already counted today, no-op
--   • If last_activity_date = TODAY - 1        → consecutive day, streak + 1
--   • If last_activity_date < TODAY - 1        → gap detected, reset to 1
--   • longest_streak is updated whenever current_streak exceeds it
--
-- Returns a JSON object:
--   { "current_streak": N, "longest_streak": N, "already_counted": bool }
-- ─────────────────────────────────────────────────────────
create or replace function public.update_user_streak()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id            uuid := auth.uid();
  v_today              date := current_date;  -- UTC date
  v_last_date          date;
  v_current_streak     int;
  v_longest_streak     int;
  v_already_counted    boolean := false;
  v_new_streak         int;
  v_new_longest        int;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Fetch current values with a row-level lock to prevent race conditions
  select
    last_activity_date,
    current_streak,
    longest_streak
  into
    v_last_date,
    v_current_streak,
    v_longest_streak
  from public.profiles
  where id = v_user_id
  for update;

  -- Guard: profile row must exist
  if not found then
    raise exception 'Profile not found for user %', v_user_id;
  end if;

  -- ── Decision tree ──────────────────────────────────────
  if v_last_date is null then
    -- First ever activity
    v_new_streak := 1;

  elsif v_last_date = v_today then
    -- Already recorded today — idempotent, do nothing
    v_already_counted := true;
    v_new_streak := v_current_streak;

  elsif v_last_date = v_today - interval '1 day' then
    -- Consecutive day
    v_new_streak := v_current_streak + 1;

  else
    -- Missed one or more days → reset
    v_new_streak := 1;

  end if;

  -- Update longest streak record
  v_new_longest := greatest(v_longest_streak, v_new_streak);

  -- Persist (skip write if nothing changed)
  if not v_already_counted then
    update public.profiles
    set
      current_streak     = v_new_streak,
      longest_streak     = v_new_longest,
      last_activity_date = v_today,
      streak_updated_at  = now()
    where id = v_user_id;
  end if;

  return jsonb_build_object(
    'current_streak',  v_new_streak,
    'longest_streak',  v_new_longest,
    'already_counted', v_already_counted
  );
end;
$$;

revoke all on function public.update_user_streak() from public;
revoke execute on function public.update_user_streak() from anon;
grant execute on function public.update_user_streak() to authenticated;

-- NOTE: an earlier version of this file also created a public.streak_status
-- view. It was SECURITY DEFINER (bypassed profiles RLS, exposing every
-- user's streak data with no per-row filter) and unused by the app, so it
-- has been intentionally removed rather than recreated here.
