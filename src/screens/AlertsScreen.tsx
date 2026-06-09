import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert as NativeAlert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import SegmentedControl from '@/src/components/SegmentedControl';
import { useUnreadAlerts } from '@/src/context/UnreadAlertsContext';
import { alertService } from '@/src/services/alertService';
import type { Alert } from '@/src/types';
import { ALERT_TABS, ALERT_VISUAL, type AlertTab } from '@/src/utils/alerts';
import { formatRelativeTime } from '@/src/utils/relativeTime';

export default function AlertsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const screenBg = scheme === 'dark' ? '#000' : '#f2f2f7';
  const { refresh: refreshBadge } = useUnreadAlerts();

  const [tab, setTab] = useState<AlertTab>('ALL');
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Each tab hits a different endpoint and replaces the list.
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
    setAlerts(null); // show the spinner when the tab changes
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function handleRead(alert: Alert) {
    if (alert.isRead) return;
    // Optimistic: flip the row to read immediately.
    setAlerts((cur) => cur?.map((a) => (a.id === alert.id ? { ...a, isRead: true } : a)) ?? cur);
    try {
      const updated = await alertService.markRead(alert.id);
      // Reconcile with the server's version of the row.
      setAlerts((cur) => cur?.map((a) => (a.id === updated.id ? updated : a)) ?? cur);
      void refreshBadge();
      // On the UNREAD tab the row should drop out of the list.
      if (tab === 'UNREAD') void load();
    } catch {
      setAlerts((cur) => cur?.map((a) => (a.id === alert.id ? { ...a, isRead: false } : a)) ?? cur);
      NativeAlert.alert('Error', 'Could not mark the alert as read.');
    }
  }

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
    <View style={{ flex: 1, backgroundColor: screenBg }}>
      <View style={styles.header}>
        <SegmentedControl options={ALERT_TABS} value={tab} onChange={setTab} />
        <Pressable onPress={handleMarkAll} style={styles.markAllBtn} hitSlop={6}>
          <Ionicons name="checkmark-done" size={16} color={colors.tint} />
          <Text style={{ color: colors.tint, fontWeight: '600' }}>Mark all as read</Text>
        </Pressable>
      </View>

      {alerts === null && !error ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => void load()} style={[styles.retryBtn, { borderColor: colors.tint }]}>
            <Ionicons name="refresh" size={16} color={colors.tint} />
            <Text style={{ color: colors.tint, fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={alerts ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <AlertRow alert={item} onPress={() => handleRead(item)} />}
          ListEmptyComponent={<Text style={[styles.muted, { color: colors.text }]}>No alerts</Text>}
        />
      )}
    </View>
  );
}

function AlertRow({ alert, onPress }: { alert: Alert; onPress: () => void }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const visual = ALERT_VISUAL[alert.alertType];
  const surface = scheme === 'dark' ? '#1c1c1e' : '#ffffff';
  const unreadBg = scheme === 'dark' ? '#0f243d' : '#e9f2ff';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { backgroundColor: alert.isRead ? surface : unreadBg }]}>
      <View style={[styles.iconCircle, { backgroundColor: `${visual.color}22` }]}>
        <Ionicons name={visual.icon} size={20} color={visual.color} />
      </View>
      <View style={styles.rowMid}>
        <Text style={[styles.message, { color: colors.text }]}>{alert.message}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.time, { color: colors.text }]}>{formatRelativeTime(alert.createdAt)}</Text>
          {alert.category ? (
            <View style={[styles.chip, { borderColor: colors.tabIconDefault }]}>
              <Text style={[styles.chipText, { color: colors.text }]}>{alert.category}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {!alert.isRead ? <View style={[styles.unreadDot, { backgroundColor: visual.color }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8e8e93',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  listContent: {
    padding: 12,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMid: {
    flex: 1,
    gap: 4,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  time: {
    fontSize: 12,
    opacity: 0.5,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  muted: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 40,
  },
  error: {
    color: '#ff3b30',
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
});
