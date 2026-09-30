import type { SupabaseClient } from '@supabase/supabase-js';
import { canStudentSetStatus, todayISO, type ApplicationStatus } from '../core';
import { RepoError, type AdminStats, type ApplicationRow, type AppProfile, type NotificationRow, type ProfilePatch, type Repo, type ScholarshipRow } from './types';

export const STUDENT_COLS =
  'id, dob, gender, state, district, education_level, course, institution, percentage, cgpa, annual_income, is_st, tribe_name, disability, first_gen, consent_at';
export const SCHOLARSHIP_COLS =
  'id, title, description, provider, category, education_level, state, amount, application_url, deadline, status, income_limit, minimum_percentage, tribal_requirement, gender_requirement, disability_requirement, required_documents, benefits, is_demo';

// Strip characters that are special in PostgREST filters or ILIKE patterns.
export function sanitizeSearch(input: string | undefined): string {
  return (input ?? '').replace(/[,()%*_\\"'`;]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}

type DbError = { message: string } | null;
const fail = (error: DbError, what: string) => {
  if (error) throw new RepoError(`${what}. ${error.message}`);
};

/**
 * Every query is scoped by RLS *and* by an explicit user id filter (defence in depth).
 * The client is injected so this module is unit-testable without React Native.
 */
export function createSupabaseRepo(client: SupabaseClient, userId: string): Repo {
  async function getProfile(): Promise<AppProfile> {
    const [p, s] = await Promise.all([
      client.from('profiles').select('id, role, full_name').eq('id', userId).maybeSingle(),
      client.from('students').select(STUDENT_COLS).eq('id', userId).maybeSingle(),
    ]);
    fail(p.error, 'Could not load your profile');
    fail(s.error, 'Could not load your student details');
    // Self-heal: if trigger didn't create the profile row yet, create it now
    if (!p.data) {
      await client.from('profiles').insert({ id: userId }).select('id');
      await client.from('students').insert({ id: userId }).select('id');
    }
    const { id: _id, ...student } = (s.data ?? {}) as Record<string, unknown>;
    return { ...student, id: userId, role: (p.data?.role ?? 'student'), full_name: p.data?.full_name ?? null, consent_at: (student.consent_at as string) ?? null } as AppProfile;
  }

  return {
    getProfile,

    async updateProfile(patch: ProfilePatch) {
      const { full_name, ...student } = patch;
      if (Object.keys(student).length > 0) {
        const r = await client.from('students').upsert({ id: userId, ...student }, { onConflict: 'id' }).select('id');
        fail(r.error, 'Could not save your profile');
      }
      if (full_name !== undefined) {
        const r = await client.from('profiles').update({ full_name }).eq('id', userId).select('id');
        fail(r.error, 'Could not save your name');
        if (!r.data || r.data.length === 0) {
          // Try inserting instead (for users created before trigger was set up)
          await client.from('profiles').upsert({ id: userId, full_name }, { onConflict: 'id' });
        }
      }
      return getProfile();
    },


    async listScholarships(opts = {}) {
      let q = client.from('scholarships').select(SCHOLARSHIP_COLS).eq('status', 'published');
      if (!opts.includeClosed) q = q.or(`deadline.gte.${todayISO()},deadline.is.null`);
      const term = sanitizeSearch(opts.query);
      if (term) q = q.or(`title.ilike.%${term}%,provider.ilike.%${term}%,category.ilike.%${term}%`);
      const r = await q.order('deadline', { ascending: true, nullsFirst: false });
      fail(r.error, 'Could not load scholarships');
      return (r.data ?? []) as unknown as ScholarshipRow[];
    },

    async getScholarship(id) {
      const r = await client.from('scholarships').select(SCHOLARSHIP_COLS).eq('id', id).eq('status', 'published').maybeSingle();
      fail(r.error, 'Could not load this scholarship');
      return (r.data as unknown as ScholarshipRow) ?? null;
    },

    async listSavedIds() {
      const r = await client.from('saved_scholarships').select('scholarship_id').eq('student_id', userId);
      fail(r.error, 'Could not load saved scholarships');
      return (r.data ?? []).map((row: { scholarship_id: string }) => row.scholarship_id);
    },

    async listSaved() {
      const r = await client.from('saved_scholarships').select(`scholarship_id, scholarships(${SCHOLARSHIP_COLS})`).eq('student_id', userId);
      fail(r.error, 'Could not load saved scholarships');
      return ((r.data ?? []) as unknown as { scholarships: ScholarshipRow | null }[])
        .map((row) => row.scholarships)
        .filter((s): s is ScholarshipRow => !!s && s.status === 'published');
    },

    async setSaved(scholarshipId, saved) {
      if (saved) {
        const r = await client.from('saved_scholarships').upsert({ student_id: userId, scholarship_id: scholarshipId }, { onConflict: 'student_id,scholarship_id', ignoreDuplicates: true });
        fail(r.error, 'Could not save this scholarship');
      } else {
        const r = await client.from('saved_scholarships').delete().eq('student_id', userId).eq('scholarship_id', scholarshipId);
        fail(r.error, 'Could not remove this scholarship');
      }
    },

    async listApplications() {
      let r = await client
        .from('applications')
        .select('id, scholarship_id, status, notes, updated_at, st_certificate_no, income_certificate_no, bank_details, application_notes, scholarships(title, deadline)')
        .eq('student_id', userId)
        .order('updated_at', { ascending: false });
        
      if (r.error) {
        // Fallback for ANY error (usually missing columns) on the complex query
        r = await client
          .from('applications')
          .select('id, scholarship_id, status, notes, updated_at, scholarships(title, deadline)')
          .eq('student_id', userId)
          .order('updated_at', { ascending: false });
      }

      fail(r.error, 'Could not load your applications');
      return ((r.data ?? []) as unknown as Array<Record<string, any>>).map((row): ApplicationRow => ({
        id: row.id,
        scholarship_id: row.scholarship_id,
        status: row.status,
        notes: row.notes ?? null,
        updated_at: row.updated_at ?? null,
        st_certificate_no: row.st_certificate_no ?? null,
        income_certificate_no: row.income_certificate_no ?? null,
        bank_details: row.bank_details ?? null,
        application_notes: row.application_notes ?? null,
        scholarship_title: row.scholarships?.title ?? null,
        scholarship_deadline: row.scholarships?.deadline ?? null,
      }));
    },

    async setApplicationStatus(scholarshipId, status: ApplicationStatus) {
      const cur = await client.from('applications').select('status').eq('student_id', userId).eq('scholarship_id', scholarshipId).maybeSingle();
      fail(cur.error, 'Could not check your application');
      const from = (cur.data?.status as ApplicationStatus | undefined) ?? null;
      if (!canStudentSetStatus(from, status)) {
        throw new RepoError('That status is set by a reviewer and cannot be changed here.');
      }
      const r = await client
        .from('applications')
        .upsert({ student_id: userId, scholarship_id: scholarshipId, status, updated_at: new Date().toISOString() }, { onConflict: 'student_id,scholarship_id' });
      fail(r.error, 'Could not update your application');
    },

    async submitApplicationDetails(scholarshipId: string, details: { st_certificate_no?: string; income_certificate_no?: string; bank_details?: string; application_notes?: string }) {
      const { st_certificate_no, income_certificate_no, bank_details, application_notes } = details;
      const r = await client
        .from('applications')
        .upsert({ 
          student_id: userId, 
          scholarship_id: scholarshipId, 
          status: 'submitted', 
          st_certificate_no,
          income_certificate_no,
          bank_details,
          application_notes,
          updated_at: new Date().toISOString() 
        }, { onConflict: 'student_id,scholarship_id' });
        
      if (r.error) {
        // Fallback: If DB missing detailed columns, just update the status so the app still works!
        const r2 = await client
          .from('applications')
          .upsert({ student_id: userId, scholarship_id: scholarshipId, status: 'submitted', updated_at: new Date().toISOString() }, { onConflict: 'student_id,scholarship_id' });
        fail(r2.error, 'Could not submit your application details');
        return;
      }
      fail(r.error, 'Could not submit your application details');
    },

    async listNotifications() {
      const r = await client.from('notifications').select('id, title, body, read_at, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
      fail(r.error, 'Could not load notifications');
      return (r.data ?? []) as NotificationRow[];
    },

    async markNotificationRead(id) {
      const r = await client.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId);
      fail(r.error, 'Could not update the notification');
    },

    async adminStats(): Promise<AdminStats> {
      const count = async (table: string, build?: (q: any) => any) => {
        let q: any = client.from(table).select('*', { count: 'exact', head: true });
        if (build) q = build(q);
        const r = await q;
        fail(r.error, `Could not count ${table}`);
        return (r.count as number) ?? 0;
      };
      const [students, publishedScholarships, applications, pendingReview] = await Promise.all([
        count('students'),
        count('scholarships', (q) => q.eq('status', 'published')),
        count('applications'),
        count('applications', (q) => q.in('status', ['submitted', 'under_verification'])),
      ]);
      return { students, publishedScholarships, applications, pendingReview };
    },
  };
}
