import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoRepo, type KeyValueStorage } from '../lib/data/demoRepo';

const memory = (): KeyValueStorage => { const m = new Map<string, string>(); return { getItem: async (k) => m.get(k) ?? null, setItem: async (k, v) => { m.set(k, v); } }; };

test('demo data persists across repo instances sharing storage', async () => {
  const st = memory();
  await createDemoRepo(st).setSaved('demo-1', true);
  assert.deepEqual(await createDemoRepo(st).listSavedIds(), ['demo-1']);
  await createDemoRepo(st).setSaved('demo-1', false);
  assert.deepEqual(await createDemoRepo(st).listSavedIds(), []);
});
test('closed scholarships are hidden unless requested; results are sorted by deadline', async () => {
  const repo = createDemoRepo(memory());
  const open = await repo.listScholarships();
  assert.ok(!open.some((s) => s.id === 'demo-4'));
  // demo-2 (6d), sch-st-5 (25d), demo-1 (45d), demo-3 (60d), sch-st-6 (75d)
  assert.deepEqual(open.map((s) => s.id), ['demo-2', 'sch-st-5', 'demo-1', 'demo-3', 'sch-st-6']);
  assert.ok((await repo.listScholarships({ includeClosed: true })).some((s) => s.id === 'demo-4'));
});

test('search matches title, provider, and category', async () => {
  const repo = createDemoRepo(memory());
  assert.deepEqual((await repo.listScholarships({ query: 'stem' })).map((s) => s.id), ['demo-3']);
  assert.equal((await repo.listScholarships({ query: 'zzz' })).length, 0);
});
test('demo repo enforces the same status rule as the server', async () => {
  const repo = createDemoRepo(memory());
  await repo.setApplicationStatus('demo-1', 'started');
  await repo.setApplicationStatus('demo-1', 'submitted');
  await assert.rejects(repo.setApplicationStatus('demo-1', 'approved'), /reviewer/);
  const apps = await repo.listApplications();
  assert.equal(apps[0].status, 'submitted'); assert.match(apps[0].scholarship_title!, /Post-Matric/);
});
test('profile updates persist and admin stats are refused in demo mode', async () => {
  const st = memory();
  await createDemoRepo(st).updateProfile({ state: 'Kerala' });
  assert.equal((await createDemoRepo(st).getProfile()).state, 'Kerala');
  await assert.rejects(createDemoRepo(st).adminStats(), /demo mode/);
});
test('corrupted stored state falls back to fresh sample state', async () => {
  const st = memory(); await st.setItem('ts_demo_state_v1', '{not json');
  assert.equal((await createDemoRepo(st).getProfile()).role, 'student');
});
