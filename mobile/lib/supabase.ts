import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './config';

// null when not configured. There is deliberately no fake client: nothing can "sign in" without a real backend.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === 'web', // email-confirmation and password-reset links
      },
    })
  : null;
