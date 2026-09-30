import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge, Card, Empty, ErrorState, H2, Loading, Screen } from '../../components/ui';
import { daysUntil } from '../../lib/core';
import { formatDeadline } from '../../lib/format';
import { useLoad, useRepo } from '../../lib/repo';
import { c, serif } from '../../lib/theme';

export default function Alerts() {
  const router = useRouter();
  const repo = useRepo();
  const { data, setData, loading, error, reload } = useLoad(async () => {
    const [notes, saved] = await Promise.all([repo.listNotifications(), repo.listSaved()]);
    // Deadline reminders are computed from your saved scholarships; they are not stored messages.
    const soon = saved.filter((s) => s.deadline && (daysUntil(s.deadline) ?? -1) >= 0 && (daysUntil(s.deadline) ?? 99) <= 14).sort((a, b) => a.deadline!.localeCompare(b.deadline!));
    return { notes, soon };
  }, [repo]);

  return (
    <Screen title="Alerts" subtitle="Deadlines and messages">
      {loading && !data ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <H2>Closing within 14 days</H2>
          {data!.soon.length === 0 ? <Empty title="Nothing closing soon" body="Saved scholarships with a deadline in the next 14 days will show here." /> : data!.soon.map((s) => (
            <Card key={s.id} tone="ochre">
              <Text accessibilityRole="link" onPress={() => router.push(`/scholarship/${s.id}`)} style={{ fontFamily: serif, fontSize: 17, fontWeight: '700', color: c.primary }}>{s.title}</Text>
              <Text style={{ color: c.ochre, fontWeight: '700' }}>{formatDeadline(s.deadline).label}</Text>
            </Card>
          ))}
          <H2>Messages</H2>
          {data!.notes.length === 0 ? <Empty title="No messages" body="Notices from the programme team will appear here." /> : data!.notes.map((n) => (
            <Pressable key={n.id} accessibilityRole="button" accessibilityLabel={`${n.title ?? 'Message'}. ${n.read_at ? 'Read' : 'Unread, press to mark as read'}`}
              onPress={async () => { if (!n.read_at) { await repo.markNotificationRead(n.id).catch(() => undefined); setData((p) => p && { ...p, notes: p.notes.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)) }); } }}>
              <Card>
                {!n.read_at ? <Badge label="New" tone="info" /> : null}
                <Text style={{ fontWeight: '700', color: c.ink, fontSize: 16 }}>{n.title}</Text>
                <Text style={{ color: c.ink }}>{n.body}</Text>
              </Card>
            </Pressable>
          ))}
        </>
      )}
    </Screen>
  );
}
