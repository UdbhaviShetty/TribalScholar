import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { checkEligibility, type Profile } from '../lib/core';
import type { ScholarshipRow } from '../lib/data/types';
import { formatDeadline, formatINR } from '../lib/format';
import { accentFor, c, serif, shadow, shadowSm } from '../lib/theme';
import { Badge, Button } from './ui';

export function eligibilityBadge(result: string) {
  if (result === 'Eligible') return { label: '✅ You appear eligible', tone: 'success' as const };
  if (result === 'Potentially Eligible') return { label: '⚠️ Add details to confirm', tone: 'warn' as const };
  return { label: '❌ Doesn\'t match profile', tone: 'error' as const };
}

export function ScholarshipCard({
  item, profile, saved, onToggleSave, busy,
}: {
  item: ScholarshipRow; profile: Profile | null; saved: boolean;
  onToggleSave: () => void; busy?: boolean;
}) {
  const router = useRouter();
  const dl = formatDeadline(item.deadline);
  const e = profile ? eligibilityBadge(checkEligibility(profile, item).result) : null;
  const a = accentFor(item.category);
  const initial = item.title.replace(/^\[demo\]\s*/i, '').charAt(0).toUpperCase() || 'S';
  
  // Deterministic realistic image based on title length
  const images = [
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=200&auto=format&fit=crop', // school
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=200&auto=format&fit=crop', // books
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=200&auto=format&fit=crop', // library
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=200&auto=format&fit=crop', // classroom
    'https://images.unsplash.com/photo-1519452333269-e36b961de315?q=80&w=200&auto=format&fit=crop', // graduation
  ];
  const imgUrl = images[item.title.length % images.length];

  return (
    <View style={[st.card, { borderTopColor: a.fg }]}>
      {/* Clickable main area */}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${item.title}. ${dl.label}. Open details`}
        onPress={() => router.push(`/scholarship/${item.id}`)}
        style={({ pressed }: any) => [{ gap: 12 }, pressed && { opacity: 0.88 }]}
      >
        {/* Header row */}
        <View style={st.head}>
          <Image 
            source={{ uri: imgUrl }} 
            style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: a.bg }} 
            resizeMode="cover"
          />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={st.title} numberOfLines={2}>{item.title}</Text>
            <Text style={st.meta} numberOfLines={1}>
              {item.provider ?? 'Provider not listed'}
              {item.category ? `  •  ${item.category}` : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.muted} />
        </View>

        {/* Chips */}
        <View style={st.chips}>
          <View style={st.amountChip}>
            <Text style={st.amountEmoji}>💰</Text>
            <Text style={st.amountText}>{formatINR(item.amount)}</Text>
          </View>
          <View style={[
            st.deadlineChip,
            dl.urgent && { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
            dl.closed && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
          ]}>
            <Text style={{ fontSize: 13 }}>{dl.closed ? '🚫' : dl.urgent ? '⏰' : '📅'}</Text>
            <Text style={[
              st.deadlineText,
              dl.urgent && { color: '#78350F', fontWeight: '800' },
              dl.closed && { color: '#991B1B', fontWeight: '800' },
            ]}>
              {dl.label}
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Eligibility + badges */}
      <View style={[st.chips, { marginTop: 2 }]}>
        {e ? <Badge label={e.label} tone={e.tone} /> : null}
        {item.is_demo ? <Badge label="Sample" tone="info" /> : null}
      </View>

      {/* Save button */}
      <Button
        small
        variant={saved ? 'ghost' : 'outline'}
        loading={busy}
        icon={saved ? '🔖' : '＋'}
        label={saved ? 'Remove from saved' : 'Save scholarship'}
        onPress={onToggleSave}
      />
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: c.line,
    borderTopWidth: 5,
    padding: 16,
    gap: 10,
    ...shadow,
  },
  head: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  avatar: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  initial: { fontFamily: serif, fontSize: 24, fontWeight: '700' },
  title: { fontFamily: serif, fontSize: 17, lineHeight: 23, fontWeight: '700', color: c.ink },
  meta: { color: c.muted, fontSize: 13, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  amountChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FEF3C7', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#FCD34D',
  },
  amountEmoji: { fontSize: 13 },
  amountText: { color: '#78350F', fontWeight: '800', fontSize: 14 },
  deadlineChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F0F4F8', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: c.slate200,
  },
  deadlineText: { color: c.muted, fontSize: 13, fontWeight: '600' },
});
