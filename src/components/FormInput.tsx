import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

// A labelled, theme-aware text field. Both auth screens use it, so styling and
// behavior stay consistent and the screens read as a simple list of fields.
//
// It accepts every standard TextInputProps (value, onChangeText, secureTextEntry,
// keyboardType, ...) via `...rest`, so callers configure it like a normal
// TextInput but get the label + styling for free.
type FormInputProps = TextInputProps & {
  label: string;
};

export default function FormInput({ label, style, ...rest }: FormInputProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { color: colors.text, borderColor: colors.tabIconDefault },
          style,
        ]}
        placeholderTextColor={colors.tabIconDefault}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
});
