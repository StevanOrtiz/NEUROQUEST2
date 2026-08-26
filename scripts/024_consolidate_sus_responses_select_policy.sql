-- =========================================================
-- scripts/024_consolidate_sus_responses_select_policy.sql
-- Follow-up to 017: two overlapping SELECT policies on sus_responses
-- ("users can read own sus" + "service role can read all sus") tripped
-- the multiple_permissive_policies advisor, and the bare auth.role()
-- in the service-role policy tripped auth_rls_initplan. Consolidated
-- into a single SELECT policy covering both cases.
-- =========================================================
drop policy if exists "users can read own sus" on public.sus_responses;
drop policy if exists "service role can read all sus" on public.sus_responses;

create policy "users can read own or service role reads all sus" on public.sus_responses
  for select using (
    (select auth.uid()) = user_id
    or (select auth.role()) = 'service_role'
  );
