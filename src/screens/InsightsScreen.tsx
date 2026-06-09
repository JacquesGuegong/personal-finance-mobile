import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MarkdownText from '@/src/components/MarkdownText';
import { colors, radius, shadows, typography } from '@/src/constants/theme';
import { useApi } from '@/src/hooks/useApi';
import { aiService } from '@/src/services/aiService';
import { alertService } from '@/src/services/alertService';
import { transactionService } from '@/src/services/transactionService';
import type { Transaction } from '@/src/types';
import { formatCurrency } from '@/src/utils/format';
import { formatRelativeTime } from '@/src/utils/relativeTime';

const CAT_COLORS = [colors.sage, colors.coral, colors.slate, '#D9A23D'];

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 4 }]}
        showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.navy} />
        </Pressable>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Powered by Claude</Text>

        <SpendingSummary />
        <CategoryBreakdown />
        <BudgetAdvice />
        <Anomalies />
      </ScrollView>
    </View>
  );
}

// ─── 1. Spending summary (cream card, navy border) ───────────────────────────
function SpendingSummary() {
  const fetcher = useCallback(() => aiService.getSpendingSummary(), []);
  const { data, loading, error, lastUpdated, reload } = useApi(fetcher);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  return (
    <View style={styles.summaryCard}>
      <View style={styles.rowBetween}>
        <Text style={styles.eyebrow}>THIS MONTH</Text>
        <Pressable onPress={() => void reload()} disabled={loading} hitSlop={8}>
          <Ionicons name="refresh" size={18} color={loading ? colors.mist : colors.slate} />
        </Pressable>
      </View>
      <Text style={styles.summaryText}>
        {loading && !data
          ? 'Reading your spending…'
          : error
            ? 'Insights are unavailable right now.'
            : data?.summary}
      </Text>
      {lastUpdated && !error ? <Text style={styles.updated}>Updated {formatClock(lastUpdated)}</Text> : null}
    </View>
  );
}

// ─── 2. Category breakdown (RN bar chart) ────────────────────────────────────
function CategoryBreakdown() {
  const fetcher = useCallback(() => transactionService.getCurrentMonth(), []);
  const { data, loading, reload } = useApi(fetcher);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const cats = expensesByCategory(data ?? []);
  const max = cats[0]?.amount ?? 0;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.cardTitle}>Spending by category</Text>
      {loading && !data ? (
        <ActivityIndicator color={colors.navy} style={{ marginVertical: 12 }} />
      ) : cats.length === 0 ? (
        <Text style={styles.muted}>No spending this month yet.</Text>
      ) : (
        cats.map((c, i) => (
          <View key={c.category} style={styles.barRow}>
            <View style={styles.rowBetween}>
              <Text style={styles.barName}>{c.category}</Text>
              <Text style={styles.barAmount}>{formatCurrency(c.amount)}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${max > 0 ? (c.amount / max) * 100 : 0}%`,
                    backgroundColor: CAT_COLORS[i % CAT_COLORS.length],
                  },
                ]}
              />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// ─── 3. Budget advice (sage tint) ────────────────────────────────────────────
function BudgetAdvice() {
  const fetcher = useCallback(() => aiService.getBudgetAdvice(), []);
  const { data, loading, error, reload } = useApi(fetcher);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  return (
    <View style={styles.adviceCard}>
      <View style={styles.rowBetween}>
        <Text style={styles.adviceEyebrow}>YOUR ADVISOR</Text>
        <Pressable onPress={() => void reload()} disabled={loading} hitSlop={8}>
          <Ionicons name="refresh" size={18} color={loading ? colors.mist : colors.sage} />
        </Pressable>
      </View>
      {loading && !data ? (
        <Text style={styles.muted}>Thinking about your budgets…</Text>
      ) : error ? (
        <Text style={styles.muted}>Advice is unavailable right now.</Text>
      ) : data ? (
        <MarkdownText text={data} color={colors.navy} markerColor={colors.sage} />
      ) : null}
    </View>
  );
}

// ─── 4. Anomalies (coral tint, only if any) ──────────────────────────────────
function Anomalies() {
  const fetcher = useCallback(() => alertService.getByType('ANOMALY'), []);
  const { data, reload } = useApi(fetcher);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  if (!data || data.length === 0) return null;

  return (
    <View style={styles.anomalySection}>
      <Text style={styles.anomalyLabel}>UNUSUAL ACTIVITY</Text>
      {data.map((a) => (
        <View key={a.id} style={styles.anomalyRow}>
          <Text style={styles.anomalyMsg}>{a.message}</Text>
          <Text style={styles.anomalyTime}>{formatRelativeTime(a.createdAt)}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function expensesByCategory(txns: Transaction[]): { category: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const t of txns) {
    if (t.type === 'EXPENSE') map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  back: { marginBottom: 4, marginLeft: -4 },
  title: { ...typography.displayMD, color: colors.navy },
  subtitle: { ...typography.caption, color: colors.inkLight, marginTop: 2, marginBottom: 20 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  muted: { ...typography.body, color: colors.inkLight },
  // Summary
  summaryCard: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: radius.xl,
    padding: 18,
    gap: 10,
  },
  eyebrow: { ...typography.caption, fontWeight: '700', letterSpacing: 1.5, color: colors.inkLight },
  summaryText: { ...typography.body, color: colors.navy, lineHeight: 24 },
  updated: { ...typography.caption, color: colors.inkLight },
  // Chart
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 18,
    marginTop: 16,
    gap: 16,
    ...shadows.card,
  },
  cardTitle: { ...typography.titleMD, color: colors.navy },
  barRow: { gap: 8 },
  barName: { ...typography.caption, color: colors.inkLight },
  barAmount: { ...typography.caption, fontWeight: '600', color: colors.navy },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.mist, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  // Advice
  adviceCard: {
    backgroundColor: 'rgba(74,158,138,0.10)',
    borderRadius: radius.xl,
    padding: 18,
    marginTop: 16,
    gap: 10,
  },
  adviceEyebrow: { ...typography.caption, fontWeight: '700', letterSpacing: 1, color: colors.sage },
  // Anomalies
  anomalySection: {
    backgroundColor: 'rgba(232,99,74,0.10)',
    borderRadius: radius.xl,
    padding: 18,
    marginTop: 16,
    gap: 10,
  },
  anomalyLabel: { ...typography.caption, fontWeight: '700', letterSpacing: 1, color: colors.coral },
  anomalyRow: {
    backgroundColor: colors.white,
    borderLeftWidth: 3,
    borderLeftColor: colors.coral,
    borderRadius: radius.md,
    padding: 12,
    gap: 3,
  },
  anomalyMsg: { ...typography.body, color: colors.navy },
  anomalyTime: { ...typography.caption, color: colors.inkLight },
});
