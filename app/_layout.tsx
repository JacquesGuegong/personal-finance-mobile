import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import LoadingScreen from '@/src/components/LoadingScreen';
import { AuthProvider } from '@/src/context/AuthContext';
import { useAuth } from '@/src/hooks/useAuth';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // The entry route ('/') decides where to send the user (see app/index.tsx).
  initialRouteName: 'index',
};

// Keep the native splash screen up until fonts are loaded.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // AuthProvider must wrap everything that uses useAuth() — including the
  // navigator below, which reads auth state to decide which stack to show.
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // While we're restoring a saved session, show a loading screen instead of
  // briefly flashing the login screen before auto-login resolves.
  if (isLoading) {
    return <LoadingScreen />;
  }

  // This is the auth gate. `Stack.Protected` only registers its child routes
  // when `guard` is true, so exactly one of these groups is ever reachable:
  //   - authenticated -> the (app) bottom-tab stack
  //   - not auth'd     -> the (auth) login/register stack
  // When isAuthenticated flips (login, logout, or a 401), Expo Router swaps
  // stacks for us — no manual navigation.replace() calls needed.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
