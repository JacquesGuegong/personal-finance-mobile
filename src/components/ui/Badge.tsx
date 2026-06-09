import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/src/constants/theme';

export type BadgeVariant = 'sage' | 'coral' | 'mist';

const VARIANT: Record<BadgeVariant, { bg: string; fg: string }> = {
  sage: { bg: colors.sage, fg: colors.white },
  coral: { bg: colors.coral, fg: colors.white },
  mist: { bg: colors.mist, fg: colors.navy },
};

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

// Small pill label. Colored variants (sage/coral) use white text; the neutral
// mist variant uses navy.
export default function Badge({ label, variant = 'mist' }: BadgeProps) {
  const { bg, fg } = VARIANT[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
