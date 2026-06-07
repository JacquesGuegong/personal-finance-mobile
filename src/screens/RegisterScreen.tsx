import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

import FormInput from '@/src/components/FormInput';
import PrimaryButton from '@/src/components/PrimaryButton';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/src/hooks/useAuth';
import { hasMinLength, isValidEmail } from '@/src/utils/validators';

const PASSWORD_MIN_LENGTH = 8;

export default function RegisterScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Returns the first validation problem, or null if the form is valid.
  function validate(): string | null {
    if (!isValidEmail(email)) {
      return 'Please enter a valid email address.';
    }
    if (!hasMinLength(password, PASSWORD_MIN_LENGTH)) {
      return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }
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
      // confirmPassword is client-side only — it is not sent to the API.
      await register(email.trim(), password);
      // Success -> root layout swaps to the App tabs automatically.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <Text style={[styles.title, { color: colors.text }]}>Create account</Text>

        <FormInput
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
        <FormInput
          label={`Password (min ${PASSWORD_MIN_LENGTH} characters)`}
          placeholder="Choose a password"
          secureTextEntry
          autoComplete="password-new"
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />
        <FormInput
          label="Confirm password"
          placeholder="Re-enter your password"
          secureTextEntry
          autoComplete="password-new"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!loading}
          onSubmitEditing={handleRegister}
          returnKeyType="go"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton title="Create account" onPress={handleRegister} loading={loading} />

        <Link href="/login" style={styles.link}>
          <Text style={{ color: colors.tint }}>Already have an account? Log in</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  error: {
    color: '#d9534f',
  },
  link: {
    marginTop: 8,
    alignSelf: 'center',
  },
});
