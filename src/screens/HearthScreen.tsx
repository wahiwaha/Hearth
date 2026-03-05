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
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Bell, SquaresFour, Rows } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '../theme';
import { ShelfRow } from '../components/ShelfRow';
import { Album } from '../types/album';
import { AlbumPulloutOverlay } from '../components/AlbumPulloutOverlay';
import { RootStackParamList } from '../types/navigation';
import { useAlbumStore } from '../store/AlbumStore';
import { useNotificationStore } from '../store/NotificationStore';
import { IconButton } from '../components/common';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ViewMode = 'shelf' | 'bento';

// Shelf view constants
const ALBUMS_PER_ROW = Math.floor((SCREEN_WIDTH - 40) / 85);
const ALBUM_WIDTH = Math.floor((SCREEN_WIDTH - 40 - (ALBUMS_PER_ROW - 1) * 6) / ALBUMS_PER_ROW);

// Bento grid constants
const BENTO_GAP = 10;
const BENTO_PAD = spacing.lg;
const BENTO_COL_W = (SCREEN_WIDTH - BENTO_PAD * 2 - BENTO_GAP) / 2;

function BentoCard({ album, index, onPress, size }: {
  album: Album;
  index: number;
  onPress: (album: Album) => void;
  size: 'large' | 'small';
}) {
  const h = size === 'large' ? BENTO_COL_W * 1.3 : BENTO_COL_W * 0.8;
  const photoCount = album.pages?.reduce(
    (s, p) => s + p.elements.filter(e => e.type === 'photo').length, 0
  ) || 0;

  return (
    <Animated.View entering={FadeInDown.delay(80 + index * 60).duration(400)}>
      <Pressable
        style={[styles.bentoCard, { width: BENTO_COL_W, height: h }]}
        onPress={() => onPress(album)}
      >
        <LinearGradient
          colors={[album.coverColor, album.spineColor]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.bentoCardInner}>
          <Text style={styles.bentoTitle} numberOfLines={2}>{album.title}</Text>
          <View style={styles.bentoMeta}>
            <Text style={styles.bentoMetaText}>{album.pageCount}p</Text>
            {photoCount > 0 && <Text style={styles.bentoMetaText}>{photoCount}장</Text>}
            {album.isShared && (
              <View style={styles.bentoSharedDot} />
            )}
          </View>
        </View>
        {album.coverImage && (
          <View style={styles.bentoCoverOverlay} />
        )}
      </Pressable>
    </Animated.View>
  );
}

export function HearthScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { albums } = useAlbumStore();
  const { unreadCount } = useNotificationStore();
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('shelf');

  // Shelf rows
  const shelfRows = useMemo(() => {
    const rows: Album[][] = [];
    for (let i = 0; i < albums.length; i += ALBUMS_PER_ROW) {
      rows.push(albums.slice(i, i + ALBUMS_PER_ROW));
    }
    return rows;
  }, [albums]);

  // Bento layout: alternating large/small pattern
  const bentoItems = useMemo(() => {
    const items: { album: Album; size: 'large' | 'small'; column: 0 | 1 }[] = [];
    let leftH = 0;
    let rightH = 0;
    albums.forEach((album, i) => {
      const isLarge = i % 3 === 0;
      const size = isLarge ? 'large' : 'small';
      const h = isLarge ? BENTO_COL_W * 1.3 : BENTO_COL_W * 0.8;
      // Place in shorter column
      if (leftH <= rightH) {
        items.push({ album, size, column: 0 });
        leftH += h + BENTO_GAP;
      } else {
        items.push({ album, size, column: 1 });
        rightH += h + BENTO_GAP;
      }
    });
    return items;
  }, [albums]);

  const handleAlbumPress = useCallback((album: Album) => {
    if (viewMode === 'bento') {
      navigation.navigate('AlbumViewer', { albumId: album.id });
    } else {
      setSelectedAlbum(album);
    }
  }, [viewMode, navigation]);

  const handleAlbumOpen = useCallback(() => {
    if (selectedAlbum) {
      const album = selectedAlbum;
      setSelectedAlbum(null);
      setTimeout(() => {
        navigation.navigate('AlbumViewer', { albumId: album.id });
      }, 300);
    }
  }, [selectedAlbum, navigation]);

  const toggleViewMode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(v => v === 'shelf' ? 'bento' : 'shelf');
  }, []);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#FDFAF5', '#F7F2EA', '#F0E8DB', '#E8DFCF']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={styles.wallTexture} />

      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(600)}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Pressable style={styles.bellContainer} onPress={() => navigation.navigate('Notifications')}>
          <Bell size={24} color={colors.textPrimary} />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Archive</Text>
          <Text style={styles.headerSubtitle}>
            {albums.length}개의 앨범
          </Text>
        </View>

        <View style={styles.headerRight}>
          <IconButton onPress={toggleViewMode}>
            {viewMode === 'shelf'
              ? <SquaresFour size={22} color={colors.textSecondary} />
              : <Rows size={22} color={colors.textSecondary} />}
          </IconButton>
          <IconButton
            size={36}
            backgroundColor={colors.accent}
            onPress={() => navigation.navigate('CreateAlbum')}
            style={styles.addButton}
          >
            <Plus size={20} color={colors.warmWhite} weight="bold" />
          </IconButton>
        </View>
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'shelf' ? (
          <>
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
          </>
        ) : (
          <Animated.View entering={FadeIn.duration(300)} style={styles.bentoContainer}>
            <View style={styles.bentoColumn}>
              {bentoItems.filter(i => i.column === 0).map((item, idx) => (
                <BentoCard
                  key={item.album.id}
                  album={item.album}
                  index={idx}
                  onPress={handleAlbumPress}
                  size={item.size}
                />
              ))}
            </View>
            <View style={styles.bentoColumn}>
              {bentoItems.filter(i => i.column === 1).map((item, idx) => (
                <BentoCard
                  key={item.album.id}
                  album={item.album}
                  index={idx}
                  onPress={handleAlbumPress}
                  size={item.size}
                />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {selectedAlbum && (
        <AlbumPulloutOverlay
          album={selectedAlbum}
          onClose={handleAlbumOpen}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  wallTexture: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.03,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  bellContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.dustyRose,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warmWhite,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...typography.title, color: colors.textPrimary, fontSize: 24 },
  headerSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addButton: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 8 },

  // Shelf styles
  emptyShelf: { marginTop: 20 },
  emptyShelfPlank: {
    height: 18,
    backgroundColor: colors.shelfLight,
    marginHorizontal: 8,
    borderRadius: 2,
    overflow: 'visible',
  },
  woodGrain: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', borderRadius: 2 },
  grainLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(187, 166, 138, 0.25)' },
  emptyShelfFront: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: colors.shelfMid,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },

  // Bento Grid styles
  bentoContainer: {
    flexDirection: 'row',
    paddingHorizontal: BENTO_PAD,
    gap: BENTO_GAP,
  },
  bentoColumn: {
    flex: 1,
    gap: BENTO_GAP,
  },
  bentoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  bentoCardInner: {
    flex: 1,
    padding: 14,
    justifyContent: 'flex-end',
  },
  bentoTitle: {
    ...typography.body,
    color: colors.textOnDark,
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bentoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  bentoMetaText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  bentoSharedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.sage,
  },
  bentoCoverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});
