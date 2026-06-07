import axios from 'axios';
import Constants from 'expo-constants';

import { getToken } from '@/src/services/authStorage';

// Central API configuration.
//
// CLAUDE.md rules enforced here:
//   - "All API calls go through services/ layer"
//   - "Never call axios directly from screens"
// This shared client is the ONLY thing that talks to the network. Screens call
// hooks/context, which call services, which use this client.

const API_PORT = 8080;

// In dev, "localhost" is relative to wherever the app runs (the phone, the
// Android emulator VM, ...), NOT your Mac — so a physical device or emulator
// can't reach the Spring Boot server that way. Metro already serves the JS
// bundle from your Mac's reachable address, exposed as `hostUri`
// (e.g. "192.168.1.50:8081"); we reuse that host and just swap the port.
function resolveDevBaseUrl(): string {
  const hostUri = Constants.expoConfig?.hostUri; // "<host>:<metroPort>"
  const host = hostUri?.split(':')[0];
  return host ? `http://${host}:${API_PORT}` : `http://localhost:${API_PORT}`;
}

// __DEV__ is a React Native global: true in development, false in a release build.
export const API_BASE_URL = __DEV__
  ? resolveDevBaseUrl() // Spring Boot dev server, reachable from the device
  : 'https://your-aws-url.com'; // production (move to .env before shipping)

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000, // fail fast instead of hanging forever if the server is down
});

// Attach the JWT to every outgoing request automatically, so individual
// services never have to think about auth headers.
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
