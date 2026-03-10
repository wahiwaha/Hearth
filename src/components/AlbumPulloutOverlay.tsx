import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Album } from '../types/album';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AlbumPulloutOverlayProps {
  album: Album;
  onClose: () => void;
}

export function AlbumPulloutOverlay({ album, onClose }: AlbumPulloutOverlayProps) {
  const colors = useColors();
  const styles = useThemedStyles((c) => ({
    root: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#0A0604',
    },
    albumContainer: {
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 4, height: 16 },
      shadowOpacity: 0.60,
      shadowRadius: 30,
      elevation: 20,
    },
    albumCover: {
      width: COVER_WIDTH,
      height: COVER_HEIGHT,
      borderRadius: 8,
      overflow: 'hidden',
    },
    spine: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 24,
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
      overflow: 'hidden',
      zIndex: 2,
    },
    spineRidge: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: 1.5,
      backgroundColor: 'rgba(0,0,0,0.15)',
    },
    spineBand: {
      position: 'absolute',
      left: 4,
      right: 4,
      height: 2,
      backgroundColor: 'rgba(0,0,0,0.08)',
      borderRadius: 1,
    },
    spineEdgeShadow: {
      position: 'absolute',
      left: 24,
      top: 0,
      bottom: 0,
      width: 12,
      zIndex: 3,
    },
    topLightCatch: {
      position: 'absolute',
      top: 0,
      left: 24,
      right: 0,
      height: 60,
      zIndex: 4,
    },
    bottomVignette: {
      position: 'absolute',
      bottom: 0,
      left: 24,
      right: 0,
      height: 100,
      zIndex: 4,
    },
    coverContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingLeft: 40,
      paddingRight: 20,
      paddingVertical: spacing.lg,
      zIndex: 5,
    },
    albumTitle: {
      ...typography.subtitle,
      textAlign: 'center',
      marginVertical: spacing.md,
      textShadowColor: 'rgba(0,0,0,0.20)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    decorLine: {
      width: '50%',
      height: 1.5,
      borderRadius: 1,
      opacity: 0.40,
    },
    sharedText: {
      ...typography.caption,
      marginTop: spacing.lg,
      opacity: 0.85,
    },
    pageCount: {
      ...typography.caption,
      marginTop: spacing.sm,
      opacity: 0.65,
    },
    innerBorder: {
      position: 'absolute',
      top: 4,
      left: 28,
      right: 5,
      bottom: 5,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 240, 210, 0.08)',
      borderRadius: 3,
      zIndex: 6,
    },
    hintText: {
      color: c.textOnDark,
      ...typography.caption,
      marginTop: spacing.lg,
      opacity: 0.35,
      textAlign: 'center',
    },
  }));

  const progress = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    overlayOpacity.value = withTiming(1, { duration: 300 });
    progress.value = withSpring(1, {
      damping: 20,
      stiffness: 180,
      mass: 0.8,
    });
  }, []);

  const handleClose = () => {
    progress.value = withSpring(0, { damping: 18, stiffness: 220 });
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
    const scale = interpolate(progress.value, [0, 1], [0.5, 1]);
    const translateY = interpolate(progress.value, [0, 1], [60, 0]);
    const rotate = interpolate(progress.value, [0, 1], [3, 0]);

    return {
      transform: [
        { perspective: 1200 },
        { scale },
        { translateY },
        { rotateZ: `${rotate}deg` },
      ],
      opacity: progress.value,
    };
  });

  const lightenColor = (color: string, amount: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
    const b = Math.min(255, (num & 0x0000FF) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const darkenColor = (color: string, amount: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
    const b = Math.max(0, (num & 0xFF) - amount);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View style={[styles.albumContainer, albumStyle]}>
        <Pressable onPress={handleClose}>
          <View
            style={[
              styles.albumCover,
              { backgroundColor: album.coverColor },
            ]}
          >
            {/* Cover gradient for material feel */}
            <LinearGradient
              colors={[
                lightenColor(album.coverColor, 15),
                album.coverColor,
                darkenColor(album.coverColor, 20),
              ]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />

            {/* Spine with depth */}
            <View style={[styles.spine]}>
              <LinearGradient
                colors={[
                  lightenColor(album.spineColor, 10),
                  album.spineColor,
                  darkenColor(album.spineColor, 20),
                ]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.8 }}
              />
              {/* Spine ridge */}
              <View style={styles.spineRidge} />
              {/* Spine bands */}
              <View style={[styles.spineBand, { top: 30 }]} />
              <View style={[styles.spineBand, { bottom: 30 }]} />
            </View>

            {/* Spine edge shadow */}
            <LinearGradient
              colors={['rgba(0,0,0,0.20)', 'rgba(0,0,0,0)']}
              style={styles.spineEdgeShadow}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />

            {/* Top light catch */}
            <LinearGradient
              colors={['rgba(255,240,210,0.18)', 'rgba(255,240,210,0)']}
              style={styles.topLightCatch}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />

            {/* Bottom vignette */}
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.15)']}
              style={styles.bottomVignette}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />

            <View style={styles.coverContent}>
              <View
                style={[
                  styles.decorLine,
                  { backgroundColor: lightenColor(album.coverColor, 60) },
                ]}
              />

              <Text
                style={[
                  styles.albumTitle,
                  { color: lightenColor(album.coverColor, 100) },
                ]}
              >
                {album.title}
              </Text>

              <View
                style={[
                  styles.decorLine,
                  { backgroundColor: lightenColor(album.coverColor, 60) },
                ]}
              />

              {album.isShared && album.memberCount != null && album.memberCount > 0 && (
                <Text
                  style={[
                    styles.sharedText,
                    { color: lightenColor(album.coverColor, 80) },
                  ]}
                >
                  {album.memberCount}명과 함께 만든 앨범
                </Text>
              )}

              <Text
                style={[
                  styles.pageCount,
                  { color: lightenColor(album.coverColor, 65) },
                ]}
              >
                {album.pageCount}p
              </Text>
            </View>

            {/* Inner border — embossed cover edge */}
            <View style={styles.innerBorder} />
          </View>

          <Text style={styles.hintText}>탭하여 열기</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const COVER_WIDTH = SCREEN_WIDTH * 0.7;
const COVER_HEIGHT = COVER_WIDTH * 1.35;
