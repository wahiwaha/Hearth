import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DOT_SIZE = 4;
const DOT_GAP = 12;
const ACTIVE_DOT_WIDTH = 16;
const VISIBLE_DURATION_MS = 1200; // how long it stays visible after scroll stops

interface Props {
  scrollX: SharedValue<number>;
  isScrolling: SharedValue<boolean>;
}

export function CapsulePageIndicator({ scrollX, isScrolling }: Props) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);

  // Hidden by default. Appears during scroll, stays briefly, then fades out.
  useDerivedValue(() => {
    if (isScrolling.value) {
      opacity.value = withTiming(1, { duration: 120 });
    } else {
      opacity.value = withDelay(
        VISIBLE_DURATION_MS,
        withTiming(0, { duration: 300 }),
      );
    }
  });

  const capsuleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      {
        translateY: interpolate(
          opacity.value,
          [0, 1],
          [-6, 0],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          opacity.value,
          [0, 1],
          [0.92, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const pageProgress = useDerivedValue(() => scrollX.value / SCREEN_WIDTH);

  const makeDotStyle = (page: number) =>
    useAnimatedStyle(() => {
      const active = interpolate(
        pageProgress.value,
        [page - 0.5, page, page + 0.5],
        [0, 1, 0],
        Extrapolation.CLAMP,
      );
      return {
        width: interpolate(active, [0, 1], [DOT_SIZE, ACTIVE_DOT_WIDTH]),
        opacity: interpolate(active, [0, 1], [0.25, 1]),
        borderRadius: DOT_SIZE / 2,
      };
    });

  const dot0Style = makeDotStyle(0);
  const dot1Style = makeDotStyle(1);
  const dot2Style = makeDotStyle(2);

  return (
    <Animated.View
      style={[styles.wrapper, { top: insets.top + 8 }, capsuleStyle]}
      pointerEvents="none"
    >
      <BlurView intensity={25} tint="light" style={styles.blur}>
        <Animated.View style={[styles.dot, dot0Style]} />
        <Animated.View style={[styles.dot, dot1Style]} />
        <Animated.View style={[styles.dot, dot2Style]} />
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(180, 160, 130, 0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  blur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DOT_GAP,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dot: {
    height: DOT_SIZE,
    backgroundColor: '#C49242',
  },
});
