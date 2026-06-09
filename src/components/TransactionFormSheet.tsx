import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import DateField from '@/src/components/DateField';
import { InputField, PrimaryButton } from '@/src/components/ui';
import { colors, radius, shadows, typography } from '@/src/constants/theme';
import { aiService } from '@/src/services/aiService';
import { transactionService } from '@/src/services/transactionService';
import type { Account, TransactionType } from '@/src/types';
import { toISODateString } from '@/src/utils/dates';

type TransactionFormSheetProps = {
  visible: boolean;
  accounts: Account[];
  onClose: () => void;
  onCreated: () => void;
};

export default function TransactionFormSheet({
  visible,
  accounts,
  onClose,
  onCreated,
}: TransactionFormSheetProps) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());

  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accent = type === 'INCOME' ? colors.sage : colors.coral;

  useEffect(() => {
    if (visible) {
      setAccountId(accounts[0]?.id ?? null);
      setAmount('');
      setType('EXPENSE');
      setDescription('');
      setCategory('');
      setDate(new Date());
      setSuggestion(null);
      setError(null);
    }
  }, [visible, accounts]);

  // Debounced AI category suggestion from the description.
  useEffect(() => {
    const desc = description.trim();
    if (!visible || desc.length < 3) {
      setSuggestion(null);
      return;
    }
    let cancelled = false;
    setSuggesting(true);
    const timer = setTimeout(async () => {
      try {
        const suggested = await aiService.categorize(desc);
        if (cancelled) return;
        setSuggestion(suggested);
        setCategory((prev) => (prev.trim() === '' ? suggested : prev));
      } catch {
        if (!cancelled) setSuggestion(null);
      } finally {
        if (!cancelled) setSuggesting(false);
      }
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [description, visible]);

  async function handleSave() {
    if (!accountId) {
      setError('Add an account first (on the Accounts tab).');
      return;
    }
    const parsed = Number(amount);
    if (!amount.trim() || Number.isNaN(parsed) || parsed <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    if (!category.trim()) {
      setError('Enter or accept a category.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await transactionService.createTransaction({
        accountId,
        amount: parsed,
        type,
        category: category.trim(),
        description: description.trim(),
        date: toISODateString(date),
      });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the transaction.');
    } finally {
      setSaving(false);
    }
  }

  const showSuggestion = suggestion !== null && suggestion !== category.trim();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {/* Huge amount */}
            <View style={styles.amountRow}>
              <Text style={[styles.amountSign, { color: accent }]}>$</Text>
              <TextInput
                style={[styles.amountInput, { color: accent }]}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.mist}
                value={amount}
                onChangeText={setAmount}
                editable={!saving}
              />
            </View>

            {/* Type pill toggle */}
            <View style={styles.toggle}>
              <Pressable
                style={[styles.toggleSeg, type === 'INCOME' && { backgroundColor: colors.sage }]}
                onPress={() => setType('INCOME')}
                disabled={saving}>
                <Text style={[styles.toggleText, { color: type === 'INCOME' ? colors.white : colors.navy }]}>
                  Income
                </Text>
              </Pressable>
              <Pressable
                style={[styles.toggleSeg, type === 'EXPENSE' && { backgroundColor: colors.coral }]}
                onPress={() => setType('EXPENSE')}
                disabled={saving}>
                <Text style={[styles.toggleText, { color: type === 'EXPENSE' ? colors.white : colors.navy }]}>
                  Expense
                </Text>
              </Pressable>
            </View>

            {/* Account (required by the API) */}
            {accounts.length === 0 ? (
              <Text style={styles.helper}>Add an account first on the Accounts tab.</Text>
            ) : (
              <View style={styles.field}>
                <Text style={styles.label}>Account</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  {accounts.map((a) => {
                    const selected = a.id === accountId;
                    return (
                      <Pressable
                        key={a.id}
                        onPress={() => setAccountId(a.id)}
                        style={[styles.chip, selected ? styles.chipActive : styles.chipInactive]}>
                        <Text style={{ color: selected ? colors.white : colors.navy, ...typography.caption, fontWeight: '600' }}>
                          {a.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Category + AI suggestion */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Category</Text>
                {suggesting ? <Text style={styles.thinking}>thinking…</Text> : null}
              </View>
              <InputField
                placeholder="e.g. Dining"
                value={category}
                onChangeText={setCategory}
                editable={!saving}
              />
              {showSuggestion ? (
                <Pressable onPress={() => setCategory(suggestion)} style={styles.suggestion}>
                  <Ionicons name="sparkles" size={13} color={colors.sage} />
                  <Text style={styles.suggestionText}>Suggested: {suggestion}</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <InputField
                placeholder="e.g. Starbucks coffee"
                value={description}
                onChangeText={setDescription}
                editable={!saving}
              />
            </View>

            {/* Date */}
            <View style={styles.field}>
              <Text style={styles.label}>Date</Text>
              <DateField value={date} onChange={setDate} />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton
              title="Add transaction"
              onPress={handleSave}
              loading={saving}
              disabled={saving || accounts.length === 0}
            />
            <Pressable onPress={onClose} disabled={saving} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,43,76,0.45)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.pill,
    borderTopRightRadius: radius.pill,
    maxHeight: '92%',
    ...shadows.float,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.mist,
    marginTop: 10,
  },
  content: {
    padding: 24,
    paddingBottom: 32,
    gap: 18,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  amountSign: {
    ...typography.displayMD,
    marginTop: 6,
    marginRight: 2,
  },
  amountInput: {
    ...typography.displayXL,
    ...typography.number,
    minWidth: 80,
    textAlign: 'center',
    padding: 0,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.mist,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  toggleSeg: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  toggleText: {
    ...typography.titleMD,
    fontWeight: '600',
  },
  field: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.inkLight,
  },
  thinking: {
    ...typography.caption,
    color: colors.sage,
    fontStyle: 'italic',
  },
  chips: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.navy,
  },
  chipInactive: {
    backgroundColor: colors.mist,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(74,158,138,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 2,
  },
  suggestionText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.sage,
  },
  helper: {
    ...typography.body,
    color: colors.coral,
  },
  error: {
    ...typography.caption,
    color: colors.coral,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    ...typography.body,
    color: colors.inkLight,
  },
});
