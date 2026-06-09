import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { memo, useCallback, useEffect, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert as NativeAlert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadows, typography } from '@/src/constants/theme';
import { useUnreadAlerts } from '@/src/context/UnreadAlertsContext';
import { alertService } from '@/src/services/alertService';
import type { Alert, AlertType } from '@/src/types';
import { formatRelativeTime } from '@/src/utils/relativeTime';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// Per-type accent color + icon (spec palette).
const VISUAL: Record<AlertType, { color: string; icon: IoniconName }> = {
  WARNING: { color: '#F59E0B', icon: 'notifications-outline' }, // amber, bell
  EXCEEDED: { color: colors.coral, icon: 'warning-outline' }, // coral, triangle
  ANOMALY: { color: '#6366F1', icon: 'sparkles-outline' }, // indigo, sparkle
};

type Tab = 'ALL' | 'UNREAD' | 'ANOMALY';
const TABS: { key: Tab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'UNREAD', label: 'Unread' },
  { key: 'ANOMALY', label: 'Anomaly' },
];

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { refresh: refreshBadge } = useUnreadAlerts();

  const [tab, setTab] = useState<Tab>('ALL');
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      let data: Alert[];
      if (tab === 'ALL') data = await alertService.getAll();
      else if (tab === 'UNREAD') data = await alertService.getUnread();
      else data = await alertService.getByType('ANOMALY');
      setAlerts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load alerts.');
    }
  }, [tab]);

  useEffect(() => {
    setAlerts(null);
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleRead = useCallback(
    async (alert: Alert) => {
      if (alert.isRead) return;
      setAlerts((cur) => cur?.map((a) => (a.id === alert.id ? { ...a, isRead: true } : a)) ?? cur);
      try {
        const updated = await alertService.markRead(alert.id);
        setAlerts((cur) => cur?.map((a) => (a.id === updated.id ? updated : a)) ?? cur);
        void refreshBadge();
        if (tab === 'UNREAD') void load();
      } catch {
        setAlerts((cur) => cur?.map((a) => (a.id === alert.id ? { ...a, isRead: false } : a)) ?? cur);
        NativeAlert.alert('Error', 'Could not mark the alert as read.');
      }
    },
    [tab, load, refreshBadge],
  );

  async function handleMarkAll() {
    try {
      await alertService.markAllRead();
      await load();
      void refreshBadge();
    } catch {
      NativeAlert.alert('Error', 'Could not mark all alerts as read.');
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Pressable onPress={handleMarkAll} hitSlop={8}>
          <Text style={styles.markAll}>Mark all read</Text>
        </Pressable>
      </View>

      {/* Underline tabs */}
      <View style={styles.tabs}>
        {TABS.map(({ key, label }) => {
          const active = tab === key;
          return (
            <Pressable key={key} onPress={() => setTab(key)} style={styles.tab}>
              <Text style={[styles.tabText, { color: active ? colors.navy : colors.inkLight }]}>{label}</Text>
              <View style={[styles.tabUnderline, active && { backgroundColor: colors.navy }]} />
            </Pressable>
          );
        })}
      </View>

      {/* Body */}
      {alerts === null && !error ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.navy} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void load()} style={styles.retryBtn}>
            <Ionicons name="refresh" size={16} color={colors.navy} />
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        </View>
      ) : (alerts ?? []).length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={alerts ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <AlertRow alert={item} onPress={handleRead} />}
        />
      )}
    </View>
  );
}

function AlertRowImpl({ alert, onPress }: { alert: Alert; onPress: (alert: Alert) => void }) {
  const visual = VISUAL[alert.alertType];
  const meta = `${alert.category ? `${alert.category} · ` : ''}${formatRelativeTime(alert.createdAt)}`;

  return (
    <Pressable
      onPress={() => onPress(alert)}
      style={[
        styles.card,
        { borderLeftColor: visual.color, backgroundColor: alert.isRead ? colors.white : colors.cream },
        alert.isRead && styles.cardRead,
      ]}>
      <View style={[styles.iconCircle, { backgroundColor: `${visual.color}1A` }]}>
        <Ionicons name={visual.icon} size={20} color={visual.color} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.message}>{alert.message}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      {!alert.isRead ? <View style={[styles.unreadDot, { backgroundColor: visual.color }]} /> : null}
    </Pressable>
  );
}
const AlertRow = memo(AlertRowImpl);

function EmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.checkCircle}>
        <Ionicons name="checkmark" size={42} color={colors.sage} />
      </View>
      <Text style={styles.emptyTitle}>All clear</Text>
      <Text style={styles.emptySub}>No alerts right now.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    ...typography.displayMD,
    color: colors.navy,
  },
  markAll: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.slate,
  },
  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  tab: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    ...typography.titleMD,
  },
  tabUnderline: {
    height: 2,
    alignSelf: 'stretch',
    borderRadius: 1,
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  // List
  listContent: {
    padding: 16,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.lg,
    borderLeftWidth: 3,
    padding: 14,
    ...shadows.card,
  },
  cardRead: {
    opacity: 0.7,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  message: {
    ...typography.body,
    color: colors.navy,
  },
  meta: {
    ...typography.caption,
    color: colors.inkLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // States
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    ...typography.body,
    color: colors.coral,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.navy,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(74,158,138,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    ...typography.titleLG,
    color: colors.navy,
  },
  emptySub: {
    ...typography.body,
    color: colors.inkLight,
    marginTop: 4,
  },
});
