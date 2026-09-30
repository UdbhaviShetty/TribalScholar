import test from 'node:test';
import assert from 'node:assert/strict';
import { formToPatch, formatDeadline, friendlyAuthError, profileToForm, validateProfile, type ProfileForm } from '../lib/format';
import { demoProfile } from '../lib/data/demoData';
import { demoAnswer } from '../lib/assistant';
import { demoScholarships } from '../lib/data/demoData';

const base = (): ProfileForm => ({ ...profileToForm(demoProfile()), consent: true });

test('valid form has no errors', () => assert.deepEqual(validateProfile(base(), '2026-09-29'), {}));
test('consent is required to save', () => assert.ok(validateProfile({ ...base(), consent: false }).consent));
test('numeric fields are range-checked', () => {
  const e = validateProfile({ ...base(), percentage: '140', cgpa: '11', annual_income: '-5' });
  assert.ok(e.percentage && e.cgpa && e.annual_income);
  assert.deepEqual(validateProfile({ ...base(), percentage: 'abc' }).percentage !== undefined, true);
});
test('dob must be a real, past date', () => {
  assert.ok(validateProfile({ ...base(), dob: '11/07/2004' }).dob);
  assert.ok(validateProfile({ ...base(), dob: '2030-01-01' }, '2026-09-29').dob);
  assert.equal(validateProfile({ ...base(), dob: '' }).dob, undefined);
});
test('formToPatch converts blanks to null, parses numbers, and keeps first consent time', () => {
  const p = formToPatch({ ...base(), district: '  ', annual_income: '1,80,000' }, '2026-01-01T00:00:00Z', new Date('2026-09-29T00:00:00Z'));
  assert.equal(p.district, null); assert.equal(p.annual_income, 180000); assert.equal(p.consent_at, '2026-01-01T00:00:00Z');
  assert.equal(formToPatch(base(), null, new Date('2026-09-29T00:00:00Z')).consent_at, '2026-09-29T00:00:00.000Z');
  assert.equal(formToPatch({ ...base(), consent: false }, 'x').consent_at, null);
});
test('deadline labels flag urgency and closed items', () => {
  assert.equal(formatDeadline('2026-09-30', '2026-09-29').label, 'Closes tomorrow');
  assert.equal(formatDeadline('2026-09-25', '2026-09-29').closed, true);
  assert.equal(formatDeadline('2026-11-01', '2026-09-29').urgent, false);
  assert.equal(formatDeadline(null).label, 'Deadline not listed');
});
test('auth errors are made readable', () => {
  assert.match(friendlyAuthError('Invalid login credentials'), /incorrect/);
  assert.match(friendlyAuthError('Email not confirmed'), /confirm/);
});
test('demo assistant defers eligibility to the rules engine and is honest when it cannot answer', () => {
  const list = demoScholarships(new Date());
  assert.match(demoAnswer('which scholarships am I eligible for?', list, demoProfile()), /Post-Matric Scholarship Scheme for ST Students: Eligible/);
  assert.match(demoAnswer('national merit fellowship', list, demoProfile()), /Karnataka|Minimum marks: 75%/);
  assert.match(demoAnswer('what is the meaning of life', list, null), /keywords/);
  assert.match(demoAnswer('', list, null), /Type a question/);
});
