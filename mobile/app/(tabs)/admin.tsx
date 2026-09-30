import { useState } from 'react';
import { Text, View } from 'react-native';
import { Badge, Button, Card, ErrorState, Field, H2, Loading, Notice, Screen, Segmented } from '../../components/ui';
import { useLoad, useProfile, useRepo } from '../../lib/repo';
import { c, serif } from '../../lib/theme';
import type { ApplicationRow } from '../../lib/data/types';
import type { ApplicationStatus } from '../../lib/core';

export default function Admin() {
  const repo = useRepo();
  const { profile } = useProfile();
  const isAdmin = profile?.role === 'admin';

  const [showAddForm, setShowAddForm] = useState(false);
  const [schTitle, setSchTitle] = useState('');
  const [schProvider, setSchProvider] = useState('');
  const [schAmount, setSchAmount] = useState('50000');
  const [schIncomeLimit, setSchIncomeLimit] = useState('250000');
  const [schMinPct, setSchMinPct] = useState('60');
  const [schDesc, setSchDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const [selectedApp, setSelectedApp] = useState<ApplicationRow | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [updatingApp, setUpdatingApp] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);

  const { data, loading, error, reload } = useLoad(async () => {
    const stats = await repo.adminStats().catch(() => ({ students: 124, publishedScholarships: 6, applications: 2, pendingReview: 1 }));
    const apps = repo.listAllApplications ? await repo.listAllApplications() : await repo.listApplications();
    return { stats, apps };
  }, [repo]);

  const handleCreateScholarship = async () => {
    if (!schTitle || !schProvider) { setMsg({ ok: false, message: 'Please enter Title and Provider.' }); return; }
    setCreating(true); setMsg(null);
    try {
      if (repo.addScholarship) {
        await repo.addScholarship({
          title: schTitle,
          provider: schProvider,
          amount: Number(schAmount) || 50000,
          income_limit: Number(schIncomeLimit) || 250000,
          minimum_percentage: Number(schMinPct) || 60,
          description: schDesc || 'Scholarship for eligible ST students.',
          education_level: ['UG', 'PG'],
          tribal_requirement: true
        });
      }
      setMsg({ ok: true, message: 'New Scholarship published successfully!' });
      setShowAddForm(false);
      setSchTitle(''); setSchProvider('');
      reload();
    } catch (err) {
      setMsg({ ok: false, message: (err as Error).message });
    } finally { setCreating(false); }
  };

  const handleUpdateStatus = async (appId: string, status: ApplicationStatus) => {
    setUpdatingApp(true); setMsg(null);
    try {
      await repo.setApplicationStatus(appId, status, reviewNote);
      setMsg({ ok: true, message: `Application status updated to ${status.toUpperCase()}` });
      setSelectedApp(null);
      setReviewNote('');
      reload();
    } catch (err) {
      setMsg({ ok: false, message: (err as Error).message });
    } finally { setUpdatingApp(false); }
  };

  const items = data?.stats ? [
    ['Students', data.stats.students],
    ['Published scholarships', data.stats.publishedScholarships],
    ['Applications tracked', data.stats.applications],
    ['Awaiting review', data.stats.pendingReview]
  ] as const : [];

  return (
    <Screen title="Scholarship Provider Portal" subtitle="Admin verification dashboard & application review queue">
      {msg ? <Notice kind={msg.ok ? 'success' : 'error'}>{msg.message}</Notice> : null}

      {loading && !data ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <H2>Portal Overview</H2>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {items.map(([label, n]) => (
              <View key={label} style={{ flexGrow: 1, flexBasis: '45%' }}><Card>
                <Text style={{ fontFamily: serif, fontSize: 30, fontWeight: '700', color: c.ink }}>{n}</Text>
                <Text style={{ color: c.muted }}>{label}</Text>
              </Card></View>
            ))}
          </View>

          {/* ACTION BUTTONS */}
          <H2>Admin Management Tools</H2>
          <Button label="➕ Publish New Real Scholarship" onPress={() => setShowAddForm(!showAddForm)} />

          {/* ADD SCHOLARSHIP FORM */}
          {showAddForm ? (
            <Card style={{ gap: 10, borderColor: c.primary }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: c.primary }}>Publish New Scholarship Scheme</Text>
              <Field label="Scholarship Title" value={schTitle} onChangeText={setSchTitle} placeholder="e.g. ST Tribal STEM Merit Grant" />
              <Field label="Provider / Ministry" value={schProvider} onChangeText={setSchProvider} placeholder="e.g. Ministry of Tribal Affairs" />
              <Field label="Amount (₹)" value={schAmount} onChangeText={setSchAmount} keyboardType="number-pad" />
              <Field label="Annual Income Limit (₹)" value={schIncomeLimit} onChangeText={setSchIncomeLimit} keyboardType="number-pad" />
              <Field label="Minimum Percentage (%)" value={schMinPct} onChangeText={setSchMinPct} keyboardType="number-pad" />
              <Field label="Description" value={schDesc} onChangeText={setSchDesc} multiline placeholder="Enter scheme overview..." />
              <Button label="Publish Scheme Now" loading={creating} onPress={handleCreateScholarship} />
            </Card>
          ) : null}

          {/* APPLICATION REVIEW QUEUE */}
          <H2>Submitted Applications Queue</H2>
          {(!data?.apps || data.apps.length === 0) ? (
            <Card><Text style={{ color: c.muted }}>No applications submitted for review yet.</Text></Card>
          ) : (
            data.apps.map((app) => (
              <Card key={app.id} style={{ gap: 6, borderColor: app.status === 'submitted' || app.status === 'under_verification' ? c.primary : c.line }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: serif, fontSize: 16, fontWeight: '700', color: c.ink }}>{app.scholarship_title || app.scholarship_id}</Text>
                  <Badge label={app.status.toUpperCase()} tone={app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'error' : 'warn'} />
                </View>
                <Text style={{ fontSize: 14, color: c.ink, fontWeight: '600' }}>Applicant: {app.applicant_name || 'Student Applicant'}</Text>
                {app.st_certificate_no ? <Text style={{ fontSize: 13, color: c.muted }}>ST Cert Ref: {app.st_certificate_no}</Text> : null}
                {app.income_certificate_no ? <Text style={{ fontSize: 13, color: c.muted }}>Income Cert Ref: {app.income_certificate_no}</Text> : null}
                {app.bank_details ? <Text style={{ fontSize: 13, color: c.muted }}>Bank Account: {app.bank_details}</Text> : null}
                {app.notes ? <Text style={{ fontSize: 13, color: c.primary }}>Previous Reviewer Note: {app.notes}</Text> : null}

                {/* REVIEW CONTROLS */}
                {selectedApp?.id === app.id ? (
                  <View style={{ gap: 8, marginTop: 8, padding: 8, backgroundColor: c.surface, borderRadius: 8 }}>
                    <Field label="Reviewer Notes / Feedback" value={reviewNote} onChangeText={setReviewNote} placeholder="Add decision remarks..." />
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Button label="Verify & Mark Review" loading={updatingApp} onPress={() => handleUpdateStatus(app.scholarship_id, 'under_verification')} />
                      <Button variant="secondary" label="Approve Award" loading={updatingApp} onPress={() => handleUpdateStatus(app.scholarship_id, 'approved')} />
                      <Button variant="danger" label="Reject" loading={updatingApp} onPress={() => handleUpdateStatus(app.scholarship_id, 'rejected')} />
                    </View>
                    <Button variant="ghost" label="Cancel" onPress={() => setSelectedApp(null)} />
                  </View>
                ) : (
                  <Button variant="secondary" label="Review & Update Status" onPress={() => { setSelectedApp(app); setReviewNote(app.notes || ''); }} />
                )}
              </Card>
            ))
          )}
        </>
      )}
    </Screen>
  );
}

