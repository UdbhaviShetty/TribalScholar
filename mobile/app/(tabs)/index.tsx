import { useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button, Card, Divider, Empty, ErrorState, H2, Loading, Notice, P, Screen,
  SectionChip, Stat,
} from '../../components/ui';
import { ScholarshipCard } from '../../components/ScholarshipCard';
import { buildRecommendation, checkEligibility, computeProfileCompletion } from '../../lib/core';
import { formatDeadline, formatINR } from '../../lib/format';
import { useLoad, useProfile, useRepo } from '../../lib/repo';
import { useSaved } from '../../lib/useSaved';
import { c, serif, shadow, shadowSm } from '../../lib/theme';

// ─── Profile ring ─────────────────────────────────────────────────────────────
function ProfileRing({ pct }: { pct: number }) {
  const color = pct === 100 ? '#15803D' : pct >= 60 ? '#137060' : '#E8820C';
  return (
    <View
      accessible
      accessibilityLabel={`Profile ${pct} percent complete`}
      style={{
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: color,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
        ...shadowSm,
      }}
    >
      <Text style={{ fontFamily: serif, fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>{pct}%</Text>
      <Text style={{ fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 }}>PROFILE</Text>
    </View>
  );
}

// ─── Deadline urgency bar ─────────────────────────────────────────────────────
function DeadlineBar({ label, daysLeft }: { label: string; daysLeft: number }) {
  const pct = Math.max(0, Math.min(1, daysLeft / 30));
  const color = daysLeft <= 5 ? '#DC2626' : daysLeft <= 14 ? '#E8820C' : '#137060';
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: c.muted }}>{label}</Text>
        <Text style={{ fontSize: 12, fontWeight: '800', color }}>{daysLeft}d left</Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: c.slate200, overflow: 'hidden' }}>
        <View style={{ height: '100%', borderRadius: 3, backgroundColor: color, width: `${pct * 100}%` }} />
      </View>
    </View>
  );
}

// ─── Quick-action row ─────────────────────────────────────────────────────────
function QuickAction({ icon, label, desc, onPress }: {
  icon: string; label: string; desc: string; onPress: () => void;
}) {
  return (
    <Button
      label={label}
      variant="ghost"
      onPress={onPress}
      icon={icon}
    />
  );
}

