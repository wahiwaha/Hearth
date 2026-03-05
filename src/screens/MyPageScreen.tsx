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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Palette,
  CloudArrowUp,
  HardDrives,
  ShieldCheck,
  Question,
  CaretRight,
  SignOut,
} from 'phosphor-react-native';
import { colors, typography, spacing } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { useAlbumStore } from '../store/AlbumStore';
import { useFriendStore } from '../store/FriendStore';
import { useAuthStore } from '../store/AuthStore';
import { useNotificationStore } from '../store/NotificationStore';
import { Avatar, GlassCard } from '../components/common';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  screen?: keyof RootStackParamList;
}

export function MyPageScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { albums } = useAlbumStore();
  const { friends } = useFriendStore();
  const { user, signOut } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const totalPhotos = albums.reduce((sum, a) => {
    const photoCount = a.pages?.reduce((ps, p) =>
      ps + p.elements.filter(e => e.type === 'photo').length, 0
    ) || 0;
    return sum + photoCount;
  }, 0);

  const menuItems: MenuItem[] = [
    { icon: <Bell size={20} color={colors.textSecondary} />, label: '알림 설정', screen: 'Notifications' },
    { icon: <Palette size={20} color={colors.textSecondary} />, label: '테마 변경', screen: 'ThemeSettings' },
    { icon: <CloudArrowUp size={20} color={colors.textSecondary} />, label: '백업 및 복원', screen: 'BackupRestore' },
    { icon: <HardDrives size={20} color={colors.textSecondary} />, label: '저장 공간', screen: 'StorageInfo' },
    { icon: <ShieldCheck size={20} color={colors.textSecondary} />, label: '개인정보 보호', screen: 'PrivacySettings' },
    { icon: <Question size={20} color={colors.textSecondary} />, label: '도움말', screen: 'HelpScreen' },
  ];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#FDFAF5', '#F7F2EA', '#F0E8DB', '#E8DFCF']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(600)}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>마이페이지</Text>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
        >
          <GlassCard style={styles.profileCard}>
            <Avatar initial={user?.initial || '게'} color={user?.avatarColor || colors.sage} size={72} />
            <Text style={styles.profileName}>{user?.displayName || '게스트'}</Text>
            <Text style={styles.profileBio}>{user?.email || '추억을 모으는 중'}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{albums.length}</Text>
                <Text style={styles.statLabel}>앨범</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{friends.length}</Text>
                <Text style={styles.statLabel}>친구</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalPhotos}</Text>
                <Text style={styles.statLabel}>사진</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Menu items */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(500)}
        >
          <GlassCard style={styles.menuCard} padding={0}>
            {menuItems.map((item, index) => (
              <Pressable
                key={item.label}
                style={[
                  styles.menuRow,
                  index < menuItems.length - 1 && styles.menuRowBorder,
                ]}
                onPress={() => {
                  if (item.screen) {
                    navigation.navigate(item.screen as any);
                  }
                }}
              >
                {item.icon}
                <Text style={styles.menuLabel}>{item.label}</Text>
                <CaretRight size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </GlassCard>
        </Animated.View>

        {/* Sign out */}
        {user && (
          <Animated.View entering={FadeInDown.delay(450).duration(500)}>
            <Pressable
              style={styles.signOutBtn}
              onPress={async () => {
                await signOut();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              }}
            >
              <SignOut size={20} color="#E57373" />
              <Text style={styles.signOutText}>로그아웃</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* App info */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(500)}
          style={styles.appInfo}
        >
          <Text style={styles.appName}>Hearth</Text>
          <Text style={styles.appVersion}>v0.1.0</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { ...typography.title, color: colors.textPrimary, fontSize: 24 },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingHorizontal: spacing.lg },

  // Profile card
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileName: { ...typography.subtitle, color: colors.textPrimary, marginTop: 12 },
  profileBio: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    justifyContent: 'center',
  },
  statItem: { alignItems: 'center', paddingHorizontal: 24 },
  statNumber: { ...typography.subtitle, color: colors.textPrimary, fontWeight: '700' },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.textMuted, opacity: 0.2 },

  // Menu
  menuCard: { marginTop: 16 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(155, 139, 123, 0.15)',
  },
  menuLabel: { ...typography.body, color: colors.textPrimary, flex: 1, marginLeft: 14 },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 16,
  },
  signOutText: {
    ...typography.body,
    color: '#E57373',
    fontWeight: '500',
  },

  // App info
  appInfo: { alignItems: 'center', marginTop: 32 },
  appName: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 2,
  },
  appVersion: { ...typography.caption, color: colors.textMuted, opacity: 0.5, marginTop: 4 },
});
