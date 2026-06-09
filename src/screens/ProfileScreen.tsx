import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadows, typography } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);

  const email = user?.email ?? '';
  const initial = (email.charAt(0) || '?').toUpperCase();

  function soon(title: string) {
    Alert.alert(title, 'Coming soon.');
  }

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert('Delete account', 'Account deletion isn’t available yet.');
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.memberSince}>Member since {new Date().getFullYear()}</Text>
        </View>

        {/* Account */}
        <Section title="Account">
          <Row label="Email" value={email} last={false} />
          <Row label="Change password" accessory={<Chevron />} onPress={() => soon('Change password')} last={false} />
          <Row
            label="Notifications"
            accessory={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ true: colors.sage, false: colors.mist }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.mist}
              />
            }
            last
          />
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <Row label="Currency" value="USD" last={false} />
          <Row label="Start of month" value="1st" last />
        </Section>

        {/* Data */}
        <Section title="Data">
          <Row label="Export transactions" accessory={<Chevron />} onPress={() => soon('Export transactions')} last={false} />
          <Row label="Privacy policy" accessory={<Chevron />} onPress={() => soon('Privacy policy')} last />
        </Section>

        {/* Danger zone */}
        <View style={[styles.card, styles.danger]}>
          <Row label="Sign out" tone="danger" onPress={handleSignOut} last={false} />
          <Row label="Delete account" tone="dangerLight" onPress={handleDeleteAccount} last />
        </View>

        <Text style={styles.version}>Personal Finance v{APP_VERSION}</Text>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

type RowTone = 'default' | 'danger' | 'dangerLight';
type RowProps = {
  label: string;
  value?: string;
  accessory?: ReactNode;
  onPress?: () => void;
  last: boolean;
  tone?: RowTone;
};

function Row({ label, value, accessory, onPress, last, tone = 'default' }: RowProps) {
  const labelColor =
    tone === 'danger' ? colors.coral : tone === 'dangerLight' ? 'rgba(232,99,74,0.65)' : colors.navy;

  const inner = (pressed: boolean) => (
    <View style={[styles.row, !last && styles.rowBorder, pressed && styles.rowPressed]}>
      <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {accessory}
      </View>
    </View>
  );

  if (!onPress) return inner(false);
  return <Pressable onPress={onPress}>{({ pressed }) => inner(pressed)}</Pressable>;
}

function Chevron() {
  return <Ionicons name="chevron-forward" size={18} color={colors.inkLight} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  // Header
  profileHeader: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { ...typography.titleLG, color: colors.white, fontWeight: '700' },
  email: { ...typography.titleMD, color: colors.navy },
  memberSince: { ...typography.caption, color: colors.inkLight, marginTop: 4 },
  // Sections
  section: { marginBottom: 22 },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.inkLight,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  danger: { marginTop: 6, marginBottom: 24 },
  // Rows
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.mist },
  rowPressed: { backgroundColor: colors.cream },
  rowLabel: { ...typography.body },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  rowValue: { ...typography.body, color: colors.inkLight, flexShrink: 1, textAlign: 'right' },
  version: { ...typography.caption, color: colors.inkLight, textAlign: 'center', marginTop: 8 },
});
