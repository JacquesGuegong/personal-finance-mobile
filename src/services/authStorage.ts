import AsyncStorage from '@react-native-async-storage/async-storage';

import type { User } from '@/src/types';

// Persists the auth session (JWT + user) in AsyncStorage so the user stays
// logged in across app restarts. CLAUDE.md rule: "JWT stored in AsyncStorage".
//
// We store the user alongside the token so we can restore a logged-in UI on
// startup without an extra /me round-trip. The token is still the source of
// truth the server checks.

const TOKEN_KEY = 'auth.token';
const USER_KEY = 'auth.user';

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function saveSession(token: string, user: User): Promise<void> {
  // multiSet writes both keys in one call.
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export async function loadSession(): Promise<{ token: string; user: User } | null> {
  const [[, token], [, userJson]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
  if (!token || !userJson) {
    return null;
  }
  try {
    return { token, user: JSON.parse(userJson) as User };
  } catch {
    // Corrupted storage — treat as logged out.
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
