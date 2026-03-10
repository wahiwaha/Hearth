import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Share,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  X,
  MagnifyingGlass,
  Check,
  PaperPlaneTilt,
  Link,
  ChatCircle,
} from 'phosphor-react-native';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { RootStackParamList } from '../types/navigation';
import { useFriendStore } from '../store/FriendStore';
import { useAlbumStore } from '../store/AlbumStore';
import { WarmBackground, GlassCard, IconButton, Avatar } from '../components/common';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'InviteCollaborator'>;

export function InviteCollaboratorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { friends } = useFriendStore();
  const { getAlbum, addCollaborator } = useAlbumStore();

  const album = getAlbum(route.params.albumId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const styles = useThemedStyles((c) => ({
    root: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    headerTitle: { ...typography.subtitle, color: c.textPrimary },

    // Search
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: c.cardBg,
      borderRadius: 12,
      gap: 10,
    },
    searchInput: {
      ...typography.body,
      color: c.textPrimary,
      flex: 1,
    },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.lg },

    // External invite
    section: { marginBottom: spacing.md },
    externalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    externalIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    externalText: { flex: 1, marginLeft: 14 },
    externalLabel: { ...typography.body, color: c.textPrimary, fontWeight: '500' },
    externalDesc: { ...typography.caption, color: c.textMuted, marginTop: 1 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.divider, marginVertical: 4 },

    // Friend list
    friendListTitle: {
      ...typography.label,
      color: c.textSecondary,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    friendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    friendInfo: { flex: 1, marginLeft: 12 },
    friendName: { ...typography.body, color: c.textPrimary, fontWeight: '500' },
    friendSub: { ...typography.caption, color: c.textMuted, marginTop: 1 },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.textMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxActive: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    emptyText: {
      ...typography.body,
      color: c.textMuted,
      textAlign: 'center',
      paddingVertical: 24,
    },

    // Bottom bar
    bottomBar: {
      paddingHorizontal: spacing.lg,
      paddingTop: 12,
      backgroundColor: c.cardBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    inviteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.accent,
      paddingVertical: 16,
      borderRadius: 14,
    },
    inviteButtonText: { ...typography.body, color: c.warmWhite, fontWeight: '600' },
  }));

  const filteredFriends = useMemo(() => {
    const existingIds = new Set(album?.collaborators?.map(c => c.id) || []);
    const available = friends.filter(f => !existingIds.has(f.id));
    if (!searchQuery.trim()) return available;
    const q = searchQuery.toLowerCase();
    return available.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.memo?.toLowerCase().includes(q)
    );
  }, [friends, album, searchQuery]);

  const toggleSelection = useCallback((friendId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(friendId)) next.delete(friendId);
      else next.add(friendId);
      return next;
    });
  }, []);

  const handleInvite = useCallback(() => {
    if (!album) return;
    selectedIds.forEach(friendId => {
      const friend = friends.find(f => f.id === friendId);
      if (friend) {
        addCollaborator(album.id, friend.id, friend.name, friend.initial, friend.avatarColor);
      }
    });
    navigation.goBack();
  }, [album, selectedIds, friends, addCollaborator, navigation]);

  const handleShareLink = useCallback(async () => {
    try {
      await Share.share({
        message: `"${album?.title}" 앨범에 초대합니다! Hearth에서 함께 추억을 꾸며봐요 🏠\nhttps://hearth.app/invite/${album?.id}`,
      });
    } catch {}
  }, [album]);

  if (!album) return null;

  return (
    <View style={styles.root}>
      <WarmBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton onPress={() => navigation.goBack()}>
          <X size={24} color={colors.textPrimary} />
        </IconButton>
        <Text style={styles.headerTitle}>참여자 초대</Text>
        <IconButton
          onPress={handleInvite}
          disabled={selectedIds.size === 0}
        >
          <Check
            size={24}
            color={selectedIds.size > 0 ? colors.accent : colors.textMuted}
            weight="bold"
          />
        </IconButton>
      </View>

      {/* Search */}
      <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.searchContainer}>
        <MagnifyingGlass size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="이름으로 검색"
          placeholderTextColor={colors.textMuted}
        />
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* External invite options */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <GlassCard style={styles.section}>
            <Pressable style={styles.externalRow} onPress={handleShareLink}>
              <View style={[styles.externalIcon, { backgroundColor: colors.sage }]}>
                <Link size={18} color={colors.warmWhite} />
              </View>
              <View style={styles.externalText}>
                <Text style={styles.externalLabel}>초대 링크 공유</Text>
                <Text style={styles.externalDesc}>링크를 보내 초대할 수 있어요</Text>
              </View>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.externalRow} onPress={handleShareLink}>
              <View style={[styles.externalIcon, { backgroundColor: colors.dustyRose }]}>
                <ChatCircle size={18} color={colors.warmWhite} />
              </View>
              <View style={styles.externalText}>
                <Text style={styles.externalLabel}>메시지로 초대</Text>
                <Text style={styles.externalDesc}>카카오톡이나 문자로 보낼 수 있어요</Text>
              </View>
            </Pressable>
          </GlassCard>
        </Animated.View>

        {/* Friend list */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Text style={styles.friendListTitle}>내 친구</Text>
          {filteredFriends.map((friend) => (
            <Pressable
              key={friend.id}
              style={styles.friendRow}
              onPress={() => toggleSelection(friend.id)}
            >
              <Avatar initial={friend.initial} color={friend.avatarColor} size={40} />
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Text style={styles.friendSub}>
                  {friend.tag}
                  {friend.isAppUser ? '' : ' · 미가입'}
                </Text>
              </View>
              <View style={[
                styles.checkbox,
                selectedIds.has(friend.id) && styles.checkboxActive,
              ]}>
                {selectedIds.has(friend.id) && (
                  <Check size={14} color={colors.warmWhite} weight="bold" />
                )}
              </View>
            </Pressable>
          ))}

          {filteredFriends.length === 0 && (
            <Text style={styles.emptyText}>
              {searchQuery ? '검색 결과가 없습니다' : '초대할 수 있는 친구가 없습니다'}
            </Text>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom action */}
      {selectedIds.size > 0 && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}
        >
          <Pressable style={styles.inviteButton} onPress={handleInvite}>
            <PaperPlaneTilt size={20} color={colors.warmWhite} />
            <Text style={styles.inviteButtonText}>
              {selectedIds.size}명 초대하기
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

