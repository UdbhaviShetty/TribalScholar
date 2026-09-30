import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, ErrorState, Field, H2, Loading, Notice, P, Screen, Segmented, StateField, Toggle } from '../../components/ui';
import { appMode } from '../../lib/config';
import { useAuth } from '../../lib/auth';
import { computeProfileCompletion } from '../../lib/core';
import { formToPatch, profileToForm, validateProfile, type FormErrors, type ProfileForm } from '../../lib/format';
import { useProfile } from '../../lib/repo';
import { c } from '../../lib/theme';

const YES_NO = [{ label: 'Yes', value: true as boolean | null }, { label: 'No', value: false as boolean | null }, { label: 'Prefer not to say', value: null as boolean | null }];

export default function Profile() {
  const auth = useAuth();
  const { profile, loading, error, reload, save } = useProfile();
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  useEffect(() => { if (profile && !form) setForm(profileToForm(profile)); }, [profile, form]);

  if (loading && !profile) return <Screen title="Profile"><Loading /></Screen>;
  if (error || !profile || !form) return <Screen title="Profile"><ErrorState message={error ?? 'Profile unavailable.'} onRetry={reload} /></Screen>;

  const set = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) => { setForm({ ...form, [k]: v }); setResult(null); };
  const completion = computeProfileCompletion({ ...profile, ...formToPatch(form, profile.consent_at) });

  const onSave = async () => {
    const e = validateProfile(form);
    setErrors(e);
    if (Object.keys(e).length) { setResult({ ok: false, message: 'Please fix the highlighted fields.' }); return; }
    setSaving(true); setResult(null);
    try { await save(formToPatch(form, profile.consent_at)); setResult({ ok: true, message: 'Profile saved.' }); }
    catch (err) { setResult({ ok: false, message: (err as Error).message }); }
    finally { setSaving(false); }
  };

  return (
    <Screen title="Profile" subtitle={auth.email ?? undefined}>
      <Card>
        <Text style={{ color: c.ink, fontWeight: '700' }}>{completion}% complete</Text>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: completion }} style={{ height: 10, borderRadius: 99, backgroundColor: c.primarySoft, overflow: 'hidden' }}>
          <View style={{ width: `${completion}%`, height: '100%', backgroundColor: c.primary }} />
        </View>
        <P muted>Only you can see your details. They are used to check scholarship criteria.</P>
      </Card>

      <H2>About you</H2>
      <Field label="Full name" value={form.full_name} onChangeText={(v) => set('full_name', v)} error={errors.full_name} autoComplete="name" />
      <Field label="Date of birth" value={form.dob} onChangeText={(v) => set('dob', v)} error={errors.dob} placeholder="YYYY-MM-DD" hint="Example: 2004-07-11" autoCapitalize="none" />
      <Segmented label="Gender" value={form.gender} onChange={(v) => set('gender', v)} options={[{ label: 'Female', value: 'Female' }, { label: 'Male', value: 'Male' }, { label: 'Other', value: 'Other' }]} />
      <StateField value={form.state} onChange={(v) => set('state', v)} />
      <Field label="District" value={form.district} onChangeText={(v) => set('district', v)} />

      <H2>Education</H2>
      <Segmented label="Education level" value={form.education_level} onChange={(v) => set('education_level', v)} options={['Diploma', 'UG', 'PG', 'PhD'].map((v) => ({ label: v, value: v }))} />
      <Field label="Course" value={form.course} onChangeText={(v) => set('course', v)} />
      <Field label="Institution" value={form.institution} onChangeText={(v) => set('institution', v)} />
      <Field label="Latest percentage" value={form.percentage} onChangeText={(v) => set('percentage', v)} error={errors.percentage} keyboardType="decimal-pad" hint="0 to 100" />
      <Field label="CGPA (optional)" value={form.cgpa} onChangeText={(v) => set('cgpa', v)} error={errors.cgpa} keyboardType="decimal-pad" hint="0 to 10" />

      <H2>Family and background</H2>
      <Field label="Annual family income (₹)" value={form.annual_income} onChangeText={(v) => set('annual_income', v)} error={errors.annual_income} keyboardType="number-pad" />
      <Segmented<boolean | null> label="Scheduled Tribe (ST)" value={form.is_st} onChange={(v) => set('is_st', v)} options={YES_NO} />
      {form.is_st ? <Field label="Tribe name (optional)" value={form.tribe_name} onChangeText={(v) => set('tribe_name', v)} /> : null}
      <Segmented<boolean | null> label="Person with disability" value={form.disability} onChange={(v) => set('disability', v)} options={YES_NO} />
      <Segmented<boolean | null> label="First-generation learner" value={form.first_gen} onChange={(v) => set('first_gen', v)} options={YES_NO} />

      <Card>
        <Toggle label="I agree to store these details to match scholarships for me. I can change or clear them later." value={form.consent} onChange={(v) => set('consent', v)} error={errors.consent} />
      </Card>
      {result ? <Notice kind={result.ok ? 'success' : 'error'}>{result.message}</Notice> : null}
      <Button label="Save profile" loading={saving} onPress={onSave} />

      <H2>Account</H2>
      <P muted>{appMode === 'demo' ? 'You are in demo mode. Signing out keeps the sample data on this device.' : 'Account deletion is not available in the app yet. Contact the programme administrator to request it.'}</P>
      <Button variant="danger" label="Sign out" onPress={auth.signOut} />
    </Screen>
  );
}
