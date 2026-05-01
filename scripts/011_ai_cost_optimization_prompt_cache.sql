-- =========================================================
-- AI cost optimization telemetry and reuse support
-- Run after 002_game_sessions.sql and 003_questions.sql
-- =========================================================

alter table public.game_sessions
  add column if not exists source_hash text,
  add column if not exists ai_model text,
  add column if not exists ai_input_chars int,
  add column if not exists ai_estimated_input_tokens int,
  add column if not exists ai_uncached_input_tokens int,
  add column if not exists ai_output_tokens int,
  add column if not exists ai_cache_creation_input_tokens int,
  add column if not exists ai_cache_read_input_tokens int,
  add column if not exists ai_cache_status text not null default 'disabled',
  add column if not exists ai_source_mode text not null default 'unknown';

alter table public.game_sessions
  drop constraint if exists game_sessions_ai_source_mode_check;

alter table public.game_sessions
  add constraint game_sessions_ai_source_mode_check
  check (ai_source_mode in ('unknown', 'text_extraction_cached_prompt', 'direct_pdf_fallback', 'reused'));

alter table public.game_sessions
  drop constraint if exists game_sessions_ai_cache_status_check;

alter table public.game_sessions
  add constraint game_sessions_ai_cache_status_check
  check (ai_cache_status in ('disabled', 'requested_5m', 'requested_1h', 'skipped_below_minimum'));

create index if not exists game_sessions_ai_reuse_idx
  on public.game_sessions (user_id, source_hash, difficulty, created_at desc)
  where source_hash is not null;

create index if not exists game_sessions_ai_cache_status_idx
  on public.game_sessions (ai_cache_status, created_at desc);
