-- =========================================================
-- TABLE: chests
-- Cofres ganados por el jugador al completar partidas
-- Rewritten to match the live production schema (originally altered
-- directly in Supabase without updating this tracked file — see
-- app/api/game/chest/save/route.ts, app/api/game/chest/open/route.ts
-- and components/.../inventory for the real column names in use).
-- =========================================================
create table if not exists public.chests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_session_id uuid references public.game_sessions(id) on delete set null,
  rarity text check (rarity in ('common', 'rare', 'epic')),
  perk_type text,
  is_opened boolean default false,
  created_at timestamptz not null default now()
);

-- Idempotent column adds in case this runs against an older-shaped table
alter table public.chests add column if not exists game_session_id uuid references public.game_sessions(id) on delete set null;
alter table public.chests add column if not exists rarity text;
alter table public.chests add column if not exists perk_type text;
alter table public.chests add column if not exists is_opened boolean default false;

alter table public.chests enable row level security;

drop policy if exists "chests_select_own" on public.chests;
create policy "chests_select_own" on public.chests
  for select using ((select auth.uid()) = user_id);

drop policy if exists "chests_insert_own" on public.chests;
create policy "chests_insert_own" on public.chests
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "chests_update_own" on public.chests;
create policy "chests_update_own" on public.chests
  for update using ((select auth.uid()) = user_id);

drop policy if exists "chests_delete_own" on public.chests;
create policy "chests_delete_own" on public.chests
  for delete using ((select auth.uid()) = user_id);

create index if not exists idx_chests_game_session_id on public.chests (game_session_id);
create index if not exists idx_chests_user_id on public.chests (user_id);
