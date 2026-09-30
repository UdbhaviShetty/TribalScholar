import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INDIAN_STATES } from '../lib/core';
import { MAX_WIDTH, c, r, serif, shadow, shadowMd, shadowSm } from '../lib/theme';

// ─── Pattern Strip ────────────────────────────────────────────────────────────
export function PatternStrip() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.strip}>
      {Array.from({ length: 60 }).map((_, i) => (
        <View
          key={i}
          style={[s.diamond, {
            backgroundColor:
              i % 4 === 0 ? 'rgba(255,255,255,0.7)'
              : i % 4 === 1 ? 'rgba(232,130,12,0.6)'
              : i % 4 === 2 ? 'rgba(255,255,255,0.3)'
              : 'rgba(255,255,255,0.15)',
          }]}
        />
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export function Screen({ title, subtitle, children, right }: {
  title: string; subtitle?: string; children: ReactNode; right?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#137060', '#0D5A4C', '#0A4A3C']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[s.hero, { paddingTop: insets.top + 20 }]}
        >
          <View style={s.blobA} /><View style={s.blobB} /><View style={s.blobC} />
          <View style={s.heroInner}>
            <View style={s.titleRow}>
              <View style={{ flex: 1 }}>
                <View style={s.portalBadge}>
                  <Text style={s.portalBadgeText}>🏛️  UNIFIED SCHOLAR PORTAL</Text>
                </View>
                <Text accessibilityRole="header" style={s.h1}>{title}</Text>
                {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
              </View>
              {right}
            </View>
            <PatternStrip />
          </View>
        </LinearGradient>
        <View style={s.column}>{children}</View>
      </ScrollView>
    </View>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────
export function Stat({ value, label, tone, icon }: {
  value: string | number; label: string;
  tone: 'primary' | 'saffron' | 'plum' | 'sky' | 'rose'; icon?: string;
}) {
  const palettes = {
    primary: { bg: '#E6F7F3', border: '#B2E4D8', num: '#0D5A4C', lbl: '#137060', iconBg: '#B2E4D8' },
    saffron: { bg: '#FEF3C7', border: '#FCD34D', num: '#78350F', lbl: '#92400E', iconBg: '#FCD34D' },
    plum:    { bg: '#EDE9FE', border: '#C4B5FD', num: '#4C1D95', lbl: '#6D28D9', iconBg: '#C4B5FD' },
    sky:     { bg: '#E0F2FE', border: '#7DD3FC', num: '#0C4A6E', lbl: '#0369A1', iconBg: '#7DD3FC' },
    rose:    { bg: '#FCE7F3', border: '#F9A8D4', num: '#9D174D', lbl: '#BE185D', iconBg: '#F9A8D4' },
  };
  const p = palettes[tone];
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`}
      style={[s.stat, { backgroundColor: p.bg, borderColor: p.border }]}>
      {icon ? <View style={[s.statIconWrap, { backgroundColor: p.iconBg }]}><Text style={s.statIcon}>{icon}</Text></View> : null}
      <Text style={[s.statNum, { color: p.num }]}>{value}</Text>
      <Text style={[s.statLabel, { color: p.lbl }]}>{label}</Text>
    </View>
  );
}

// ─── Typography ───────────────────────────────────────────────────────────────
export const H2 = ({ children }: { children: ReactNode }) =>
  <Text accessibilityRole="header" style={s.h2}>{children}</Text>;
export const P = ({ children, muted }: { children: ReactNode; muted?: boolean }) =>
  <Text style={[s.p, muted && { color: c.muted }]}>{children}</Text>;

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, tone, style }: {
  children: ReactNode;
  tone?: 'ochre' | 'green' | 'blue' | 'purple';
  style?: any;
}) => {
  const toneMap: Record<string, any> = {
    ochre:  { borderLeftWidth: 4, borderLeftColor: '#E8820C', borderColor: '#FCD34D', backgroundColor: '#FFFBEB' },
    green:  { borderLeftWidth: 4, borderLeftColor: c.primary, borderColor: c.primaryMid, backgroundColor: c.primarySoft },
    blue:   { borderLeftWidth: 4, borderLeftColor: c.sky, borderColor: '#7DD3FC', backgroundColor: c.skySoft },
    purple: { borderLeftWidth: 4, borderLeftColor: c.plum, borderColor: '#C4B5FD', backgroundColor: c.plumSoft },
  };
  return <View style={[s.card, tone ? toneMap[tone] : null, style]}>{children}</View>;
};

// ─── Section chip ─────────────────────────────────────────────────────────────
export const SectionChip = ({ label, icon }: { label: string; icon?: string }) => (
  <View style={s.sectionChip}>
    {icon ? <Text style={s.sectionChipIcon}>{icon}</Text> : null}
    <Text style={s.sectionChipText}>{label}</Text>
  </View>
);

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type BtnProps = {
  label: string; onPress: () => void; variant?: BtnVariant;
  loading?: boolean; disabled?: boolean; hint?: string; small?: boolean; icon?: string;
};

export function Button({ label, onPress, variant = 'primary', loading, disabled, hint, small, icon }: BtnProps) {
  const off = disabled || loading;
  const variantStyles: Record<BtnVariant, { box: any; text: string }> = {
    primary:   { box: { backgroundColor: c.primary, ...shadowSm }, text: '#FFFFFF' },
    secondary: { box: { backgroundColor: '#FEF3C7', borderWidth: 1.5, borderColor: '#FCD34D' }, text: '#78350F' },
    danger:    { box: { backgroundColor: '#FEE2E2', borderWidth: 1.5, borderColor: '#FCA5A5' }, text: c.danger },
    ghost:     { box: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.border }, text: c.slate700 },
    outline:   { box: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.primary }, text: c.primary },
  };
  const st = variantStyles[variant];
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label}
      accessibilityHint={hint} accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={off ? undefined : onPress}
      style={({ pressed, focused }: any) => [
        s.btn, small && s.btnSmall, st.box,
        pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] },
        off && { opacity: 0.45 }, focused && s.focus,
      ]}
    >
      {loading
        ? <ActivityIndicator color={st.text} size="small" />
        : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {icon ? <Text style={{ fontSize: 16 }}>{icon}</Text> : null}
            <Text style={[s.btnText, { color: st.text }]}>{label}</Text>
          </View>
      }
    </Pressable>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────
export function Field({ label, error, hint, ...rest }: TextInputProps & { label: string; error?: string; hint?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 5 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label} placeholderTextColor={c.slate500}
        {...rest}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        style={[
          s.input,
          focused && s.inputFocused,
          error ? s.inputError : null,
          rest.multiline ? { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 } : null,
          rest.editable === false ? { backgroundColor: c.slate100, color: c.muted } : null,
        ]}
      />
      {hint && !error ? <Text style={s.hint}>{hint}</Text> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={s.errorText}>{error}</Text> : null}
    </View>
  );
}

// ─── Segmented control ────────────────────────────────────────────────────────
export function Segmented<T extends string | boolean | null>({ label, options, value, onChange }: {
  label: string; options: { label: string; value: T }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={s.segRow}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable key={String(o.value)} accessibilityRole="radio"
              accessibilityLabel={`${label}: ${o.label}`} accessibilityState={{ selected: on, checked: on }}
              onPress={() => onChange(o.value)}
              style={({ focused }: any) => [s.seg, on && s.segOn, focused && s.focus]}>
              <Text style={[s.segText, on && { color: '#FFFFFF', fontWeight: '700' }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ label, value, onChange, error }: {
  label: string; value: boolean; onChange: (v: boolean) => void; error?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Pressable accessibilityRole="checkbox" accessibilityLabel={label}
        accessibilityState={{ checked: value }} onPress={() => onChange(!value)}
        style={({ focused }: any) => [s.toggleRow, focused && s.focus]}>
        <View style={[s.box, value && { backgroundColor: c.primary, borderColor: c.primary }]}>
          {value ? <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>✓</Text> : null}
        </View>
        <Text style={[s.p, { flex: 1 }]}>{label}</Text>
      </Pressable>
      {error ? <Text accessibilityLiveRegion="polite" style={s.errorText}>{error}</Text> : null}
    </View>
  );
}

// ─── State Field ─────────────────────────────────────────────────────────────
export function StateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const q = value.trim().toLowerCase();
  const matches = q ? INDIAN_STATES.filter((x) => x.toLowerCase().includes(q) && x.toLowerCase() !== q).slice(0, 5) : [];
  return (
    <View style={{ gap: 4 }}>
      <Field label="State / UT" value={value} onChangeText={(t) => { onChange(t); setOpen(true); }}
        placeholder="Start typing, e.g. Karnataka" autoCapitalize="words" />
      {open && matches.length > 0 && (
        <View style={s.suggestBox}>
          {matches.map((m) => (
            <Pressable key={m} accessibilityRole="button" accessibilityLabel={`Choose ${m}`}
              onPress={() => { onChange(m); setOpen(false); }}
              style={({ pressed }: any) => [s.suggestItem, pressed && { backgroundColor: c.primarySoft }]}>
              <Text style={[s.p, { color: c.ink }]}>📍 {m}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Notice ───────────────────────────────────────────────────────────────────
const noticeTones = {
  info:    { bg: '#DBEAFE', fg: '#1E40AF', border: '#93C5FD', icon: 'ℹ️' },
  warn:    { bg: '#FEF3C7', fg: '#78350F', border: '#FCD34D', icon: '⚠️' },
  error:   { bg: '#FEE2E2', fg: '#991B1B', border: '#FCA5A5', icon: '❌' },
  success: { bg: '#DCFCE7', fg: '#14532D', border: '#86EFAC', icon: '✅' },
};
export function Notice({ kind = 'info', children }: { kind?: keyof typeof noticeTones; children: ReactNode }) {
  const t = noticeTones[kind];
  return (
    <View accessibilityRole={kind === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion={kind === 'error' || kind === 'success' ? 'polite' : 'none'}
      style={[s.notice, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={s.noticeIcon}>{t.icon}</Text>
      <Text style={[s.noticeText, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
const badgeTones = {
  info:    { bg: '#DBEAFE', fg: '#1E40AF' },
  warn:    { bg: '#FEF3C7', fg: '#78350F' },
  error:   { bg: '#FEE2E2', fg: '#991B1B' },
  success: { bg: '#DCFCE7', fg: '#14532D' },
};
export const Badge = ({ label, tone = 'info' }: { label: string; tone?: keyof typeof badgeTones }) => {
  const t = badgeTones[tone];
  return (
    <View style={[s.badge, { backgroundColor: t.bg }]}>
      <Text style={[s.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
};

// ─── Loading ──────────────────────────────────────────────────────────────────
export const Loading = ({ label = 'Loading…' }: { label?: string }) => (
  <View accessibilityLabel={label} accessibilityLiveRegion="polite" style={s.loadingWrap}>
    <View style={s.loadingCard}>
      <ActivityIndicator color={c.primary} size="large" />
      <Text style={s.loadingText}>{label}</Text>
    </View>
  </View>
);

// ─── Empty state ──────────────────────────────────────────────────────────────
export const Empty = ({ title, body, action, icon }: {
  title: string; body: string; action?: ReactNode; icon?: string;
}) => (
  <View style={s.emptyWrap}>
    <Text style={s.emptyIcon}>{icon ?? '📭'}</Text>
    <Text style={s.emptyTitle}>{title}</Text>
    <Text style={s.emptyBody}>{body}</Text>
    {action ? <View style={{ marginTop: 8 }}>{action}</View> : null}
  </View>
);

// ─── Error state ──────────────────────────────────────────────────────────────
export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <View style={{ gap: 10 }}>
    <Notice kind="error">{message}</Notice>
    {onRetry ? <Button label="Try again" variant="outline" onPress={onRetry} /> : null}
  </View>
);

// ─── Divider ─────────────────────────────────────────────────────────────────
export const Divider = ({ label }: { label?: string }) => (
  <View style={s.dividerWrap}>
    <View style={s.dividerLine} />
    {label ? <Text style={s.dividerLabel}>{label}</Text> : null}
    {label ? <View style={s.dividerLine} /> : null}
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  hero: {
    width: '100%', alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 28, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden',
  },
  heroInner: { width: '100%', maxWidth: MAX_WIDTH },
  blobA: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.06)', top: -80, right: -60 },
  blobB: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(232,130,12,0.15)', bottom: -40, left: -30 },
  blobC: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)', top: 20, left: '40%' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  portalBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  portalBadgeText: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  h1: { fontFamily: serif, fontSize: 30, lineHeight: 36, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  subtitle: { color: 'rgba(255,255,255,0.80)', fontSize: 14, marginTop: 4, lineHeight: 20 },
  strip: { flexDirection: 'row', height: 14, overflow: 'hidden', marginTop: 16, alignItems: 'center' },
  diamond: { width: 9, height: 9, marginRight: 9, transform: [{ rotate: '45deg' }] },
  scroll: { flexGrow: 1, alignItems: 'center', paddingBottom: 60 },
  column: { width: '100%', maxWidth: MAX_WIDTH, gap: 14, paddingTop: 20, paddingHorizontal: 16 },
  stat: { flex: 1, minWidth: 100, borderRadius: 16, padding: 16, gap: 4, borderWidth: 1.5, ...shadowSm },
  statIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statIcon: { fontSize: 16 },
  statNum: { fontFamily: serif, fontSize: 30, fontWeight: '700', lineHeight: 34 },
  statLabel: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  sectionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: c.primarySoft, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: c.primaryMid, marginBottom: 2,
  },
  sectionChipIcon: { fontSize: 14 },
  sectionChipText: { color: c.primary, fontSize: 13, fontWeight: '700' },
  h2: { fontFamily: serif, fontSize: 20, fontWeight: '700', color: c.ink, marginTop: 4, letterSpacing: -0.3 },
  p: { color: c.ink, fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: c.line, padding: 16, gap: 8, ...shadow },
  btn: { minHeight: 50, borderRadius: 12, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  btnSmall: { minHeight: 40, paddingHorizontal: 14 },
  btnText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  focus: { borderWidth: 2.5, borderColor: c.primary },
  label: { color: c.slate700, fontWeight: '600', fontSize: 13, marginBottom: 1 },
  input: {
    minHeight: 50, borderWidth: 1.5, borderColor: c.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFFFFF', fontSize: 15, color: c.ink,
  },
  inputFocused: { borderColor: c.primary, borderWidth: 2, backgroundColor: c.primarySoft },
  inputError: { borderColor: c.danger, borderWidth: 2 },
  hint: { color: c.muted, fontSize: 12 },
  errorText: { color: c.danger, fontSize: 12, fontWeight: '600' },
  segRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  seg: { minHeight: 40, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1.5, borderColor: c.border, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: c.primary, borderColor: c.primary },
  segText: { color: c.slate700, fontWeight: '600', fontSize: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: c.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  notice: { borderRadius: 12, padding: 14, borderWidth: 1.5, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  noticeIcon: { fontSize: 16 },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  loadingWrap: { padding: 32, alignItems: 'center' },
  loadingCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', gap: 14, borderWidth: 1.5, borderColor: c.line, ...shadow },
  loadingText: { color: c.muted, fontSize: 14, fontWeight: '500' },
  emptyWrap: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: c.line },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { fontFamily: serif, fontSize: 18, fontWeight: '700', color: c.ink, textAlign: 'center' },
  emptyBody: { color: c.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 280 },
  dividerWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: c.line },
  dividerLabel: { color: c.muted, fontSize: 12, fontWeight: '600' },
  suggestBox: { borderWidth: 1.5, borderColor: c.border, borderRadius: 12, backgroundColor: '#FFFFFF', overflow: 'hidden', ...shadow },
  suggestItem: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: c.line },
});
