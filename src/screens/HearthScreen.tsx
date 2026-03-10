import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  Alert,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withSpring,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Plus,
  Bell,
  PencilSimple,
  Trash,
  ArrowCounterClockwise,
  PushPin,
  X,
  CaretLeft,
  CaretRight,
} from 'phosphor-react-native';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { Album } from '../types/album';
import { RootStackParamList } from '../types/navigation';
import { useAlbumStore } from '../store/AlbumStore';
import { useNotificationStore } from '../store/NotificationStore';
import { IconButton, WarmBackground, Avatar } from '../components/common';
import { WoodBackground } from '../components/WoodBackground';
import { useT } from '../i18n';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
type Nav = NativeStackNavigationProp<RootStackParamList>;

const PINNED_ALBUM_W = SCREEN_WIDTH - 120;
const PINNED_ALBUM_H = Math.round(PINNED_ALBUM_W * 4 / 3);
const LIBRARY_CARD_W = 100;
const LIBRARY_CARD_H = Math.round(LIBRARY_CARD_W * 4 / 3);
const POPUP_W = SCREEN_WIDTH - 60;
const POPUP_H = Math.round(POPUP_W * 4 / 3);

const DEFAULT_COVER_COLOR = '#A89070';

function safeColor(color: string | undefined): string {
  if (!color || typeof color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return DEFAULT_COVER_COLOR;
  }
  return color;
}

function darken(color: string, amt: number): string {
  const c = safeColor(color);
  const num = parseInt(c.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amt);
  const g = Math.max(0, ((num >> 8) & 0xFF) - amt);
  const b = Math.max(0, (num & 0xFF) - amt);
  return `rgb(${r}, ${g}, ${b})`;
}

function lighten(color: string, amt: number): string {
  const c = safeColor(color);
  const num = parseInt(c.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amt);
  const g = Math.min(255, ((num >> 8) & 0xFF) + amt);
  const b = Math.min(255, (num & 0xFF) + amt);
  return `rgb(${r}, ${g}, ${b})`;
}

/* ─── Album Cover Component ─── */
function AlbumCover({ album, size, height: h }: { album: Album; size: number; height?: number }) {
  const styles = useThemedStyles(createStyles);
  const coverColor = safeColor(album.coverColor);
  const coverH = h || size;
  return (
    <View style={[styles.albumCover, { width: size, height: coverH }]}>
      {album.coverImage ? (
        <Image
          source={{ uri: album.coverImage }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[lighten(coverColor, 20), coverColor, darken(coverColor, 25)]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
        />
      )}
      <LinearGradient
        colors={['rgba(255,252,245,0.18)', 'rgba(255,252,245,0)']}
        locations={[0, 1]}
        style={styles.coverTopLight}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)']}
        style={styles.coverBottomShadow}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.coverTitleArea}>
        <Text
          style={[styles.coverTitle, { color: album.coverImage ? '#FFF' : lighten(coverColor, 100), fontSize: size > 150 ? 16 : 11 }]}
          numberOfLines={2}
        >
          {album.title}
        </Text>
      </View>
    </View>
  );
}

/* ─── Album Page Component (placeholder) ─── */
function AlbumPageView({ album, pageIndex, size, height: h }: { album: Album; pageIndex: number; size: number; height?: number }) {
  const styles = useThemedStyles(createStyles);
  const page = album.pages?.[pageIndex];
  const bgColor = page?.backgroundColor || '#F4EDE2';
  const pageH = h || size;

  return (
    <View style={[styles.albumPage, { width: size, height: pageH, backgroundColor: bgColor }]}>
      <View style={styles.pageLines}>
        {[0.2, 0.35, 0.5, 0.65, 0.8].map((p, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: pageH * p,
              left: size * 0.1,
              right: size * 0.1,
              height: StyleSheet.hairlineWidth,
              backgroundColor: 'rgba(160,140,120,0.15)',
            }}
          />
        ))}
      </View>
      <Text style={styles.pageNumber}>{pageIndex + 1}</Text>
    </View>
  );
}

