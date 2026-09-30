import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../lib/auth';
import { RepoProvider } from '../lib/repo';

// A navigator must render on the first pass. Access control lives in <RequireAuth> (protected layouts) and login.tsx.
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <RepoProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </RepoProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
