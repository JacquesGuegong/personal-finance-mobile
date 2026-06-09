import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DateField from '@/src/components/DateField';
import SwipeableRow from '@/src/components/SwipeableRow';
import TransactionFormSheet from '@/src/components/TransactionFormSheet';
import { colors, radius, shadows, typography } from '@/src/constants/theme';
import { accountService } from '@/src/services/accountService';
import { transactionService } from '@/src/services/transactionService';
import type { Account, Transaction, TransactionType } from '@/src/types';
import { formatSectionDate, toISODateString } from '@/src/utils/dates';
import { formatCurrency } from '@/src/utils/format';
import { distinctCategories, groupByDate } from '@/src/utils/transactions';

// A single-select filter across one chip row: All / Income / Expenses / <category>.
type Filter =
  | { kind: 'all' }
  | { kind: 'type'; type: TransactionType }
  | { kind: 'category'; category: string };

const ALL: Filter = { kind: 'all' };

function matches(filter: Filter, t: Transaction): boolean {
  if (filter.kind === 'all') return true;
  if (filter.kind === 'type') return t.type === filter.type;
  return t.category === filter.category;
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();

  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const [filter, setFilter] = useState<Filter>(ALL);
  const [showDateRange, setShowDateRange] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fabVisible, setFabVisible] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [txns, accts] = await Promise.all([
        transactionService.getRange(toISODateString(startDate), toISODateString(endDate)),
        accountService.getAccounts(),
      ]);
      setTransactions(txns);
      setAccounts(accts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load transactions.');
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleDelete = useCallback(async (id: string) => {
    let snapshot: Transaction[] | null = null;
    setTransactions((cur) => {
      snapshot = cur;
      return cur?.filter((t) => t.id !== id) ?? cur;
    });
    try {
      await transactionService.deleteTransaction(id);
    } catch {
      setTransactions(snapshot);
      Alert.alert('Delete failed', 'Could not delete that transaction. Please try again.');
    }
  }, []);

  const categories = useMemo(() => distinctCategories(transactions ?? []), [transactions]);
  const sections = useMemo(
    () => groupByDate((transactions ?? []).filter((t) => matches(filter, t))),
    [transactions, filter],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Transactions</Text>
        <Pressable
          onPress={() => setShowDateRange((v) => !v)}
          style={[styles.filterBtn, showDateRange && { backgroundColor: colors.navy }]}
          hitSlop={6}>
          <Ionicons name="options-outline" size={20} color={showDateRange ? colors.white : colors.navy} />
        </Pressable>
      </View>

      {/* Date range (toggle) */}
      {showDateRange ? (
        <View style={styles.dateRow}>
          <DateField label="From" value={startDate} onChange={setStartDate} />
          <DateField label="To" value={endDate} onChange={setEndDate} />
        </View>
      ) : null}

      {/* Filter chips */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          <Chip label="All" active={filter.kind === 'all'} onPress={() => setFilter(ALL)} />
          <Chip
            label="Income"
            active={filter.kind === 'type' && filter.type === 'INCOME'}
            onPress={() => setFilter({ kind: 'type', type: 'INCOME' })}
          />
          <Chip
            label="Expenses"
            active={filter.kind === 'type' && filter.type === 'EXPENSE'}
            onPress={() => setFilter({ kind: 'type', type: 'EXPENSE' })}
          />
          {categories.map((c) => (
            <Chip
              key={c}
              label={c}
              active={filter.kind === 'category' && filter.category === c}
              onPress={() => setFilter({ kind: 'category', category: c })}
            />
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {transactions === null && !error ? (
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
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{formatSectionDate(section.title)}</Text>
          )}
          renderItem={({ item }) => <TxnRow txn={item} onDelete={handleDelete} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No transactions match these filters.</Text>
          }
        />
      )}

      {/* FAB */}
      <Pressable onPress={() => setFabVisible(true)} style={styles.fab}>
        <Ionicons name="add" size={30} color={colors.white} />
      </Pressable>

      <TransactionFormSheet
        visible={fabVisible}
        accounts={accounts}
        onClose={() => setFabVisible(false)}
        onCreated={() => {
          setFabVisible(false);
          void load();
        }}
      />
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
      <Text style={[styles.chipText, { color: active ? colors.white : colors.navy }]}>{label}</Text>
    </Pressable>
  );
}

function TxnRowImpl({ txn, onDelete }: { txn: Transaction; onDelete: (id: string) => void }) {
  const income = txn.type === 'INCOME';
  const accent = income ? colors.sage : colors.coral;
  return (
    <SwipeableRow onDelete={() => onDelete(txn.id)}>
      <View style={styles.rowCard}>
        <View style={[styles.circle, { backgroundColor: accent }]}>
          <Text style={styles.circleText}>{txn.category.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.rowMid}>
          <Text style={styles.rowDesc} numberOfLines={1}>
            {txn.description || txn.category}
          </Text>
          <Text style={styles.rowCat}>{txn.category}</Text>
        </View>
        <Text style={[styles.rowAmount, { color: accent }]}>
          {income ? '+' : '−'}
          {formatCurrency(txn.amount)}
        </Text>
      </View>
    </SwipeableRow>
  );
}
const TxnRow = memo(TxnRowImpl);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    ...typography.displayMD,
    color: colors.navy,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  chips: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: colors.navy,
  },
  chipInactive: {
    backgroundColor: colors.mist,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '600',
  },
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // clear the FAB
  },
  sectionHeader: {
    ...typography.caption,
    color: colors.inkLight,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  empty: {
    ...typography.body,
    color: colors.inkLight,
    textAlign: 'center',
    marginTop: 40,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    padding: 14,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    ...typography.titleMD,
    color: colors.white,
    fontWeight: '700',
  },
  rowMid: {
    flex: 1,
  },
  rowDesc: {
    ...typography.titleMD,
    color: colors.navy,
  },
  rowCat: {
    ...typography.caption,
    color: colors.inkLight,
    marginTop: 2,
  },
  rowAmount: {
    ...typography.titleMD,
    ...typography.number,
    fontWeight: '700',
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
