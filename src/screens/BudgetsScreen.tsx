import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BudgetFormSheet from '@/src/components/BudgetFormSheet';
import MarkdownText from '@/src/components/MarkdownText';
import { colors, radius, shadows, typography } from '@/src/constants/theme';
import { useApi } from '@/src/hooks/useApi';
import { aiService } from '@/src/services/aiService';
import { budgetService } from '@/src/services/budgetService';
import type { BudgetStatus } from '@/src/types';
import { budgetLevel, budgetPercent } from '@/src/utils/finance';
import { formatCurrency, formatCurrencyWhole } from '@/src/utils/format';

const AMBER = '#D9A23D';
const LEVEL_COLOR = { ok: colors.sage, warning: AMBER, exceeded: colors.coral } as const;

function monthLabelFor(month: number, year: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets();

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [budgets, setBudgets] = useState<BudgetStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  const label = monthLabelFor(month, year);

  const load = useCallback(async () => {
    setError(null);
    try {
      setBudgets(await budgetService.getBudgets({ month, year }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load budgets.');
    }
  }, [month, year]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
  }

  const list = budgets ?? [];
  const counts = list.reduce(
    (acc, b) => {
      acc[budgetLevel(b)] += 1;
      return acc;
    },
    { ok: 0, warning: 0, exceeded: 0 },
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}>
        {/* Header */}
        <Text style={styles.title}>Budgets</Text>
        <View style={styles.monthRow}>
          <Pressable onPress={() => shiftMonth(-1)} hitSlop={8} style={styles.chev}>
            <Ionicons name="chevron-back" size={22} color={colors.navy} />
          </Pressable>
          <Text style={styles.monthLabel}>{label}</Text>
          <Pressable onPress={() => shiftMonth(1)} hitSlop={8} style={styles.chev}>
            <Ionicons name="chevron-forward" size={22} color={colors.navy} />
          </Pressable>
        </View>

        {/* Summary bar */}
        {list.length > 0 ? (
          <View style={styles.summary}>
            <SummaryStat value={counts.ok} label="On track" color={colors.sage} />
            <View style={styles.summaryDivider} />
            <SummaryStat value={counts.warning} label="Warning" color={AMBER} />
            <View style={styles.summaryDivider} />
            <SummaryStat value={counts.exceeded} label="Exceeded" color={colors.coral} />
          </View>
        ) : null}

        {/* Budget list */}
        {budgets === null && !error ? (
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
        ) : list.length === 0 ? (
          <Text style={styles.empty}>No budgets for {label}.</Text>
        ) : (
          list.map((b) => <BudgetCard key={b.id} budget={b} />)
        )}

        <AdvisorCard />
      </ScrollView>

      {/* FAB */}
      <Pressable onPress={() => setFormVisible(true)} style={styles.fab}>
        <Ionicons name="add" size={30} color={colors.white} />
      </Pressable>

      <BudgetFormSheet
        visible={formVisible}
        month={month}
        year={year}
        monthLabel={label}
        onClose={() => setFormVisible(false)}
        onCreated={() => {
          setFormVisible(false);
          void load();
        }}
      />
    </View>
  );
}

function SummaryStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function BudgetCard({ budget }: { budget: BudgetStatus }) {
  const [expanded, setExpanded] = useState(false);
  const pct = budgetPercent(budget);
  const level = budgetLevel(budget);
  const color = LEVEL_COLOR[level];
  const left = budget.limitAmount - budget.spentAmount;

  // Pacing: daily average so far and projected month-end spend.
  const now = new Date();
  const daysInMonth = new Date(budget.year, budget.month, 0).getDate();
  const isCurrent = budget.year === now.getFullYear() && budget.month === now.getMonth() + 1;
  const isPast =
    budget.year < now.getFullYear() ||
    (budget.year === now.getFullYear() && budget.month < now.getMonth() + 1);
  const elapsed = isCurrent ? now.getDate() : isPast ? daysInMonth : 0;
  const dailyAvg = elapsed > 0 ? budget.spentAmount / elapsed : 0;
  const projected = dailyAvg * daysInMonth;
  const overUnder = projected - budget.limitAmount;
  const insight =
    elapsed === 0
      ? 'This month hasn’t started yet.'
      : overUnder > 0
        ? `At this pace you'll spend about ${formatCurrencyWhole(projected)} — roughly ${formatCurrencyWhole(overUnder)} over budget.`
        : `On pace for about ${formatCurrencyWhole(projected)} — roughly ${formatCurrencyWhole(Math.abs(overUnder))} under budget.`;

  return (
    <Pressable style={styles.card} onPress={() => setExpanded((v) => !v)}>
      <View style={styles.cardTop}>
        <Text style={styles.cardCat}>{budget.category}</Text>
        <Text style={styles.cardLimit}>{formatCurrency(budget.limitAmount)}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.inkLight}
          style={styles.cardChev}
        />
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, pct)}%`, backgroundColor: color }]} />
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.spent}>{formatCurrency(budget.spentAmount)} spent</Text>
        {left >= 0 ? (
          <Text style={styles.left}>{formatCurrency(left)} left</Text>
        ) : (
          <View style={styles.exceededBadge}>
            <Text style={styles.exceededText}>EXCEEDED</Text>
          </View>
        )}
      </View>

      {expanded ? (
        <View style={styles.expanded}>
          <View style={styles.expandStats}>
            <View style={styles.expandStat}>
              <Text style={styles.expandLabel}>Daily average</Text>
              <Text style={styles.expandValue}>{formatCurrency(dailyAvg)}</Text>
            </View>
            <View style={styles.expandStat}>
              <Text style={styles.expandLabel}>Projected</Text>
              <Text style={styles.expandValue}>{formatCurrencyWhole(projected)}</Text>
            </View>
          </View>
          <View style={styles.insight}>
            <Ionicons name="sparkles" size={14} color={colors.sage} />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

function AdvisorCard() {
  const fetcher = useCallback(() => aiService.getBudgetAdvice(), []);
  const { data, loading, error, reload } = useApi(fetcher);
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <View style={styles.advisor}>
      <View style={styles.advisorHeader}>
        <Text style={styles.advisorLabel}>YOUR ADVISOR</Text>
        <Pressable onPress={() => void reload()} disabled={loading} hitSlop={8}>
          <Ionicons name="refresh" size={18} color={loading ? colors.mist : colors.sage} />
        </Pressable>
      </View>
      {loading ? (
        <Text style={styles.advisorMuted}>Thinking about your budgets…</Text>
      ) : error ? (
        <Text style={styles.advisorMuted}>Advice is unavailable right now.</Text>
      ) : data ? (
        <MarkdownText text={data} color={colors.navy} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  title: {
    ...typography.displayMD,
    color: colors.navy,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  chev: {
    padding: 2,
  },
  monthLabel: {
    ...typography.titleMD,
    color: colors.navy,
  },
  // Summary
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    paddingVertical: 18,
    marginBottom: 20,
    ...shadows.card,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    ...typography.displayMD,
    ...typography.number,
  },
  summaryLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 12,
    ...shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardCat: {
    ...typography.titleMD,
    color: colors.navy,
    flex: 1,
  },
  cardLimit: {
    ...typography.body,
    color: colors.inkLight,
    marginRight: 8,
  },
  cardChev: {
    marginLeft: 2,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mist,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  spent: {
    ...typography.body,
    color: colors.inkLight,
  },
  left: {
    ...typography.body,
    fontWeight: '600',
    color: colors.sage,
  },
  exceededBadge: {
    backgroundColor: colors.coral,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  exceededText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  expanded: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.mist,
    gap: 14,
  },
  expandStats: {
    flexDirection: 'row',
    gap: 24,
  },
  expandStat: {
    gap: 2,
  },
  expandLabel: {
    ...typography.caption,
    color: colors.inkLight,
  },
  expandValue: {
    ...typography.titleMD,
    ...typography.number,
    color: colors.navy,
  },
  insight: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(74,158,138,0.10)',
    borderRadius: radius.lg,
    padding: 12,
  },
  insightText: {
    ...typography.caption,
    color: colors.navy,
    flex: 1,
    lineHeight: 18,
  },
  // Advisor
  advisor: {
    backgroundColor: 'rgba(74,158,138,0.10)',
    borderRadius: radius.xl,
    padding: 18,
    marginTop: 8,
    gap: 10,
  },
  advisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  advisorLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.sage,
  },
  advisorMuted: {
    ...typography.body,
    color: colors.inkLight,
  },
  // States
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
    ...typography.body,
    color: colors.inkLight,
    textAlign: 'center',
    paddingVertical: 32,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.float,
  },
});
