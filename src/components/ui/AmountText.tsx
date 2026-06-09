import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { colors, typography } from '@/src/constants/theme';
import { formatCurrency } from '@/src/utils/format';

type AmountTextProps = {
  value: number;
  /** Prefix a + / − sign (useful for income vs expense rows). */
  showSign?: boolean;
  /** Override the sign-based color (e.g. navy for a neutral net-worth figure). */
  color?: string;
  style?: StyleProp<TextStyle>;
};

// Large tabular-figure currency. Color follows the sign: sage for positive,
// coral for negative — unless `color` is given.
export default function AmountText({ value, showSign, color, style }: AmountTextProps) {
  const positive = value >= 0;
  const resolvedColor = color ?? (positive ? colors.sage : colors.coral);
  const sign = showSign ? (positive ? '+' : '−') : '';
  const text = `${sign}${formatCurrency(Math.abs(value))}`;

  return <Text style={[styles.amount, { color: resolvedColor }, style]}>{text}</Text>;
}

const styles = StyleSheet.create({
  amount: {
    ...typography.displayLG,
    ...typography.number, // tabular-nums so digits line up
  },
});
