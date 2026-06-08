import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import DateField from '@/src/components/DateField';
import FormInput from '@/src/components/FormInput';
import PrimaryButton from '@/src/components/PrimaryButton';
import SegmentedControl from '@/src/components/SegmentedControl';
import { aiService } from '@/src/services/aiService';
import { transactionService } from '@/src/services/transactionService';
import type { Account, TransactionType } from '@/src/types';
import { toISODateString } from '@/src/utils/dates';

const TXN_TYPES: readonly TransactionType[] = ['EXPENSE', 'INCOME'];

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
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const surface = scheme === 'dark' ? '#1c1c1e' : '#ffffff';

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

  // Reset the form each time it opens.
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

  // AI auto-suggest: debounce the description, then ask the API to categorize.
  // We auto-fill the category only if the user hasn't typed one, and always
  // surface the suggestion as a tappable chip.
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
      setError('Create an account first to add a transaction.');
      return;
    }
    const parsedAmount = Number(amount);
    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
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
        amount: parsedAmount,
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

  const showSuggestionChip = suggestion !== null && suggestion !== category.trim();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { backgroundColor: surface }]}>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
            <Text style={[styles.title, { color: colors.text }]}>Add transaction</Text>

            {accounts.length === 0 ? (
              <Text style={styles.error}>You need an account first. Add one on the Accounts tab.</Text>
            ) : (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Account</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  {accounts.map((a) => {
                    const selected = a.id === accountId;
                    return (
                      <Pressable
                        key={a.id}
                        onPress={() => setAccountId(a.id)}
                        style={[
                          styles.chip,
                          { borderColor: colors.tabIconDefault },
                          selected && { backgroundColor: colors.tint, borderColor: colors.tint },
                        ]}>
                        <Text style={{ color: selected ? '#fff' : colors.text, fontSize: 13, fontWeight: '600' }}>
                          {a.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <FormInput
              label="Amount"
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              editable={!saving}
            />

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Type</Text>
              <SegmentedControl options={TXN_TYPES} value={type} onChange={setType} disabled={saving} />
            </View>

            <FormInput
              label="Description"
              placeholder="e.g. Starbucks coffee"
              value={description}
              onChangeText={setDescription}
              editable={!saving}
            />

            <View style={styles.field}>
              <View style={styles.categoryLabelRow}>
                <Text style={[styles.label, { color: colors.text }]}>Category</Text>
                {suggesting ? <ActivityIndicator size="small" /> : null}
              </View>
              <FormInput
                label=""
                placeholder="e.g. Dining"
                value={category}
                onChangeText={setCategory}
                editable={!saving}
              />
              {showSuggestionChip ? (
                <Pressable
                  onPress={() => setCategory(suggestion)}
                  style={[styles.suggestionChip, { borderColor: colors.tint }]}>
                  <Ionicons name="sparkles-outline" size={14} color={colors.tint} />
                  <Text style={{ color: colors.tint, fontSize: 13, fontWeight: '600' }}>
                    Suggested: {suggestion}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Date</Text>
              <DateField value={date} onChange={setDate} />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton
              title="Save transaction"
              onPress={handleSave}
              loading={saving}
              disabled={saving || accounts.length === 0}
            />
            <Pressable onPress={onClose} disabled={saving} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  scroll: {
    padding: 20,
    paddingBottom: 32,
    gap: 14,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8e8e93',
    opacity: 0.5,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chips: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 2,
  },
  error: {
    color: '#ff3b30',
  },
  cancelBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    opacity: 0.7,
  },
});