/* ─── Pinned Album with auto-flip ─── */
function PinnedAlbum({ album, onPress }: { album: Album; onPress: () => void }) {
  const styles = useThemedStyles(createStyles);
  const pageCount = album.pages?.length || 0;
  const totalSlides = 1 + pageCount;
  const [currentSlide, setCurrentSlide] = useState(0);
  const flipProgress = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advanceSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    let flipTimer: ReturnType<typeof setTimeout> | null = null;
    const startTimer = () => {
      timerRef.current = setTimeout(() => {
        flipProgress.value = withSequence(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.cubic) }),
          withTiming(0, { duration: 0 }),
        );
        flipTimer = setTimeout(() => advanceSlide(), 300);
        startTimer();
      }, 4000);
    };
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (flipTimer) clearTimeout(flipTimer);
    };
  }, [totalSlides, advanceSlide]);

  const flipStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 0.5, 1], [0, -90, 0]);
    const scaleX = interpolate(flipProgress.value, [0, 0.25, 0.5, 0.75, 1], [1, 0.95, 0.85, 0.95, 1]);
    return {
      transform: [
        { perspective: 800 },
        { rotateY: `${rotateY}deg` },
        { scaleX },
      ],
    };
  });

  const shadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(flipProgress.value, [0, 0.5, 1], [0.15, 0.35, 0.15]),
  }));

  return (
    <View style={styles.pinnedSection}>
      <Animated.View style={[styles.pinnedAlbumWrap, shadowStyle]}>
        <Pressable onPress={onPress}>
          <Animated.View style={flipStyle}>
            {currentSlide === 0 ? (
              <AlbumCover album={album} size={PINNED_ALBUM_W} height={PINNED_ALBUM_H} />
            ) : (
              <AlbumPageView
                album={album}
                pageIndex={currentSlide - 1}
                size={PINNED_ALBUM_W}
                height={PINNED_ALBUM_H}
              />
            )}
          </Animated.View>
        </Pressable>
      </Animated.View>

      {/* Page indicator dots */}
      <View style={styles.pageIndicator}>
        {Array.from({ length: Math.min(totalSlides, 8) }, (_, i) => (
          <View
            key={i}
            style={[styles.pageDot, i === currentSlide && styles.pageDotActive]}
          />
        ))}
        {totalSlides > 8 && <Text style={styles.pageDotMore}>+{totalSlides - 8}</Text>}
      </View>
    </View>
  );
}

