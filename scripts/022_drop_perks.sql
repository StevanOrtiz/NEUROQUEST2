-- =========================================================
-- scripts/022_drop_perks.sql
-- `perks` had no tracked migration file (created directly in Supabase,
-- like `chests` originally was) and is never referenced anywhere in the
-- app code (zero `.from("perks")` calls). Its concept (extra_life,
-- fifty_fifty, double_xp, hint, skip_question) is already fully covered
-- by `inventory_items.item_type`. Confirmed 0 rows before dropping.
-- =========================================================
drop table if exists public.perks cascade;
