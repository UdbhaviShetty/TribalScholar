-- Run this in Supabase SQL Editor to fix the missing columns error
-- It will add the new application detail columns to your existing table safely.

alter table applications 
add column if not exists applicant_name text,
add column if not exists applicant_email text,
add column if not exists st_certificate_no text,
add column if not exists income_certificate_no text,
add column if not exists bank_details text,
add column if not exists application_notes text;
