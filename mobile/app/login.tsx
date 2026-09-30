import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, type AuthResult } from '../lib/auth';
import { c, serif } from '../lib/theme';

type Mode = 'signin' | 'signup' | 'forgot';

// ─── Reusable input field ──────────────────────────────────────────────────────
function LField({ label, value, onChange, secure, keyboard, autoComplete, placeholder, hint, onSubmit }: {
  label: string; value: string; onChange: (v: string) => void;
  secure?: boolean; keyboard?: 'email-address' | 'default';
  autoComplete?: any; placeholder?: string; hint?: string; onSubmit?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={ls.fieldWrap}>
      <Text style={ls.fieldLabel}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange}
        secureTextEntry={secure} keyboardType={keyboard ?? 'default'}
        autoComplete={autoComplete}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
        placeholder={placeholder} placeholderTextColor="#94A3B8"
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmit} returnKeyType={onSubmit ? 'done' : 'next'}
        style={[ls.fieldInput, focused && ls.fieldFocused]}
      />
      {hint ? <Text style={ls.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

// ─── Buttons ──────────────────────────────────────────────────────────────────
function PrimaryBtn({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  return (
    <Pressable onPress={loading ? undefined : onPress}
      style={({ pressed }: any) => [ls.primaryBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }, loading && { opacity: 0.6 }]}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={ls.primaryBtnText}>{label}</Text>}
    </Pressable>
  );
}
function GhostBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={ls.ghostBtn}><Text style={ls.ghostBtnText}>{label}</Text></Pressable>;
}

// ─── Result banner ────────────────────────────────────────────────────────────
function ResultBanner({ result }: { result: AuthResult }) {
  const ok = result.ok;
  return (
    <View style={[ls.banner, { backgroundColor: ok ? '#DCFCE7' : '#FEE2E2', borderColor: ok ? '#86EFAC' : '#FCA5A5' }]}>
      <Text style={{ fontSize: 16 }}>{ok ? '✅' : '❌'}</Text>
      <Text style={[ls.bannerText, { color: ok ? '#14532D' : '#991B1B', flex: 1 }]}>{result.message}</Text>
    </View>
  );
}

