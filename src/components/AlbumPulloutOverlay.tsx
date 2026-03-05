import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Album } from '../types/album';
import { colors, typography, spacing } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AlbumPulloutOverlayProps {
  album: Album;
  onClose: () => void;
}

export function AlbumPulloutOverlay({ album, onClose }: AlbumPulloutOverlayProps) {
  const progress = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    overlayOpacity.value = withTiming(1, { duration: 300 });
    progress.value = withSpring(1, {
      damping: 18,
      stiffness: 120,
      mass: 0.8,
    });
  }, []);

  const handleClose = () => {
    progress.value = withSpring(0, { damping: 20, stiffness: 200 });
    overlayOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value * 0.6,
  }));

  const albumStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.3, 1]);
    const translateY = interpolate(progress.value, [0, 1], [100, 0]);
    const rotate = interpolate(progress.value, [0, 0.5, 1], [5, -2, 0]);

    return {
      transform: [
        { scale },
        { translateY },
        { rotateZ: `${rotate}deg` },
      ],
      opacity: progress.value,
    };
  });

  const darkenColor = (color: string, amount: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const lightenColor = (color: string, amount: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
    const b = Math.min(255, (num & 0x0000FF) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <View style={styles.root}>
      {/* Dimmed background */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Album cover expanded */}
      <Animated.View style={[styles.albumContainer, albumStyle]}>
        <Pressable onPress={handleClose}>
          {/* Album cover — large */}
          <View
            style={[
              styles.albumCover,
              { backgroundColor: album.coverColor },
            ]}
          >
            {/* Spine */}
            <View
              style={[
                styles.spine,
                { backgroundColor: album.spineColor },
              ]}
            />

            {/* Cover content */}
            <View style={styles.coverContent}>
              <View
                style={[
                  styles.decorLine,
                  { backgroundColor: lightenColor(album.coverColor, 50) },
                ]}
              />

              <Text
                style={[
                  styles.albumTitle,
                  { color: lightenColor(album.coverColor, 90) },
                ]}
              >
                {album.title}
              </Text>

              <View
                style={[
                  styles.decorLine,
                  { backgroundColor: lightenColor(album.coverColor, 50) },
                ]}
              />

              {album.isShared && album.memberCount && (
                <Text
                  style={[
                    styles.sharedText,
                    { color: lightenColor(album.coverColor, 70) },
                  ]}
                >
                  {album.memberCount}명과 함께 만든 앨범
                </Text>
              )}

              <Text
                style={[
                  styles.pageCount,
                  { color: lightenColor(album.coverColor, 60) },
                ]}
              >
                {album.pageCount}p
              </Text>
            </View>

            {/* Cover highlight */}
            <View style={styles.highlight} />
          </View>

          {/* Tap to open hint */}
          <Text style={styles.hintText}>탭하여 닫기</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const COVER_WIDTH = SCREEN_WIDTH * 0.7;
const COVER_HEIGHT = COVER_WIDTH * 1.35;

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1C1208',
  },
  albumContainer: {
    alignItems: 'center',
  },
  albumCover: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  spine: {
    width: 20,
    height: COVER_HEIGHT,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  coverContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  albumTitle: {
    ...typography.subtitle,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  decorLine: {
    width: '50%',
    height: 1.5,
    borderRadius: 1,
    opacity: 0.6,
  },
  sharedText: {
    ...typography.caption,
    marginTop: spacing.lg,
    opacity: 0.8,
  },
  pageCount: {
    ...typography.caption,
    marginTop: spacing.sm,
    opacity: 0.6,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderTopRightRadius: 8,
  },
  hintText: {
    color: colors.textOnDark,
    ...typography.caption,
    marginTop: spacing.lg,
    opacity: 0.5,
  },
});
