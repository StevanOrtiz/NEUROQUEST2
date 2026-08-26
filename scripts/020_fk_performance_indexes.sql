-- =========================================================
-- scripts/020_fk_performance_indexes.sql
-- 5 foreign keys with no covering index, flagged by the Supabase
-- performance advisor (unindexed_foreign_keys).
-- =========================================================
create index if not exists idx_chests_game_session_id on public.chests (game_session_id);
create index if not exists idx_chests_user_id on public.chests (user_id);
create index if not exists idx_questions_session_id on public.questions (session_id);
create index if not exists idx_subject_game_sessions_user_id on public.subject_game_sessions (user_id);
create index if not exists idx_task_documents_task_id on public.task_documents (task_id);
