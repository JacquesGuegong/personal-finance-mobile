import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

// Shown while the app restores a saved session on startup, so the user sees a
// spinner instead of a flash of the login screen before auto-login resolves.
export default function LoadingScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
