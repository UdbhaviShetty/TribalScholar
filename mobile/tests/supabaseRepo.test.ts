import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseRepo, sanitizeSearch } from '../lib/data/supabaseRepo';
import { RepoError } from '../lib/data/types';
import { has, mockClient } from './mockClient';

const UID = 'user-1';

test('getProfile reads only the signed-in user and merges profiles + students', async () => {
  const { client, calls } = mockClient((c) => c.table === 'profiles'
    ? { data: { id: UID, role: 'student', full_name: 'Asha' } }
    : { data: { id: UID, state: 'Karnataka', consent_at: '2026-01-01T00:00:00Z' } });
  const p = await createSupabaseRepo(client, UID).getProfile();
  assert.equal(p.full_name, 'Asha'); assert.equal(p.state, 'Karnataka'); assert.equal(p.role, 'student');
  assert.ok(calls.every((c) => has(c, 'eq', 'id', UID)));
});

test('getProfile surfaces database errors as RepoError', async () => {
  const { client } = mockClient(() => ({ error: { message: 'boom' } }));
  await assert.rejects(createSupabaseRepo(client, UID).getProfile(), (e: Error) => e instanceof RepoError && /boom/.test(e.message));
});

test('listScholarships requests published, open scholarships ordered by deadline', async () => {
  const { client, calls } = mockClient(() => ({ data: [{ id: 'a', title: 'A' }] }));
  const rows = await createSupabaseRepo(client, UID).listScholarships();
  assert.equal(rows.length, 1);
  const c = calls[0];
  assert.ok(has(c, 'eq', 'status', 'published'));
  assert.ok(c.ops.some((o) => o.m === 'or' && /deadline\.gte\.\d{4}-\d{2}-\d{2},deadline\.is\.null/.test(o.args[0])));
  assert.ok(has(c, 'order', 'deadline'));
});

test('listScholarships can include closed items', async () => {
  const { client, calls } = mockClient(() => ({ data: [] }));
  await createSupabaseRepo(client, UID).listScholarships({ includeClosed: true });
  assert.ok(!calls[0].ops.some((o) => o.m === 'or'));
});

test('search input cannot inject PostgREST filter syntax', async () => {
  assert.equal(sanitizeSearch('a,status.eq.draft)%_*'), 'a status.eq.draft');
  const { client, calls } = mockClient(() => ({ data: [] }));
  await createSupabaseRepo(client, UID).listScholarships({ query: 'merit),status.eq.draft' });
  const or = calls[0].ops.filter((o) => o.m === 'or').map((o) => o.args[0]).join('|');
  assert.ok(!/\),status/.test(or));
  assert.ok(has(calls[0], 'eq', 'status', 'published'));
});

test('saving upserts with the user id; unsaving deletes scoped to user and scholarship', async () => {
  const { client, calls } = mockClient(() => ({}));
  const repo = createSupabaseRepo(client, UID);
  await repo.setSaved('s1', true);
  assert.deepEqual(calls[0].ops.find((o) => o.m === 'upsert')!.args[0], { student_id: UID, scholarship_id: 's1' });
  await repo.setSaved('s1', false);
  assert.ok(has(calls[1], 'delete') && has(calls[1], 'eq', 'student_id', UID) && has(calls[1], 'eq', 'scholarship_id', 's1'));
});

test('listSaved drops scholarships hidden by RLS (null join) and non-published ones', async () => {
  const { client } = mockClient(() => ({ data: [
    { scholarships: { id: 'a', title: 'A', status: 'published' } }, { scholarships: null }, { scholarships: { id: 'b', title: 'B', status: 'archived' } },
  ] }));
  assert.deepEqual((await createSupabaseRepo(client, UID).listSaved()).map((s) => s.id), ['a']);
});

test('students cannot set reviewer statuses; nothing is written', async () => {
  const { client, calls } = mockClient(() => ({ data: { status: 'started' } }));
  await assert.rejects(createSupabaseRepo(client, UID).setApplicationStatus('s1', 'approved'), /reviewer/);
  assert.ok(!calls.some((c) => has(c, 'upsert')));
});

test('students cannot change an application a reviewer already moved', async () => {
  const { client, calls } = mockClient(() => ({ data: { status: 'under_verification' } }));
  await assert.rejects(createSupabaseRepo(client, UID).setApplicationStatus('s1', 'started'), /reviewer/);
  assert.ok(!calls.some((c) => has(c, 'upsert')));
});

test('a permitted status change upserts with the user id', async () => {
  const { client, calls } = mockClient((c) => (has(c, 'maybeSingle') ? { data: null } : {}));
  await createSupabaseRepo(client, UID).setApplicationStatus('s1', 'started');
  const up = calls.find((c) => has(c, 'upsert'))!.ops.find((o) => o.m === 'upsert')!;
  assert.equal(up.args[0].student_id, UID); assert.equal(up.args[0].status, 'started');
  assert.equal(up.args[1].onConflict, 'student_id,scholarship_id');
});

test('listApplications maps the joined scholarship title', async () => {
  const { client, calls } = mockClient(() => ({ data: [{ id: 'x', scholarship_id: 's1', status: 'started', updated_at: 't', scholarships: { title: 'T', deadline: '2026-12-01' } }] }));
  const rows = await createSupabaseRepo(client, UID).listApplications();
  assert.equal(rows[0].scholarship_title, 'T');
  assert.ok(has(calls[0], 'eq', 'student_id', UID));
});

test('updateProfile reports a clear error when the name update is blocked by RLS (0 rows)', async () => {
  const { client } = mockClient(() => ({ data: [] }));
  await assert.rejects(createSupabaseRepo(client, UID).updateProfile({ full_name: 'New' }), /0003/);
});

test('updateProfile upserts student fields for the current user only', async () => {
  const { client, calls } = mockClient((c) => (c.table === 'profiles' ? { data: { id: UID, role: 'student', full_name: null } } : { data: { id: UID } }));
  await createSupabaseRepo(client, UID).updateProfile({ state: 'Kerala', percentage: 70 });
  const up = calls.find((c) => has(c, 'upsert'))!.ops.find((o) => o.m === 'upsert')!;
  assert.deepEqual(up.args[0], { id: UID, state: 'Kerala', percentage: 70 });
});

test('notifications are read and marked read for the current user only', async () => {
  const { client, calls } = mockClient(() => ({ data: [] }));
  const repo = createSupabaseRepo(client, UID);
  await repo.listNotifications(); await repo.markNotificationRead('n1');
  assert.ok(has(calls[0], 'eq', 'user_id', UID));
  assert.ok(has(calls[1], 'eq', 'id', 'n1') && has(calls[1], 'eq', 'user_id', UID));
});

test('adminStats returns live counts', async () => {
  const { client } = mockClient(() => ({ count: 7 }));
  assert.deepEqual(await createSupabaseRepo(client, UID).adminStats(), { students: 7, publishedScholarships: 7, applications: 7, pendingReview: 7 });
});
