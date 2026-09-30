import type { ApplicationStatus, Profile, Scholarship } from '../core';

export type Role = 'student' | 'admin';
export type AppProfile = Profile & { id: string; role: Role; consent_at: string | null };
export type ProfilePatch = Partial<Omit<AppProfile, 'id' | 'role'>>;
export type ScholarshipRow = Scholarship & { id: string; title: string };

export type ApplicationRow = {
  id: string;
  scholarship_id: string;
  status: ApplicationStatus;
  notes: string | null;
  updated_at: string | null;
  scholarship_title: string | null;
  scholarship_deadline: string | null;
  applicant_name?: string | null;
  applicant_email?: string | null;
  st_certificate_no?: string | null;
  income_certificate_no?: string | null;
  bank_details?: string | null;
  application_notes?: string | null;
};

export type NotificationRow = { id: string; title: string | null; body: string | null; read_at: string | null; created_at: string | null };
export type AdminStats = { students: number; publishedScholarships: number; applications: number; pendingReview: number };

export class RepoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RepoError';
  }
}

export interface Repo {
  getProfile(): Promise<AppProfile>;
  updateProfile(patch: ProfilePatch): Promise<AppProfile>;
  listScholarships(opts?: { query?: string; includeClosed?: boolean }): Promise<ScholarshipRow[]>;
  getScholarship(id: string): Promise<ScholarshipRow | null>;
  addScholarship?(scholarship: Partial<ScholarshipRow>): Promise<ScholarshipRow>;
  listSavedIds(): Promise<string[]>;
  listSaved(): Promise<ScholarshipRow[]>;
  setSaved(scholarshipId: string, saved: boolean): Promise<void>;
  listApplications(): Promise<ApplicationRow[]>;
  listAllApplications?(): Promise<ApplicationRow[]>;
  setApplicationStatus(scholarshipId: string, status: ApplicationStatus, notes?: string): Promise<void>;
  submitApplicationDetails?(scholarshipId: string, details: { st_certificate_no?: string; income_certificate_no?: string; bank_details?: string; application_notes?: string }): Promise<void>;
  listNotifications(): Promise<NotificationRow[]>;
  markNotificationRead(id: string): Promise<void>;
  adminStats(): Promise<AdminStats>;
}