/* ─── Album Popup with page swipe + drag-to-pin ─── */
function AlbumPopup({
  album,
  isPinned,
  onClose,
  onPin,
  onEdit,
}: {
  album: Album;
  isPinned: boolean;
  onClose: () => void;
  onPin: (albumId: string) => void;
  onEdit: (album: Album) => void;
}) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const pageCount = album.pages?.length || 0;
  const totalSlides = 1 + pageCount; // cover + pages
  const [currentPage, setCurrentPage] = useState(0);

  // Slide-up animation
  const slideY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // Vertical drag for dismissing or pinning
  const dragY = useSharedValue(0);
  const savedDragY = useSharedValue(0);
  const isDraggingVertically = useSharedValue(false);

  // Horizontal swipe for pages
  const swipeX = useSharedValue(0);

  useEffect(() => {
    slideY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
    backdropOpacity.value = withTiming(1, { duration: 300 });
  }, []);

  const handleDismissAnimated = useCallback(() => {
    slideY.value = withTiming(SCREEN_HEIGHT, { duration: 300, easing: Easing.in(Easing.cubic) });
    backdropOpacity.value = withTiming(0, { duration: 250 });
    setTimeout(onClose, 310);
  }, [onClose]);

  const handlePinDrop = useCallback(() => {
    dragY.value = withSpring(0, { damping: 20 });
  }, []);

  const goToPage = useCallback((page: number) => {
    const clamped = Math.max(0, Math.min(page, totalSlides - 1));
    setCurrentPage(clamped);
  }, [totalSlides]);

  // Horizontal swipe gesture for page navigation
  const horizontalSwipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      swipeX.value = e.translationX;
    })
    .onEnd((e) => {
      const threshold = POPUP_W * 0.15;
      if (e.translationX < -threshold && currentPage < totalSlides - 1) {
        runOnJS(goToPage)(currentPage + 1);
      } else if (e.translationX > threshold && currentPage > 0) {
        runOnJS(goToPage)(currentPage - 1);
      }
      swipeX.value = withSpring(0, { damping: 20 });
    });

  // Vertical drag gesture for dismiss/pin
  const verticalDrag = Gesture.Pan()
    .activeOffsetY([-20, 20])
    .failOffsetX([-30, 30])
    .onStart(() => {
      savedDragY.value = dragY.value;
      isDraggingVertically.value = true;
    })
    .onUpdate((e) => {
      dragY.value = savedDragY.value + e.translationY;
    })
    .onEnd(() => {
      isDraggingVertically.value = false;
      // Drag down to dismiss
      if (dragY.value > 100) {
        runOnJS(handleDismissAnimated)();
        return;
      }
      // Drag up to pin (only for non-pinned albums)
      if (!isPinned && dragY.value < -80) {
        runOnJS(handlePinDrop)();
        return;
      }
      // Bounce back
      dragY.value = withSpring(0, { damping: 20 });
    });

  const composedGesture = Gesture.Exclusive(verticalDrag, horizontalSwipe);

  // Page content with horizontal swipe offset
  const pageSwipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeX.value * 0.3 }],
  }));

  // Main container style: slide up + vertical drag
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: slideY.value + dragY.value },
    ],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Pin hint when dragging up
  const pinHintStyle = useAnimatedStyle(() => {
    const show = !isPinned && dragY.value < -20;
    return {
      opacity: show ? interpolate(dragY.value, [-20, -80], [0, 1]) : 0,
      transform: [{ scale: show ? interpolate(dragY.value, [-20, -80], [0.8, 1]) : 0.8 }],
    };
  });

  return (
    <View style={styles.popupRoot}>
      {/* Blur backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropAnimStyle]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} onPress={handleDismissAnimated} />
      </Animated.View>

      {/* Pin hint at top */}
      {!isPinned && (
        <Animated.View style={[styles.pinHint, pinHintStyle]}>
          <PushPin size={20} color={colors.accent} weight="fill" />
          <Text style={styles.pinHintText}>놓으면 고정</Text>
        </Animated.View>
      )}

      {/* Album popup */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.popupContainer, containerStyle]}>
          {/* Album content */}
          <Animated.View style={[styles.popupAlbumShadow, pageSwipeStyle]}>
            {currentPage === 0 ? (
              <AlbumCover album={album} size={POPUP_W} height={POPUP_H} />
            ) : (
              <AlbumPageView
                album={album}
                pageIndex={currentPage - 1}
                size={POPUP_W}
                height={POPUP_H}
              />
            )}
          </Animated.View>

          {/* Page indicator */}
          <View style={styles.popupPageIndicator}>
            {Array.from({ length: Math.min(totalSlides, 10) }, (_, i) => (
              <View
                key={i}
                style={[styles.popupDot, i === currentPage && styles.popupDotActive]}
              />
            ))}
            {totalSlides > 10 && (
              <Text style={styles.popupDotMore}>+{totalSlides - 10}</Text>
            )}
          </View>

          {/* Page nav arrows */}
          {currentPage > 0 && (
            <Pressable style={[styles.pageNavBtn, styles.pageNavLeft]} onPress={() => goToPage(currentPage - 1)}>
              <CaretLeft size={20} color="#FFF" weight="bold" />
            </Pressable>
          )}
          {currentPage < totalSlides - 1 && (
            <Pressable style={[styles.pageNavBtn, styles.pageNavRight]} onPress={() => goToPage(currentPage + 1)}>
              <CaretRight size={20} color="#FFF" weight="bold" />
            </Pressable>
          )}

          {/* Info bar */}
          <View style={styles.popupInfoBar}>
            <View style={styles.popupInfoLeft}>
              <Text style={styles.popupAlbumTitle} numberOfLines={1}>{album.title}</Text>
              <Text style={styles.popupAlbumMeta}>
                {currentPage === 0 ? '표지' : `${currentPage} / ${pageCount}페이지`}
                {' · '}{album.isShared ? '공유' : '개인'}
              </Text>
            </View>
            {isPinned && (
              <Pressable style={styles.popupEditBtn} onPress={() => onEdit(album)}>
                <PencilSimple size={16} color="#FFF" weight="bold" />
                <Text style={styles.popupEditText}>편집</Text>
              </Pressable>
            )}
          </View>

          {/* Collaborators */}
          {album.collaborators && album.collaborators.length > 0 && (
            <View style={styles.popupCollaborators}>
              <View style={styles.popupCollabAvatars}>
                {album.collaborators.map((collab, idx) => (
                  <View key={collab.id} style={[styles.popupCollabAvatarWrap, { marginLeft: idx === 0 ? 0 : -8 }]}>
                    <Avatar
                      initial={collab.initial}
                      color={collab.avatarColor}
                      imageUrl={collab.avatarUrl}
                      size={28}
                    />
                  </View>
                ))}
              </View>
              <Text style={styles.popupCollabNames} numberOfLines={1}>
                {album.collaborators.map(c => c.name).join(', ')}
              </Text>
            </View>
          )}

          {/* Close button */}
          <Pressable style={styles.popupCloseBtn} onPress={handleDismissAnimated}>
            <X size={18} color="#FFF" weight="bold" />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

