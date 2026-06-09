import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SectionHeader from '@/src/components/ui/SectionHeader';
import { colors, radius, shadows, typography } from '@/src/constants/theme';
import { useUnreadAlerts } from '@/src/context/UnreadAlertsContext';
import { useApi } from '@/src/hooks/useApi';
import { useAuth } from '@/src/hooks/useAuth';
import { accountService } from '@/src/services/accountService';
import { aiService } from '@/src/services/aiService';
import { budgetService } from '@/src/services/budgetService';
import { transactionService } from '@/src/services/transactionService';
import type { BudgetStatus, Transaction } from '@/src/types';
import { fromISODateString } from '@/src/utils/dates';
import { budgetPercent, summarizeMonth, sumBalances } from '@/src/utils/finance';
import { formatCurrency, formatCurrencyWhole } from '@/src/utils/format';

const AMBER = '#D9A23D';
const DOT_PALETTE = [colors.navy, colors.slate, colors.sage, colors.coral, AMBER];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { count } = useUnreadAlerts();

  const accounts = useApi(useCallback(() => accountService.getAccounts(), []));
  const txns = useApi(useCallback(() => transactionService.getCurrentMonth(), []));
  const budgets = useApi(useCallback(() => budgetService.getBudgets(), []));
  const summary = useApi(useCallback(() => aiService.getSpendingSummary(), []));

  useFocusEffect(
    useCallback(() => {
      void accounts.reload();
      void txns.reload();
      void budgets.reload();
      void summary.reload();
    }, [accounts.reload, txns.reload, budgets.reload, summary.reload]),
  );

  const netWorth = sumBalances(accounts.data ?? []);
  const { income, expenses } = summarizeMonth(txns.data ?? []);
  const recent = [...(txns.data ?? [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const monthLabel = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting(user?.name, user?.email)}</Text>
            <Text style={styles.month}>{monthLabel}</Text>
          </View>
          <Pressable onPress={() => router.push('/alerts')} hitSlop={8}>
            <Ionicons name="notifications-outline" size={24} color={colors.navy} />
            {count > 0 ? <View style={styles.bellDot} /> : null}
          </Pressable>
        </View>

        {/* Net worth hero */}
        <View style={styles.hero}>
          <View pointerEvents="none" style={styles.heroGlow} />
          <Text style={styles.heroLabel}>Net worth</Text>
          <Text style={styles.heroAmount}>{formatCurrency(netWorth)}</Text>
          <View style={styles.heroPills}>
            <View style={[styles.heroPill, { backgroundColor: colors.sage }]}>
              <Text style={styles.heroPillText}>+ {formatCurrencyWhole(income)} income</Text>
            </View>
            <View style={[styles.heroPill, { backgroundColor: colors.coral }]}>
              <Text style={styles.heroPillText}>− {formatCurrencyWhole(expenses)} expenses</Text>
            </View>
          </View>
        </View>

        {/* Budgets */}
        <View style={styles.section}>
          <SectionHeader title="Budgets" actionLabel="See all" onAction={() => router.push('/budgets')} />
        </View>
        {budgets.error ? (
          <SectionRetry label="Couldn’t load budgets" onRetry={() => void budgets.reload()} />
        ) : budgets.data && budgets.data.length === 0 ? (
          <Text style={styles.emptyInline}>No budgets yet.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.budgetScroll}>
            {(budgets.data ?? []).map((b) => (
              <BudgetMiniCard key={b.id} budget={b} />
            ))}
          </ScrollView>
        )}

        {/* AI insight — tap the card for the full Insights screen */}
        <View style={styles.section}>
          <Pressable style={styles.aiCard} onPress={() => router.push('/insights' as Href)}>
            <View style={styles.aiHeader}>
              <Text style={styles.aiLabel}>AI INSIGHT</Text>
              <Pressable onPress={() => void summary.reload()} disabled={summary.loading} hitSlop={8}>
                <Ionicons
                  name="refresh"
                  size={16}
                  color={summary.loading ? colors.mist : colors.inkLight}
                />
              </Pressable>
            </View>
            <Text style={styles.aiText}>
              {summary.loading && !summary.data
                ? 'Reading your spending…'
                : summary.error
                  ? 'Insights are unavailable right now.'
                  : summary.data?.summary}
            </Text>
          </Pressable>
        </View>

        {/* Recent */}
        <View style={styles.section}>
          <SectionHeader title="Recent" actionLabel="See all" onAction={() => router.push('/transactions')} />
        </View>
        <View style={styles.recentCard}>
          {txns.error ? (
            <SectionRetry label="Couldn’t load transactions" onRetry={() => void txns.reload()} />
          ) : recent.length === 0 ? (
            <Text style={styles.emptyInline}>No transactions yet.</Text>
          ) : (
            recent.map((t, i) => (
              <View key={t.id}>
                {i > 0 ? <View style={styles.rowDivider} /> : null}
                <TxnRow txn={t} />
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── pieces ──────────────────────────────────────────────────────────────────
function BudgetMiniCard({ budget }: { budget: BudgetStatus }) {
  const { width } = useWindowDimensions();
  const pct = budgetPercent(budget);
  const color = pct >= 100 ? colors.coral : pct >= 70 ? AMBER : colors.sage;

  return (
    <View style={[styles.budgetCard, { width: width * 0.8 }]}>
      <Text style={styles.budgetCat}>{budget.category}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, pct)}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.budgetRow}>
        <Text style={styles.budgetAmounts}>
          {formatCurrency(budget.spentAmount)} of {formatCurrency(budget.limitAmount)}
        </Text>
        <Text style={styles.budgetPct}>{Math.round(pct)}%</Text>
      </View>
    </View>
  );
}

function TxnRow({ txn }: { txn: Transaction }) {
  const income = txn.type === 'INCOME';
  return (
    <View style={styles.txnRow}>
      <View style={[styles.dot, { backgroundColor: categoryColor(txn.category) }]} />
      <View style={styles.txnMid}>
        <Text style={styles.txnName} numberOfLines={1}>
          {txn.description || txn.category}
        </Text>
        <Text style={styles.txnDate}>
          {fromISODateString(txn.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </Text>
      </View>
      <Text style={[styles.txnAmount, { color: income ? colors.sage : colors.coral }]}>
        {income ? '+' : '−'}
        {formatCurrency(txn.amount)}
      </Text>
    </View>
  );
}

function SectionRetry({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <View style={styles.section}>
      <Pressable onPress={onRetry} style={styles.retry} hitSlop={6}>
        <Ionicons name="refresh" size={15} color={colors.coral} />
        <Text style={styles.retryText}>{label} · Tap to retry</Text>
      </Pressable>
    </View>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function greeting(name?: string, email?: string): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const raw = name?.split(' ')[0] || email?.split('@')[0] || 'there';
  const display = raw.charAt(0).toUpperCase() + raw.slice(1);
  return `${part}, ${display}`;
}

function categoryColor(category: string): string {
  let hash = 0;
  for (const ch of category) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return DOT_PALETTE[hash % DOT_PALETTE.length];
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    paddingBottom: 32,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greeting: {
    ...typography.caption,
    color: colors.inkLight,
  },
  month: {
    ...typography.titleMD,
    color: colors.navy,
    marginTop: 2,
  },
  bellDot: {
    position: 'absolute',
    top: -2,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.coral,
    borderWidth: 1.5,
    borderColor: colors.cream,
  },
  // Hero
  hero: {
    marginHorizontal: 20,
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: 24,
    overflow: 'hidden',
    ...shadows.float,
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(247,245,241,0.06)',
  },
  heroLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
  },
  heroAmount: {
    ...typography.displayXL,
    ...typography.number,
    color: colors.white,
    marginTop: 6,
    marginBottom: 18,
  },
  heroPills: {
    flexDirection: 'row',
    gap: 10,
  },
  heroPill: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroPillText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.white,
  },
  // Sections
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  emptyInline: {
    ...typography.body,
    color: colors.inkLight,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  // Budgets
  budgetScroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  budgetCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 20,
    ...shadows.card,
  },
  budgetCat: {
    ...typography.titleMD,
    color: colors.navy,
    marginBottom: 14,
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
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  budgetAmounts: {
    ...typography.body,
    color: colors.navy,
  },
  budgetPct: {
    ...typography.caption,
    color: colors.inkLight,
  },
  // AI card
  aiCard: {
    backgroundColor: 'rgba(74,158,138,0.10)',
    borderLeftWidth: 3,
    borderLeftColor: colors.sage,
    borderRadius: radius.lg,
    padding: 16,
    gap: 8,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.sage,
  },
  aiText: {
    ...typography.body,
    color: colors.navy,
  },
  // Recent
  recentCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    ...shadows.card,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.mist,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  txnMid: {
    flex: 1,
  },
  txnName: {
    ...typography.titleMD,
    color: colors.navy,
  },
  txnDate: {
    ...typography.caption,
    color: colors.inkLight,
    marginTop: 2,
  },
  txnAmount: {
    ...typography.titleMD,
    ...typography.number,
  },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  retryText: {
    ...typography.caption,
    color: colors.coral,
  },
});
