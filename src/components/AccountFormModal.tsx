import { useEffect, useState } from 'react';
import {
  Alert,
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
import { accountService } from '@/src/services/accountService';
import { ACCOUNT_TYPES, type Account, type AccountType } from '@/src/types';
import { isNonEmpty } from '@/src/utils/validators';

type AccountFormModalProps = {
  visible: boolean;
  account: Account | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function AccountFormModal({ visible, account, onClose, onSaved }: AccountFormModalProps) {
  const isEdit = account !== null;

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('CHECKING');
  const [balance, setBalance] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(account?.name ?? '');
      setType((account?.type as AccountType) ?? 'CHECKING');
      setBalance(account ? String(account.balance) : '');
      setError(null);
    }
  }, [visible, account]);

  async function handleSave() {
    if (!isNonEmpty(name)) {
      setError('Please enter an account name.');
      return;
    }
    const parsed = balance.trim() === '' ? 0 : Number(balance);
    if (Number.isNaN(parsed)) {
      setError('Balance must be a number.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const input = { name: name.trim(), type, balance: parsed };
      if (account) await accountService.updateAccount(account.id, input);
      else await accountService.createAccount(input);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the account.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!account) return;
    Alert.alert('Delete account', `Delete “${account.name}”? This can’t be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: handleDelete },
    ]);
  }

  async function handleDelete() {
    if (!account) return;
    setError(null);
    setDeleting(true);
    try {
      await accountService.deleteAccount(account.id);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the account.');
    } finally {
      setDeleting(false);
    }
  }

  const busy = saving || deleting;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.content}>
            <Text style={styles.title}>{isEdit ? 'Edit account' : 'New account'}</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Account name</Text>
              <InputField placeholder="e.g. Everyday Checking" value={name} onChangeText={setName} editable={!busy} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.pills}>
                {ACCOUNT_TYPES.map((t) => {
                  const selected = t === type;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setType(t)}
                      disabled={busy}
                      style={[styles.pill, selected ? styles.pillActive : styles.pillInactive]}>
                      <Text style={[styles.pillText, { color: selected ? colors.white : colors.navy }]}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Initial balance</Text>
              <InputField
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={balance}
                onChangeText={setBalance}
                editable={!busy}
                style={typography.number}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton
              title={isEdit ? 'Save changes' : 'Add account'}
              onPress={handleSave}
              loading={saving}
              disabled={busy}
            />

            {isEdit ? (
              <Pressable onPress={confirmDelete} disabled={busy} style={styles.delete}>
                <Text style={styles.deleteText}>{deleting ? 'Deleting…' : 'Delete account'}</Text>
              </Pressable>
            ) : null}

            <Pressable onPress={onClose} disabled={busy} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,43,76,0.45)' },
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
  content: { padding: 24, paddingBottom: 32, gap: 16 },
  title: { ...typography.titleLG, color: colors.navy },
  field: { gap: 6 },
  label: { ...typography.caption, fontWeight: '600', color: colors.inkLight },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 9 },
  pillActive: { backgroundColor: colors.navy },
  pillInactive: { backgroundColor: colors.mist },
  pillText: { ...typography.caption, fontWeight: '700' },
  error: { ...typography.caption, color: colors.coral },
  delete: { alignItems: 'center', paddingVertical: 10 },
  deleteText: { ...typography.body, fontWeight: '600', color: colors.coral },
  cancel: { alignItems: 'center', paddingVertical: 4 },
  cancelText: { ...typography.body, color: colors.inkLight },
});
