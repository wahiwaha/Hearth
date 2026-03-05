import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

/** 사진 추가 시 blur → 선명 전환 (0.8초) */
export function usePhotoRevealAnimation() {
  const blur = useSharedValue(20);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const reveal = useCallback(() => {
    opacity.value = 0;
    scale.value = 0.9;
    blur.value = 20;

    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 15, stiffness: 120 });
    blur.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [blur, opacity, scale]);

  return { animatedStyle, blur, reveal };
}

/** 스티커 놓을 때 물리 바운스 */
export function useStickerBounceAnimation() {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const bounce = useCallback((finalRotation: number = 0) => {
    scale.value = 0;
    rotation.value = finalRotation - 15;

    scale.value = withSequence(
      withSpring(1.3, { damping: 4, stiffness: 300 }),
      withSpring(0.85, { damping: 8, stiffness: 200 }),
      withSpring(1.05, { damping: 10, stiffness: 250 }),
      withSpring(1, { damping: 15, stiffness: 200 })
    );
    rotation.value = withSpring(finalRotation, { damping: 12, stiffness: 150 });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [scale, rotation]);

  return { animatedStyle, bounce };
}

/** 페이지 넘김 curl 효과 */
export function usePageCurlAnimation() {
  const progress = useSharedValue(0); // 0 = flat, 1 = fully curled
  const translateX = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${progress.value * -180}deg` },
      { translateX: translateX.value },
    ],
    opacity: progress.value < 0.5 ? 1 : 0,
    backfaceVisibility: 'hidden' as const,
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.3,
    transform: [{ translateX: translateX.value - 20 }],
  }));

  const turnPage = useCallback((direction: 'next' | 'prev') => {
    const target = direction === 'next' ? 1 : 0;
    progress.value = withTiming(target, {
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [progress]);

  const resetPage = useCallback(() => {
    progress.value = withSpring(0, { damping: 20, stiffness: 200 });
  }, [progress]);

  return { frontStyle, shadowStyle, progress, turnPage, resetPage };
}

/** 봉투 열기 애니메이션 (공유 앨범 초대 수락) */
export function useEnvelopeAnimation() {
  const flapAngle = useSharedValue(0); // 0 = closed, 180 = open
  const cardTranslateY = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const envelopeOpacity = useSharedValue(1);

  const flapStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: `${flapAngle.value}deg` },
    ],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: cardTranslateY.value },
      { scale: cardScale.value },
    ],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: envelopeOpacity.value,
  }));

  const openEnvelope = useCallback((onComplete?: () => void) => {
    // Phase 1: Open flap
    flapAngle.value = withTiming(180, { duration: 600, easing: Easing.out(Easing.cubic) });

    // Phase 2: Card rises out
    cardTranslateY.value = withDelay(400, withSpring(-100, { damping: 12, stiffness: 100 }));
    cardScale.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 120 }));

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (onComplete) {
      // Phase 3: Fade out after delay
      envelopeOpacity.value = withDelay(1500, withTiming(0, { duration: 400 }, () => {
        runOnJS(onComplete)();
      }));
    }
  }, [flapAngle, cardTranslateY, cardScale, envelopeOpacity]);

  return { flapStyle, cardStyle, containerStyle, openEnvelope };
}

/** Tab 전환 애니메이션 */
export function useTabTransition() {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const switchTab = useCallback((direction: 'left' | 'right') => {
    const offset = direction === 'left' ? -30 : 30;
    translateX.value = offset;
    opacity.value = 0;
    translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 250 });
  }, [translateX, opacity]);

  return { contentStyle, switchTab };
}

/** 이미지 크로스페이드 */
export function useCrossfadeAnimation() {
  const currentOpacity = useSharedValue(1);
  const nextOpacity = useSharedValue(0);

  const currentStyle = useAnimatedStyle(() => ({
    opacity: currentOpacity.value,
  }));

  const nextStyle = useAnimatedStyle(() => ({
    opacity: nextOpacity.value,
  }));

  const crossfade = useCallback((duration: number = 300) => {
    currentOpacity.value = withTiming(0, { duration });
    nextOpacity.value = withTiming(1, { duration });
  }, [currentOpacity, nextOpacity]);

  const reset = useCallback(() => {
    currentOpacity.value = 1;
    nextOpacity.value = 0;
  }, [currentOpacity, nextOpacity]);

  return { currentStyle, nextStyle, crossfade, reset };
}
