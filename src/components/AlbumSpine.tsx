import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Album } from '../types/album';

interface AlbumSpineProps {
  album: Album;
  index: number;
  onPress: (album: Album) => void;
  width: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AlbumSpine({ album, index, onPress, width }: AlbumSpineProps) {
  const pressed = useSharedValue(0);

  const SPINE_WIDTH = width;
  const ALBUM_HEIGHT = 200;

  const darkenColor = (color: string, amount: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
    const b = Math.max(0, (num & 0xFF) - amount);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const lightenColor = (color: string, amount: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
    const b = Math.min(255, (num & 0xFF) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressed.value, [0, 1], [0, -14]);
    const scale = interpolate(pressed.value, [0, 1], [1, 1.05]);
    const rotateZ = interpolate(pressed.value, [0, 1], [0, -1.5]);

    return {
      transform: [
        { perspective: 800 },
        { translateY },
        { scale },
        { rotateZ: `${rotateZ}deg` },
      ],
    };
  });

  return (
    <AnimatedPressable
      style={[styles.container, { width: SPINE_WIDTH }, animatedStyle]}
      onPressIn={() => { pressed.value = withSpring(1, { damping: 18, stiffness: 400 }); }}
      onPressOut={() => { pressed.value = withSpring(0, { damping: 15, stiffness: 350 }); }}
      onPress={() => onPress(album)}
    >
      {/* Top edge — book thickness with visible pages */}
      <View
        style={[
          styles.topEdge,
          {
            width: SPINE_WIDTH - 2,
            backgroundColor: lightenColor(album.coverColor, 15),
          },
        ]}
      >
        {/* Page edges — stacked paper from top view */}
        <View style={styles.pageEdges}>
          <View style={[styles.pageEdgeLine, { backgroundColor: lightenColor(album.coverColor, 55), opacity: 0.95 }]} />
          <View style={[styles.pageEdgeLine, { backgroundColor: lightenColor(album.coverColor, 48), opacity: 0.8 }]} />
          <View style={[styles.pageEdgeLine, { backgroundColor: lightenColor(album.coverColor, 42), opacity: 0.6 }]} />
          <View style={[styles.pageEdgeLine, { backgroundColor: lightenColor(album.coverColor, 36), opacity: 0.4 }]} />
          <View style={[styles.pageEdgeLine, { backgroundColor: lightenColor(album.coverColor, 30), opacity: 0.3 }]} />
        </View>
        <LinearGradient
          colors={['rgba(0,0,0,0.18)', 'rgba(0,0,0,0)']}
          style={styles.topEdgeShadow}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
        />
      </View>

      {/* Main cover face */}
      <View style={[styles.coverFace, { width: SPINE_WIDTH, height: ALBUM_HEIGHT }]}>
        {/* Cover base — rich leather/cloth material */}
        <LinearGradient
          colors={[
            lightenColor(album.coverColor, 22),
            lightenColor(album.coverColor, 8),
            album.coverColor,
            darkenColor(album.coverColor, 15),
            darkenColor(album.coverColor, 28),
          ]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.6, y: 1 }}
        />

        {/* Leather/fabric weave texture — fine horizontal & vertical lines */}
        <View style={styles.textureOverlay}>
          {/* Horizontal weave lines */}
          {[0.08, 0.14, 0.20, 0.26, 0.32, 0.38, 0.44, 0.50, 0.56, 0.62, 0.68, 0.74, 0.80, 0.86, 0.92].map((pos, i) => (
            <View
              key={`h${i}`}
              style={{
                position: 'absolute',
                top: ALBUM_HEIGHT * pos,
                left: 12,
                right: 2,
                height: StyleSheet.hairlineWidth,
                backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.05)' : 'rgba(255,240,210,0.03)',
              }}
            />
          ))}
          {/* Vertical subtle grain */}
          {[0.25, 0.50, 0.75].map((pos, i) => (
            <View
              key={`v${i}`}
              style={{
                position: 'absolute',
                left: SPINE_WIDTH * pos,
                top: 0,
                bottom: 0,
                width: StyleSheet.hairlineWidth,
                backgroundColor: 'rgba(0,0,0,0.02)',
              }}
            />
          ))}
        </View>

