// Canonical forms for values that arrive from forms, seed files, and CSVs in different spellings.
export const INDIAN_STATES: string[] = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
  'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
];

const STATE_CODES: Record<string, string> = {
  an: 'Andaman and Nicobar Islands', ap: 'Andhra Pradesh', ar: 'Arunachal Pradesh', as: 'Assam', br: 'Bihar',
  ch: 'Chandigarh', cg: 'Chhattisgarh', dh: 'Dadra and Nagar Haveli and Daman and Diu', dl: 'Delhi', ga: 'Goa',
  gj: 'Gujarat', hr: 'Haryana', hp: 'Himachal Pradesh', jk: 'Jammu and Kashmir', jh: 'Jharkhand', ka: 'Karnataka',
  kl: 'Kerala', la: 'Ladakh', ld: 'Lakshadweep', mp: 'Madhya Pradesh', mh: 'Maharashtra', mn: 'Manipur',
  ml: 'Meghalaya', mz: 'Mizoram', nl: 'Nagaland', od: 'Odisha', or: 'Odisha', py: 'Puducherry', pb: 'Punjab',
  rj: 'Rajasthan', sk: 'Sikkim', tn: 'Tamil Nadu', ts: 'Telangana', tr: 'Tripura', up: 'Uttar Pradesh',
  uk: 'Uttarakhand', wb: 'West Bengal',
};

const clean = (v: string | null | undefined) => (v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

export function normalizeState(v: string | null | undefined): string {
  const k = clean(v);
  return STATE_CODES[k]?.toLowerCase() ?? k;
}

export function normalizeGender(v: string | null | undefined): string {
  const k = clean(v);
  if (['f', 'female', 'woman', 'girl', 'women'].includes(k)) return 'female';
  if (['m', 'male', 'man', 'boy', 'men'].includes(k)) return 'male';
  return k;
}

export function normalizeEducation(v: string | null | undefined): string {
  const k = clean(v).replace(/[.\s]/g, '');
  if (['ug', 'undergraduate', 'bachelor', 'bachelors', 'graduation'].includes(k)) return 'ug';
  if (['pg', 'postgraduate', 'master', 'masters', 'postgraduation'].includes(k)) return 'pg';
  return k;
}

// Deadlines are 'YYYY-MM-DD'. A scholarship is open through the end of its deadline day.
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isDeadlineOpen(deadline: string | null | undefined, today: string = todayISO()): boolean {
  if (!deadline) return true; // no deadline listed => treat as open, UI must say "not listed"
  return deadline.slice(0, 10) >= today;
}

export function daysUntil(deadline: string | null | undefined, today: string = todayISO()): number | null {
  if (!deadline) return null;
  const a = Date.UTC(+deadline.slice(0, 4), +deadline.slice(5, 7) - 1, +deadline.slice(8, 10));
  const b = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
  return Math.round((a - b) / 86_400_000);
}
