import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appMode } from './config';
import { supabase } from './supabase';
import { friendlyAuthError } from './format';

export type AuthResult = { ok: boolean; message: string; needsConfirmation?: boolean };
type Status = 'loading' | 'signedOut' | 'signedIn';
type AuthValue = {
  status: Status; userId: string | null; email: string | null; recovery: boolean;
  signIn(email: string, password: string): Promise<AuthResult>;
  signInDemo(role: 'student' | 'admin'): Promise<void>;
  signUp(email: string, password: string, fullName: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  resendConfirmation(email: string): Promise<AuthResult>;
  sendPasswordReset(email: string): Promise<AuthResult>;
  setNewPassword(password: string): Promise<AuthResult>;
};

const DEMO_KEY = 'ts_demo_session';
const Ctx = createContext<AuthValue | null>(null);
export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
};

const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const NOT_CONFIGURED: AuthResult = { ok: false, message: 'This app is not connected to a backend yet. See the setup notes.' };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ status: Status; userId: string | null; email: string | null }>({ status: 'loading', userId: null, email: null });
  const [recovery, setRecovery] = useState(false);

  // Restore the session on load, then follow auth events (sign-in, sign-out, token refresh, recovery link).
  useEffect(() => {
    let cancelled = false;
    if (appMode === 'supabase' && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (cancelled) return;
        const s = data.session;
        setState(s ? { status: 'signedIn', userId: s.user.id, email: s.user.email ?? null } : { status: 'signedOut', userId: null, email: null });
      }).catch(() => !cancelled && setState({ status: 'signedOut', userId: null, email: null }));
      // Keep this callback synchronous: awaiting Supabase calls inside it can deadlock the client.
      const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
        if (event === 'PASSWORD_RECOVERY') setRecovery(true);
        setState(s ? { status: 'signedIn', userId: s.user.id, email: s.user.email ?? null } : { status: 'signedOut', userId: null, email: null });
      });
      return () => { cancelled = true; sub.subscription.unsubscribe(); };
    }
    if (appMode === 'demo') {
      AsyncStorage.getItem(DEMO_KEY).then((raw) => {
        if (cancelled) return;
        setState(raw ? { status: 'signedIn', userId: 'demo-user', email: JSON.parse(raw).email ?? 'demo' } : { status: 'signedOut', userId: null, email: null });
      });
      return () => { cancelled = true; };
    }
    setState({ status: 'signedOut', userId: null, email: null });
    return () => { cancelled = true; };
  }, []);

  // Always-available demo login — bypasses Supabase entirely.
  const signInDemo = useCallback(async (role: 'student' | 'admin') => {
    const email = role === 'admin' ? 'admin@scholar.org' : 'student@scholar.org';
    await AsyncStorage.setItem(DEMO_KEY, JSON.stringify({ email, role }));
    setState({ status: 'signedIn', userId: `demo-${role}`, email });
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const e = email.trim();
    if (appMode === 'demo') {
      await AsyncStorage.setItem(DEMO_KEY, JSON.stringify({ email: e || 'demo' }));
      setState({ status: 'signedIn', userId: 'demo-user', email: e || 'demo' });
      return { ok: true, message: '' };
    }
    if (appMode !== 'supabase' || !supabase) return NOT_CONFIGURED;
    if (!validEmail(e)) return { ok: false, message: 'Enter a valid email address.' };
    if (!password) return { ok: false, message: 'Enter your password.' };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: e, password });
      if (error) return { ok: false, message: friendlyAuthError(error.message), needsConfirmation: /not confirmed/i.test(error.message) };
      return { ok: true, message: '' };
    } catch (err) { return { ok: false, message: friendlyAuthError((err as Error).message) }; }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string): Promise<AuthResult> => {
    if (appMode !== 'supabase' || !supabase) return NOT_CONFIGURED;
    const e = email.trim();
    if (!validEmail(e)) return { ok: false, message: 'Enter a valid email address.' };
    if (password.length < 8) return { ok: false, message: 'Use a password with at least 8 characters.' };
    try {
      const { data, error } = await supabase.auth.signUp({ email: e, password, options: { data: { full_name: fullName.trim() || null } } });
      if (error) return { ok: false, message: friendlyAuthError(error.message) };
      if (!data.session) return { ok: true, needsConfirmation: true, message: 'Account created. Open the confirmation link we emailed you, then sign in.' };
      return { ok: true, message: 'Account created.' };
    } catch (err) { return { ok: false, message: friendlyAuthError((err as Error).message) }; }
  }, []);

  const signOut = useCallback(async () => {
    if (appMode === 'demo') await AsyncStorage.removeItem(DEMO_KEY);
    else if (supabase) await supabase.auth.signOut().catch(() => undefined);
    setRecovery(false);
    setState({ status: 'signedOut', userId: null, email: null });
  }, []);

  const resendConfirmation = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED;
    if (!validEmail(email.trim())) return { ok: false, message: 'Enter your email address first.' };
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    return error ? { ok: false, message: friendlyAuthError(error.message) } : { ok: true, message: 'Confirmation email sent. Check your inbox and spam folder.' };
  }, []);

  const sendPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED;
    if (!validEmail(email.trim())) return { ok: false, message: 'Enter your email address first.' };
    const redirectTo = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    // Same message whether or not the account exists, so this cannot be used to probe for registered emails.
    return error ? { ok: false, message: friendlyAuthError(error.message) } : { ok: true, message: 'If that email has an account, a reset link is on its way.' };
  }, []);

  const setNewPassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED;
    if (password.length < 8) return { ok: false, message: 'Use a password with at least 8 characters.' };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, message: friendlyAuthError(error.message) };
    setRecovery(false);
    return { ok: true, message: 'Password updated.' };
  }, []);

  const value = useMemo(() => ({ ...state, recovery, signIn, signInDemo, signUp, signOut, resendConfirmation, sendPasswordReset, setNewPassword }), [state, recovery, signIn, signInDemo, signUp, signOut, resendConfirmation, sendPasswordReset, setNewPassword]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
