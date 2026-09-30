import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Badge, Button, Card, ErrorState, Field, H2, Loading, Notice, P, Screen } from '../../components/ui';
import { StatusPicker } from '../../components/StatusPicker';
import { eligibilityBadge } from '../../components/ScholarshipCard';
import { checkEligibility, type ApplicationStatus } from '../../lib/core';
import { formatDeadline, formatINR } from '../../lib/format';
import { useLoad, useProfile, useRepo } from '../../lib/repo';
import { useSaved } from '../../lib/useSaved';
import { c } from '../../lib/theme';

const FIELD_LABEL: Record<string, string> = { education_level: 'education level', state: 'state', annual_income: 'annual income', percentage: 'percentage', is_st: 'Scheduled Tribe status', gender: 'gender', disability: 'disability status' };

export default function ScholarshipDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const repo = useRepo();
  const { profile } = useProfile();
  const saved = useSaved();

  const [showApplyForm, setShowApplyForm] = useState(false);
  const [stCert, setStCert] = useState('ST-CERT-2026-8891');
  const [incomeCert, setIncomeCert] = useState('INC-2026-4421');
  const [bankDetails, setBankDetails] = useState('SBIN0004521 / A/C 3882910291');
  const [appNotes, setAppNotes] = useState('Applying for tuition support & book stipend for academic year 2026.');
  const [submitting, setSubmitting] = useState(false);
  const [applyResult, setApplyResult] = useState<{ ok: boolean; message: string } | null>(null);

  const { data, setData, loading, error, reload } = useLoad(async () => {
    const [scholarship, apps] = await Promise.all([repo.getScholarship(id), repo.listApplications()]);
    const currentApp = apps.find((a) => a.scholarship_id === id);
    return {
      scholarship,
      status: (currentApp?.status ?? null) as ApplicationStatus | null,
      appDetails: currentApp
    };
  }, [repo, id]);

  const back = <Button variant="ghost" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/scholarships'))} />;
  if (loading && !data) return <Screen title="Scholarship">{back}<Loading /></Screen>;
  if (error) return <Screen title="Scholarship">{back}<ErrorState message={error} onRetry={reload} /></Screen>;
  const s = data?.scholarship;
  if (!s) return <Screen title="Not available">{back}<Notice>This scholarship is no longer listed or you don't have access to it.</Notice></Screen>;

  const dl = formatDeadline(s.deadline);
  const elig = profile ? checkEligibility(profile, s) : null;
  const badge = elig ? eligibilityBadge(elig.result) : null;
  const url = s.application_url && /^https?:\/\//i.test(s.application_url) ? s.application_url : null;
  const benefits = Array.isArray(s.benefits) ? s.benefits.join(', ') : s.benefits;
  const isSaved = saved.ids.includes(s.id);
  const isSubmitted = data?.status === 'submitted' || data?.status === 'under_verification' || data?.status === 'approved' || data?.status === 'rejected';

  const handleSubmitApplication = async () => {
    if (!repo.submitApplicationDetails) {
      await repo.setApplicationStatus(s.id, 'submitted');
    } else {
      setSubmitting(true);
      setApplyResult(null);
      try {
        await repo.submitApplicationDetails(s.id, {
          st_certificate_no: stCert,
          income_certificate_no: incomeCert,
          bank_details: bankDetails,
          application_notes: appNotes
        });
        setApplyResult({ ok: true, message: 'Application submitted successfully to the portal!' });
        setData((p) => p ? { ...p, status: 'submitted' } : p);
        setShowApplyForm(false);
      } catch (err) {
        setApplyResult({ ok: false, message: (err as Error).message });
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <Screen title={s.title} subtitle={s.provider ?? undefined}>
      {back}
      
      <Card>
        <Text style={{ color: c.primary, fontSize: 22, fontWeight: '700' }}>{formatINR(s.amount)}</Text>
        <Text style={{ color: dl.urgent ? c.ochre : c.muted, fontWeight: dl.urgent ? '700' : '400' }}>{dl.label}</Text>
        {badge ? <Badge label={badge.label} tone={badge.tone} /> : null}
        {dl.closed ? <Badge label="Applications closed" tone="error" /> : null}
      </Card>

      {s.description ? <P>{s.description}</P> : null}
      {benefits ? <P>Benefits: {benefits}</P> : null}

      {/* PORTAL APPLICATION SECTION */}
      <H2>Unified Scholar Portal Application</H2>
      {applyResult ? <Notice kind={applyResult.ok ? 'success' : 'error'}>{applyResult.message}</Notice> : null}

      {isSubmitted ? (
        <Card style={{ backgroundColor: c.primarySoft, borderColor: c.primary }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: c.primary }}>✅ Application Submitted</Text>
          <Text style={{ fontSize: 14, color: c.ink, marginTop: 4 }}>Status: <Text style={{ fontWeight: '700' }}>{data?.status?.toUpperCase()}</Text></Text>
          {data?.appDetails?.st_certificate_no ? <Text style={{ fontSize: 13, color: c.muted, marginTop: 4 }}>ST Certificate Ref: {data.appDetails.st_certificate_no}</Text> : null}
          {data?.appDetails?.notes ? <Text style={{ fontSize: 13, color: c.primary, marginTop: 4 }}>Reviewer Notes: {data.appDetails.notes}</Text> : null}
        </Card>
      ) : showApplyForm ? (
        <Card style={{ gap: 10, borderColor: c.primary }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: c.ink }}>Fill Application Details</Text>
          <Field label="Applicant Name" value={profile?.full_name || ''} editable={false} hint="Pre-filled from your profile" />
          <Field label="ST / Caste Certificate No." value={stCert} onChangeText={setStCert} placeholder="e.g. ST-CERT-2026-8891" />
          <Field label="Income Certificate No." value={incomeCert} onChangeText={setIncomeCert} placeholder="e.g. INC-2026-4421" />
          <Field label="Bank Account / IFSC Details" value={bankDetails} onChangeText={setBankDetails} placeholder="e.g. SBIN0004521 / A/C 3882910291" />
          <Field label="Statement of Purpose / Notes" value={appNotes} onChangeText={setAppNotes} multiline placeholder="State why you are applying..." />
          <Button label="Confirm & Submit Application" loading={submitting} onPress={handleSubmitApplication} />
          <Button variant="ghost" label="Cancel" onPress={() => setShowApplyForm(false)} />
        </Card>
      ) : (
        <Button label="📝 Submit Direct Application via Portal" onPress={() => setShowApplyForm(true)} />
      )}

      {elig ? (
        <>
          <H2>Your eligibility check</H2>
          <Card>
            {elig.reasons.map((r) => (
              <View key={r.field} style={{ flexDirection: 'row', gap: 8 }}>
                <Text accessibilityLabel={r.ok ? 'Met' : 'Not met'} style={{ color: r.ok ? c.ok : c.danger, fontWeight: '800', width: 18 }}>{r.ok ? '✓' : '✗'}</Text>
                <Text style={{ flex: 1, color: c.ink, fontSize: 15 }}>{r.msg}</Text>
              </View>
            ))}
            {elig.missing.map((f) => (
              <View key={f} style={{ flexDirection: 'row', gap: 8 }}>
                <Text accessibilityLabel="Unknown" style={{ color: c.ochre, fontWeight: '800', width: 18 }}>?</Text>
                <Text style={{ flex: 1, color: c.ink, fontSize: 15 }}>Add your {FIELD_LABEL[f] ?? f} to your profile to check this.</Text>
              </View>
            ))}
            {elig.reasons.length + elig.missing.length === 0 ? <P muted>No specific criteria are listed for this scholarship.</P> : null}
          </Card>
        </>
      ) : null}

      {s.required_documents && s.required_documents.length > 0 ? (
        <>
          <H2>Required documents</H2>
          <Card>{s.required_documents.map((d) => <Text key={d} style={{ color: c.ink, fontSize: 15 }}>• {d}</Text>)}</Card>
        </>
      ) : null}

      <H2>Application options & tracking</H2>
      {saved.error ? <Notice kind="error">{saved.error}</Notice> : null}
      <Button variant={isSaved ? 'ghost' : 'secondary'} loading={saved.busyId === s.id} label={isSaved ? 'Remove from saved' : 'Save scholarship'} onPress={() => saved.toggle(s.id)} />
      <StatusPicker scholarshipId={s.id} status={data?.status ?? null} onChanged={(status) => setData((p) => (p ? { ...p, status } : p))} />
      {url ? <Button variant="ghost" label="Open Official Government Portal Link" hint="Opens external website" onPress={() => Linking.openURL(url)} /> : null}
    </Screen>
  );
}

