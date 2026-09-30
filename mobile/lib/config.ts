const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  url && anonKey && url !== 'https://YOUR_PROJECT.supabase.co' && anonKey !== 'your-anon-key',
);

export type AppMode = 'supabase' | 'demo' | 'unconfigured';

export const appMode: AppMode = isSupabaseConfigured ? 'supabase' : 'demo';

export const assistantMode: 'server' | 'demo' =
  appMode === 'supabase' && process.env.EXPO_PUBLIC_ASSISTANT_MODE === 'server' ? 'server' : 'demo';

