-- =========================================================
-- scripts/018_game_sessions_double_xp.sql
-- The "double_xp" power-up (app/api/game/use-item/route.ts,
-- app/api/game/answer/route.ts) read/wrote this column, but it never
-- existed on the live table — writes were silently swallowed.
-- =========================================================
alter table public.game_sessions
  add column if not exists double_xp_active boolean not null default false;

comment on column public.game_sessions.double_xp_active is
  'True while the double_xp power-up is active for the current question; reset to false by app/api/game/answer/route.ts after each answer.';
