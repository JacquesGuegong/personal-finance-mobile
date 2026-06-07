import axios from 'axios';

import { api } from '@/src/services/api';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/src/types';

// Auth API calls. This is the boundary between our app and the Spring Boot
// backend. Screens never see axios or HTTP status codes — they get either a
// clean AuthResponse or an Error with a user-friendly message.

// Verified backend contract (probed against the running server):
//   POST /api/auth/login    200  { token, userId, email }
//   POST /api/auth/register 201  { token, userId, email }
//   login bad password      403  { status, message, timestamp }
//   register duplicate      409  { status, message, timestamp }
// The success body is FLAT (token + userId + email), so we normalize it into the
// app's AuthResponse ({ token, user }) here, in one place.
interface RawAuthResponse {
  token: string;
  userId: string;
  email: string;
}

function normalize(data: RawAuthResponse): AuthResponse {
  return {
    token: data.token,
    user: { id: data.userId, email: data.email },
  };
}

export const authService = {
  async login(req: LoginRequest): Promise<AuthResponse> {
    try {
      const { data } = await api.post<RawAuthResponse>('/api/auth/login', req);
      return normalize(data);
    } catch (error) {
      // This backend returns 403 (not 401) for bad credentials.
      throw translateAuthError(error, {
        byStatus: { 403: 'Invalid email or password.' },
        fallback: 'Login failed. Please try again.',
      });
    }
  },

  async register(req: RegisterRequest): Promise<AuthResponse> {
    try {
      const { data } = await api.post<RawAuthResponse>('/api/auth/register', req);
      return normalize(data);
    } catch (error) {
      throw translateAuthError(error, {
        byStatus: { 409: 'An account with this email already exists.' },
        fallback: 'Registration failed. Please try again.',
      });
    }
  },
};

// Turns an axios error into a plain Error carrying a message safe to show users.
function translateAuthError(
  error: unknown,
  options: { byStatus: Record<number, string>; fallback: string },
): Error {
  if (axios.isAxiosError(error)) {
    // No response = the request never reached the server (offline, server down,
    // or wrong base URL — e.g. localhost from a physical device).
    if (!error.response) {
      return new Error('Cannot reach the server. Check your connection.');
    }
    const mapped = options.byStatus[error.response.status];
    if (mapped) {
      return new Error(mapped);
    }
    // Otherwise prefer the message the API sent, if any.
    const serverMessage =
      typeof error.response.data === 'object' &&
      error.response.data !== null &&
      'message' in error.response.data
        ? String((error.response.data as { message: unknown }).message)
        : null;
    return new Error(serverMessage ?? options.fallback);
  }
  return new Error(options.fallback);
}
