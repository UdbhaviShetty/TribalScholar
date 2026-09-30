// Renders the exported demo-mode web bundle in jsdom and walks the main student flow.
// Usage: npm run smoke:web   (builds dist-demo first)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const root = path.resolve(process.env.SMOKE_DIR ?? 'dist-demo');
const expectSetup = process.env.SMOKE_EXPECT_SETUP === '1'; // check a NON-demo, unconfigured build
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  let p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(root, 'index.html');
  res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

const errors = [];
process.on('unhandledRejection', (e) => /6000ms timeout/.test(String(e?.message ?? e)) || errors.push('unhandledRejection: ' + String(e?.message ?? e).slice(0, 200)));
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push(String(e.message).slice(0, 200)));
// jsdom has no layout engine; stub the browser APIs React Native Web expects.
const beforeParse = (w) => {
  const Noop = class { observe() {} unobserve() {} disconnect() {} };
  w.ResizeObserver = Noop; w.IntersectionObserver = Noop; w.CSSFontFaceRule ??= class {};
  w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
};
const dom = await JSDOM.fromURL(`http://localhost:${port}/`, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc, beforeParse });
const { window } = dom;

const text = () => window.document.body.textContent ?? '';
const waitFor = async (label, pred, ms = 15000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (pred()) return; await new Promise((r) => setTimeout(r, 100)); }
  throw new Error(`Timed out waiting for: ${label}\nBody text: ${text().slice(0, 400)}\nErrors: ${errors.join(' | ')}`);
};
const click = (label) => {
  const el = [...window.document.querySelectorAll('[role="button"],[role="radio"],[role="link"],[role="checkbox"],[role="tab"],a,button')].find((e) => (e.getAttribute('aria-label') ?? e.textContent ?? '').includes(label));
  if (!el) throw new Error(`No control labelled "${label}". Body: ${text().slice(0, 300)}`);
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
};

let step = 'start';
try {
  if (expectSetup) {
    step = 'unconfigured build shows set-up screen and offers no way in';
    await waitFor(step, () => text().includes('Set-up needed'));
    if (text().includes('Continue in demo mode') || text().includes('Demo mode:')) throw new Error('demo mode is active in a build that should not have it');
    console.log('PASS unconfigured build: set-up screen only, no demo/login bypass');
    window.close(); server.close(); process.exit(0);
  }
  step = 'signed-out gate shows login'; await waitFor(step, () => text().includes('Continue in demo mode'));
  step = 'demo banner is labelled'; await waitFor(step, () => text().includes('Demo mode'));
  click('Continue in demo mode');
  step = 'home renders after sign-in'; await waitFor(step, () => text().includes('Hello, Sample') );
  step = 'recommendations load from repo'; await waitFor(step, () => text().includes('Post-Matric Tribal Support'));
  step = 'closed sample is not offered'; if (text().includes('Closed Sample Award')) throw new Error('closed scholarship visible on Home');
  step = 'save a scholarship'; click('Save [DEMO] Post-Matric Tribal Support');
  await waitFor(step, () => !!window.document.querySelector('[aria-label^="Remove [DEMO] Post-Matric Tribal Support from saved"]'));
  step = 'Saved tab lists it'; click('Saved'); await waitFor(step, () => text().includes('Scholarships you') && text().includes('Post-Matric Tribal Support'));
  step = 'Applications tab starts empty'; click('Applications'); await waitFor(step, () => text().includes('No applications tracked'));
  step = 'open detail with eligibility'; click('Saved'); await waitFor(step, () => text().includes('Post-Matric'));
  click('Post-Matric Tribal Support.'); await waitFor(step, () => text().includes('Your eligibility') && text().includes('Documents to prepare') && text().includes('Sample record'));
  step = 'set application progress'; click('My progress: Started'); await waitFor(step, () => text().includes('Progress saved.'));
  step = 'Applications tab shows tracked item'; click('Applications'); await waitFor(step, () => !text().includes('No applications tracked') && text().includes('Post-Matric Tribal Support'));
  step = 'reviewer statuses are not offered to students'; if (text().includes('My progress') && window.document.querySelector('[aria-label="My progress: Approved"]')) throw new Error('Approved option is visible to students');
  step = 'profile requires consent'; click('Profile'); await waitFor(step, () => text().includes('Save profile'));
  click('Save profile'); await waitFor(step, () => text().includes('Please fix the highlighted fields.') && text().includes('Please agree'));
  step = 'profile saves once consent is given'; click('I agree to store these details'); await new Promise((r) => setTimeout(r, 300)); click('Save profile'); await waitFor(step, () => text().includes('Profile saved.'));
  step = 'admin area is hidden from students'; if (window.document.querySelector('[role="tab"][aria-label="Admin"]') || /Live counts from the database/.test(text())) throw new Error('admin visible');
  step = 'sign out returns to login'; click('Sign out'); await waitFor(step, () => text().includes('Continue in demo mode'));
  console.log('PASS web smoke: gate, demo label, sign-in, Home, save, Saved, detail, progress, Applications, profile consent+save, no admin, sign-out');
} catch (e) {
  console.error('FAIL at step:', step, '\n', e.message); process.exitCode = 1;
} finally { window.close(); server.close(); }
