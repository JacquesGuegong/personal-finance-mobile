import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius, shadows, typography } from '@/src/constants/theme';

// Shared auth layout: a typographic brand hero (top ~40%) over a white card
// (bottom ~60%) that slides up on mount. Login and Register both use it, so the
// branding is identical — combined with the auth stack's `fade` transition, the
// brand appears to stay put while only the card content changes.
type AuthScaffoldProps = {
  title: string;
  children: ReactNode;
};

export default function AuthScaffold({ title, children }: AuthScaffoldProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const cardStyle = {
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [44, 0] }) }],
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.branding}>
          <Text style={styles.wordmark}>
            Finance<Text style={styles.accent}>.</Text>
          </Text>
          <Text style={styles.subtitle}>Your money, clearly.</Text>
        </View>

        <Animated.View style={[styles.card, cardStyle]}>
          <ScrollView
            contentContainerStyle={styles.cardContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{title}</Text>
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  flex: {
    flex: 1,
  },
  branding: {
    flex: 4,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingBottom: 28,
  },
  wordmark: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -2,
    color: colors.navy,
  },
  accent: {
    color: colors.sage,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkLight,
    marginTop: 8,
  },
  card: {
    flex: 6,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.pill,
    borderTopRightRadius: radius.pill,
    ...shadows.float,
  },
  cardContent: {
    padding: 28,
    paddingTop: 32,
  },
  title: {
    ...typography.displayMD,
    color: colors.navy,
    marginBottom: 24,
  },
});
