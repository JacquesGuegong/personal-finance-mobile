import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, typography } from '@/src/constants/theme';

type InputFieldProps = TextInputProps & {
  label?: string;
};

// White field with a mist border and navy text. Forwards every TextInputProps
// (value, onChangeText, secureTextEntry, keyboardType, ...).
export default function InputField({ label, style, ...rest }: InputFieldProps) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.inkLight}
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
    ...typography.caption,
    fontWeight: '600',
    color: colors.inkLight,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.mist,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.navy,
  },
});