// ─── Home screen ─────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const repo = useRepo();
  const { profile, loading: pLoading, error: pError, reload: reloadProfile } = useProfile();
  const saved = useSaved();
  const { data: list, loading, error, reload } = useLoad(() => repo.listScholarships(), [repo]);

  const { top, next, daysLeft } = useMemo(() => {
    if (!profile || !list) return { top: [], next: null, daysLeft: 0 };
    const ranked = list
      .map((s) => ({ s, result: checkEligibility(profile, s).result, score: buildRecommendation(profile, s).score }))
      .filter((x) => x.result !== 'Not Eligible')
      .sort((a, b) => b.score - a.score);
    const savedOpen = list.filter((s) => saved.ids.includes(s.id) && s.deadline)
      .sort((a, b) => a.deadline!.localeCompare(b.deadline!));
    const nextSaved = savedOpen[0] ?? null;
    let dl = 0;
    if (nextSaved?.deadline) {
      const diff = new Date(nextSaved.deadline).getTime() - Date.now();
      dl = Math.max(0, Math.ceil(diff / 86400000));
    }
    return { top: ranked.slice(0, 3).map((x) => x.s), next: nextSaved, daysLeft: dl };
  }, [profile, list, saved.ids]);

  if (pLoading && !profile) return <Screen title="Dashboard"><Loading /></Screen>;
  if (pError) return <Screen title="Dashboard"><ErrorState message={pError} onRetry={reloadProfile} /></Screen>;

  const completion = profile ? computeProfileCompletion(profile) : 0;
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Scholar';

  return (
    <Screen
      title={`Hello, ${firstName}`}
      subtitle="Your scholarship dashboard"
      right={<ProfileRing pct={completion} />}
    >
      {/* ── Realistic Hero Banner ── */}
      <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 6, ...shadow }}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop' }}
          style={{ width: '100%', height: 160 }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Text style={{ fontFamily: serif, color: '#fff', fontSize: 18, fontWeight: '700' }}>Find Your Future</Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Explore government and private funding opportunities.</Text>
        </View>
      </View>

      {/* ── Stats row ── */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat tone="primary" value={list?.length ?? '–'} label="Open Now" icon="🎓" />
        <Stat tone="saffron" value={top.length} label="Matches" icon="✨" />
        <Stat tone="plum" value={saved.ids.length} label="Saved" icon="🔖" />
      </View>

      {/* ── Profile completion nudge ── */}
      {completion < 100 || !profile?.consent_at ? (
        <Card tone="blue">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: serif, fontSize: 17, fontWeight: '700', color: c.ink }}>
                {completion < 100 ? `Profile ${completion}% complete` : 'Data consent needed'}
              </Text>
              <P muted>
                {profile?.consent_at
                  ? 'Fill in remaining details for more accurate matches.'
                  : 'Share your details to unlock scholarship matching.'}
              </P>
            </View>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.skySoft, alignItems: 'center', justifyContent: 'center', marginLeft: 12 }}>
              <Text style={{ fontSize: 22 }}>📋</Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={{ height: 8, borderRadius: 4, backgroundColor: c.slate200, overflow: 'hidden', marginTop: 4 }}>
            <View style={{ height: '100%', borderRadius: 4, backgroundColor: c.sky, width: `${completion}%` }} />
          </View>
          <Button label="Complete your profile" onPress={() => router.push('/profile')} />
        </Card>
      ) : null}

      {/* ── Next deadline ── */}
      {next ? (
        <Card tone="ochre">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Text style={{ fontSize: 18 }}>⏰</Text>
            <Text style={{ color: '#78350F', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 }}>NEXT SAVED DEADLINE</Text>
          </View>
          <Text style={{ fontFamily: serif, fontSize: 20, fontWeight: '700', color: c.ink }}>{next.title}</Text>
          <P muted>Award: {formatINR(next.amount)}</P>
          <DeadlineBar label={formatDeadline(next.deadline).label} daysLeft={daysLeft} />
          <Button
            variant="secondary"
            label="View details"
            icon="→"
            onPress={() => router.push(`/scholarship/${next.id}`)}
          />
        </Card>
      ) : null}

      {/* ── Recommended scholarships ── */}
      <Divider label="RECOMMENDED FOR YOU" />
      <SectionChip label="Best matches based on your profile" icon="🏆" />

      {loading && !list ? (
        <Loading label="Finding scholarships…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : top.length === 0 ? (
        <Empty
          icon="🔍"
          title="No matches yet"
          body={list && list.length === 0 ? 'No open scholarships are published right now.' : 'Complete your profile to see matches.'}
          action={<Button variant="outline" label="Browse all scholarships" onPress={() => router.push('/scholarships')} />}
        />
      ) : (
        top.map((s) => (
          <ScholarshipCard
            key={s.id} item={s} profile={profile}
            saved={saved.ids.includes(s.id)} busy={saved.busyId === s.id}
            onToggleSave={() => saved.toggle(s.id)}
          />
        ))
      )}

      {saved.error ? <Notice kind="error">{saved.error}</Notice> : null}

      {/* ── Quick actions ── */}
      <Divider label="QUICK ACTIONS" />
      <View style={{ gap: 8 }}>
        <Button variant="ghost" label="Deadline Alerts" icon="🔔" onPress={() => router.push('/alerts')} />
        <Button variant="ghost" label="AI Scholar Assistant" icon="🤖" onPress={() => router.push('/assistant')} />
        <Button variant="ghost" label="My Applications" icon="📄" onPress={() => router.push('/applications')} />
      </View>

      {/* ── Footer info card ── */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 28 }}>🏛️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: serif, fontSize: 15, fontWeight: '700', color: c.ink }}>Unified Scholar Portal</Text>
            <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>
              An initiative to connect tribal and minority students with government & private scholarships.
            </Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}
