-- 0003_student_workflows.sql
-- DRAFT FOR REVIEW. Not applied to any project. Do not run against production without reading it first.
-- Written against the policies in 0001_schema.sql. Compare with your live policies first (see docs/DATABASE.md).
-- Idempotent: every policy is dropped-if-exists before it is created.

begin;

-- 1. is_admin() is SECURITY DEFINER; pin its search_path so it cannot be hijacked by a shadowing schema.
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = ''
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

-- 2. profiles: 0001 grants UPDATE(full_name) but has no UPDATE policy, so RLS silently blocks every update.
--    The column grant still prevents users from touching `role`.
revoke update on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;
drop policy if exists p_update_own on public.profiles;
create policy p_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- 3. applications: 0001's app_own policy lets a student write ANY status (including 'approved').
--    Students may only record self-reported stages; reviewer stages stay with admins (app_admin policy is unchanged).
drop policy if exists app_own on public.applications;
drop policy if exists app_student_select on public.applications;
drop policy if exists app_student_insert on public.applications;
drop policy if exists app_student_update on public.applications;
create policy app_student_select on public.applications for select to authenticated
  using (student_id = auth.uid());
create policy app_student_insert on public.applications for insert to authenticated
  with check (
    student_id = auth.uid()
    and status in ('not_applied', 'started', 'submitted')
    and exists (select 1 from public.scholarships s where s.id = scholarship_id and s.status = 'published')
  );
-- USING also restricts the *existing* row: once a reviewer moves it on, the student can no longer edit it.
create policy app_student_update on public.applications for update to authenticated
  using (student_id = auth.uid() and status in ('not_applied', 'started', 'submitted'))
  with check (student_id = auth.uid() and status in ('not_applied', 'started', 'submitted'));

-- 4. saved_scholarships: only published scholarships can be saved (FKs alone would accept any known UUID).
drop policy if exists sv_own on public.saved_scholarships;
drop policy if exists sv_select on public.saved_scholarships;
drop policy if exists sv_insert on public.saved_scholarships;
drop policy if exists sv_delete on public.saved_scholarships;
create policy sv_select on public.saved_scholarships for select to authenticated using (student_id = auth.uid());
create policy sv_insert on public.saved_scholarships for insert to authenticated
  with check (student_id = auth.uid() and exists (select 1 from public.scholarships s where s.id = scholarship_id and s.status = 'published'));
create policy sv_delete on public.saved_scholarships for delete to authenticated using (student_id = auth.uid());

-- 5. notifications: users may only mark their own notifications read (not rewrite title/body/owner).
--    Note: this column grant also applies to admins editing existing rows; admins can still INSERT freely.
revoke update on public.notifications from authenticated, anon;
grant update (read_at) on public.notifications to authenticated;
drop policy if exists n_upd on public.notifications;
create policy n_upd on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

commit;

-- ROLLBACK (manual): recreate app_own / sv_own from 0001_schema.sql and drop the policies created above.
--
-- VERIFY after applying (run as a normal student via the API, not the SQL editor):
--   * update applications set status='approved' where ...            -> must fail / affect 0 rows
--   * insert into saved_scholarships for a draft scholarship id        -> must fail
--   * update profiles set role='admin' where id = auth.uid()           -> must fail (no column privilege)
--   * update profiles set full_name='X' where id = auth.uid()          -> must succeed
