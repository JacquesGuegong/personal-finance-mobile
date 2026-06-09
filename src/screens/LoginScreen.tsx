import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import AuthScaffold from '@/src/components/AuthScaffold';
import {
  InputField,
  PasswordField,
  PrimaryButton,
  SecondaryButton,
} from '@/src/components/ui';
import { colors, typography } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { isNonEmpty, isValidEmail } from '@/src/utils/validators';

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!isValidEmail(email) || !isNonEmpty(password)) {
      setError('Enter a valid email and your password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      // Success flips auth state → the root layout swaps to the app tabs.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleForgot() {
    Alert.alert('Forgot password', 'Password reset is coming soon.');
  }

  return (
    <AuthScaffold title="Welcome back">
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
        placeholder="Password"
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
        editable={!loading}
        returnKeyType="go"
        onSubmitEditing={handleLogin}
      />

      <Pressable style={styles.forgotWrap} onPress={handleForgot} hitSlop={8}>
        <Text style={styles.forgot}>Forgot password?</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton title="Sign in" onPress={handleLogin} loading={loading} />

      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.orLine} />
      </View>

      <SecondaryButton title="Create account" onPress={() => router.push('/register')} />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  gap16: {
    height: 16,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
  },
  forgot: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.slate,
  },
  error: {
    ...typography.caption,
    color: colors.coral,
    marginBottom: 12,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.mist,
  },
  orText: {
    ...typography.caption,
    color: colors.inkLight,
    marginHorizontal: 12,
  },
});
