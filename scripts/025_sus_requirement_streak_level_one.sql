-- =========================================================
-- scripts/025_sus_requirement_streak_level_one.sql
-- SUS eligibility was lowered from streak >= 3 / level >= 3 to
-- streak >= 1 / level >= 1 (enforced in app/api/sus/route.ts and
-- components/sus/sus-form.tsx). This is documentation-only: the
-- requirement itself is enforced in application code, not by a DB
-- constraint, so this migration only keeps the table comment accurate.
-- =========================================================
comment on table public.sus_responses is
  'System Usability Scale responses, one row per submission per user. Users need streak >= 1 and level >= 1 to submit.';
