-- =========================================================
-- scripts/023_revoke_anon_update_streak.sql
-- Follow-up to 019: after recreating update_user_streak() there,
-- the security advisor still showed it as executable by `anon`.
-- REVOKE ALL FROM PUBLIC does not remove Supabase's explicit
-- default-privilege grant of EXECUTE to `anon` on new functions in the
-- public schema, so it must be revoked separately.
-- =========================================================
revoke execute on function public.update_user_streak() from anon;
revoke execute on function public.update_user_streak() from public;
grant execute on function public.update_user_streak() to authenticated;
