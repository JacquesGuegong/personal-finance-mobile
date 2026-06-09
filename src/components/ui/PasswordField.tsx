import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, typography } from '@/src/constants/theme';

// Password field with a show/hide eye toggle. Matches InputField's look.
type PasswordFieldProps = Omit<TextInputProps, 'secureTextEntry'> & {
  label?: string;
};

export default function PasswordField({ label, style, ...rest }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.inkLight}
          secureTextEntry={!visible}
          {...rest}
        />
        <Pressable onPress={() => setVisible((v) => !v)} hitSlop={8} style={styles.toggle}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inkLight} />
        </Pressable>
      </View>
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.mist,
    borderRadius: radius.lg,
    paddingRight: 12,
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.navy,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggle: {
    padding: 4,
  },
});
