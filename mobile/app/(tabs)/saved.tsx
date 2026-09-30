import { useRouter } from 'expo-router';
import { Button, Empty, ErrorState, Loading, Notice, Screen } from '../../components/ui';
import { ScholarshipCard } from '../../components/ScholarshipCard';
import { useLoad, useProfile, useRepo } from '../../lib/repo';
import { useSaved } from '../../lib/useSaved';

export default function Saved() {
  const router = useRouter();
  const repo = useRepo();
  const { profile } = useProfile();
  const saved = useSaved();
  const { data, loading, error, reload } = useLoad(() => repo.listSaved(), [repo]);
  const items = (data ?? []).filter((s) => saved.ids.includes(s.id));

  return (
    <Screen title="Saved" subtitle="Scholarships you're keeping an eye on">
      {saved.error ? <Notice kind="error">{saved.error}</Notice> : null}
      {loading && !data ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : items.length === 0 ? (
        <Empty title="Nothing saved yet" body="Save a scholarship from Discover and it will appear here." action={<Button variant="secondary" label="Browse scholarships" onPress={() => router.push('/scholarships')} />} />
      ) : items.map((s) => (
        <ScholarshipCard key={s.id} item={s} profile={profile} saved busy={saved.busyId === s.id} onToggleSave={() => saved.toggle(s.id)} />
      ))}
    </Screen>
  );
}
