import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

import OfflineBanner from '@/src/components/OfflineBanner';
import { colors } from '@/src/constants/theme';
import { UnreadAlertsProvider, useUnreadAlerts } from '@/src/context/UnreadAlertsContext';

// AppStack — shown only when logged in (gated in app/_layout.tsx).
// The unread-alerts count lives in a provider ABOVE the tab navigator so the
// Alerts tab badge (and the Dashboard badge) can read it and stay in sync.
// The OfflineBanner sits above the tabs so it's visible on every screen.
export default function AppTabsLayout() {
  return (
    <UnreadAlertsProvider>
      <View style={{ flex: 1 }}>
        <OfflineBanner />
        <AppTabs />
      </View>
    </UnreadAlertsProvider>
  );
}

function AppTabs() {
  const { count } = useUnreadAlerts();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.inkLight,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarBadgeStyle: { backgroundColor: colors.coral },
        // Floating white bar: rounded top, soft upward shadow, no hairline.
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTopWidth: 0,
          shadowColor: colors.navy,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 12,
          paddingTop: 6,
        },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          // The screen renders its own header (with the alerts badge), so hide
          // the native one to avoid a duplicate title.
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          // AccountsScreen renders its own net-worth header; hide the native one.
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="swap-horizontal-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarBadge: count > 0 ? count : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
      {/* Not a tab — a pushed screen (reached from the Dashboard AI card).
          href: null keeps it out of the tab bar but navigable. */}
      <Tabs.Screen name="insights" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
