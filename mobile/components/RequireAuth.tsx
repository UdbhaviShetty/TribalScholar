import type { ReactNode } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth';
import { Loading } from './ui';

/** Protected routes render their content (and start their data loads) only for a signed-in user. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, recovery } = useAuth();
  if (status === 'loading') return <Loading label="Checking your session…" />;
  if (status === 'signedOut' || recovery) return <Redirect href="/login" />;
  return <>{children}</>;
}
