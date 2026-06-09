import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AuthScaffold from '@/src/components/AuthScaffold';
import { InputField, PasswordField, PrimaryButton } from '@/src/components/ui';
import { colors, typography } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { hasMinLength, isValidEmail } from '@/src/utils/validators';

const PASSWORD_MIN_LENGTH = 8;

export default function RegisterScreen() {
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!isValidEmail(email)) return 'Please enter a valid email address.';
    if (!hasMinLength(password, PASSWORD_MIN_LENGTH)) {
      return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  }

  async function handleRegister() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScaffold title="Create account">
      <InputField
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />
      <View style={styles.gap16} />
      <PasswordField
        placeholder={`Password (min ${PASSWORD_MIN_LENGTH} characters)`}
        autoComplete="password-new"
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />
      <View style={styles.gap16} />
      <PasswordField
        placeholder="Confirm password"
        autoComplete="password-new"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        editable={!loading}
        returnKeyType="go"
        onSubmitEditing={handleRegister}
      />

      <View style={styles.gap24} />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton title="Get started" onPress={handleRegister} loading={loading} />

      <Pressable style={styles.loginLinkWrap} onPress={() => router.push('/login')} hitSlop={8}>
        <Text style={styles.loginLink}>
          Already have an account? <Text style={styles.loginLinkBold}>Sign in</Text>
        </Text>
      </Pressable>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  gap16: {
    height: 16,
  },
  gap24: {
    height: 24,
  },
  error: {
    ...typography.caption,
    color: colors.coral,
    marginBottom: 12,
  },
  loginLinkWrap: {
    alignSelf: 'center',
    marginTop: 20,
  },
  loginLink: {
    ...typography.body,
    color: colors.inkLight,
  },
  loginLinkBold: {
    color: colors.navy,
    fontWeight: '600',
  },
});