/* ─── Library Album Card (tap to view, long-press+drag to pin) ─── */
function LibraryCard({
  album,
  index,
  onPress,
  onDragMove,
  onDragEnd,
  onDragActivate,
}: {
  album: Album;
  index: number;
  onPress: () => void;
  onDragActivate: (album: Album, absX: number, absY: number) => void;
  onDragMove: (absX: number, absY: number) => void;
  onDragEnd: (absX: number, absY: number) => void;
}) {
  const styles = useThemedStyles(createStyles);
  // Single Pan gesture with long press activation — continuous from hold to drag
  const dragGesture = Gesture.Pan()
    .activateAfterLongPress(300)
    .onStart((e) => {
      runOnJS(onDragActivate)(album, e.absoluteX, e.absoluteY);
    })
    .onUpdate((e) => {
      runOnJS(onDragMove)(e.absoluteX, e.absoluteY);
    })
    .onEnd((e) => {
      runOnJS(onDragEnd)(e.absoluteX, e.absoluteY);
    });

  // Tap gesture for opening the album popup
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(onPress)();
    });

  // Tap has priority over drag's long press for short taps
  const composed = Gesture.Exclusive(dragGesture, tapGesture);

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
      <GestureDetector gesture={composed}>
        <Animated.View style={styles.libraryCard}>
          <View style={styles.libraryCardCover}>
            <AlbumCover album={album} size={LIBRARY_CARD_W} height={LIBRARY_CARD_H} />
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

