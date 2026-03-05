import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Album } from '../types/album';
import { colors } from '../theme';

interface AlbumSpineProps {
  album: Album;
  index: number;
  onPress: (album: Album) => void;
  width: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AlbumSpine({ album, index, onPress, width }: AlbumSpineProps) {
  const pressed = useSharedValue(0);
  const pullOut = useSharedValue(0);

  const SPINE_WIDTH = width;
  const ALBUM_HEIGHT = 180;
  const SPINE_DEPTH = 28;

  const handlePress = () => {
    onPress(album);
  };

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressed.value, [0, 1], [0, -12]);
    const scale = interpolate(pressed.value, [0, 1], [1, 1.02]);

    return {
      transform: [
        { translateY },
        { scale },
      ],
    };
  });

  // Darken color for spine side and top
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
    <AnimatedPressable
      style={[styles.container, { width: SPINE_WIDTH }, animatedStyle]}
      onPressIn={() => {
        pressed.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 15, stiffness: 300 });
      }}
      onPress={handlePress}
    >
      {/* Album top edge (visible from above) */}
      <View
        style={[
          styles.topEdge,
          {
            width: SPINE_WIDTH - 2,
            height: SPINE_DEPTH / 2,
            backgroundColor: lightenColor(album.coverColor, 20),
          },
        ]}
      />

      {/* Main album face (cover facing outward) */}
      <View
        style={[
          styles.coverFace,
          {
            width: SPINE_WIDTH,
            height: ALBUM_HEIGHT,
            backgroundColor: album.coverColor,
          },
        ]}
      >
        {/* Spine strip on the left */}
        <View
          style={[
            styles.spineStrip,
            {
              backgroundColor: album.spineColor,
              width: 8,
              height: ALBUM_HEIGHT,
            },
          ]}
        />

        {/* Cover texture / decoration */}
        <View style={styles.coverContent}>
          {/* Decorative line near top */}
          <View
            style={[
              styles.decorLine,
              { backgroundColor: lightenColor(album.coverColor, 40) },
            ]}
          />

          {/* Title on cover */}
          <Text
            style={[
              styles.coverTitle,
              { color: lightenColor(album.coverColor, 80) },
            ]}
            numberOfLines={2}
          >
            {album.title}
          </Text>

          {/* Decorative line near bottom */}
          <View
            style={[
              styles.decorLine,
              { backgroundColor: lightenColor(album.coverColor, 40) },
            ]}
          />

          {/* Shared indicator */}
          {album.isShared && (
            <Text style={[styles.sharedBadge, { color: lightenColor(album.coverColor, 60) }]}>
              {album.memberCount}명과 함께
            </Text>
          )}
        </View>

        {/* Subtle shadow/highlight for 3D effect */}
        <View style={styles.coverHighlight} />
        <View style={styles.coverShadow} />
      </View>

      {/* Bottom edge shadow */}
      <View
        style={[
          styles.bottomShadow,
          { width: SPINE_WIDTH },
        ]}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 3,
  },
  topEdge: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginBottom: -1,
  },
  coverFace: {
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
    // Subtle shadow for depth
    shadowColor: '#1C1208',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  spineStrip: {
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  coverContent: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 10,
    lineHeight: 15,
  },
  decorLine: {
    width: '60%',
    height: 1,
    borderRadius: 1,
    opacity: 0.5,
  },
  sharedBadge: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 8,
    opacity: 0.7,
  },
  coverHighlight: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopRightRadius: 3,
  },
  coverShadow: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderBottomRightRadius: 3,
  },
  bottomShadow: {
    height: 4,
    backgroundColor: 'transparent',
    shadowColor: '#1C1208',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
});
