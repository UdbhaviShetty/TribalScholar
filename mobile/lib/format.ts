import { daysUntil, todayISO } from './core';
import type { AppProfile, ProfilePatch } from './data/types';

export const formatINR = (n: number | null | undefined) => (n == null ? 'Not listed' : `₹${n.toLocaleString('en-IN')}`);

export function formatDeadline(deadline: string | null | undefined, today = todayISO()) {
  if (!deadline) return { label: 'Deadline not listed', urgent: false, closed: false };
  const d = daysUntil(deadline, today)!;
  if (d < 0) return { label: `Closed ${-d} day${d === -1 ? '' : 's'} ago`, urgent: false, closed: true };
  if (d === 0) return { label: 'Closes today', urgent: true, closed: false };
  if (d === 1) return { label: 'Closes tomorrow', urgent: true, closed: false };
  return { label: `${d} days left (${deadline})`, urgent: d <= 7, closed: false };
}

export type ProfileForm = {
  full_name: string; dob: string; gender: string; state: string; district: string; education_level: string;
  course: string; institution: string; percentage: string; cgpa: string; annual_income: string; tribe_name: string;
  is_st: boolean | null; disability: boolean | null; first_gen: boolean | null; consent: boolean;
};

const s = (v: unknown) => (v == null ? '' : String(v));
export const profileToForm = (p: AppProfile): ProfileForm => ({
  full_name: s(p.full_name), dob: s(p.dob), gender: s(p.gender), state: s(p.state), district: s(p.district),
  education_level: s(p.education_level), course: s(p.course), institution: s(p.institution), percentage: s(p.percentage),
  cgpa: s(p.cgpa), annual_income: s(p.annual_income), tribe_name: s(p.tribe_name),
  is_st: p.is_st ?? null, disability: p.disability ?? null, first_gen: p.first_gen ?? null, consent: !!p.consent_at,
});

export type FormErrors = Partial<Record<keyof ProfileForm, string>>;

const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(/,/g, '')));

export function validateProfile(f: ProfileForm, today = todayISO()): FormErrors {
  const e: FormErrors = {};
  if (!f.consent) e.consent = 'Please agree so we can store your details and match scholarships.';
  if (f.full_name.length > 120) e.full_name = 'Name is too long.';
  if (f.dob.trim()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.dob.trim()) || Number.isNaN(Date.parse(f.dob.trim()))) e.dob = 'Use the format YYYY-MM-DD.';
    else if (f.dob.trim() > today) e.dob = 'Date of birth cannot be in the future.';
    else if (f.dob.trim() < '1930-01-01') e.dob = 'Please check the year.';
  }
  const pct = num(f.percentage); if (pct !== null && (!Number.isFinite(pct) || pct < 0 || pct > 100)) e.percentage = 'Enter a value from 0 to 100.';
  const cgpa = num(f.cgpa); if (cgpa !== null && (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10)) e.cgpa = 'Enter a value from 0 to 10.';
  const inc = num(f.annual_income); if (inc !== null && (!Number.isFinite(inc) || inc < 0)) e.annual_income = 'Enter a positive amount in rupees.';
  return e;
}

const blank = (v: string) => (v.trim() === '' ? null : v.trim());
export function formToPatch(f: ProfileForm, previousConsentAt: string | null, now = new Date()): ProfilePatch {
  return {
    full_name: blank(f.full_name), dob: blank(f.dob), gender: blank(f.gender), state: blank(f.state), district: blank(f.district),
    education_level: blank(f.education_level), course: blank(f.course), institution: blank(f.institution),
    percentage: num(f.percentage), cgpa: num(f.cgpa), annual_income: num(f.annual_income), tribe_name: blank(f.tribe_name),
    is_st: f.is_st, disability: f.disability, first_gen: f.first_gen,
    consent_at: f.consent ? previousConsentAt ?? now.toISOString() : null,
  };
}

export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'Email or password is incorrect.';
  if (m.includes('not confirmed')) return 'Please confirm your email first. Check your inbox, or resend the link below.';
  if (m.includes('already registered')) return 'An account with this email already exists. Try signing in.';
  if (m.includes('password') && m.includes('characters')) return 'Password is too short. Use at least 8 characters.';
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a minute and try again.';
  if (m.includes('fetch') || m.includes('network')) return 'Could not reach the server. Check your connection.';
  return message;
}
