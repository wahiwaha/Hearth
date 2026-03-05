import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  ChatCircle,
  BookOpen,
  Camera,
  PaperPlaneTilt,
  PencilSimple,
} from 'phosphor-react-native';
import { colors, typography, spacing } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { useFriendStore } from '../store/FriendStore';
import { useAlbumStore } from '../store/AlbumStore';
import { WarmBackground, Avatar, GlassCard, IconButton } from '../components/common';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'FriendProfile'>;

export function FriendProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { getFriend } = useFriendStore();
  const { albums } = useAlbumStore();

  const friend = getFriend(route.params.friendId);

  if (!friend) {
    return (
      <View style={styles.root}>
        <WarmBackground />
        <Text style={styles.notFound}>친구를 찾을 수 없습니다</Text>
      </View>
    );
  }

  // Shared albums with this friend
  const sharedAlbums = albums.filter(a =>
    a.collaborators?.some(c => c.id === friend.id)
  );

  return (
    <View style={styles.root}>
      <WarmBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </IconButton>
        <View style={{ flex: 1 }} />
        <IconButton onPress={() => {}}>
          <PencilSimple size={22} color={colors.textPrimary} />
        </IconButton>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.profileSection}>
          <Avatar initial={friend.initial} color={friend.avatarColor} size={80} />
          <Text style={styles.name}>{friend.name}</Text>
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{friend.tag}</Text>
          </View>
          {(friend.relation || friend.memo) && (
            <Text style={styles.subInfo}>{friend.relation || friend.memo}</Text>
          )}

          {/* Quick stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{friend.sharedAlbumCount || 0}</Text>
              <Text style={styles.statLabel}>공유 앨범</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{friend.photoCount || 0}</Text>
              <Text style={styles.statLabel}>함께 찍은 사진</Text>
            </View>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn}>
              <View style={[styles.actionIcon, { backgroundColor: colors.sage }]}>
                <BookOpen size={20} color={colors.warmWhite} />
              </View>
              <Text style={styles.actionLabel}>앨범 만들기</Text>
            </Pressable>
            <Pressable style={styles.actionBtn}>
              <View style={[styles.actionIcon, { backgroundColor: colors.dustyRose }]}>
                <Camera size={20} color={colors.warmWhite} />
              </View>
              <Text style={styles.actionLabel}>사진 보내기</Text>
            </Pressable>
            <Pressable style={styles.actionBtn}>
              <View style={[styles.actionIcon, { backgroundColor: colors.accent }]}>
                <PaperPlaneTilt size={20} color={colors.warmWhite} />
              </View>
              <Text style={styles.actionLabel}>초대하기</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* App user status */}
        {!friend.isAppUser && (
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <GlassCard style={styles.inviteCard}>
              <Text style={styles.inviteTitle}>
                {friend.name}님은 아직 Hearth를 사용하고 있지 않아요
              </Text>
              <Pressable style={styles.inviteButton}>
                <PaperPlaneTilt size={16} color={colors.warmWhite} />
                <Text style={styles.inviteButtonText}>초대 메시지 보내기</Text>
              </Pressable>
            </GlassCard>
          </Animated.View>
        )}

        {/* Shared albums */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>함께 만든 앨범</Text>
            {sharedAlbums.length > 0 ? (
              sharedAlbums.map((album) => (
                <Pressable
                  key={album.id}
                  style={styles.albumRow}
                  onPress={() => navigation.navigate('AlbumViewer', { albumId: album.id })}
                >
                  <View style={[styles.albumThumb, { backgroundColor: album.coverColor }]}>
                    <View style={[styles.albumThumbSpine, { backgroundColor: album.spineColor }]} />
                  </View>
                  <View style={styles.albumInfo}>
                    <Text style={styles.albumTitle}>{album.title}</Text>
                    <Text style={styles.albumSub}>{album.pageCount}페이지</Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyAlbums}>
                아직 함께 만든 앨범이 없어요
              </Text>
            )}
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </View>
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
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg },

  // Profile
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  name: {
    ...typography.title,
    color: colors.textPrimary,
    marginTop: 12,
    fontSize: 24,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(196, 139, 53, 0.12)',
    marginTop: 8,
  },
  tagText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  subInfo: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  statItem: { alignItems: 'center', paddingHorizontal: 28 },
  statNumber: { ...typography.subtitle, color: colors.textPrimary, fontWeight: '700' },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.textMuted, opacity: 0.2 },

  // Actions
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: spacing.lg,
  },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },

  // Invite
  inviteCard: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  inviteTitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dustyRose,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  inviteButtonText: {
    ...typography.body,
    color: colors.warmWhite,
    fontWeight: '500',
    fontSize: 14,
  },

  // Shared albums
  section: { marginBottom: spacing.md },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  albumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  albumThumb: {
    width: 44,
    height: 56,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  albumThumbSpine: {
    width: 4,
  },
  albumInfo: {
    flex: 1,
    marginLeft: 12,
  },
  albumTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  albumSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyAlbums: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
