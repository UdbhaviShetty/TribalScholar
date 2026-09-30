import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';
import { useProfile } from '../../lib/repo';
import { c } from '../../lib/theme';
import { RequireAuth } from '../../components/RequireAuth';

const icon = (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: string; size: number }) =>
    <Ionicons name={name} size={size} color={color} />;

export default function TabsLayout() {
  const wide = useWindowDimensions().width >= 900;
  const { profile } = useProfile();
  const isAdmin = profile?.role === 'admin';
  return (
    <RequireAuth>
      <Tabs screenOptions={{
        headerShown: false,
        tabBarPosition: wide ? 'left' : 'bottom',
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2, marginBottom: 2 },
        tabBarActiveBackgroundColor: '#E6F7F3',
        tabBarItemStyle: { borderRadius: 12, marginHorizontal: 3, marginVertical: 4 },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: c.line,
          borderTopWidth: 1.5,
          height: wide ? undefined : 72,
          paddingTop: 4,
          paddingHorizontal: 4,
          shadowColor: '#1A2332',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
      }}>
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home') }} />
        <Tabs.Screen name="scholarships" options={{ title: 'Discover', tabBarIcon: icon('search') }} />
        <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: icon('bookmark') }} />
        <Tabs.Screen name="applications" options={{ title: 'Applied', tabBarIcon: icon('document-text') }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person') }} />
        <Tabs.Screen name="alerts" options={{ href: null, title: 'Alerts' }} />
        <Tabs.Screen name="assistant" options={{ href: null, title: 'Assistant' }} />
        <Tabs.Screen name="admin" options={{ href: isAdmin ? undefined : null, title: 'Admin', tabBarIcon: icon('stats-chart') }} />
      </Tabs>
    </RequireAuth>
  );
}
