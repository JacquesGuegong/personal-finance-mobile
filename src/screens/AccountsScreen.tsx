import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { memo, useCallback, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AccountFormModal from '@/src/components/AccountFormModal';
import SwipeableRow from '@/src/components/SwipeableRow';
import { PrimaryButton } from '@/src/components/ui';
import { colors, radius, shadows, typography } from '@/src/constants/theme';
import { accountService } from '@/src/services/accountService';
import type { Account } from '@/src/types';
import { sumBalances } from '@/src/utils/finance';
import { formatCurrency } from '@/src/utils/format';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TYPE_COLOR: Record<string, string> = {
  CHECKING: colors.slate,
  SAVINGS: colors.sage,
  CREDIT: colors.coral,
  CASH: '#D9A23D',
};
const TYPE_ICON: Record<string, IoniconName> = {
  CHECKING: 'card-outline',
  SAVINGS: 'save-outline',
  CREDIT: 'card',
  CASH: 'cash-outline',
};

const typeColor = (t: string) => TYPE_COLOR[t] ?? colors.slate;
const typeIcon = (t: string): IoniconName => TYPE_ICON[t] ?? 'wallet-outline';
const typeLabel = (t: string) => t.charAt(0) + t.slice(1).toLowerCase();

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();

  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setAccounts(await accountService.getAccounts());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load accounts.');
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const openAdd = useCallback(() => {
    setEditing(null);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((account: Account) => {
    setEditing(account);
    setModalVisible(true);
  }, []);

  const confirmDelete = useCallback(
    (account: Account) => {
      Alert.alert('Delete account', `Delete “${account.name}”? This can’t be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await accountService.deleteAccount(account.id);
              void load();
            } catch {
              Alert.alert('Error', 'Could not delete the account.');
            }
          },
        },
      ]);
    },
    [load],
  );

  const list = accounts ?? [];
  const netWorth = sumBalances(list);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Accounts</Text>
        <Pressable onPress={openAdd} style={styles.addBtn} hitSlop={6}>
          <Ionicons name="add" size={24} color={colors.slate} />
        </Pressable>
      </View>

      {accounts === null && !error ? (
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
        <EmptyState onAdd={openAdd} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
          ListHeaderComponent={
            <View style={styles.netCard}>
              <Text style={styles.netLabel}>Total net worth</Text>
              <Text style={styles.netAmount}>{formatCurrency(netWorth)}</Text>
              <Text style={styles.netSub}>
                Across {list.length} account{list.length === 1 ? '' : 's'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <AccountRow account={item} onPress={openEdit} onDelete={confirmDelete} />
          )}
        />
      )}

      <AccountFormModal
        visible={modalVisible}
        account={editing}
        onClose={() => setModalVisible(false)}
        onSaved={() => {
          setModalVisible(false);
          void load();
        }}
      />
    </View>
  );
}

function AccountRowImpl({
  account,
  onPress,
  onDelete,
}: {
  account: Account;
  onPress: (a: Account) => void;
  onDelete: (a: Account) => void;
}) {
  const color = typeColor(account.type);
  const balanceColor = account.balance >= 0 ? colors.sage : colors.coral;

  return (
    <SwipeableRow onDelete={() => onDelete(account)}>
      <Pressable style={styles.rowCard} onPress={() => onPress(account)}>
        <View style={[styles.circle, { backgroundColor: color }]}>
          <Ionicons name={typeIcon(account.type)} size={20} color={colors.white} />
        </View>
        <View style={styles.rowMid}>
          <Text style={styles.rowName} numberOfLines={1}>
            {account.name}
          </Text>
          <Text style={styles.rowType}>{typeLabel(account.type)} account</Text>
        </View>
        <Text style={[styles.rowBalance, { color: balanceColor }]}>{formatCurrency(account.balance)}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.mist} />
      </Pressable>
    </SwipeableRow>
  );
}
const AccountRow = memo(AccountRowImpl);

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.walletCircle}>
        <Ionicons name="wallet-outline" size={48} color={colors.navy} />
      </View>
      <Text style={styles.emptyTitle}>No accounts yet</Text>
      <Text style={styles.emptySub}>Add your first account to get started.</Text>
      <View style={styles.emptyBtn}>
        <PrimaryButton title="Add account" onPress={onAdd} />
      </View>
    </View>
  );
}

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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  // Net worth
  netCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: 24,
    marginBottom: 16,
    ...shadows.float,
  },
  netLabel: { ...typography.caption, color: 'rgba(255,255,255,0.6)' },
  netAmount: { ...typography.displayXL, ...typography.number, color: colors.white, marginTop: 6 },
  netSub: { ...typography.caption, color: 'rgba(255,255,255,0.5)', marginTop: 6 },
  // Row
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
  rowMid: { flex: 1 },
  rowName: { ...typography.titleMD, color: colors.navy },
  rowType: { ...typography.caption, color: colors.inkLight, marginTop: 2 },
  rowBalance: { ...typography.titleMD, ...typography.number, fontWeight: '700' },
  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 40 },
  walletCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...shadows.card,
  },
  emptyTitle: { ...typography.titleLG, color: colors.navy },
  emptySub: { ...typography.body, color: colors.inkLight, textAlign: 'center', marginTop: 6 },
  emptyBtn: { alignSelf: 'stretch', marginTop: 24 },
});