        {/* Spine strip with embossed/raised look */}
        <View style={[styles.spineStrip, { height: ALBUM_HEIGHT }]}>
          <LinearGradient
            colors={[
              lightenColor(album.spineColor, 15),
              lightenColor(album.spineColor, 5),
              album.spineColor,
              darkenColor(album.spineColor, 20),
              darkenColor(album.spineColor, 35),
            ]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.1 }}
            end={{ x: 1, y: 0.9 }}
          />
          {/* Spine ridge line */}
          <View style={styles.spineRidge} />
          {/* Inner spine highlight */}
          <View style={styles.spineInnerHighlight} />
          {/* Spine bands (ribbing) — top and bottom */}
          <View style={[styles.spineBand, { top: 16 }]} />
          <View style={[styles.spineBand, { top: 22 }]} />
          <View style={[styles.spineBand, { top: ALBUM_HEIGHT - 22 }]} />
          <View style={[styles.spineBand, { top: ALBUM_HEIGHT - 16 }]} />
          {/* Center spine decoration */}
          <View style={[styles.spineDecorDot, { top: ALBUM_HEIGHT * 0.5 - 2 }]} />
        </View>

        {/* Cover content — gold foil title */}
        <View style={styles.coverContent}>
          {/* Top corner ornament */}
          <View style={styles.cornerOrnament}>
            <View style={[styles.cornerLine, { backgroundColor: lightenColor(album.coverColor, 70) }]} />
            <View style={[styles.cornerLineV, { backgroundColor: lightenColor(album.coverColor, 70) }]} />
          </View>

          <View style={[styles.decorLine, { backgroundColor: lightenColor(album.coverColor, 75) }]} />

          {/* Gold foil title effect */}
          <View style={styles.titleWrap}>
            <Text
              style={[styles.coverTitle, {
                color: lightenColor(album.coverColor, 110),
                textShadowColor: lightenColor(album.coverColor, 130),
              }]}
              numberOfLines={2}
            >
              {album.title}
            </Text>
            {/* Gold shimmer overlay on title */}
            <LinearGradient
              colors={[
                'rgba(255,240,180,0)',
                'rgba(255,240,180,0.12)',
                'rgba(255,240,180,0)',
              ]}
              style={styles.goldShimmer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>

          <View style={[styles.decorLine, { backgroundColor: lightenColor(album.coverColor, 75) }]} />

          {album.isShared && (
            <Text style={[styles.sharedBadge, { color: lightenColor(album.coverColor, 90) }]}>
              {album.memberCount}명과 함께
            </Text>
          )}

          {/* Bottom corner ornament */}
          <View style={styles.cornerOrnamentBottom}>
            <View style={[styles.cornerLine, { backgroundColor: lightenColor(album.coverColor, 70) }]} />
            <View style={[styles.cornerLineV, { backgroundColor: lightenColor(album.coverColor, 70) }]} />
          </View>
        </View>

        {/* Left edge shadow — deep groove between spine and cover */}
        <LinearGradient
          colors={['rgba(0,0,0,0.30)', 'rgba(0,0,0,0.10)', 'rgba(0,0,0,0)']}
          style={styles.spineEdgeShadow}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />

        {/* Right edge — book edge depth with page hint */}
        <View style={styles.rightEdge}>
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.20)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          {/* Page edge lines visible from side */}
          <View style={[styles.rightPageLine, { right: 1 }]} />
          <View style={[styles.rightPageLine, { right: 2.5, opacity: 0.5 }]} />
        </View>

        {/* Top light catch — warm ambient from above */}
        <LinearGradient
          colors={['rgba(255,240,210,0.25)', 'rgba(255,240,210,0.08)', 'rgba(255,240,210,0)']}
          style={styles.topLightCatch}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Bottom vignette — standing on shelf */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0.22)']}
          style={styles.coverShadow}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Embossed inner border — recessed cover edge */}
        <View style={styles.coverInnerBorder} />
        {/* Inner border highlight (catch light on embossed edge) */}
        <View style={styles.coverInnerHighlight} />
      </View>

      {/* Bottom edge — book standing on shelf */}
      <View
        style={[
          styles.bottomEdge,
          { width: SPINE_WIDTH - 2, backgroundColor: darkenColor(album.coverColor, 35) },
        ]}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 3,
    shadowColor: '#0A0604',
    shadowOffset: { width: 4, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 12,
  },
  topEdge: {
    height: 16,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 3,
    marginBottom: -1,
    overflow: 'hidden',
  },
  topEdgeShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  pageEdges: {
    position: 'absolute',
    top: 2,
    left: 10,
    right: 2,
    gap: 1.5,
  },
  pageEdgeLine: {
    height: 1.2,
    borderRadius: 0.5,
  },
  coverFace: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  textureOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  spineStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 12,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    overflow: 'hidden',
    zIndex: 2,
  },
  spineRidge: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  spineInnerHighlight: {
    position: 'absolute',
    left: 1.5,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,240,200,0.12)',
  },
  spineBand: {
    position: 'absolute',
    left: 2,
    right: 2,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.10)',
    borderRadius: 1,
  },
  spineDecorDot: {
    position: 'absolute',
    left: 3.5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,240,200,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  spineEdgeShadow: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    width: 12,
    zIndex: 3,
  },
  rightEdge: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 6,
    zIndex: 3,
  },
  rightPageLine: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,240,210,0.15)',
  },
  topLightCatch: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 0,
    height: 45,
    zIndex: 4,
  },
  coverContent: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 10,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  titleWrap: {
    position: 'relative',
    alignItems: 'center',
    overflow: 'hidden',
  },
  coverTitle: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Georgia',
    textAlign: 'center',
    marginVertical: 10,
    lineHeight: 15,
    letterSpacing: 1.0,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  goldShimmer: {
    position: 'absolute',
    top: 0,
    left: -10,
    right: -10,
    bottom: 0,
  },
  decorLine: {
    width: '50%',
    height: 1,
    borderRadius: 1,
    opacity: 0.30,
  },
  sharedBadge: {
    fontSize: 8.5,
    fontWeight: '600',
    marginTop: 8,
    opacity: 0.70,
    letterSpacing: 0.5,
    fontFamily: 'Georgia',
  },
  // Corner ornaments
  cornerOrnament: {
    position: 'absolute',
    top: 8,
    left: 18,
    width: 12,
    height: 12,
  },
  cornerOrnamentBottom: {
    position: 'absolute',
    bottom: 8,
    right: 6,
    width: 12,
    height: 12,
    transform: [{ rotate: '180deg' }],
  },
  cornerLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 12,
    height: StyleSheet.hairlineWidth,
    opacity: 0.25,
  },
  cornerLineV: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: StyleSheet.hairlineWidth,
    height: 12,
    opacity: 0.25,
  },

  coverShadow: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 0,
    height: 80,
    zIndex: 6,
  },
  coverInnerBorder: {
    position: 'absolute',
    top: 4,
    left: 14,
    right: 4,
    bottom: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 2,
    zIndex: 7,
  },
  coverInnerHighlight: {
    position: 'absolute',
    top: 3,
    left: 14,
    right: 4,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,240,210,0.10)',
    zIndex: 7,
  },
  bottomEdge: {
    height: 4,
    marginTop: -1,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});
