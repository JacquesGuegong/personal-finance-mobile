import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

// Generic segmented control — a row of mutually-exclusive options. Used for the
// type filter (ALL/INCOME/EXPENSE) and the form's type toggle (INCOME/EXPENSE).
type SegmentedControlProps<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: SegmentedControlProps<T>) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View style={[styles.row, { borderColor: colors.tint }]}>
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            disabled={disabled}
            onPress={() => onChange(opt)}
            style={[styles.item, selected && { backgroundColor: colors.tint }]}>
            <Text
              numberOfLines={1}
              style={[styles.text, { color: selected ? '#fff' : colors.tint }]}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  item: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
});
