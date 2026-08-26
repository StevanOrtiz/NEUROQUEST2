-- =========================================================
-- scripts/021_rls_performance_fixes.sql
-- ~45 RLS policies across the schema used bare `auth.uid()` in their
-- USING/WITH CHECK clauses. Postgres re-evaluates a bare auth.uid()
-- once per row; wrapping it as `(select auth.uid())` lets the planner
-- evaluate it once per statement instead. Flagged systemically by the
-- Supabase performance advisor (auth_rls_initplan) on nearly every
-- policy in the database. This file mechanically rewrites all of them.
--
-- (sus_responses was already fixed with this pattern in 017;
-- api_rate_limit_events was created with this pattern in 016.)
-- =========================================================

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using ((select auth.uid()) = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check ((select auth.uid()) = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using ((select auth.uid()) = id);

-- game_sessions
drop policy if exists "game_sessions_select_own" on public.game_sessions;
create policy "game_sessions_select_own" on public.game_sessions for select using ((select auth.uid()) = user_id);
drop policy if exists "game_sessions_insert_own" on public.game_sessions;
create policy "game_sessions_insert_own" on public.game_sessions for insert with check ((select auth.uid()) = user_id);
drop policy if exists "game_sessions_update_own" on public.game_sessions;
create policy "game_sessions_update_own" on public.game_sessions for update using ((select auth.uid()) = user_id);
drop policy if exists "game_sessions_delete_own" on public.game_sessions;
create policy "game_sessions_delete_own" on public.game_sessions for delete using ((select auth.uid()) = user_id);

-- questions
drop policy if exists "questions_select_own" on public.questions;
create policy "questions_select_own" on public.questions for select using ((select auth.uid()) = user_id);
drop policy if exists "questions_insert_own" on public.questions;
create policy "questions_insert_own" on public.questions for insert with check ((select auth.uid()) = user_id);
drop policy if exists "questions_update_own" on public.questions;
create policy "questions_update_own" on public.questions for update using ((select auth.uid()) = user_id);

-- inventory_items
drop policy if exists "inventory_items_select_own" on public.inventory_items;
create policy "inventory_items_select_own" on public.inventory_items for select using ((select auth.uid()) = user_id);
drop policy if exists "inventory_items_insert_own" on public.inventory_items;
create policy "inventory_items_insert_own" on public.inventory_items for insert with check ((select auth.uid()) = user_id);
drop policy if exists "inventory_items_update_own" on public.inventory_items;
create policy "inventory_items_update_own" on public.inventory_items for update using ((select auth.uid()) = user_id);
drop policy if exists "inventory_items_delete_own" on public.inventory_items;
create policy "inventory_items_delete_own" on public.inventory_items for delete using ((select auth.uid()) = user_id);

-- chests
drop policy if exists "chests_select_own" on public.chests;
create policy "chests_select_own" on public.chests for select using ((select auth.uid()) = user_id);
drop policy if exists "chests_insert_own" on public.chests;
create policy "chests_insert_own" on public.chests for insert with check ((select auth.uid()) = user_id);
drop policy if exists "chests_update_own" on public.chests;
create policy "chests_update_own" on public.chests for update using ((select auth.uid()) = user_id);
drop policy if exists "chests_delete_own" on public.chests;
create policy "chests_delete_own" on public.chests for delete using ((select auth.uid()) = user_id);

-- user_subject_progress
drop policy if exists "progress_select_own" on public.user_subject_progress;
create policy "progress_select_own" on public.user_subject_progress for select using ((select auth.uid()) = user_id);
drop policy if exists "progress_insert_own" on public.user_subject_progress;
create policy "progress_insert_own" on public.user_subject_progress for insert with check ((select auth.uid()) = user_id);
drop policy if exists "progress_update_own" on public.user_subject_progress;
create policy "progress_update_own" on public.user_subject_progress for update using ((select auth.uid()) = user_id);

-- subject_game_sessions
drop policy if exists "sgs_select_own" on public.subject_game_sessions;
create policy "sgs_select_own" on public.subject_game_sessions for select using ((select auth.uid()) = user_id);
drop policy if exists "sgs_insert_own" on public.subject_game_sessions;
create policy "sgs_insert_own" on public.subject_game_sessions for insert with check ((select auth.uid()) = user_id);

-- adhd_screening_results
drop policy if exists "adhd_screening_select_own" on public.adhd_screening_results;
create policy "adhd_screening_select_own" on public.adhd_screening_results for select using ((select auth.uid()) = user_id);
drop policy if exists "adhd_screening_insert_own" on public.adhd_screening_results;
create policy "adhd_screening_insert_own" on public.adhd_screening_results for insert with check ((select auth.uid()) = user_id);

-- user_usage_reports
drop policy if exists "user_usage_reports_select_own" on public.user_usage_reports;
create policy "user_usage_reports_select_own" on public.user_usage_reports for select using ((select auth.uid()) = user_id);
drop policy if exists "user_usage_reports_insert_own" on public.user_usage_reports;
create policy "user_usage_reports_insert_own" on public.user_usage_reports for insert with check ((select auth.uid()) = user_id);

-- user_achievements
drop policy if exists "Users can read own achievements" on public.user_achievements;
create policy "Users can read own achievements" on public.user_achievements for select using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own achievements" on public.user_achievements;
create policy "Users can insert own achievements" on public.user_achievements for insert with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own achievements" on public.user_achievements;
create policy "Users can update own achievements" on public.user_achievements for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- user_tasks
drop policy if exists "Users can read own tasks" on public.user_tasks;
create policy "Users can read own tasks" on public.user_tasks for select using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own tasks" on public.user_tasks;
create policy "Users can insert own tasks" on public.user_tasks for insert with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own tasks" on public.user_tasks;
create policy "Users can update own tasks" on public.user_tasks for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own tasks" on public.user_tasks;
create policy "Users can delete own tasks" on public.user_tasks for delete using ((select auth.uid()) = user_id);

-- task_documents
drop policy if exists "Users can read own task documents" on public.task_documents;
create policy "Users can read own task documents" on public.task_documents for select using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own task documents" on public.task_documents;
create policy "Users can insert own task documents" on public.task_documents for insert with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own task documents" on public.task_documents;
create policy "Users can update own task documents" on public.task_documents for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own task documents" on public.task_documents;
create policy "Users can delete own task documents" on public.task_documents for delete using ((select auth.uid()) = user_id);

-- storage.objects (study-documents bucket, from 015_personal_chest_tasks.sql)
drop policy if exists "Users can read own study documents" on storage.objects;
create policy "Users can read own study documents" on storage.objects for select using (
  bucket_id = 'study-documents'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
drop policy if exists "Users can insert own study documents" on storage.objects;
create policy "Users can insert own study documents" on storage.objects for insert with check (
  bucket_id = 'study-documents'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
drop policy if exists "Users can update own study documents" on storage.objects;
create policy "Users can update own study documents" on storage.objects for update using (
  bucket_id = 'study-documents'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid())::text
) with check (
  bucket_id = 'study-documents'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
drop policy if exists "Users can delete own study documents" on storage.objects;
create policy "Users can delete own study documents" on storage.objects for delete using (
  bucket_id = 'study-documents'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
