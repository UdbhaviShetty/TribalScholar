import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge, Button, Card, Empty, ErrorState, Loading, Screen } from '../../components/ui';
import { StatusPicker } from '../../components/StatusPicker';
import { formatDeadline } from '../../lib/format';
import { useLoad, useRepo } from '../../lib/repo';
import { c, serif } from '../../lib/theme';

export default function Applications() {
  const router = useRouter();
  const repo = useRepo();
  const { data, setData, loading, error, reload } = useLoad(() => repo.listApplications(), [repo]);

  return (
    <Screen title="Application Tracker" subtitle="Real-time application status, submitted details, and provider feedback">
      {loading && !data ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : !data || data.length === 0 ? (
        <Empty title="No applications submitted yet" body="Browse available scholarships, check your eligibility, and submit direct applications through the portal." action={<Button label="Browse Scholarships" onPress={() => router.push('/scholarships')} />} />
      ) : data.map((a) => (
        <Card key={a.id} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text accessibilityRole="link" onPress={() => router.push(`/scholarship/${a.scholarship_id}`)} style={{ fontFamily: serif, fontSize: 18, fontWeight: '700', color: c.primary, flex: 1 }}>
              {a.scholarship_title ?? 'Scholarship Scheme'}
            </Text>
            <Badge label={a.status.toUpperCase()} tone={a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'error' : 'warn'} />
          </View>

          {a.scholarship_deadline ? <Text style={{ color: c.muted, fontSize: 13 }}>{formatDeadline(a.scholarship_deadline).label}</Text> : null}
          {a.st_certificate_no ? <Text style={{ fontSize: 13, color: c.ink }}>ST Certificate Ref: <Text style={{ fontWeight: '600' }}>{a.st_certificate_no}</Text></Text> : null}
          {a.notes ? <Text style={{ fontSize: 13, color: c.primary, fontWeight: '600' }}>Provider Note: {a.notes}</Text> : null}

          <StatusPicker scholarshipId={a.scholarship_id} status={a.status} onChanged={(status) => setData((p) => (p ?? []).map((x) => (x.id === a.id ? { ...x, status } : x)))} />
          <Button variant="secondary" label="View Scholarship & Details" onPress={() => router.push(`/scholarship/${a.scholarship_id}`)} />
        </Card>
      ))}
    </Screen>
  );
}

