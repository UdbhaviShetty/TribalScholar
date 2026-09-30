import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Empty, ErrorState, Field, Loading, Notice, Screen, Toggle } from '../../components/ui';
import { ScholarshipCard } from '../../components/ScholarshipCard';
import { checkEligibility } from '../../lib/core';
import { useLoad, useProfile, useRepo } from '../../lib/repo';
import { useSaved } from '../../lib/useSaved';

export default function Discover() {
  const router = useRouter();
  const repo = useRepo();
  const { profile } = useProfile();
  const saved = useSaved();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [hideMismatch, setHideMismatch] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDebounced(query), 300); return () => clearTimeout(t); }, [query]);

  const { data, loading, error, reload } = useLoad(() => repo.listScholarships({ query: debounced, includeClosed: showClosed }), [repo, debounced, showClosed]);
  const items = useMemo(() => (data ?? []).filter((s) => !hideMismatch || !profile || checkEligibility(profile, s).result !== 'Not Eligible'), [data, hideMismatch, profile]);

  return (
    <Screen title="Discover" subtitle="Published scholarships you can apply to">
      <Field label="Search" value={query} onChangeText={setQuery} placeholder="Title, provider or category" returnKeyType="search" autoCapitalize="none" />
      <View style={{ gap: 2 }}>
        <Toggle label="Hide scholarships that don't match my profile" value={hideMismatch} onChange={setHideMismatch} />
        <Toggle label="Include closed scholarships" value={showClosed} onChange={setShowClosed} />
      </View>
      {saved.error ? <Notice kind="error">{saved.error}</Notice> : null}
      {loading && !data ? <Loading label="Loading scholarships…" /> : error ? <ErrorState message={error} onRetry={reload} /> : items.length === 0 ? (
        <Empty title="No scholarships found" body={debounced ? `Nothing matches "${debounced}".` : 'No scholarships are available with these filters.'} action={debounced ? <Button variant="secondary" label="Clear search" onPress={() => setQuery('')} /> : undefined} />
      ) : items.map((s) => (
        <ScholarshipCard key={s.id} item={s} profile={profile} saved={saved.ids.includes(s.id)} busy={saved.busyId === s.id} onToggleSave={() => saved.toggle(s.id)} />
      ))}
      {!profile?.consent_at ? <Button variant="ghost" label="Complete your profile for accurate results" onPress={() => router.push('/profile')} /> : null}
    </Screen>
  );
}
