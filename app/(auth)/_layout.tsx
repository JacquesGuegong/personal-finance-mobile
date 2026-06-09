import { Stack } from 'expo-router';

// AuthStack — shown only when logged out (gated in app/_layout.tsx).
// `animation: 'fade'` cross-fades login <-> register; since both share the same
// AuthScaffold branding, the brand appears to stay put while the card changes.
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
