import { normalizeEducation, normalizeGender, normalizeState } from './normalize';

export type Profile = {
  full_name?: string | null;
  dob?: string | null;
  education_level?: string | null;
  state?: string | null;
  district?: string | null;
  course?: string | null;
  institution?: string | null;
  annual_income?: number | null;
  percentage?: number | null;
  cgpa?: number | null;
  is_st?: boolean | null;
  tribe_name?: string | null;
  gender?: string | null;
  disability?: boolean | null;
  first_gen?: boolean | null;
};

export type Scholarship = {
  id?: string;
  title?: string;
  description?: string;
  provider?: string;
  category?: string;
  education_level?: string[] | null;
  state?: string[] | null;
  amount?: number | null;
  application_url?: string | null;
  deadline?: string | null;
  status?: string | null;
  income_limit?: number | null;
  minimum_percentage?: number | null;
  tribal_requirement?: boolean | null;
  gender_requirement?: string | null;
  disability_requirement?: boolean | null;
  required_documents?: string[];
  benefits?: string[] | string | null;
  is_demo?: boolean | null;
};

export type Result = 'Eligible' | 'Not Eligible' | 'Potentially Eligible';
export type Check = { ok: boolean | null; msg: string; field: string };
export type Recommendation = {
  score: number;
  reasons: string[];
  summary: string;
};

export type ApplicationStatus =
  | 'not_applied'
  | 'started'
  | 'submitted'
  | 'under_verification'
  | 'approved'
  | 'rejected';

const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
  'not_applied',
  'started',
  'submitted',
  'under_verification',
  'approved',
  'rejected',
];

export function computeProfileCompletion(profile: Profile): number {
  const requiredFields: Array<keyof Profile> = [
    'full_name',
    'dob',
    'gender',
    'state',
    'district',
    'education_level',
    'course',
    'institution',
    'percentage',
    'annual_income',
    'is_st',
    'tribe_name',
    'disability',
    'first_gen',
  ];

  const completed = requiredFields.filter((field) => {
    const value = profile[field];
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'boolean') return value !== null;
    return value !== undefined && value !== null && String(value).trim() !== '';
  }).length;

  return Math.round((completed / requiredFields.length) * 100);
}

export function checkEligibility(p: Profile, s: Scholarship) {
  const c: Check[] = [];

  const add = (
    field: string,
    needed: boolean,
    val: string | number | boolean | null | undefined,
    test: () => boolean,
    pass: string,
    fail: string,
  ) => {
    if (!needed) return;
    if (val == null) {
      c.push({ ok: null, msg: `Missing: ${field}`, field });
      return;
    }
    const ok = test();
    c.push({ ok, msg: ok ? pass : fail, field });
  };

  add('education_level', !!s.education_level?.length, p.education_level, () => s.education_level!.map(normalizeEducation).includes(normalizeEducation(p.education_level)), 'Education level matches the scholarship requirement.', 'Education level is not covered by this scholarship.');
  add('state', !!s.state?.length, p.state, () => s.state!.map(normalizeState).includes(normalizeState(p.state)), 'Your state is eligible for this scholarship.', 'This scholarship is not available in your state.');
  add('annual_income', s.income_limit != null, p.annual_income, () => (p.annual_income ?? Infinity) <= (s.income_limit ?? Infinity), 'Annual income is within the stated limit.', `Annual income is above the limit of ${s.income_limit}.`);
  add('percentage', s.minimum_percentage != null, p.percentage, () => (p.percentage ?? 0) >= (s.minimum_percentage ?? 0), 'Academic percentage meets the minimum requirement.', `Percentage is below the minimum of ${s.minimum_percentage}%.`);
  add('is_st', !!s.tribal_requirement, p.is_st, () => p.is_st === true, 'Scheduled Tribe requirement is met.', 'This scholarship requires Scheduled Tribe status.');
  add('gender', !!s.gender_requirement, p.gender, () => normalizeGender(p.gender) === normalizeGender(s.gender_requirement), 'Gender requirement is satisfied.', 'Gender requirement is not met.');
  add('disability', !!s.disability_requirement, p.disability, () => p.disability === true, 'Disability requirement is met.', 'This scholarship requires disability status.');

  const result: Result = c.some((x) => x.ok === false)
    ? 'Not Eligible'
    : c.some((x) => x.ok === null)
      ? 'Potentially Eligible'
      : 'Eligible';

  return {
    result,
    reasons: c.filter((x) => x.ok !== null),
    missing: c.filter((x) => x.ok === null).map((x) => x.field),
    documents: s.required_documents ?? [],
  };
}

export function matchScore(p: Profile, s: Scholarship) {
  const r = checkEligibility(p, s);
  if (r.result === 'Not Eligible') return 0;

  const total = r.reasons.length + r.missing.length || 1;
  const passed = r.reasons.filter((reason) => reason.ok).length;
  return Math.min(100, Math.round((passed / total) * 100));
}

export function buildRecommendation(p: Profile, s: Scholarship): Recommendation {
  const eligibility = checkEligibility(p, s);

  if (eligibility.result === 'Not Eligible') {
    return {
      score: 0,
      reasons: ['This scholarship is not a good fit because one or more essential eligibility criteria are not met.'],
      summary: 'Not recommended',
    };
  }

  const positiveReasons = eligibility.reasons.filter((reason) => reason.ok).map((reason) => reason.msg);
  const missingReasons = eligibility.missing.length > 0 ? [`Missing profile information: ${eligibility.missing.join(', ')}`] : [];
  const amountBonus = s.amount && s.amount > 0 ? 8 : 0;
  const deadlineBonus = s.deadline ? 6 : 0;
  const academicBonus = (p.percentage ?? 0) >= 75 ? 10 : 4;
  const fitScore = Math.min(95, 52 + positiveReasons.length * 8 + amountBonus + deadlineBonus + academicBonus);
  const score = eligibility.result === 'Potentially Eligible' ? Math.min(84, fitScore - 10) : fitScore;

  const reasons = [...positiveReasons, ...missingReasons];
  const summary = eligibility.result === 'Eligible'
    ? 'Strong match based on your eligibility and academic profile.'
    : 'Good candidate but some information is still needed before confirming eligibility.';

  return { score: Math.max(25, Math.round(score)), reasons, summary };
}

// Statuses a student may record about their own application. The rest are set by a reviewer/admin.
export const STUDENT_SETTABLE_STATUSES: ApplicationStatus[] = ['not_applied', 'started', 'submitted'];
const TERMINAL_STATUSES: ApplicationStatus[] = ['approved', 'rejected'];

export function canStudentSetStatus(from: ApplicationStatus | null, to: ApplicationStatus): boolean {
  if (!STUDENT_SETTABLE_STATUSES.includes(to)) return false;
  return from === null || STUDENT_SETTABLE_STATUSES.includes(from);
}

// Reviewer workflow: forward-only, at most two steps, and approved/rejected are final.
export function canTransitionApplicationStatus(from: ApplicationStatus, to: ApplicationStatus): boolean {
  const fromIndex = APPLICATION_STATUS_ORDER.indexOf(from);
  const toIndex = APPLICATION_STATUS_ORDER.indexOf(to);

  if (fromIndex === -1 || toIndex === -1) return false;
  if (TERMINAL_STATUSES.includes(from)) return false;
  if (toIndex < fromIndex) return false;
  return toIndex - fromIndex <= 2;
}
