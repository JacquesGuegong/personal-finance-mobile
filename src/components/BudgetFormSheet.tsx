import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { InputField, PrimaryButton } from '@/src/components/ui';
import { colors, radius, shadows, typography } from '@/src/constants/theme';
import { budgetService } from '@/src/services/budgetService';
import { isNonEmpty } from '@/src/utils/validators';

type BudgetFormSheetProps = {
  visible: boolean;
  month: number;
  year: number;
  monthLabel: string;
  onClose: () => void;
  onCreated: () => void;
};

export default function BudgetFormSheet({
  visible,
  month,
  year,
  monthLabel,
  onClose,
  onCreated,
}: BudgetFormSheetProps) {
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setCategory('');
      setLimit('');
      setError(null);
    }
  }, [visible]);

  async function handleSave() {
    if (!isNonEmpty(category)) {
      setError('Please enter a category.');
      return;
    }
    const parsedLimit = Number(limit);
    if (!limit.trim() || Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      setError('Enter a monthly limit greater than 0.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await budgetService.createBudget({ category: category.trim(), limitAmount: parsedLimit, month, year });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the budget.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.content}>
            <Text style={styles.title}>New budget</Text>
            <Text style={styles.subtitle}>for {monthLabel}</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <InputField placeholder="e.g. Dining" value={category} onChangeText={setCategory} editable={!saving} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Monthly limit</Text>
              <InputField
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={limit}
                onChangeText={setLimit}
                editable={!saving}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton title="Add budget" onPress={handleSave} loading={saving} disabled={saving} />
            <Pressable onPress={onClose} disabled={saving} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
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
    gap: 16,
  },
  title: {
    ...typography.titleLG,
    color: colors.navy,
  },
  subtitle: {
    ...typography.caption,
    color: colors.inkLight,
    marginTop: -12,
  },
  field: {
    gap: 6,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.inkLight,
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
