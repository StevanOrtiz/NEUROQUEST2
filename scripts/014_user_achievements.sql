-- User achievement medals shown in the profile.
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  title text not null,
  description text not null,
  icon text not null,
  rarity text not null default 'common'
    check (rarity in ('common', 'rare', 'epic', 'legendary')),
  metadata jsonb not null default '{}'::jsonb,
  earned_at timestamptz not null default now(),
  unique (user_id, code)
);

create index if not exists idx_user_achievements_user_earned
  on public.user_achievements(user_id, earned_at desc);

create index if not exists idx_user_achievements_code_earned
  on public.user_achievements(code, earned_at desc);

alter table public.user_achievements enable row level security;

drop policy if exists "Users can read own achievements" on public.user_achievements;
create policy "Users can read own achievements"
  on public.user_achievements
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own achievements" on public.user_achievements;
create policy "Users can insert own achievements"
  on public.user_achievements
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own achievements" on public.user_achievements;
create policy "Users can update own achievements"
  on public.user_achievements
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
