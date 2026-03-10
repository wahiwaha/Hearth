import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  PencilSimple,
  TrashSimple,
  ImageSquare,
  BookOpen,
  Users,
  NotePencil,
  X,
  Plus,
  Minus,
  Sparkle,
} from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { RootStackParamList } from '../types/navigation';
import { useFriendStore } from '../store/FriendStore';
import { useAlbumStore } from '../store/AlbumStore';
import { Album } from '../types/album';
import { WarmBackground, Avatar, GlassCard, IconButton } from '../components/common';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'FriendProfile'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 200;
const AVATAR_SIZE = 88;
const AVATAR_OVERLAP = AVATAR_SIZE / 2;
const ALBUM_CARD_W = 140;
const ALBUM_CARD_H = 180;
const PHOTO_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - 8) / 3;

type TabType = 'albums' | 'photos';

/* --- Dummy "AI-detected" photos with this friend --- */
interface TogetherPhoto {
  id: string;
  color: string; // fallback color
  imageUrl: string; // photo image URL
  date: string;
}

function generateDummyPhotos(friendId: string): TogetherPhoto[] {
  const count = Math.max(3, Math.floor(Math.random() * 8) + 4);
  const photoColors = [
    '#E8D5C4', '#D4C4B0', '#C8B8A4', '#BCA898',
    '#D0C0B0', '#E0D0C0', '#C4B4A4', '#D8C8B8',
    '#CCBCAC', '#E4D4C4', '#D0C4B4', '#C8BCA8',
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: `photo-${friendId}-${i}`,
    color: photoColors[i % photoColors.length],
    imageUrl: `https://picsum.photos/seed/together-${friendId}-${i}/300/300`,
    date: `2026.${String(Math.floor(Math.random() * 3) + 1).padStart(2, '0')}.${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
  }));
}

/* --- Album Detail Overlay --- */
function AlbumDetailOverlay({
  album,
  onClose,
  onEdit,
  onView,
}: {
  album: Album;
  onClose: () => void;
  onEdit: () => void;
  onView: () => void;
}) {
  const colors = useColors();
  const styles = useThemedStyles((c) => ({
    overlayBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      zIndex: 100,
      padding: 28,
    },
    overlayCard: {
      width: '100%' as const,
      maxWidth: 340,
      backgroundColor: c.background,
      borderRadius: 20,
      overflow: 'hidden' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 10,
    },
    overlayAlbumCover: {
      height: 160,
      flexDirection: 'row' as const,
      overflow: 'hidden' as const,
      justifyContent: 'center' as const,
      alignItems: 'flex-end' as const,
      paddingBottom: 14,
      paddingHorizontal: 16,
    },
    overlaySpine: {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      width: 8,
    },
    overlayAlbumTitle: {
      ...typography.title,
      color: 'rgba(255,255,255,0.9)',
      fontSize: 18,
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    overlayInfo: {
      padding: 20,
    },
    overlayTitle: {
      ...typography.subtitle,
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '700' as const,
    },
    overlayMeta: {
      ...typography.caption,
      color: c.textMuted,
      marginTop: 4,
    },
    overlayCollabSection: {
      marginTop: 16,
    },
    overlayCollabHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 5,
      marginBottom: 8,
    },
    overlayCollabLabel: {
      ...typography.caption,
      color: c.textMuted,
      fontWeight: '600' as const,
      fontSize: 12,
    },
    overlayCollabList: {
      gap: 8,
    },
    overlayCollabItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    overlayCollabName: {
      ...typography.body,
      color: c.textPrimary,
      fontWeight: '500' as const,
      fontSize: 14,
      flex: 1,
    },
    ownerBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: 'rgba(196,139,53,0.1)',
    },
    ownerBadgeText: {
      ...typography.caption,
      color: c.accent,
      fontWeight: '600' as const,
      fontSize: 10,
    },
    overlayActions: {
      flexDirection: 'row' as const,
      gap: 10,
      marginTop: 20,
    },
    overlayActionBtn: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: c.dustyRose,
    },
    overlayEditBtn: {
      backgroundColor: 'rgba(160,149,133,0.1)',
    },
    overlayActionText: {
      ...typography.body,
      color: c.warmWhite,
      fontWeight: '600' as const,
      fontSize: 14,
    },
    overlayClose: {
      position: 'absolute' as const,
      top: 12,
      right: 12,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.25)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
  }));

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.overlayBackdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View entering={ZoomIn.duration(300).springify()} style={styles.overlayCard}>
        {/* Album cover preview */}
        <View style={[styles.overlayAlbumCover, { backgroundColor: album.coverColor }]}>
          <View style={[styles.overlaySpine, { backgroundColor: album.spineColor }]} />
          {album.coverImage ? (
            <Image
              source={{ uri: album.coverImage }}
              style={[StyleSheet.absoluteFill, { left: 8 }]}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(0,0,0,0.05)']}
              style={[StyleSheet.absoluteFill, { left: 8 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          <Text style={styles.overlayAlbumTitle}>{album.title}</Text>
        </View>

        {/* Info */}
        <View style={styles.overlayInfo}>
          <Text style={styles.overlayTitle}>{album.title}</Text>
          <Text style={styles.overlayMeta}>
            {album.pageCount}페이지 · {album.isShared ? '공유 앨범' : '개인 앨범'}
          </Text>

          {/* Collaborators */}
          {album.collaborators && album.collaborators.length > 0 && (
            <View style={styles.overlayCollabSection}>
              <View style={styles.overlayCollabHeader}>
                <Users size={14} color={colors.textMuted} />
                <Text style={styles.overlayCollabLabel}>참여자</Text>
              </View>
              <View style={styles.overlayCollabList}>
                {album.collaborators.map((c) => (
                  <View key={c.id} style={styles.overlayCollabItem}>
                    <Avatar initial={c.initial} color={c.avatarColor} imageUrl={c.avatarUrl} size={28} />
                    <Text style={styles.overlayCollabName}>{c.name}</Text>
                    {c.role === 'owner' && (
                      <View style={styles.ownerBadge}>
                        <Text style={styles.ownerBadgeText}>관리자</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.overlayActions}>
            <Pressable style={styles.overlayActionBtn} onPress={onView}>
              <BookOpen size={18} color={colors.warmWhite} />
              <Text style={styles.overlayActionText}>앨범 보기</Text>
            </Pressable>
            <Pressable style={[styles.overlayActionBtn, styles.overlayEditBtn]} onPress={onEdit}>
              <NotePencil size={18} color={colors.textPrimary} />
              <Text style={[styles.overlayActionText, { color: colors.textPrimary }]}>편집</Text>
            </Pressable>
          </View>
        </View>

        {/* Close */}
        <Pressable style={styles.overlayClose} onPress={onClose}>
          <X size={20} color={colors.textMuted} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

/* ===============================================
   FriendProfileScreen
   =============================================== */
export function FriendProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { getFriend, deleteFriend } = useFriendStore();
  const { albums } = useAlbumStore();

  const friend = getFriend(route.params.friendId);

  const [activeTab, setActiveTab] = useState<TabType>('albums');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [togetherPhotos, setTogetherPhotos] = useState<TogetherPhoto[]>(() =>
    friend ? generateDummyPhotos(friend.id) : []
  );

  const styles = useThemedStyles((c) => ({
    root: { flex: 1 },
    notFound: { ...typography.body, color: c.textMuted, textAlign: 'center' as const, marginTop: 100 },
    scroll: { flex: 1 },

    // Banner
    banner: { width: SCREEN_WIDTH, overflow: 'hidden' as const },
    bannerBg: { ...StyleSheet.absoluteFillObject },
    bgChangeBtn: {
      position: 'absolute' as const,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.2)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },

    // Header
    headerOverlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      zIndex: 10,
    },

    // Avatar
    avatarSection: {
      alignItems: 'center' as const,
      marginTop: -AVATAR_OVERLAP,
      zIndex: 5,
    },
    avatarRing: {
      width: AVATAR_SIZE + 8,
      height: AVATAR_SIZE + 8,
      borderRadius: (AVATAR_SIZE + 8) / 2,
      backgroundColor: c.background,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
    },

    // Info
    infoSection: {
      alignItems: 'center' as const,
      paddingTop: 12,
      paddingBottom: 20,
    },
    name: {
      ...typography.title,
      color: c.textPrimary,
      fontSize: 24,
    },
    tagRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      marginTop: 8,
    },
    tagBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: 'rgba(196, 139, 53, 0.08)',
    },
    tagText: {
      ...typography.caption,
      color: c.accent,
      fontWeight: '600' as const,
    },
    subInfo: {
      ...typography.body,
      color: c.textMuted,
      fontSize: 14,
    },

    // Tab bar
    tabBar: {
      flexDirection: 'row' as const,
      marginHorizontal: spacing.lg,
      borderRadius: 14,
      backgroundColor: c.glass,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.glassBorder,
      padding: 4,
      marginBottom: 16,
    },
    tabBtn: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 6,
      paddingVertical: 10,
      borderRadius: 11,
    },
    tabBtnActive: {
      backgroundColor: c.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    tabText: {
      ...typography.caption,
      color: c.textMuted,
      fontWeight: '500' as const,
      fontSize: 13,
    },
    tabTextActive: {
      color: c.textPrimary,
      fontWeight: '600' as const,
    },
    tabCount: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: 'rgba(160,149,133,0.12)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 5,
    },
    tabCountText: {
      ...typography.caption,
      fontSize: 10,
      fontWeight: '700' as const,
      color: c.textMuted,
    },

    // Albums scroll
    albumsScroll: {
      paddingHorizontal: spacing.lg,
      gap: 14,
      paddingBottom: 8,
    },
    albumCard: {
      width: ALBUM_CARD_W,
      alignItems: 'center' as const,
    },
    albumCardCover: {
      width: ALBUM_CARD_W,
      height: ALBUM_CARD_H,
      borderRadius: 10,
      overflow: 'hidden' as const,
      flexDirection: 'row' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    albumCardSpine: {
      width: 8,
    },
    albumCardTitle: {
      ...typography.body,
      color: c.textPrimary,
      fontWeight: '600' as const,
      fontSize: 13,
      marginTop: 10,
      textAlign: 'center' as const,
    },
    albumCardSub: {
      ...typography.caption,
      color: c.textMuted,
      fontSize: 11,
      marginTop: 2,
    },

    // Photos
    contentPad: {
      paddingHorizontal: spacing.lg,
    },
    aiHint: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: 'rgba(138,170,120,0.08)',
      marginBottom: 12,
    },
    aiHintText: {
      ...typography.caption,
      color: c.sage,
      fontWeight: '500' as const,
      fontSize: 12,
      flex: 1,
    },
    addPhotoBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 6,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: c.glassBorder,
      borderStyle: 'dashed' as const,
      marginBottom: 14,
    },
    addPhotoBtnText: {
      ...typography.caption,
      color: c.textSecondary,
      fontWeight: '500' as const,
      fontSize: 13,
    },
    photoGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 4,
      marginBottom: 16,
    },
    photoItem: {
      width: PHOTO_SIZE,
      height: PHOTO_SIZE,
      borderRadius: 8,
      overflow: 'visible' as const,
    },
    photoPlaceholder: {
      width: '100%' as const,
      height: '100%' as const,
      borderRadius: 8,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    photoRemoveBtn: {
      position: 'absolute' as const,
      top: -4,
      right: -4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      zIndex: 2,
    },

    // Empty
    emptyState: {
      alignItems: 'center' as const,
      paddingVertical: 40,
      gap: 10,
    },
    emptyText: {
      ...typography.body,
      color: c.textMuted,
      fontSize: 14,
    },

    // Delete
    deleteButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 6,
      paddingVertical: 14,
      marginTop: 12,
      marginBottom: 12,
      borderRadius: 12,
      backgroundColor: 'rgba(212,112,104,0.06)',
    },
    deleteButtonText: {
      ...typography.body,
      color: c.error,
      fontWeight: '500' as const,
      fontSize: 14,
    },
  }));

  if (!friend) {
    return (
      <View style={styles.root}>
        <WarmBackground />
        <Text style={styles.notFound}>친구를 찾을 수 없습니다</Text>
      </View>
    );
  }

  const sharedAlbums = albums.filter(a =>
    a.collaborators?.some(c => c.id === friend.id)
  );

  const handleDelete = useCallback(() => {
    Alert.alert(
      '정말 삭제할까요?',
      `${friend.name}님을 소중한 사람 목록에서 삭제합니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            deleteFriend(friend.id);
            navigation.goBack();
          },
        },
      ],
    );
  }, [friend, deleteFriend, navigation]);

  const handleRemovePhoto = useCallback((photoId: string) => {
    Alert.alert(
      '사진 제외',
      '이 사진을 함께 찍은 사진 목록에서 제외할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제외',
          onPress: () => setTogetherPhotos(prev => prev.filter(p => p.id !== photoId)),
        },
      ],
    );
  }, []);

  const handleAddPhoto = useCallback(() => {
    // In real app, this would open photo picker
    const newPhoto: TogetherPhoto = {
      id: `photo-new-${Date.now()}`,
      color: '#D4C8B8',
      imageUrl: `https://picsum.photos/seed/new-${Date.now()}/300/300`,
      date: '2026.03.09',
    };
    setTogetherPhotos(prev => [newPhoto, ...prev]);
  }, []);

  const bannerColor = friend.profileBgColor || '#D5CBBD';

  return (
    <View style={styles.root}>
      <WarmBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Banner --- */}
        <View style={[styles.banner, { height: BANNER_HEIGHT + insets.top }]}>
          <View style={[styles.bannerBg, { backgroundColor: bannerColor }]}>
            {friend.profileBgUrl ? (
              <Image
                source={{ uri: friend.profileBgUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={['rgba(255,255,255,0.12)', 'rgba(0,0,0,0.05)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            )}
          </View>
          <Pressable style={[styles.bgChangeBtn, { bottom: 12, right: 14 }]}>
            <ImageSquare size={16} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </View>

        {/* --- Header (over banner) --- */}
        <View style={[styles.headerOverlay, { paddingTop: insets.top + 8 }]}>
          <IconButton onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#FFF" />
          </IconButton>
          <View style={{ flex: 1 }} />
          <IconButton onPress={() => {}}>
            <PencilSimple size={22} color="#FFF" />
          </IconButton>
        </View>

        {/* --- Avatar --- */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <Avatar initial={friend.initial} color={friend.avatarColor} size={AVATAR_SIZE} imageUrl={friend.avatarUrl} />
          </View>
        </View>

        {/* --- Profile Info --- */}
        <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.infoSection}>
          <Text style={styles.name}>{friend.name}</Text>
          <View style={styles.tagRow}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{friend.tag}</Text>
            </View>
            {(friend.relation || friend.memo) && (
              <Text style={styles.subInfo}>{friend.relation || friend.memo}</Text>
            )}
          </View>
        </Animated.View>

        {/* --- Tab Toggle --- */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.tabBar}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'albums' && styles.tabBtnActive]}
            onPress={() => setActiveTab('albums')}
          >
            <BookOpen
              size={16}
              color={activeTab === 'albums' ? colors.textPrimary : colors.textMuted}
              weight={activeTab === 'albums' ? 'fill' : 'regular'}
            />
            <Text style={[styles.tabText, activeTab === 'albums' && styles.tabTextActive]}>
              함께 만든 앨범
            </Text>
            {sharedAlbums.length > 0 && (
              <View style={styles.tabCount}>
                <Text style={styles.tabCountText}>{sharedAlbums.length}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'photos' && styles.tabBtnActive]}
            onPress={() => setActiveTab('photos')}
          >
            <ImageSquare
              size={16}
              color={activeTab === 'photos' ? colors.textPrimary : colors.textMuted}
              weight={activeTab === 'photos' ? 'fill' : 'regular'}
            />
            <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>
              함께 찍은 사진
            </Text>
            {togetherPhotos.length > 0 && (
              <View style={styles.tabCount}>
                <Text style={styles.tabCountText}>{togetherPhotos.length}</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* --- Albums Tab --- */}
        {activeTab === 'albums' && (
          <Animated.View entering={FadeIn.duration(300)}>
            {sharedAlbums.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.albumsScroll}
              >
                {sharedAlbums.map((album, idx) => (
                  <Animated.View
                    key={album.id}
                    entering={FadeInDown.delay(idx * 60).duration(400)}
                  >
                    <Pressable
                      style={styles.albumCard}
                      onPress={() => setSelectedAlbum(album)}
                    >
                      <View style={[styles.albumCardCover, { backgroundColor: album.coverColor }]}>
                        <View style={[styles.albumCardSpine, { backgroundColor: album.spineColor }]} />
                        {album.coverImage ? (
                          <Image
                            source={{ uri: album.coverImage }}
                            style={[StyleSheet.absoluteFill, { left: 8 }]}
                            resizeMode="cover"
                          />
                        ) : (
                          <LinearGradient
                            colors={['rgba(255,255,255,0.15)', 'rgba(0,0,0,0.06)']}
                            style={[StyleSheet.absoluteFill, { left: 8 }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          />
                        )}
                      </View>
                      <Text style={styles.albumCardTitle} numberOfLines={2}>
                        {album.title}
                      </Text>
                      <Text style={styles.albumCardSub}>
                        {album.pageCount}p · {album.collaborators?.length || 1}명
                      </Text>
                    </Pressable>
                  </Animated.View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <BookOpen size={36} color={colors.textMuted} weight="thin" />
                <Text style={styles.emptyText}>아직 함께 만든 앨범이 없어요</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* --- Photos Tab --- */}
        {activeTab === 'photos' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.contentPad}>
            {/* AI hint */}
            <View style={styles.aiHint}>
              <Sparkle size={14} color={colors.sage} weight="fill" />
              <Text style={styles.aiHintText}>
                AI가 앨범에서 {friend.name}님과 함께 찍은 사진을 찾았어요
              </Text>
            </View>

            {/* Add photo button */}
            <Pressable style={styles.addPhotoBtn} onPress={handleAddPhoto}>
              <Plus size={16} color={colors.textSecondary} />
              <Text style={styles.addPhotoBtnText}>사진 추가하기</Text>
            </Pressable>

            {/* Photo grid */}
            {togetherPhotos.length > 0 ? (
              <View style={styles.photoGrid}>
                {togetherPhotos.map((photo, idx) => (
                  <Animated.View
                    key={photo.id}
                    entering={FadeIn.delay(idx * 30).duration(300)}
                  >
                    <View style={styles.photoItem}>
                      <View style={[styles.photoPlaceholder, { backgroundColor: photo.color }]}>
                        <Image
                          source={{ uri: photo.imageUrl }}
                          style={StyleSheet.absoluteFill}
                          resizeMode="cover"
                        />
                      </View>
                      {/* Remove button */}
                      <Pressable
                        style={styles.photoRemoveBtn}
                        onPress={() => handleRemovePhoto(photo.id)}
                      >
                        <Minus size={10} color="#FFF" weight="bold" />
                      </Pressable>
                    </View>
                  </Animated.View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <ImageSquare size={36} color={colors.textMuted} weight="thin" />
                <Text style={styles.emptyText}>함께 찍은 사진이 없어요</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* --- Delete --- */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.contentPad}>
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <TrashSimple size={18} color={colors.error} />
            <Text style={styles.deleteButtonText}>삭제하기</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* --- Album Detail Overlay --- */}
      {selectedAlbum && (
        <AlbumDetailOverlay
          album={selectedAlbum}
          onClose={() => setSelectedAlbum(null)}
          onView={() => {
            const albumId = selectedAlbum.id;
            setSelectedAlbum(null);
            navigation.navigate('AlbumViewer', { albumId });
          }}
          onEdit={() => {
            const albumId = selectedAlbum.id;
            setSelectedAlbum(null);
            const firstPageId = selectedAlbum.pages?.[0]?.id || `${albumId}-page-0`;
            navigation.navigate('AlbumEditor', { albumId, pageId: firstPageId });
          }}
        />
      )}
    </View>
  );
}
