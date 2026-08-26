-- =========================================================
-- scripts/019_security_definer_fixes.sql
-- Two SECURITY DEFINER issues flagged by the Supabase security advisor:
--
-- 1. `streak_status` view had no WHERE clause and, being SECURITY
--    DEFINER, bypassed profiles' RLS entirely -- any caller with SELECT
--    could read every user's streak data. Unused anywhere in the app.
--
-- 2. `update_user_streak(p_user_id uuid)` was SECURITY DEFINER and
--    directly callable via /rest/v1/rpc/update_user_streak by any
--    authenticated user with an ARBITRARY uuid -- nothing checked that
--    p_user_id belonged to the caller. The app always passed its own
--    user.id, but the hole existed independent of app code. Fixed by
--    dropping the parameter entirely and deriving the user from
--    auth.uid() internally, then locking EXECUTE down to `authenticated`
--    only (Supabase grants EXECUTE to `anon` by default on new
--    functions, so both `anon` and `public` must be revoked explicitly).
-- =========================================================

drop view if exists public.streak_status;

drop function if exists public.update_user_streak(uuid);

create or replace function public.update_user_streak()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id            uuid := auth.uid();
  v_today              date := current_date;
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

  select last_activity_date, current_streak, longest_streak
  into v_last_date, v_current_streak, v_longest_streak
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'Profile not found for user %', v_user_id;
  end if;

  if v_last_date is null then
    v_new_streak := 1;
  elsif v_last_date = v_today then
    v_already_counted := true;
    v_new_streak := v_current_streak;
  elsif v_last_date = v_today - interval '1 day' then
    v_new_streak := v_current_streak + 1;
  else
    v_new_streak := 1;
  end if;

  v_new_longest := greatest(v_longest_streak, v_new_streak);

  if not v_already_counted then
    update public.profiles
    set current_streak = v_new_streak,
        longest_streak = v_new_longest,
        last_activity_date = v_today,
        streak_updated_at = now()
    where id = v_user_id;
  end if;

  return jsonb_build_object(
    'current_streak',  v_new_streak,
    'longest_streak',  v_new_longest,
    'already_counted', v_already_counted
  );
end;
$$;

-- REVOKE ALL FROM PUBLIC alone is not enough -- Supabase's default
-- privileges grant EXECUTE to `anon`/`authenticated` explicitly on every
-- new function in the public schema, independent of the PUBLIC grant.
revoke all on function public.update_user_streak() from public;
revoke execute on function public.update_user_streak() from anon;
grant execute on function public.update_user_streak() to authenticated;

-- Documented as intentionally SECURITY DEFINER, no functional change:
comment on function public.get_records_leaderboards(integer) is
  'Intentionally SECURITY DEFINER: aggregates across all users profiles/game_sessions/questions for the public leaderboard, bypassing per-row RLS by design. p_limit is clamped server-side to [1,100], so no unbounded-read risk.';

comment on function public.handle_new_user() is
  'Intentionally SECURITY DEFINER: trigger function for on_auth_user_created, must insert into public.profiles with elevated privilege at signup time. Not directly RPC-callable in a meaningful way (references trigger-only NEW).';
