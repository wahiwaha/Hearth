import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  UserPlus,
  Camera,
  Heart,
  Checks,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '../theme';
import { WarmBackground, IconButton, Avatar } from '../components/common';
import { useNotificationStore, NotificationType } from '../store/NotificationStore';
import { RootStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const notificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'album_invite': return <BookOpen size={16} color={colors.warmWhite} />;
    case 'photo_added': return <Camera size={16} color={colors.warmWhite} />;
    case 'friend_request': return <UserPlus size={16} color={colors.warmWhite} />;
    case 'album_update': return <Heart size={16} color={colors.warmWhite} />;
    case 'reminder': return <Bell size={16} color={colors.warmWhite} />;
  }
};

const notificationColor = (type: NotificationType) => {
  switch (type) {
    case 'album_invite': return colors.accent;
    case 'photo_added': return colors.sage;
    case 'friend_request': return colors.dustyRose;
    case 'album_update': return '#7B8FA3';
    case 'reminder': return '#D4A855';
  }
};

function formatTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return `${Math.floor(days / 7)}주 전`;
}

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const handleNotifPress = useCallback((notif: typeof notifications[0]) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    if (notif.albumId) {
      navigation.navigate('AlbumViewer', { albumId: notif.albumId });
    } else if (notif.friendId) {
      navigation.navigate('FriendProfile', { friendId: notif.friendId });
    }
  }, [markAsRead, navigation]);

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [markAllAsRead]);

  return (
    <View style={styles.root}>
      <WarmBackground />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </IconButton>
        <Text style={styles.headerTitle}>알림</Text>
        {unreadCount > 0 ? (
          <IconButton onPress={handleMarkAllRead}>
            <Checks size={22} color={colors.accent} />
          </IconButton>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {notifications.map((notif, index) => (
          <Animated.View
            key={notif.id}
            entering={FadeInDown.delay(50 + index * 60).duration(400)}
          >
            <Pressable
              style={[
                styles.notifRow,
                !notif.read && styles.notifUnread,
              ]}
              onPress={() => handleNotifPress(notif)}
            >
              <View style={styles.notifAvatarContainer}>
                <Avatar initial={notif.avatarInitial} color={notif.avatarColor} size={44} />
                <View style={[styles.notifTypeBadge, { backgroundColor: notificationColor(notif.type) }]}>
                  {notificationIcon(notif.type)}
                </View>
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>{notif.title}</Text>
                <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
                <Text style={styles.notifTime}>{formatTime(notif.time)}</Text>
              </View>
              {!notif.read && <View style={styles.unreadDot} />}
            </Pressable>
          </Animated.View>
        ))}

        {notifications.length === 0 && (
          <View style={styles.empty}>
            <Bell size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>새로운 알림이 없어요</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg },

  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  notifUnread: {
    backgroundColor: 'rgba(196, 139, 53, 0.06)',
  },
  notifAvatarContainer: {
    position: 'relative',
  },
  notifTypeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.warmWhite,
  },
  notifContent: { flex: 1, marginLeft: 14 },
  notifTitle: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  notifMessage: { ...typography.body, color: colors.textPrimary, fontSize: 14, marginTop: 2, lineHeight: 20 },
  notifTime: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 6,
  },

  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 16,
  },
});
