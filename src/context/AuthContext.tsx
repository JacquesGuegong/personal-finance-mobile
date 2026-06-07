import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authService } from '@/src/services/authService';
import { clearSession, loadSession, saveSession } from '@/src/services/authStorage';
import type { User } from '@/src/types';

// The shape of everything the rest of the app can read/do regarding auth.
export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean; // true while we restore a saved session on startup
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Created with `undefined` so that consuming it outside the provider throws a
// clear error (handled in hooks/useAuth.ts) instead of silently returning null.
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore a saved session once, on app startup, so a returning user skips the
  // login screen.
  useEffect(() => {
    (async () => {
      try {
        const session = await loadSession();
        if (session) {
          setToken(session.token);
          setUser(session.user);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const res = await authService.login({ email, password });
    await saveSession(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
  }

  async function register(email: string, password: string): Promise<void> {
    const res = await authService.register({ email, password });
    await saveSession(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
  }

  async function logout(): Promise<void> {
    await clearSession();
    setToken(null);
    setUser(null);
  }

  // useMemo keeps the context value stable between renders so consumers don't
  // re-render unless something actually changed.
  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, login, register, logout }),
    [user, token, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