// ─── Login page ───────────────────────────────────────────────────────────────
export default function Login() {
  const auth = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [demoLoading, setDemoLoading] = useState<'student' | 'admin' | null>(null);
  const [result, setResult] = useState<AuthResult | null>(null);

  const run = async (fn: () => Promise<AuthResult>) => {
    setBusy(true); setResult(null);
    try { setResult(await fn()); } finally { setBusy(false); }
  };
  const switchMode = (m: Mode) => { setMode(m); setResult(null); };

  // Quick demo login — always works, no account needed
  const enterAsDemo = async (role: 'student' | 'admin') => {
    setDemoLoading(role);
    await auth.signInDemo(role);
    setDemoLoading(null);
  };

  // ── Guards ──
  if (auth.status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D5A4C' }}>
        <View style={ls.splashCard}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>🏛️</Text>
          <Text style={{ fontFamily: serif, fontSize: 20, fontWeight: '700', color: '#0D4A3C', marginBottom: 4 }}>Unified Scholar Portal</Text>
          <Text style={{ color: '#5A6A7E', fontSize: 13, marginBottom: 20 }}>Ministry of Tribal Affairs · Govt. of India</Text>
          <ActivityIndicator color="#137060" size="large" />
          <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 12 }}>Checking session…</Text>
        </View>
      </View>
    );
  }
  if (auth.status === 'signedIn' && !auth.recovery) return <Redirect href="/" />;

  // ── Recovery ──
  if (auth.recovery) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F9FC', paddingTop: insets.top + 40, paddingHorizontal: 20 }}>
        <Text style={[ls.formTitle, { marginBottom: 8 }]}>🔐 Set New Password</Text>
        <LField label="New Password" value={password} onChange={setPassword} secure hint="At least 8 characters" />
        {result ? <ResultBanner result={result} /> : null}
        <View style={{ marginTop: 8 }}>
          <PrimaryBtn label="Update Password" loading={busy} onPress={() => run(() => auth.setNewPassword(password))} />
        </View>
      </View>
    );
  }

  const doSignIn = () => run(() => auth.signIn(email, password));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={[ls.page, { paddingTop: insets.top }]}>

        {/* ── Hero banner ── */}
        <LinearGradient colors={['#083B30', '#137060', '#1A9070']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ls.hero}>
          <View style={ls.blob1} /><View style={ls.blob2} />
          {/* India tricolor stripe */}
          <View style={{ flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 18 }}>
            <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
            <View style={{ flex: 1, backgroundColor: '#138808' }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <View style={ls.emblem}><Text style={{ fontSize: 26 }}>🏛️</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontFamily: serif, fontSize: 17, fontWeight: '700' }}>Unified Scholar Portal</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 }}>Ministry of Tribal Affairs · Govt. of India</Text>
            </View>
          </View>
          <Text style={{ color: '#FFFFFF', fontFamily: serif, fontSize: 24, fontWeight: '700', lineHeight: 30, marginBottom: 8 }}>
            Scholarships for{'\n'}Every Deserving Student
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 20, marginBottom: 14 }}>
            500+ government & private scholarships. AI eligibility checks. Real-time status tracking.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['🔒 Secure', '📋 Official', '🆓 Free'].map((b) => (
              <View key={b} style={ls.trustBadge}><Text style={ls.trustText}>{b}</Text></View>
            ))}
          </View>
        </LinearGradient>

        {/* ── Scrollable form area ── */}
        <ScrollView contentContainerStyle={[ls.scroll, { paddingBottom: insets.bottom + 28 }]}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Form card ── */}
          <View style={ls.tabs}>
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <Pressable key={m} onPress={() => switchMode(m)} style={[ls.tab, mode === m && ls.tabOn]}>
                <Text style={[ls.tabText, mode === m && ls.tabTextOn]}>
                  {m === 'signin' ? '🔑 Sign In' : '📝 Register'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ── Form card ── */}
          <View style={ls.formCard}>
            {mode === 'forgot' ? (
              <>
                <Text style={ls.formTitle}>Reset Password</Text>
                <Text style={ls.formSub}>We'll send a reset link to your registered email.</Text>
                <LField label="Email Address" value={email} onChange={setEmail} keyboard="email-address" autoComplete="email" placeholder="your@email.com" />
                {result ? <ResultBanner result={result} /> : null}
                <PrimaryBtn label="Send Reset Link" loading={busy} onPress={() => run(() => auth.sendPasswordReset(email))} />
                <GhostBtn label="← Back to Sign In" onPress={() => switchMode('signin')} />
              </>
            ) : mode === 'signup' ? (
              <>
                <Text style={ls.formTitle}>Create Account</Text>
                <Text style={ls.formSub}>
                  Use a real email address — we'll send a confirmation link.{'\n'}
                  After verifying, sign in with your credentials.
                </Text>
                <LField label="Full Name" value={name} onChange={setName} autoComplete="name" placeholder="e.g. Ananya Birsa Munda" />
                <LField label="Email Address" value={email} onChange={setEmail} keyboard="email-address" autoComplete="email" placeholder="your@email.com" />
                <LField label="Password" value={password} onChange={setPassword} secure autoComplete="new-password" hint="Minimum 8 characters" placeholder="Choose a strong password" />
                {result ? <ResultBanner result={result} /> : null}
                {result?.needsConfirmation && (
                  <View style={ls.confirmBox}>
                    <Text style={ls.confirmText}>
                      📧 Check your inbox for the confirmation link. After clicking it, come back and Sign In.
                    </Text>
                  </View>
                )}
                {!result?.needsConfirmation && (
                  <PrimaryBtn label="Create Account →" loading={busy} onPress={() => run(() => auth.signUp(email, password, name))} />
                )}
                <GhostBtn label="Already registered? Sign In" onPress={() => switchMode('signin')} />
              </>
            ) : (
              <>
                <Text style={ls.formTitle}>Sign In</Text>
                <Text style={ls.formSub}>Use your registered email and password.</Text>
                <LField label="Email Address" value={email} onChange={setEmail} keyboard="email-address" autoComplete="email" placeholder="your@email.com" />
                <LField label="Password" value={password} onChange={setPassword} secure autoComplete="current-password" placeholder="Your password" onSubmit={doSignIn} />
                {result ? <ResultBanner result={result} /> : null}
                <PrimaryBtn label="Sign In →" loading={busy} onPress={doSignIn} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <GhostBtn label="New user? Register" onPress={() => switchMode('signup')} />
                  <GhostBtn label="Forgot Password?" onPress={() => switchMode('forgot')} />
                </View>
              </>
            )}
          </View>

          {/* ── Stats ── */}
          <View style={ls.statsRow}>
            {[{ n: '500+', l: 'Scholarships' }, { n: '₹50Cr+', l: 'Disbursed' }, { n: '1L+', l: 'Students' }].map((s) => (
              <View key={s.l} style={ls.statCell}>
                <Text style={ls.statNum}>{s.n}</Text>
                <Text style={ls.statLbl}>{s.l}</Text>
              </View>
            ))}
          </View>

          <Text style={ls.footer}>Secured under IT Act 2000 · Data processed by Supabase · Free forever for students</Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ls = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F9FC' },
  splashCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 36, alignItems: 'center', marginHorizontal: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 },
  hero: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, overflow: 'hidden', position: 'relative' },
  blob1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40 },
  blob2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(232,130,12,0.18)', bottom: -30, left: 10 },
  emblem: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  trustBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  trustText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' },
  scroll: { paddingHorizontal: 16, paddingTop: 18, gap: 16 },

  // Instant access
  instantBox: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 2, borderColor: '#B2E4D8', gap: 12, shadowColor: '#137060', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 },
  instantHeader: { gap: 3 },
  instantTitle: { fontWeight: '800', fontSize: 14, color: '#0D4A3C' },
  instantSub: { color: '#5A6A7E', fontSize: 12 },
  demoBtn: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1.5, minHeight: 90 },
  demoBtnStudent: { backgroundColor: '#E6F7F3', borderColor: '#B2E4D8' },
  demoBtnAdmin: { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
  demoBtnTitle: { fontWeight: '800', fontSize: 15, color: '#1A2332' },
  demoBtnSub: { fontSize: 11, color: '#5A6A7E', textAlign: 'center' },

  // Divider
  divRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  divText: { color: '#94A3B8', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  // Tabs
  tabs: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4, borderWidth: 1.5, borderColor: '#E2E8F0' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabOn: { backgroundColor: '#137060', shadowColor: '#137060', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  tabText: { fontWeight: '700', fontSize: 13, color: '#64748B' },
  tabTextOn: { color: '#FFFFFF' },

  // Form card
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, gap: 14, borderWidth: 1.5, borderColor: '#E2E8F0', shadowColor: '#1A2332', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3 },
  formTitle: { fontFamily: serif, fontSize: 20, fontWeight: '700', color: '#1A2332' },
  formSub: { color: '#64748B', fontSize: 13, lineHeight: 19, marginTop: -6 },

  // Fields
  fieldWrap: { gap: 5 },
  fieldLabel: { color: '#334155', fontWeight: '700', fontSize: 12, letterSpacing: 0.3 },
  fieldInput: { minHeight: 50, borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: '#1A2332', backgroundColor: '#F8FAFC' },
  fieldFocused: { borderColor: '#137060', borderWidth: 2, backgroundColor: '#F0FBF8' },
  fieldHint: { color: '#64748B', fontSize: 11 },

  // Buttons
  primaryBtn: { minHeight: 52, backgroundColor: '#137060', borderRadius: 13, alignItems: 'center', justifyContent: 'center', shadowColor: '#137060', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  ghostBtn: { paddingVertical: 8, alignItems: 'center' },
  ghostBtnText: { color: '#137060', fontSize: 13, fontWeight: '600' },

  // Banner
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1.5 },
  bannerText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },

  // Confirm box
  confirmBox: { backgroundColor: '#DBEAFE', borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: '#93C5FD' },
  confirmText: { color: '#1E40AF', fontSize: 13, lineHeight: 20, fontWeight: '500' },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
  statCell: { alignItems: 'center', gap: 2 },
  statNum: { fontFamily: serif, fontSize: 20, fontWeight: '700', color: '#0D4A3C' },
  statLbl: { color: '#5A6A7E', fontSize: 11, fontWeight: '600' },
  footer: { textAlign: 'center', color: '#94A3B8', fontSize: 11, lineHeight: 17 },
});
