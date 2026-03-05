import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CAPSULE_WIDTH = 120;
const CAPSULE_HEIGHT = 6;
const DOT_SIZE = 4;
const DOT_GAP = 14;
const ACTIVE_DOT_WIDTH = 16;
const TOTAL_PAGES = 3;
const FADE_DELAY_MS = 800;

interface Props {
  scrollX: SharedValue<number>;
  isScrolling: SharedValue<boolean>;
}

export function CapsulePageIndicator({ scrollX, isScrolling }: Props) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);

  // Track scrolling state changes to drive opacity
  useDerivedValue(() => {
    if (isScrolling.value) {
      opacity.value = withTiming(1, { duration: 150 });
    } else {
      opacity.value = withDelay(FADE_DELAY_MS, withTiming(0, { duration: 400 }));
    }
  });

  // Capsule container fade
  const capsuleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      {
        translateY: interpolate(
          opacity.value,
          [0, 1],
          [-8, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  // Current page progress (0..2)
  const pageProgress = useDerivedValue(() =>
    scrollX.value / SCREEN_WIDTH,
  );

  // Dot styles for each page
  const dot0Style = useAnimatedStyle(() => {
    const active = interpolate(
      pageProgress.value,
      [-0.5, 0, 0.5],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return {
      width: interpolate(active, [0, 1], [DOT_SIZE, ACTIVE_DOT_WIDTH]),
      opacity: interpolate(active, [0, 1], [0.35, 1]),
      borderRadius: DOT_SIZE / 2,
    };
  });

  const dot1Style = useAnimatedStyle(() => {
    const active = interpolate(
      pageProgress.value,
      [0.5, 1, 1.5],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return {
      width: interpolate(active, [0, 1], [DOT_SIZE, ACTIVE_DOT_WIDTH]),
      opacity: interpolate(active, [0, 1], [0.35, 1]),
      borderRadius: DOT_SIZE / 2,
    };
  });

  const dot2Style = useAnimatedStyle(() => {
    const active = interpolate(
      pageProgress.value,
      [1.5, 2, 2.5],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return {
      width: interpolate(active, [0, 1], [DOT_SIZE, ACTIVE_DOT_WIDTH]),
      opacity: interpolate(active, [0, 1], [0.35, 1]),
      borderRadius: DOT_SIZE / 2,
    };
  });

  return (
    <Animated.View
      style={[
        styles.capsule,
        { top: insets.top + 8 },
        capsuleStyle,
      ]}
      pointerEvents="none"
    >
      <Animated.View style={[styles.dot, dot0Style]} />
      <Animated.View style={[styles.dot, dot1Style]} />
      <Animated.View style={[styles.dot, dot2Style]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  capsule: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DOT_GAP,
    backgroundColor: 'rgba(44, 31, 16, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 100,
  },
  dot: {
    height: DOT_SIZE,
    backgroundColor: '#FDFAF5',
  },
});