/* ─── Deleted Album Card ─── */
function DeletedCard({
  album,
  index,
  onRestore,
  onDelete,
}: {
  album: Album;
  index: number;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  return (
    <Animated.View entering={FadeIn.delay(index * 40).duration(300)}>
      <View style={styles.deletedCard}>
        <View style={styles.deletedCoverWrap}>
          <View style={{ opacity: 0.5 }}>
            <AlbumCover album={album} size={80} />
          </View>
        </View>
        <View style={styles.deletedInfo}>
          <Text style={styles.deletedTitle} numberOfLines={1}>{album.title}</Text>
          <View style={styles.deletedActions}>
            <Pressable style={styles.deletedRestoreBtn} onPress={onRestore}>
              <ArrowCounterClockwise size={14} color={colors.sage} />
              <Text style={styles.deletedRestoreText}>복구</Text>
            </Pressable>
            <Pressable style={styles.deletedRemoveBtn} onPress={onDelete}>
              <Trash size={14} color={colors.error} />
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

/* ═══════════════════════════════════════════
   HearthScreen (Archive)
   ═══════════════════════════════════════════ */
export function HearthScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {
    albums, deletedAlbums, pinnedAlbumId,
    pinAlbum, restoreAlbum, permanentlyDeleteAlbum,
  } = useAlbumStore();
  const { unreadCount } = useNotificationStore();
  const t = useT();

  const pinnedAlbum = useMemo(() => albums.find(a => a.id === pinnedAlbumId) || null, [albums, pinnedAlbumId]);
  const libraryAlbums = useMemo(() => albums.filter(a => a.id !== pinnedAlbumId), [albums, pinnedAlbumId]);

  const [popupAlbum, setPopupAlbum] = useState<Album | null>(null);
  const [popupIsPinned, setPopupIsPinned] = useState(false);

  // Drag-to-pin state
  const [draggingAlbum, setDraggingAlbum] = useState<Album | null>(null);
  const draggingAlbumRef = useRef<Album | null>(null);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragScale = useSharedValue(1);
  const dragOpacity = useSharedValue(0);
  const dropHighlight = useSharedValue(0);
  const pinnedAreaRef = useRef<View>(null);
  const pinnedAreaY = useRef(0);

  const handleOpenAlbum = useCallback((album: Album, isPinned: boolean) => {
    setPopupAlbum(album);
    setPopupIsPinned(isPinned);
  }, []);

  const handleClosePopup = useCallback(() => {
    setPopupAlbum(null);
  }, []);

  const handlePinAlbum = useCallback((albumId: string) => {
    pinAlbum(albumId);
  }, [pinAlbum]);

  const handleEditAlbum = useCallback((album: Album) => {
    setPopupAlbum(null);
    const firstPageId = album.pages?.[0]?.id || `${album.id}-page-0`;
    navigation.navigate('AlbumEditor', { albumId: album.id, pageId: firstPageId });
  }, [navigation]);

  // Drag callbacks for LibraryCard
  const handleDragActivate = useCallback((album: Album, absX: number, absY: number) => {
    draggingAlbumRef.current = album;
    setDraggingAlbum(album);
    dragX.value = absX - LIBRARY_CARD_W / 2;
    dragY.value = absY - LIBRARY_CARD_H / 2;
    dragScale.value = withSpring(1.1, { damping: 15 });
    dragOpacity.value = withTiming(1, { duration: 150 });
    // Measure pinned area position
    pinnedAreaRef.current?.measureInWindow((_px, py) => {
      pinnedAreaY.current = py;
    });
  }, []);

  const handleDragMove = useCallback((absX: number, absY: number) => {
    dragX.value = absX - LIBRARY_CARD_W / 2;
    dragY.value = absY - LIBRARY_CARD_H / 2;
    // Check if over pinned area
    const overPinned = absY < pinnedAreaY.current + PINNED_ALBUM_H + 80;
    dropHighlight.value = withTiming(overPinned ? 1 : 0, { duration: 150 });
  }, []);

  const handleDragEnd = useCallback((absX: number, absY: number) => {
    const album = draggingAlbumRef.current;
    const overPinned = absY < pinnedAreaY.current + PINNED_ALBUM_H + 80;
    if (overPinned && album) {
      // 바로 스왑 — 드래그한 앨범이 대표앨범이 됨
      pinAlbum(album.id);
      dragOpacity.value = withTiming(0, { duration: 200 });
      dropHighlight.value = withTiming(0, { duration: 200 });
      setTimeout(() => { draggingAlbumRef.current = null; setDraggingAlbum(null); }, 220);
    } else {
      cancelDrag();
    }
  }, [pinAlbum]);

  function cancelDrag() {
    dragOpacity.value = withTiming(0, { duration: 200 });
    dropHighlight.value = withTiming(0, { duration: 200 });
    setTimeout(() => { draggingAlbumRef.current = null; setDraggingAlbum(null); }, 220);
  }

  const floatingCardStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: dragX.value,
    top: dragY.value,
    opacity: dragOpacity.value,
    transform: [{ scale: dragScale.value }],
    zIndex: 200,
  }));

  const accentColor = colors.accent;
  const pinnedDropHighlightStyle = useAnimatedStyle(() => ({
    borderWidth: interpolate(dropHighlight.value, [0, 1], [0, 2.5]),
    borderColor: accentColor,
    borderRadius: 14,
    borderStyle: 'dashed' as const,
  }));

  const handleRestore = useCallback((id: string) => {
    restoreAlbum(id);
  }, [restoreAlbum]);

  const handlePermanentDelete = useCallback((id: string, title: string) => {
    Alert.alert(
      '영구 삭제',
      `"${title}"을(를) 영구적으로 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => permanentlyDeleteAlbum(id) },
      ],
    );
  }, [permanentlyDeleteAlbum]);

  const handleEditPinned = useCallback(() => {
    if (pinnedAlbum) {
      const firstPageId = pinnedAlbum.pages?.[0]?.id || `${pinnedAlbum.id}-page-0`;
      navigation.navigate('AlbumEditor', { albumId: pinnedAlbum.id, pageId: firstPageId });
    }
  }, [pinnedAlbum, navigation]);

  return (
    <View style={styles.root}>
      <WoodBackground />

      {/* Header */}
      <View style={[styles.headerWrap, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle}>{t.archive}</Text>
            <Text style={styles.headerSubtitle}>{t.albumCount(albums.length)}</Text>
          </View>
          <View style={styles.headerRight}>
            {pinnedAlbum && (
              <Pressable style={styles.headerIconBtn} onPress={handleEditPinned}>
                <PencilSimple size={20} color="rgba(220,210,195,0.8)" />
              </Pressable>
            )}
            <Pressable style={styles.bellContainer} onPress={() => navigation.navigate('Notifications')}>
              <Bell size={22} color="#F0E8DB" />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </Pressable>
            <IconButton
              size={38}
              backgroundColor={colors.accent}
              onPress={() => navigation.navigate('CreateAlbum')}
              style={styles.addButton}
            >
              <Plus size={18} color="#FFF" weight="bold" />
            </IconButton>
          </View>
        </View>
        <View style={styles.headerDivider} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Pinned Album ─── */}
        <View ref={pinnedAreaRef}>
          <Animated.View style={pinnedDropHighlightStyle}>
            {pinnedAlbum ? (
              <Animated.View entering={FadeIn.duration(500)}>
                <PinnedAlbum
                  album={pinnedAlbum}
                  onPress={() => handleOpenAlbum(pinnedAlbum, true)}
                />
              </Animated.View>
            ) : (
              <Animated.View entering={FadeIn.duration(300)} style={styles.emptyPinned}>
                <PushPin size={28} color="rgba(200,190,170,0.5)" weight="thin" />
                <Text style={styles.emptyPinnedText}>
                  앨범을 길게 눌러 여기로 드래그하세요
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </View>

        {/* ─── Library ─── */}
        {libraryAlbums.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>내 앨범</Text>
              <Text style={styles.sectionCount}>{libraryAlbums.length}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.libraryScroll}
            >
              {libraryAlbums.map((album, idx) => (
                <LibraryCard
                  key={album.id}
                  album={album}
                  index={idx}
                  onPress={() => handleOpenAlbum(album, false)}
                  onDragActivate={handleDragActivate}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ─── Deleted Albums (Trash) ─── */}
        {deletedAlbums.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <View style={styles.sectionHeader}>
              <Trash size={16} color="rgba(200,190,170,0.5)" />
              <Text style={styles.sectionTitle}>삭제된 앨범</Text>
              <Text style={styles.sectionCount}>{deletedAlbums.length}</Text>
            </View>
            <View style={styles.deletedList}>
              {deletedAlbums.map((album, idx) => (
                <DeletedCard
                  key={album.id}
                  album={album}
                  index={idx}
                  onRestore={() => handleRestore(album.id)}
                  onDelete={() => handlePermanentDelete(album.id, album.title)}
                />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* ─── Floating drag card ─── */}
      {draggingAlbum && (
        <Animated.View style={floatingCardStyle} pointerEvents="none">
          <View style={styles.floatingCard}>
            <AlbumCover album={draggingAlbum} size={LIBRARY_CARD_W} height={LIBRARY_CARD_H} />
          </View>
        </Animated.View>
      )}

      {/* ─── Album Popup ─── */}
      {popupAlbum && (
        <AlbumPopup
          album={popupAlbum}
          isPinned={popupIsPinned}
          onClose={handleClosePopup}
          onPin={handlePinAlbum}
          onEdit={handleEditAlbum}
        />
      )}
    </View>
  );
}

const createStyles = (c: ReturnType<typeof useColors>) => ({
  root: { flex: 1 } as const,

  // Header
  headerWrap: { zIndex: 10 } as const,
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  headerTitleArea: { alignItems: 'flex-start' as const },
  headerTitle: { ...typography.title, color: '#F0E8DB', fontSize: 28, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  headerSubtitle: { ...typography.caption, color: 'rgba(220,210,195,0.7)', marginTop: 2 },
  headerRight: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(180,160,130,0.15)',
    marginHorizontal: spacing.lg,
  },
  bellContainer: { width: 40, height: 40, justifyContent: 'center' as const, alignItems: 'center' as const },
  bellBadge: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: c.dustyRose,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 3,
  },
  bellBadgeText: { fontSize: 9, fontWeight: '700' as const, color: '#FFF' },
  addButton: {
    shadowColor: c.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20,
    shadowRadius: 5,
  },

  scrollView: { flex: 1 } as const,

  headerIconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  // Pinned album
  pinnedSection: {
    alignItems: 'center' as const,
    paddingTop: 24,
    paddingBottom: 32,
  },
  pinnedAlbumWrap: {
    borderRadius: 12,
    overflow: 'hidden' as const,
    shadowColor: '#2A1E10',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  pageIndicator: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 5,
    marginTop: 10,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(160,149,133,0.2)',
  },
  pageDotActive: {
    backgroundColor: c.accent,
    width: 18,
    borderRadius: 3,
  },
  pageDotMore: {
    ...typography.caption,
    fontSize: 9,
    color: c.textMuted,
    marginLeft: 2,
  },

  // Empty pinned
  emptyPinned: {
    alignItems: 'center' as const,
    paddingVertical: 50,
    gap: 10,
  },
  emptyPinnedText: {
    ...typography.body,
    color: 'rgba(200,190,170,0.6)',
    fontSize: 14,
  },

  // Album cover
  albumCover: { borderRadius: 10, overflow: 'hidden' as const },
  coverTopLight: { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 50, zIndex: 2 },
  coverBottomShadow: { position: 'absolute' as const, bottom: 0, left: 0, right: 0, height: 70, zIndex: 2 },
  coverTitleArea: { position: 'absolute' as const, bottom: 10, left: 12, right: 12, zIndex: 3 },
  coverTitle: {
    fontWeight: '700' as const,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Album page
  albumPage: {
    borderRadius: 10,
    overflow: 'hidden' as const,
    justifyContent: 'flex-end' as const,
    alignItems: 'center' as const,
    paddingBottom: 12,
  },
  pageLines: { ...StyleSheet.absoluteFillObject },
  pageNumber: {
    ...typography.caption,
    color: c.textMuted,
    fontSize: 11,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    marginBottom: 12,
    gap: 6,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: '#F0E8DB',
    fontSize: 16,
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionCount: {
    ...typography.caption,
    color: 'rgba(220,210,195,0.6)',
    fontSize: 12,
  },

  // Library scroll
  libraryScroll: {
    paddingHorizontal: spacing.lg,
    gap: 12,
    paddingBottom: 0,
  },
  libraryCard: {
    width: LIBRARY_CARD_W,
    alignItems: 'center' as const,
  },
  libraryCardCover: {
    borderRadius: 6,
    overflow: 'hidden' as const,
    shadowColor: '#2A1E10',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },

  // Deleted albums
  deletedList: {
    paddingHorizontal: spacing.lg,
    gap: 8,
    marginBottom: 16,
  },
  deletedCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(30,22,14,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(140,120,90,0.15)',
  },
  deletedCoverWrap: {
    borderRadius: 6,
    overflow: 'hidden' as const,
  },
  deletedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deletedTitle: {
    ...typography.body,
    color: 'rgba(220,210,195,0.8)',
    fontWeight: '500' as const,
    fontSize: 14,
    marginBottom: 6,
  },
  deletedActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  deletedRestoreBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(138,170,120,0.1)',
  },
  deletedRestoreText: {
    ...typography.caption,
    color: c.sage,
    fontWeight: '600' as const,
    fontSize: 12,
  },
  deletedRemoveBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(212,112,104,0.08)',
  },

  // Floating drag card
  floatingCard: {
    borderRadius: 8,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },

  // ─── Album Popup ───
  popupRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  popupContainer: {
    position: 'absolute' as const,
    left: (SCREEN_WIDTH - POPUP_W) / 2,
    top: (SCREEN_HEIGHT - POPUP_H) / 2 - 50,
    width: POPUP_W,
    alignItems: 'center' as const,
  },
  popupAlbumShadow: {
    borderRadius: 14,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 15,
  },
  popupPageIndicator: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 5,
    marginTop: 12,
  },
  popupDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  popupDotActive: {
    backgroundColor: '#FFF',
    width: 18,
    borderRadius: 3,
  },
  popupDotMore: {
    ...typography.caption,
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 2,
  },
  pageNavBtn: {
    position: 'absolute' as const,
    top: POPUP_H / 2 - 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  pageNavLeft: {
    left: -12,
  },
  pageNavRight: {
    right: -12,
  },
  popupInfoBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingTop: 14,
    width: '100%' as const,
    paddingHorizontal: 4,
  },
  popupInfoLeft: {
    flex: 1,
    marginRight: 10,
  },
  popupAlbumTitle: {
    ...typography.subtitle,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  popupAlbumMeta: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 2,
  },
  popupEditBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(196, 146, 66, 0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  popupEditText: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: '700' as const,
    fontSize: 13,
  },
  popupCollaborators: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingTop: 10,
    paddingHorizontal: 4,
    width: '100%' as const,
  },
  popupCollabAvatars: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  popupCollabAvatarWrap: {
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
  },
  popupCollabNames: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    flex: 1,
  },
  popupCloseBtn: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.40)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Pin hint
  pinHint: {
    position: 'absolute' as const,
    top: 60,
    alignSelf: 'center' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    zIndex: 110,
  },
  pinHintText: {
    ...typography.caption,
    color: c.accent,
    fontWeight: '700' as const,
    fontSize: 13,
  },
});
