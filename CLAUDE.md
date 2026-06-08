# CLAUDE.md

## Project
Personal Finance Tracker — React Native Mobile App
React Native + Expo + TypeScript

## Connects To
Spring Boot API: http://localhost:8080 (dev)
Production API: https://your-aws-url.com (prod)

## Architecture
Routing is **Expo Router** (file-based). Expo Router is built on React
Navigation, so Stack/Tabs concepts still apply — they're configured via files
and `_layout.tsx` instead of imperative navigators.

- app/ — routing layer ONLY. Route files are thin re-exports of src/screens.
  - app/_layout.tsx — AuthProvider + auth gate (Stack.Protected)
  - app/index.tsx — '/' entry, redirects to /dashboard or /login
  - app/(auth)/ — logged-out stack: login, register
  - app/(app)/ — logged-in Bottom Tabs: dashboard, transactions, budgets, alerts, profile
- src/screens/ — one file per screen (actual UI)
- src/components/ — reusable UI components
- src/services/ — API calls (axios) — the ONLY place that talks to the network
- src/hooks/ — custom React hooks (e.g. useAuth)
- src/context/ — global state (AuthContext)
- src/navigation/ — shared route path constants (structural nav config lives in app/_layout files)
- src/utils/ — helpers
- src/types/ — shared TypeScript interfaces

Path alias: `@/*` maps to the project root, so import as `@/src/...`.

## Rules
- TypeScript everywhere — no any types
- JWT stored in AsyncStorage
- All API calls go through services/ layer
- Never call axios directly from screens
- Handle loading and error states on every screen
- New screens: add the UI in src/screens, then a thin re-export route file in app/
- Auth is state-driven — change auth state via useAuth(), don't manually
  navigate between the auth and app stacks

## Current Status
- Navigation, auth gate, and tab placeholder screens are in place.
- Auth is wired to the real API (axios + AsyncStorage installed):
  - src/services/api.ts — shared axios client.
    - baseURL: EXPO_PUBLIC_API_URL (.env) > dev LAN auto-detect (Expo hostUri) > prod default.
    - request interceptor attaches the JWT.
    - response interceptor: 401 on a protected request -> clears session via a
      handler registered by AuthContext (setUnauthorizedHandler) -> nav falls back to login.
  - src/services/authService.ts — POST /api/auth/login and /api/auth/register,
    with HTTP errors translated to user-friendly messages.
  - src/services/authStorage.ts — persists/restores { token, user } in AsyncStorage.
  - AuthContext: token, user, isAuthenticated, isLoading; login(email,password),
    register(email,password), logout; restores the saved session on startup.
  - Nav gate uses isAuthenticated; LoadingScreen shows while isLoading.
  - VERIFIED backend contract (probed against running server):
    success body is FLAT { token, userId, email } (normalized to { token, user });
    login bad password -> 403; register duplicate -> 409.
- Login/Register screens are real (validation, loading-disabled button, error
  states, keyboard handling) and use shared FormInput + PrimaryButton components.
- Tab screens (Dashboard, Transactions, Budgets, Alerts) are still placeholders.

## API Base URL
Dev: auto-detected LAN host (so physical devices reach the local server)
Override / Prod: EXPO_PUBLIC_API_URL in .env (see .env.example)
