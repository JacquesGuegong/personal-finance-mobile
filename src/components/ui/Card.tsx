import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, shadows } from '@/src/constants/theme';

// White surface with the soft card shadow, 16px radius, 20px padding.
export default function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 20,
    ...shadows.card,
  },
});
