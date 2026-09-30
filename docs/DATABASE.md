# Database and RLS

Tables: `profiles`, `students`, `scholarships`, `saved_scholarships`, `applications`, `notifications` (see `supabase/migrations/0001_schema.sql`).

## Migrations
| File | Purpose | Status |
|---|---|---|
| 0001_schema.sql | Schema, RLS, signup trigger | Applied by you |
| 0002_fix_signup_trigger.sql | SECURITY DEFINER signup trigger fix | Applied manually by you |
| 0003_student_workflows.sql | Fixes below | **Draft, not applied.** Review, then run in the SQL editor of a *dev* project first |

## What 0003 fixes (found by reading 0001; verify against your live database first)
1. `profiles` had `GRANT UPDATE(full_name)` but no UPDATE policy, so name updates are silently blocked. The app reports this clearly if it happens.
2. `applications` policy `app_own` allowed students to set any status, including `approved`.
3. Students could save/apply to draft or archived scholarships if they knew the UUID.
4. `notifications` update policy had no `WITH CHECK` and no column limit.
5. `is_admin()` (SECURITY DEFINER) had no pinned `search_path`.

## Verify live policies before applying (read-only)
```sql
select tablename, policyname, cmd, roles, qual, with_check from pg_policies where schemaname='public' order by 1,2;
select relname, relrowsecurity from pg_class where relnamespace='public'::regnamespace and relkind='r';
```

## Seed data
`supabase/seed/sample_scholarships.sql` inserts three fictional `[DEMO]` scholarships (idempotent). These are not real or verified. Publish real records by inserting them with `status='published'` and `is_demo=false`, and delete the demo rows before launch.

## Making an admin
Sign up, then in the SQL editor: `update profiles set role='admin' where id='<user uuid>';`. The Admin tab then shows live counts.

## Not covered by automated tests
RLS policies are not tested automatically (no database is available to the test suite). After applying 0003 in a dev project, run the checks listed at the bottom of that file as a normal student.
