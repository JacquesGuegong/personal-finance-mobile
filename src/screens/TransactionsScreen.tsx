import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import DateField from '@/src/components/DateField';
import SegmentedControl from '@/src/components/SegmentedControl';
import SwipeableRow from '@/src/components/SwipeableRow';
import TransactionFormSheet from '@/src/components/TransactionFormSheet';
import { accountService } from '@/src/services/accountService';
import { transactionService } from '@/src/services/transactionService';
import type { Account, Transaction } from '@/src/types';
import { categoryIcon } from '@/src/utils/categoryIcon';
import { formatDateHeading, toISODateString } from '@/src/utils/dates';
import { formatCurrency } from '@/src/utils/format';
import {
  TYPE_FILTERS,
  distinctCategories,
  filterTransactions,
  groupByDate,
  type TypeFilter,
} from '@/src/utils/transactions';

export default function TransactionsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const screenBg = scheme === 'dark' ? '#000' : '#f2f2f7';

  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fabVisible, setFabVisible] = useState(false);

  // Only the date range hits the server; type/category are filtered client-side.
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
  }, [load]); // runs on mount and whenever the date range changes

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const previous = transactions;
      // Optimistic removal so the row disappears immediately.
      setTransactions((current) => current?.filter((t) => t.id !== id) ?? current);
      try {
        await transactionService.deleteTransaction(id);
      } catch {
        setTransactions(previous); // roll back on failure
        Alert.alert('Delete failed', 'Could not delete that transaction. Please try again.');
      }
    },
    [transactions],
  );

  const categories = useMemo(() => distinctCategories(transactions ?? []), [transactions]);
  const sections = useMemo(
    () => groupByDate(filterTransactions(transactions ?? [], typeFilter, categoryFilter)),
    [transactions, typeFilter, categoryFilter],
  );

  const filterBar = (
    <View style={styles.filterBar}>
      <View style={styles.dateRow}>
        <DateField label="From" value={startDate} onChange={setStartDate} />
        <DateField label="To" value={endDate} onChange={setEndDate} />
      </View>
      <SegmentedControl options={TYPE_FILTERS} value={typeFilter} onChange={setTypeFilter} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <CategoryChip label="All" active={categoryFilter === null} onPress={() => setCategoryFilter(null)} />
        {categories.map((c) => (
          <CategoryChip
            key={c}
            label={c}
            active={categoryFilter === c}
            onPress={() => setCategoryFilter(c)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: screenBg }}>
      {filterBar}

      {transactions === null && !error ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: colors.text }]}>
              {formatDateHeading(section.title)}
            </Text>
          )}
          renderItem={({ item }) => (
            <TransactionRow txn={item} onDelete={() => handleDelete(item.id)} />
          )}
          ListEmptyComponent={
            error ? (
              <Text style={styles.error}>{error}</Text>
            ) : (
              <Text style={[styles.muted, { color: colors.text }]}>
                No transactions match these filters.
              </Text>
            )
          }
        />
      )}

      <Pressable onPress={() => setFabVisible(true)} style={[styles.fab, { backgroundColor: colors.tint }]}>
        <Ionicons name="add" size={30} color="#fff" />
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

function CategoryChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: colors.tabIconDefault },
        active && { backgroundColor: colors.tint, borderColor: colors.tint },
      ]}>
      <Text style={{ color: active ? '#fff' : colors.text, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

function TransactionRow({ txn, onDelete }: { txn: Transaction; onDelete: () => void }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const surface = scheme === 'dark' ? '#1c1c1e' : '#ffffff';
  const iconBg = scheme === 'dark' ? '#2c2c2e' : '#eef0f2';
  const income = txn.type === 'INCOME';
  const amountColor = income ? '#34c759' : '#ff3b30';

  return (
    <SwipeableRow onDelete={onDelete}>
      <View style={[styles.row, { backgroundColor: surface }]}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <Ionicons name={categoryIcon(txn.category)} size={20} color={colors.text} />
        </View>
        <View style={styles.rowMid}>
          <Text style={[styles.desc, { color: colors.text }]} numberOfLines={1}>
            {txn.description || txn.category}
          </Text>
          <Text style={[styles.cat, { color: colors.text }]}>{txn.category}</Text>
        </View>
        <Text style={[styles.amount, { color: amountColor }]}>
          {income ? '+' : '-'}
          {formatCurrency(txn.amount)}
        </Text>
      </View>
    </SwipeableRow>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    padding: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8e8e93',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chips: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 12,
    paddingBottom: 96, // clear the FAB
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.5,
    marginTop: 14,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
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
    gap: 2,
  },
  desc: {
    fontSize: 15,
    fontWeight: '600',
  },
  cat: {
    fontSize: 12,
    opacity: 0.5,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  muted: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 32,
  },
  error: {
    color: '#ff3b30',
    textAlign: 'center',
    marginTop: 32,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
});
