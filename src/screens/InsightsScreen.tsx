import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import Card from '@/src/components/Card';
import MarkdownText from '@/src/components/MarkdownText';
import Skeleton from '@/src/components/Skeleton';
import { useApi, type UseApiResult } from '@/src/hooks/useApi';
import { aiService } from '@/src/services/aiService';
import { alertService } from '@/src/services/alertService';
import type { Alert } from '@/src/types';
import { formatRelativeTime } from '@/src/utils/relativeTime';

export default function InsightsScreen() {
  const scheme = useColorScheme();
  const screenBg = scheme === 'dark' ? '#000' : '#f2f2f7';

  return (
    <ScrollView style={{ backgroundColor: screenBg }} contentContainerStyle={styles.content}>
      <SpendingSummarySection />
      <BudgetAdviceSection />
      <AnomaliesSection />
    </ScrollView>
  );
}

// ─── 1. Spending Summary ─────────────────────────────────────────────────────
function SpendingSummarySection() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const fetcher = useCallback(() => aiService.getSpendingSummary(), []);
  const api = useApi(fetcher);
  useFocusEffect(useCallback(() => { void api.reload(); }, [api.reload]));

  return (
    <InsightCard title="Spending Summary" api={api} hasData={api.data !== null} skeletonLines={3}>
      <Text style={[styles.bodyText, { color: colors.text }]}>{api.data?.summary}</Text>
    </InsightCard>
  );
}

// ─── 2. Budget Advice ────────────────────────────────────────────────────────
function BudgetAdviceSection() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const fetcher = useCallback(() => aiService.getBudgetAdvice(), []);
  const api = useApi(fetcher);
  useFocusEffect(useCallback(() => { void api.reload(); }, [api.reload]));

  return (
    <InsightCard title="Budget Advice" api={api} hasData={api.data !== null} skeletonLines={4}>
      {/* `advice` is free text (often Markdown) — MarkdownText renders both plain
          paragraphs and the occasional heading/bullet without assuming a list. */}
      {api.data ? <MarkdownText text={api.data} color={colors.text} /> : null}
    </InsightCard>
  );
}

// ─── 3. Anomaly Alerts ───────────────────────────────────────────────────────
function AnomaliesSection() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const fetcher = useCallback(() => alertService.getByType('ANOMALY'), []);
  const api = useApi(fetcher);
  useFocusEffect(useCallback(() => { void api.reload(); }, [api.reload]));

  // No client "last updated" here — each anomaly carries its own createdAt.
  return (
    <InsightCard title="Anomaly Alerts" api={api} hasData={api.data !== null} skeletonLines={2} hideTimestamp>
      {api.data && api.data.length === 0 ? (
        <Text style={[styles.muted, { color: colors.text }]}>No anomalies detected</Text>
      ) : (
        api.data?.map((anomaly) => <AnomalyRow key={anomaly.id} anomaly={anomaly} />)
      )}
    </InsightCard>
  );
}

function AnomalyRow({ anomaly }: { anomaly: Alert }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  return (
    <View style={styles.anomalyRow}>
      <Ionicons name="pulse-outline" size={18} color="#af52de" style={styles.anomalyIcon} />
      <View style={styles.anomalyBody}>
        {/* Everything (category, amount, reason) is inside `message`. */}
        <Text style={[styles.bodyText, { color: colors.text }]}>{anomaly.message}</Text>
        <Text style={[styles.time, { color: colors.text }]}>{formatRelativeTime(anomaly.createdAt)}</Text>
      </View>
    </View>
  );
}

// ─── Shared section card ─────────────────────────────────────────────────────
type InsightCardProps<T> = {
  title: string;
  api: UseApiResult<T>;
  hasData: boolean;
  skeletonLines: number;
  hideTimestamp?: boolean;
  children: ReactNode;
};

function InsightCard<T>({ title, api, hasData, skeletonLines, hideTimestamp, children }: InsightCardProps<T>) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <Card>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Pressable onPress={() => void api.reload()} disabled={api.loading} hitSlop={8}>
          <Ionicons
            name="refresh"
            size={20}
            color={api.loading ? colors.tabIconDefault : colors.tint}
          />
        </Pressable>
      </View>

      {api.loading && !hasData ? (
        // Skeleton on first load only — keep showing cached content on refresh.
        <View style={styles.skeletonWrap}>
          {Array.from({ length: skeletonLines }).map((_, i) => (
            <Skeleton key={i} width={i === skeletonLines - 1 ? '70%' : '100%'} height={14} />
          ))}
        </View>
      ) : api.error ? (
        // "Tap to refresh" ONLY on a real request failure (network/HTTP) — a 200
        // fallback sentence is treated as data, not an error.
        <Pressable onPress={() => void api.reload()} style={styles.errorState}>
          <Ionicons name="cloud-offline-outline" size={20} color={colors.tabIconDefault} />
          <Text style={[styles.muted, { color: colors.text }]}>Couldn’t load. Tap to refresh.</Text>
        </Pressable>
      ) : (
        children
      )}

      {!hideTimestamp && !api.error && api.lastUpdated ? (
        <Text style={[styles.updated, { color: colors.text }]}>
          Updated {formatClock(api.lastUpdated)}
          {api.loading ? ' · refreshing…' : ''}
        </Text>
      ) : null}
    </Card>
  );
}

function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  skeletonWrap: {
    gap: 8,
  },
  errorState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  updated: {
    fontSize: 11,
    opacity: 0.45,
    marginTop: 4,
  },
  muted: {
    fontSize: 14,
    opacity: 0.6,
  },
  anomalyRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
  },
  anomalyIcon: {
    marginTop: 2,
  },
  anomalyBody: {
    flex: 1,
    gap: 2,
  },
  time: {
    fontSize: 12,
    opacity: 0.5,
  },
});
