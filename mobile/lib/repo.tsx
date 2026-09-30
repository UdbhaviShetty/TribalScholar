import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type DependencyList, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { appMode } from './config';
import { supabase } from './supabase';
import { useAuth } from './auth';
import { createSupabaseRepo } from './data/supabaseRepo';
import { createDemoRepo } from './data/demoRepo';
import type { AppProfile, ProfilePatch, Repo } from './data/types';

const RepoCtx = createContext<Repo | null>(null);
export const useRepo = () => {
  const r = useContext(RepoCtx);
  if (!r) throw new Error('useRepo must be used while signed in');
  return r;
};

type ProfileValue = { profile: AppProfile | null; loading: boolean; error: string | null; reload(): Promise<void>; save(patch: ProfilePatch): Promise<void> };
const ProfileCtx = createContext<ProfileValue | null>(null);
export const useProfile = () => {
  const v = useContext(ProfileCtx);
  if (!v) throw new Error('useProfile must be used while signed in');
  return v;
};

export function RepoProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const repo = useMemo<Repo | null>(() => {
    if (!userId) return null;
    if (appMode === 'demo') return createDemoRepo(AsyncStorage);
    if (appMode === 'supabase' && supabase) return createSupabaseRepo(supabase, userId);
    return null;
  }, [userId]);
  // Provider shape stays identical whether or not a user is signed in, so the navigator below never remounts.
  return <RepoCtx.Provider value={repo}><ProfileProvider repo={repo}>{children}</ProfileProvider></RepoCtx.Provider>;
}

function ProfileProvider({ repo, children }: { repo: Repo | null; children: ReactNode }) {
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    if (!repo) { setProfile(null); setLoading(false); return; }
    setLoading(true); setError(null);
    try { setProfile(await repo.getProfile()); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, [repo]);
  useEffect(() => { reload(); }, [reload]);
  const save = useCallback(async (patch: ProfilePatch) => { if (!repo) throw new Error('Not signed in.'); setProfile(await repo.updateProfile(patch)); }, [repo]);
  const value = useMemo(() => ({ profile, loading, error, reload, save }), [profile, loading, error, reload, save]);
  return <ProfileCtx.Provider value={value}>{children}</ProfileCtx.Provider>;
}

/** Loads data whenever the screen gains focus. Ignores results from stale requests. */
export function useLoad<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);
  const run = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true); setError(null);
    try { const d = await fn(); if (mine === seq.current) setData(d); }
    catch (e) { if (mine === seq.current) setError((e as Error).message || 'Something went wrong.'); }
    finally { if (mine === seq.current) setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useFocusEffect(useCallback(() => { run(); return () => { seq.current++; }; }, [run]));
  return { data, setData, error, loading, reload: run };
}
