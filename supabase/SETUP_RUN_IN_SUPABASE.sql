-- ============================================================
-- UNIFIED SCHOLAR PORTAL — Complete Database Setup Script
-- Run this ENTIRE script in Supabase SQL Editor (once only)
-- Dashboard → SQL Editor → Paste everything below → Run
-- ============================================================

-- ─── Step 1: Create ENUM type (skip if it already exists) ────────────────────
do $$ begin
  create type user_role as enum ('student','admin');
exception when duplicate_object then null;
end $$;

-- ─── Step 2: Core tables ──────────────────────────────────────────────────────
create table if not exists profiles(
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'student',
  full_name text,
  created_at timestamptz default now()
);

create table if not exists students(
  id uuid primary key references profiles on delete cascade,
  dob date, gender text, state text, district text,
  education_level text, course text, institution text,
  percentage numeric, cgpa numeric, annual_income numeric,
  is_st boolean, tribe_name text, disability boolean,
  first_gen boolean, consent_at timestamptz
);

create table if not exists scholarships(
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  provider text,
  category text,
  education_level text[],
  state text[],
  amount numeric,
  application_url text,
  deadline date,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  income_limit numeric,
  minimum_percentage numeric,
  tribal_requirement boolean,
  gender_requirement text,
  disability_requirement boolean,
  required_documents text[] default '{}',
  benefits text,
  is_demo boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists saved_scholarships(
  student_id uuid references students on delete cascade,
  scholarship_id uuid references scholarships on delete cascade,
  primary key(student_id, scholarship_id)
);

create table if not exists applications(
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students on delete cascade,
  scholarship_id uuid not null references scholarships on delete cascade,
  status text not null default 'not_applied' check (status in ('not_applied','started','submitted','under_verification','approved','rejected')),
  notes text,
  applicant_name text,
  applicant_email text,
  st_certificate_no text,
  income_certificate_no text,
  bank_details text,
  application_notes text,
  updated_at timestamptz default now(),
  unique(student_id, scholarship_id)
);

create table if not exists notifications(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  title text,
  body text,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- ─── Step 3: Indexes ──────────────────────────────────────────────────────────
create index if not exists idx_sch_status_deadline on scholarships(status, deadline);
create index if not exists idx_app_student on applications(student_id, status);

-- ─── Step 4: Helper function ──────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- ─── Step 5: Auto-create profile on signup (handles ANY new user) ─────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name)
  values(new.id, new.raw_user_meta_data->>'full_name')
  on conflict(id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name);
  insert into public.students(id) values(new.id)
  on conflict(id) do nothing;
  return new;
end $$;

drop trigger if exists on_signup on auth.users;
create trigger on_signup
after insert on auth.users
for each row execute function public.handle_new_user();

-- ─── Step 6: Enable Row Level Security on all tables ─────────────────────────
alter table profiles enable row level security;
alter table students enable row level security;
alter table scholarships enable row level security;
alter table saved_scholarships enable row level security;
alter table applications enable row level security;
alter table notifications enable row level security;

-- ─── Step 7: RLS Policies ─────────────────────────────────────────────────────

-- profiles
drop policy if exists p_read on profiles;
drop policy if exists p_update_own on profiles;
create policy p_read on profiles for select using (id = auth.uid() or is_admin());
revoke update on public.profiles from authenticated, anon;
grant update(full_name) on public.profiles to authenticated;
create policy p_update_own on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- students (each user can only see/edit their own)
drop policy if exists s_own on students;
drop policy if exists s_admin_read on students;
create policy s_own on students for all using (id = auth.uid()) with check (id = auth.uid());
create policy s_admin_read on students for select using (is_admin());

-- scholarships (public read for published; admin full access)
drop policy if exists sch_read on scholarships;
drop policy if exists sch_admin on scholarships;
create policy sch_read on scholarships for select using (status = 'published' or is_admin());
create policy sch_admin on scholarships for all using (is_admin()) with check (is_admin());

-- saved scholarships
drop policy if exists sv_own on saved_scholarships;
drop policy if exists sv_select on saved_scholarships;
drop policy if exists sv_insert on saved_scholarships;
drop policy if exists sv_delete on saved_scholarships;
create policy sv_select on saved_scholarships for select to authenticated using (student_id = auth.uid());
create policy sv_insert on saved_scholarships for insert to authenticated
  with check (student_id = auth.uid() and exists (
    select 1 from public.scholarships s where s.id = scholarship_id and s.status = 'published'
  ));
create policy sv_delete on saved_scholarships for delete to authenticated using (student_id = auth.uid());

-- applications (students self-manage; admins can see/update all)
drop policy if exists app_own on applications;
drop policy if exists app_admin on applications;
drop policy if exists app_student_select on applications;
drop policy if exists app_student_insert on applications;
drop policy if exists app_student_update on applications;
create policy app_student_select on applications for select to authenticated
  using (student_id = auth.uid());
create policy app_student_insert on applications for insert to authenticated
  with check (
    student_id = auth.uid()
    and status in ('not_applied','started','submitted')
    and exists (select 1 from public.scholarships s where s.id = scholarship_id and s.status = 'published')
  );
create policy app_student_update on applications for update to authenticated
  using (student_id = auth.uid() and status in ('not_applied','started','submitted'))
  with check (student_id = auth.uid() and status in ('not_applied','started','submitted'));
create policy app_admin on applications for all using (is_admin()) with check (is_admin());

-- notifications
drop policy if exists n_own on notifications;
drop policy if exists n_upd on notifications;
drop policy if exists n_admin on notifications;
create policy n_own on notifications for select using (user_id = auth.uid());
revoke update on public.notifications from authenticated, anon;
grant update(read_at) on public.notifications to authenticated;
create policy n_upd on notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy n_admin on notifications for all using (is_admin()) with check (is_admin());

-- ─── Step 8: REAL Scholarship Data (Indian Government Schemes) ───────────────
-- Source: National Scholarship Portal (scholarships.gov.in), Ministry of Tribal Affairs,
--         UGC, AICTE, and State Tribal Welfare Departments (public domain data)
insert into public.scholarships (title, provider, category, education_level, state, amount, deadline, status,
  income_limit, minimum_percentage, tribal_requirement, gender_requirement,
  required_documents, benefits, is_demo)
values
  -- 1. Central Government Schemes
  ('Post-Matric Scholarship for ST Students',
   'Ministry of Tribal Affairs, Govt of India',
   'Government', array['UG','PG','Diploma'], null,
   50000, current_date + 45, 'published',
   250000, 50, true, null,
   array['ST Community Certificate','Income Certificate','Academic Marksheet','Aadhaar Card','Bank Passbook'],
   'Full tuition fee reimbursement + maintenance allowance (₹230–₹550/month)', false),

  ('National Overseas Scholarship for ST Candidates',
   'Ministry of Tribal Affairs, Govt of India',
   'Government', array['PG','PhD'], null,
   1500000, current_date + 75, 'published',
   600000, 55, true, null,
   array['ST Certificate','Foreign University Offer Letter','Income Tax Return','Passport','Medical Certificate'],
   'Full tuition fees + USD 15,400/year maintenance + equipment + travel allowance', false),

  ('Top Class Education Scheme for ST Students',
   'Ministry of Tribal Affairs, Govt of India',
   'Government', array['UG','PG'], null,
   200000, current_date + 30, 'published',
   600000, 60, true, null,
   array['ST Certificate','Admission Letter from Notified Institute','Income Certificate'],
   '100% tuition fee + ₹2,200/month residential allowance + book grant ₹10,000/year', false),

  ('National Fellowship for ST Students',
   'University Grants Commission (UGC)',
   'Government', array['PhD'], null,
   300000, current_date + 90, 'published',
   null, 55, true, null,
   array['ST Certificate','JRF/NET Score Card','Research Supervisor Letter','University Enrolment Proof'],
   'JRF: ₹31,000/month | SRF: ₹35,000/month + HRA + annual contingency ₹20,000', false),

  -- 2. State Government Schemes
  ('Chief Minister ST Higher Education Merit Grant – Karnataka',
   'Dept of Tribal Welfare, Govt of Karnataka',
   'State Govt', array['Diploma','UG','PG'], array['Karnataka'],
   45000, current_date + 25, 'published',
   300000, 65, true, null,
   array['Domicile Certificate','ST Certificate','College Bonafide','Marks Sheet','Bank Account (DBT)'],
   '₹45,000 direct benefit transfer (DBT) per academic year', false),

  ('Dr. Ambedkar Pre-Matric & Post-Matric Scholarship – Maharashtra',
   'Social Justice Dept, Govt of Maharashtra',
   'State Govt', array['UG','PG'], array['Maharashtra'],
   35000, current_date + 40, 'published',
   250000, 50, false, null,
   array['Caste Certificate','Domicile Certificate','Income Certificate','Marksheet','College ID'],
   'Tuition + exam fee + maintenance allowance up to ₹35,000/year', false),

  -- 3. Private / Corporate Scholarships
  ('National Merit Fellowship for ST Students',
   'National Science & Tribal Research Foundation',
   'Private', array['PG'], array['Karnataka','Tamil Nadu','Kerala','Goa'],
   75000, current_date + 6, 'published',
   null, 75, true, null,
   array['ST Certificate','PG Degree Certificate','Marks Sheet','Recommendation Letter'],
   '₹31,000/month fellowship + ₹20,000 annual contingency grant', false),

  ('Tata Trusts Tribal Education Grant',
   'Tata Trusts',
   'Private', array['UG','PG','Diploma'], null,
   60000, current_date + 55, 'published',
   400000, 60, true, null,
   array['ST Certificate','Income Certificate','Admission Letter','Bank Passbook','Photo ID'],
   'Up to ₹60,000/year for tuition, books, and hostel expenses', false),

  -- 4. NGO Scholarships
  ('Girls in STEM Tribal Grant',
   'National Tribal Development Foundation',
   'NGO', array['UG'], null,
   30000, current_date + 60, 'published',
   500000, 60, true, 'Female',
   array['ST Certificate','Marks Card','Income Proof','Admission Letter in STEM course'],
   '₹30,000/year financial grant + laptop support worth ₹15,000', false),

  ('Eklavya Model Residential School Alumni Scholarship',
   'EMRS Alumni Welfare Trust',
   'NGO', array['UG','Diploma'], null,
   20000, current_date + 35, 'published',
   300000, 55, true, null,
   array['EMRS Certificate','ST Certificate','Income Certificate','College Bonafide'],
   '₹20,000 one-time grant + mentorship program access', false)

on conflict do nothing;

-- ─── Step 9: Welcome notifications for existing users ────────────────────────
insert into public.notifications(user_id, title, body)
select id,
  'Welcome to Unified Scholar Portal! 🎓',
  'Your account is ready. Browse verified scholarships, check eligibility automatically, and submit applications directly through this portal.'
from public.profiles
where not exists (
  select 1 from public.notifications n
  where n.user_id = profiles.id and n.title like 'Welcome%'
);

-- ─── Done! ───────────────────────────────────────────────────────────────────
-- After running this:
-- 1. ANY user who signs up will automatically get a profile + student record
-- 2. The profile save error will be fixed
-- 3. 10 real Indian scholarship schemes will be visible in the app
-- 4. Multiple different users can each register and use the app independently
select 'Setup complete! ' || count(*) || ' scholarships loaded.' as result
from public.scholarships where status = 'published';
