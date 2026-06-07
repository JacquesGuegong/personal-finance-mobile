// Shared TypeScript interfaces for the whole app.
// CLAUDE.md rule: "TypeScript everywhere — no any types".
// Every API request/response shape lives here so screens, services and the
// auth context all agree on the same contract.

export interface User {
  id: string;
  email: string;
  name?: string; // optional: the auth endpoints may not return a display name
}

/**
 * App-internal auth result (normalized in authService).
 * NOTE: the API itself returns a FLAT body { token, userId, email } — see
 * authService.ts, which maps it into this shape.
 */
export interface AuthResponse {
  token: string; // JWT — stored in AsyncStorage (see CLAUDE.md)
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}
