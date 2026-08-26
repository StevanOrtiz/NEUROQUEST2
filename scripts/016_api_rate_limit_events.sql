-- Minimal per-user rate limiting for cost/abuse-sensitive API routes
-- (PDF quiz generation via Claude, personal chest document uploads).
-- No new infra: reuses Supabase, same pattern as the rest of the schema.

create table if not exists public.api_rate_limit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  route text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_user_route_time
  on public.api_rate_limit_events (user_id, route, created_at desc);

alter table public.api_rate_limit_events enable row level security;

-- Reads/writes only ever happen through the service-side Supabase client
-- inside route handlers (using the authenticated user's own id), never
-- directly from the browser, so policies mirror the rest of the schema:
-- a user can only see/insert their own rate-limit events.
drop policy if exists "Users can read own rate limit events" on public.api_rate_limit_events;
create policy "Users can read own rate limit events"
  on public.api_rate_limit_events for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own rate limit events" on public.api_rate_limit_events;
create policy "Users can insert own rate limit events"
  on public.api_rate_limit_events for insert
  with check ((select auth.uid()) = user_id);

-- Old events are useless once their window has passed; keep the table small.
-- Run manually or wire to a scheduled job if it grows large.
-- delete from public.api_rate_limit_events where created_at < now() - interval '1 day';
