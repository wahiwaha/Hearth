import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../theme';
import { ShelfRow } from '../components/ShelfRow';
import { Album } from '../types/album';
import { AlbumPulloutOverlay } from '../components/AlbumPulloutOverlay';
import { dummyAlbums } from '../utils/dummyAlbums';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// How many albums per shelf row (responsive)
const ALBUMS_PER_ROW = Math.floor((SCREEN_WIDTH - 40) / 85);
const ALBUM_WIDTH = Math.floor((SCREEN_WIDTH - 40 - (ALBUMS_PER_ROW - 1) * 6) / ALBUMS_PER_ROW);

export function HearthScreen() {
  const insets = useSafeAreaInsets();
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  // Split albums into shelf rows
  const shelfRows = useMemo(() => {
    const rows: Album[][] = [];
    for (let i = 0; i < dummyAlbums.length; i += ALBUMS_PER_ROW) {
      rows.push(dummyAlbums.slice(i, i + ALBUMS_PER_ROW));
    }
    return rows;
  }, []);

  const handleAlbumPress = useCallback((album: Album) => {
    setSelectedAlbum(album);
  }, []);

  return (
    <View style={styles.root}>
      {/* Warm background gradient — like a cozy room */}
      <LinearGradient
        colors={['#E8DED0', '#D4C4AE', '#C8B898', '#BCA882']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Subtle wall texture overlay */}
      <View style={styles.wallTexture} />

      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(600)}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        {/* Profile avatar */}
        <Pressable style={styles.avatarButton}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>찬</Text>
          </View>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Hearth</Text>
          <Text style={styles.headerSubtitle}>
            {dummyAlbums.length}개의 앨범
          </Text>
        </View>

        {/* Add album button */}
        <Pressable style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </Animated.View>

      {/* Shelves */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {shelfRows.map((row, rowIndex) => (
          <Animated.View
            key={rowIndex}
            entering={FadeInDown.delay(200 + rowIndex * 100).duration(500)}
          >
            <ShelfRow
              albums={row}
              onAlbumPress={handleAlbumPress}
              albumWidth={ALBUM_WIDTH}
            />
          </Animated.View>
        ))}

        {/* Empty shelf at bottom for visual balance */}
        <View style={styles.emptyShelf}>
          <View style={styles.emptyShelfPlank}>
            <View style={styles.woodGrain}>
              <View style={[styles.grainLine, { top: 3 }]} />
              <View style={[styles.grainLine, { top: 8 }]} />
              <View style={[styles.grainLine, { top: 14 }]} />
            </View>
            <View style={styles.emptyShelfFront} />
          </View>
        </View>
      </ScrollView>

      {/* Page indicator dots at bottom */}
      <View style={[styles.pageIndicator, { bottom: insets.bottom + 10 }]}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      {/* Album pull-out overlay */}
      {selectedAlbum && (
        <AlbumPulloutOverlay
          album={selectedAlbum}
          onClose={() => setSelectedAlbum(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  wallTexture: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.03,
    // Simulating subtle texture
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  avatarButton: {
    padding: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.shelfDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.textOnDark,
    fontSize: 14,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.title,
    color: colors.textPrimary,
    fontSize: 24,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    color: colors.warmWhite,
    fontSize: 22,
    fontWeight: '400',
    marginTop: -1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  emptyShelf: {
    marginTop: 20,
  },
  emptyShelfPlank: {
    height: 18,
    backgroundColor: '#B89B78',
    marginHorizontal: 8,
    borderRadius: 2,
    overflow: 'visible',
  },
  woodGrain: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 2,
  },
  grainLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(160, 130, 90, 0.3)',
  },
  emptyShelfFront: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#A08258',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  pageIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
    opacity: 0.3,
  },
  dotActive: {
    opacity: 1,
    backgroundColor: colors.textPrimary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
