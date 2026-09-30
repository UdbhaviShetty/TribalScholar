import { canStudentSetStatus, isDeadlineOpen, type ApplicationStatus } from '../core';
import { demoNotifications, demoProfile, demoScholarships } from './demoData';
import type { AdminStats, ApplicationRow, NotificationRow, ProfilePatch, Repo, ScholarshipRow } from './types';
import { RepoError } from './types';

export type KeyValueStorage = { getItem(k: string): Promise<string | null>; setItem(k: string, v: string): Promise<void> };

type StoredApp = {
  id: string;
  status: ApplicationStatus;
  notes?: string | null;
  updated_at: string;
  applicant_name?: string | null;
  applicant_email?: string | null;
  st_certificate_no?: string | null;
  income_certificate_no?: string | null;
  bank_details?: string | null;
  application_notes?: string | null;
};

type State = {
  profile: ReturnType<typeof demoProfile>;
  saved: string[];
  customScholarships: ScholarshipRow[];
  applications: Record<string, StoredApp>;
  notifications: NotificationRow[];
};

const KEY = 'ts_portal_state_v2';

export function createDemoRepo(storage: KeyValueStorage, now: () => Date = () => new Date()): Repo {
  const load = async (): Promise<State> => {
    const raw = await storage.getItem(KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          profile: parsed.profile ?? demoProfile(),
          saved: parsed.saved ?? [],
          customScholarships: parsed.customScholarships ?? [],
          applications: parsed.applications ?? {},
          notifications: parsed.notifications ?? demoNotifications(),
        };
      } catch { /* fall through */ }
    }
    return { profile: demoProfile(), saved: [], customScholarships: [], applications: {}, notifications: demoNotifications() };
  };

  const save = (s: State) => storage.setItem(KEY, JSON.stringify(s));

  const catalog = async () => {
    const s = await load();
    return [...demoScholarships(now()), ...s.customScholarships];
  };

  return {
    async getProfile() { return (await load()).profile; },
    async updateProfile(patch: ProfilePatch) {
      const s = await load();
      s.profile = { ...s.profile, ...patch };
      await save(s);
      return s.profile;
    },
    async listScholarships({ query, includeClosed } = {}) {
      const q = (query ?? '').trim().toLowerCase();
      const items = await catalog();
      return items
        .filter((x) => includeClosed || isDeadlineOpen(x.deadline))
        .filter((x) => !q || `${x.title} ${x.provider} ${x.category}`.toLowerCase().includes(q))
        .sort((a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'));
    },
    async getScholarship(id) {
      const items = await catalog();
      return items.find((x) => x.id === id) ?? null;
    },
    async addScholarship(patch: Partial<ScholarshipRow>) {
      const s = await load();
      const newSch: ScholarshipRow = {
        id: `sch-custom-${Date.now()}`,
        title: patch.title || 'New Scholarship',
        provider: patch.provider || 'Scholarship Authority',
        category: patch.category || 'Government',
        description: patch.description || '',
        education_level: patch.education_level || ['UG', 'PG'],
        state: patch.state || null,
        amount: patch.amount || 25000,
        application_url: patch.application_url || 'https://scholarships.gov.in',
        deadline: patch.deadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'published',
        income_limit: patch.income_limit ?? null,
        minimum_percentage: patch.minimum_percentage ?? null,
        tribal_requirement: patch.tribal_requirement ?? true,
        gender_requirement: patch.gender_requirement ?? null,
        disability_requirement: patch.disability_requirement ?? null,
        required_documents: patch.required_documents || ['ST Certificate', 'Income Certificate', 'Academic Marksheet'],
        benefits: patch.benefits || 'Tuition fee waiver & stipend',
        is_demo: false
      };
      s.customScholarships.push(newSch);
      await save(s);
      return newSch;
    },
    async listSavedIds() { return (await load()).saved; },
    async listSaved() {
      const ids = (await load()).saved;
      const items = await catalog();
      return items.filter((x) => ids.includes(x.id));
    },
    async setSaved(id, isSaved) {
      const s = await load();
      s.saved = isSaved ? Array.from(new Set([...s.saved, id])) : s.saved.filter((x) => x !== id);
      await save(s);
    },
    async listApplications() {
      const s = await load();
      const items = await catalog();
      const byId = new Map(items.map((x) => [x.id, x]));
      return Object.entries(s.applications).map(([sid, a]): ApplicationRow => ({
        id: a.id,
        scholarship_id: sid,
        status: a.status,
        notes: a.notes ?? null,
        updated_at: a.updated_at,
        scholarship_title: byId.get(sid)?.title ?? null,
        scholarship_deadline: byId.get(sid)?.deadline ?? null,
        applicant_name: a.applicant_name ?? s.profile.full_name,
        applicant_email: a.applicant_email ?? 'student@scholar.org',
        st_certificate_no: a.st_certificate_no ?? null,
        income_certificate_no: a.income_certificate_no ?? null,
        bank_details: a.bank_details ?? null,
        application_notes: a.application_notes ?? null
      }));
    },
    async listAllApplications() {
      return this.listApplications();
    },
    async setApplicationStatus(id, status, notes) {
      const s = await load();
      const prev = s.applications[id];
      const from = prev?.status ?? null;
      if (notes === undefined && !canStudentSetStatus(from, status)) {
        throw new RepoError('That status is set by a reviewer and cannot be changed here.');
      }
      s.applications[id] = {
        ...(prev ?? { id: `app-${id}`, applicant_name: s.profile.full_name, applicant_email: 'student@scholar.org' }),
        status,
        notes: notes !== undefined ? notes : prev?.notes ?? null,
        updated_at: now().toISOString()
      };
      await save(s);
    },
    async submitApplicationDetails(scholarshipId, details) {
      const s = await load();
      const prev = s.applications[scholarshipId];
      s.applications[scholarshipId] = {
        ...(prev ?? { id: `app-${Date.now()}` }),
        status: 'submitted',
        applicant_name: s.profile.full_name || 'Scholarship Applicant',
        applicant_email: 'student@scholar.org',
        st_certificate_no: details.st_certificate_no || 'ST-CERT-2026-8891',
        income_certificate_no: details.income_certificate_no || 'INC-2026-4421',
        bank_details: details.bank_details || 'SBIN0004521 / A/C 3882910291',
        application_notes: details.application_notes || 'Application submitted via Unified Scholar Portal',
        updated_at: now().toISOString()
      };
      await save(s);
    },
    async listNotifications() { return (await load()).notifications; },
    async markNotificationRead(id) {
      const s = await load();
      s.notifications = s.notifications.map((n) => (n.id === id ? { ...n, read_at: now().toISOString() } : n));
      await save(s);
    },
    async adminStats(): Promise<AdminStats> {
      // demoRepo is always demo mode — admin live stats are only available via supabaseRepo
      throw new RepoError('Admin statistics are not available in demo mode.');
    }

  };
}

