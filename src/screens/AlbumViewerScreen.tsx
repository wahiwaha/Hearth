import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Image,
  FlatList,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  GearSix,
  Plus,
  Users,
  GridFour,
  Rows,
  SquaresFour,
  PencilSimple,
  Export,
  BookOpen,
} from 'phosphor-react-native';
import { colors, typography, spacing } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { useAlbumStore } from '../store/AlbumStore';
import { WarmBackground, IconButton, GlassCard } from '../components/common';
import { AlbumPage } from '../types/album';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AlbumViewer'>;

type ViewMode = 'grid2' | 'grid4' | 'single' | 'gallery';

const VIEW_MODES: { mode: ViewMode; label: string; icon: typeof GridFour; cols: number }[] = [
  { mode: 'single', label: '1장', icon: Rows, cols: 1 },
  { mode: 'grid2', label: '2장', icon: GridFour, cols: 2 },
  { mode: 'grid4', label: '4장', icon: SquaresFour, cols: 4 },
];

export function AlbumViewerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { getAlbum, addPage, setLastViewedPage } = useAlbumStore();

  const album = getAlbum(route.params.albumId);
  const [viewMode, setViewMode] = useState<ViewMode>('grid2');

  const pages = useMemo(() => album?.pages || [], [album]);

  const handlePagePress = useCallback((page: AlbumPage) => {
    if (!album) return;
    setLastViewedPage(album.id, page.id);
    navigation.navigate('AlbumEditor', { albumId: album.id, pageId: page.id });
  }, [album, navigation, setLastViewedPage]);

  const handleAddPage = useCallback(() => {
    if (!album) return;
    const newPage = addPage(album.id);
    if (newPage) {
      navigation.navigate('AlbumEditor', { albumId: album.id, pageId: newPage.id });
    }
  }, [album, addPage, navigation]);

  const cycleViewMode = useCallback(() => {
    const modes: ViewMode[] = ['single', 'grid2', 'grid4'];
    const idx = modes.indexOf(viewMode);
    const next = modes[(idx + 1) % modes.length];
    setViewMode(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [viewMode]);

  if (!album) {
    return (
      <View style={styles.root}>
        <WarmBackground />
        <Text style={styles.notFound}>앨범을 찾을 수 없습니다</Text>
      </View>
    );
  }

  const GRID_GAP = viewMode === 'grid4' ? 6 : 12;
  const GRID_PADDING = spacing.lg;
  const cols = viewMode === 'grid4' ? 4 : viewMode === 'grid2' ? 2 : 1;
  const gridPageWidth = viewMode === 'single'
    ? SCREEN_WIDTH - GRID_PADDING * 2
    : (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (cols - 1)) / cols;
  const gridPageHeight = gridPageWidth * 1.35;

  return (
    <View style={styles.root}>
      <WarmBackground />

      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <IconButton onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </IconButton>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{album.title}</Text>
          <Text style={styles.headerSubtitle}>
            {album.pageCount}페이지
            {album.isShared && ` · ${album.memberCount || album.collaborators?.length || 0}명 참여`}
          </Text>
        </View>

        <IconButton onPress={() => navigation.navigate('AlbumSettings', { albumId: album.id })}>
          <GearSix size={24} color={colors.textPrimary} />
        </IconButton>
      </Animated.View>

      {/* View mode toggle + collaborators + Add page */}
      <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.toolbar}>
        {/* View mode buttons (GoodNotes style) */}
        <View style={styles.viewToggle}>
          {VIEW_MODES.map(({ mode, icon: Icon }) => (
            <Pressable
              key={mode}
              style={[styles.viewToggleBtn, viewMode === mode && styles.viewToggleBtnActive]}
              onPress={() => { setViewMode(mode); Haptics.selectionAsync(); }}
            >
              <Icon size={16} color={viewMode === mode ? colors.warmWhite : colors.textMuted} />
            </Pressable>
          ))}
        </View>

        {album.isShared && album.collaborators && (
          <View style={styles.collaboratorAvatars}>
            {album.collaborators.slice(0, 3).map((c, i) => (
              <View
                key={c.id}
                style={[
                  styles.miniAvatar,
                  { backgroundColor: c.avatarColor, marginLeft: i > 0 ? -8 : 0, zIndex: 3 - i },
                ]}
              >
                <Text style={styles.miniAvatarText}>{c.initial}</Text>
              </View>
            ))}
            {album.collaborators.length > 3 && (
              <View style={[styles.miniAvatar, { backgroundColor: colors.textMuted, marginLeft: -8 }]}>
                <Text style={styles.miniAvatarText}>+{album.collaborators.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.toolbarRight}>
          <IconButton
            size={32}
            onPress={() => navigation.navigate('PageManager', { albumId: album.id })}
          >
            <BookOpen size={18} color={colors.textSecondary} />
          </IconButton>
          <IconButton
            size={36}
            backgroundColor={colors.accent}
            onPress={handleAddPage}
            style={styles.addPageBtn}
          >
            <Plus size={20} color={colors.warmWhite} weight="bold" />
          </IconButton>
        </View>
      </Animated.View>

      {/* Page grid */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.grid, { gap: GRID_GAP }]}>
          {pages.map((page, index) => (
            <Animated.View
              key={page.id}
              entering={FadeInDown.delay(80 + index * 30).duration(350)}
            >
              <PageCard
                page={page}
                width={gridPageWidth}
                height={gridPageHeight}
                compact={viewMode === 'grid4'}
                onPress={() => handlePagePress(page)}
              />
            </Animated.View>
          ))}

          {/* Add page card */}
          <Animated.View entering={FadeInDown.delay(80 + pages.length * 30).duration(350)}>
            <Pressable
              style={[
                styles.addPageCard,
                { width: gridPageWidth, height: gridPageHeight },
              ]}
              onPress={handleAddPage}
            >
              <Plus size={viewMode === 'grid4' ? 20 : 32} color={colors.textMuted} />
              {viewMode !== 'grid4' && <Text style={styles.addPageText}>페이지 추가</Text>}
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

/** Individual page card rendering */
function PageCard({
  page, width, height, compact, onPress,
}: {
  page: AlbumPage;
  width: number;
  height: number;
  compact: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.gridPage, { width, height, backgroundColor: page.backgroundColor }]}
      onPress={onPress}
    >
      {/* Page number */}
      <Text style={[styles.pageNumber, compact && { fontSize: 8 }]}>{page.pageNumber + 1}</Text>

      {/* Render elements preview */}
      {page.elements.length > 0 ? (
        page.elements.slice(0, compact ? 2 : 6).map((el) => {
          if (el.type === 'photo' && el.photoUri) {
            return (
              <Image
                key={el.id}
                source={{ uri: el.photoUri }}
                style={[
                  styles.elementPreview,
                  {
                    left: (el.x / 100) * width,
                    top: (el.y / 100) * height,
                    width: (el.width / 100) * width,
                    height: (el.height / 100) * height,
                    transform: [{ rotate: `${el.rotation}deg` }],
                    opacity: el.isBlurred ? 0.2 : (el.opacity ?? 1),
                  },
                ]}
              />
            );
          }
          if (el.type === 'sticker') {
            return (
              <Text
                key={el.id}
                style={[
                  styles.stickerPreview,
                  {
                    left: (el.x / 100) * width,
                    top: (el.y / 100) * height,
                    fontSize: (el.width / 100) * width * 0.6,
                  },
                ]}
              >
                {el.stickerEmoji}
              </Text>
            );
          }
          if (el.type === 'text' && !compact) {
            return (
              <Text
                key={el.id}
                style={[
                  styles.textPreview,
                  {
                    left: (el.x / 100) * width,
                    top: (el.y / 100) * height,
                    fontSize: compact ? 6 : 9,
                  },
                ]}
                numberOfLines={1}
              >
                {el.textContent}
              </Text>
            );
          }
          return null;
        })
      ) : (
        <View style={styles.emptyPage}>
          <PencilSimple size={compact ? 16 : 24} color={colors.textMuted} />
          {!compact && <Text style={styles.emptyPageText}>탭하여 꾸미기</Text>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...typography.subtitle, color: colors.textPrimary, fontSize: 20 },
  headerSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    overflow: 'hidden',
  },
  viewToggleBtn: { paddingHorizontal: 10, paddingVertical: 7 },
  viewToggleBtnActive: { backgroundColor: colors.textSecondary, borderRadius: 10 },

  collaboratorAvatars: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  miniAvatar: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.warmWhite,
  },
  miniAvatarText: { color: colors.textOnDark, fontSize: 10, fontWeight: '600' },

  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addPageBtn: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },

  gridPage: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  pageNumber: {
    position: 'absolute',
    top: 6, right: 6,
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  elementPreview: { position: 'absolute', borderRadius: 3 },
  textPreview: { position: 'absolute', ...typography.caption, color: colors.textSecondary },
  stickerPreview: { position: 'absolute' },
  emptyPage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyPageText: { ...typography.caption, color: colors.textMuted, marginTop: 6 },

  addPageCard: {
    borderWidth: 2,
    borderColor: colors.divider,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(253, 250, 245, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  addPageText: { ...typography.caption, color: colors.textMuted, marginTop: 8 },
});
