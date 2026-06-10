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
import type { Account, PageResponse, Transaction } from '@/src/types';
import { formatSectionDate, toISODateString } from '@/src/utils/dates';
import { formatCurrency } from '@/src/utils/format';
import { groupByDate } from '@/src/utils/transactions';

const PAGE_SIZE = 20;

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();

  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const [showDateRange, setShowDateRange] = useState(false);

  // Filtering is now server-side: date range + an optional category. (Income/
  // expense filtering was dropped — the API has no `type` param, so it can't be
  // done correctly across server pages.) `categoryOptions` accumulates categories
  // we've seen so the chips stay stable even when one category is selected.
  const [category, setCategory] = useState<string | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<Transaction> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fabVisible, setFabVisible] = useState(false);

  const fetchCurrent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await transactionService.getPage({
        startDate: toISODateString(startDate),
        endDate: toISODateString(endDate),
        category: category ?? undefined,
        page,
        size: PAGE_SIZE,
      });
      // If a delete emptied the current page, step back into range.
      if (res.content.length === 0 && page > 0 && res.totalElements > 0) {
        setPage((p) => Math.max(0, p - 1));
        return;
      }
      setData(res);
      if (res.content.length > 0) {
        setCategoryOptions((prev) => {
          const set = new Set(prev);
          for (const t of res.content) set.add(t.category);
          return [...set].sort();
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load transactions.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, category, page]);

  useEffect(() => {
    void fetchCurrent();
  }, [fetchCurrent]);

  useFocusEffect(useCallback(() => { void fetchCurrent(); }, [fetchCurrent]));

  const loadAccounts = useCallback(async () => {
    try {
      setAccounts(await accountService.getAccounts());
    } catch {
      /* the form just won't have accounts; the list still works */
    }
  }, []);
  useFocusEffect(useCallback(() => { void loadAccounts(); }, [loadAccounts]));

  // Filter/date changes reset to page 0 and show a fresh load (clear data).
  function selectCategory(next: string | null) {
    setCategory(next);
    setPage(0);
    setData(null);
  }
  function changeStart(d: Date) {
    setStartDate(d);
    setCategory(null);
    setCategoryOptions([]);
    setPage(0);
    setData(null);
  }
  function changeEnd(d: Date) {
    setEndDate(d);
    setCategory(null);
    setCategoryOptions([]);
    setPage(0);
    setData(null);
  }
  // Page nav keeps the previous rows visible (no `setData(null)`).
  const goToPage = (p: number) => setPage(p);

  const handleDelete = useCallback(async (id: string) => {
    let snapshot: PageResponse<Transaction> | null = null;
    setData((d) => {
      snapshot = d;
      return d
        ? { ...d, content: d.content.filter((t) => t.id !== id), totalElements: Math.max(0, d.totalElements - 1) }
        : d;
    });
    try {
      await transactionService.deleteTransaction(id);
      void fetchCurrent(); // resync counts / pages with the server
    } catch {
      setData(snapshot);
      Alert.alert('Delete failed', 'Could not delete that transaction. Please try again.');
    }
  }, [fetchCurrent]);

  const sections = useMemo(() => groupByDate(data?.content ?? []), [data]);
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const hasNext = data?.hasNext ?? false;

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
          <DateField label="From" value={startDate} onChange={changeStart} />
          <DateField label="To" value={endDate} onChange={changeEnd} />
        </View>
      ) : null}

      {/* Category chips */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" active={category === null} onPress={() => selectCategory(null)} />
          {categoryOptions.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => selectCategory(c)} />
          ))}
        </ScrollView>
      </View>

      {/* Body */}
      {data === null && !error ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.navy} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void fetchCurrent()} style={styles.retryBtn}>
            <Ionicons name="refresh" size={16} color={colors.navy} />
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        </View>
      ) : totalElements === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>No transactions in this range.</Text>
        </View>
      ) : (
        <>
          <SectionList
            style={styles.list}
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.listContent}
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionHeader}>{formatSectionDate(section.title)}</Text>
            )}
            renderItem={({ item }) => <TxnRow txn={item} onDelete={handleDelete} />}
          />
          <View style={styles.pageBar}>
            <Pressable
              onPress={() => goToPage(page - 1)}
              disabled={page === 0 || loading}
              style={[styles.pageBtn, (page === 0 || loading) && styles.pageBtnDisabled]}>
              <Ionicons name="chevron-back" size={16} color={colors.navy} />
              <Text style={styles.pageBtnText}>Prev</Text>
            </Pressable>

            {loading ? (
              <ActivityIndicator color={colors.navy} />
            ) : (
              <Text style={styles.pageInfo}>
                Page {page + 1} of {Math.max(1, totalPages)}
              </Text>
            )}

            <Pressable
              onPress={() => goToPage(page + 1)}
              disabled={!hasNext || loading}
              style={[styles.pageBtn, (!hasNext || loading) && styles.pageBtnDisabled]}>
              <Text style={styles.pageBtnText}>Next</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.navy} />
            </Pressable>
          </View>
        </>
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
          void fetchCurrent();
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
  root: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { ...typography.displayMD, color: colors.navy },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 12 },
  chips: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  chip: { borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 9 },
  chipActive: { backgroundColor: colors.navy },
  chipInactive: { backgroundColor: colors.mist },
  chipText: { ...typography.caption, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { ...typography.body, color: colors.coral },
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
  retryLabel: { ...typography.caption, fontWeight: '600', color: colors.navy },
  empty: { ...typography.body, color: colors.inkLight, textAlign: 'center' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  sectionHeader: {
    ...typography.caption,
    color: colors.inkLight,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    padding: 14,
  },
  circle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  circleText: { ...typography.titleMD, color: colors.white, fontWeight: '700' },
  rowMid: { flex: 1 },
  rowDesc: { ...typography.titleMD, color: colors.navy },
  rowCat: { ...typography.caption, color: colors.inkLight, marginTop: 2 },
  rowAmount: { ...typography.titleMD, ...typography.number, fontWeight: '700' },
  // Pagination
  pageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.mist,
    backgroundColor: colors.cream,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.mist,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { ...typography.caption, fontWeight: '600', color: colors.navy },
  pageInfo: { ...typography.caption, color: colors.inkLight },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 78,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.float,
  },
});
