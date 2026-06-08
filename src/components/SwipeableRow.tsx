import { Ionicons } from '@expo/vector-icons';
import { useRef, type ReactNode } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

// Swipe-to-delete built on React Native core (PanResponder + Animated) — no
// gesture-handler / worklets, so it runs everywhere including Expo Go.
//
// Drag the row left to reveal a Delete action; release past the halfway point to
// keep it open, otherwise it snaps back. The horizontal-only gesture check lets
// the list keep scrolling vertically.
const ACTION_WIDTH = 88;

type SwipeableRowProps = {
  children: ReactNode;
  onDelete: () => void;
};

export default function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const open = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      // Only claim the gesture for clearly-horizontal drags, so vertical
      // scrolling of the SectionList still works.
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_e, g) => {
        const base = open.current ? -ACTION_WIDTH : 0;
        const next = Math.min(0, Math.max(-ACTION_WIDTH, base + g.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_e, g) => {
        const base = open.current ? -ACTION_WIDTH : 0;
        const current = Math.min(0, Math.max(-ACTION_WIDTH, base + g.dx));
        const shouldOpen = current < -ACTION_WIDTH / 2;
        open.current = shouldOpen;
        Animated.spring(translateX, {
          toValue: shouldOpen ? -ACTION_WIDTH : 0,
          useNativeDriver: false,
          bounciness: 0,
        }).start();
      },
    }),
  ).current;

  function handleDelete() {
    open.current = false;
    Animated.timing(translateX, { toValue: 0, duration: 150, useNativeDriver: false }).start();
    onDelete();
  }

  return (
    <View style={styles.container}>
      <View style={styles.actionWrap}>
        <Pressable onPress={handleDelete} style={styles.deleteAction}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={styles.deleteLabel}>Delete</Text>
        </Pressable>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
  },
  deleteAction: {
    flex: 1,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  deleteLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
