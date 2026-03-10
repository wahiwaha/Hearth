import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  Bell,
  Palette,
  Translate,
  CloudArrowUp,
  HardDrives,
  ShieldCheck,
  Question,
  CaretRight,
  SignOut,
  Camera,
  PencilSimple,
  X,
  Check,
  ImageSquare,
} from 'phosphor-react-native';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { RootStackParamList } from '../types/navigation';
import { useAlbumStore } from '../store/AlbumStore';
import { useFriendStore } from '../store/FriendStore';
import { useAuthStore } from '../store/AuthStore';
import { useNotificationStore } from '../store/NotificationStore';
import { StorageService } from '../services/firebase';
import { Avatar, GlassCard, WarmBackground } from '../components/common';
import { useT } from '../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_WIDTH = SCREEN_WIDTH - 44; // frameOuter(32) + coverWrap margin(12)
const COVER_HEIGHT = Math.round(COVER_WIDTH * 9 / 16); // 16:9 비율
const AVATAR_SIZE = 88;
const AVATAR_OVERLAP = AVATAR_SIZE / 2;

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  screen?: keyof RootStackParamList;
  badge?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MyPageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { albums } = useAlbumStore();
  const { friends } = useFriendStore();
  const { user, signOut, updateProfile } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const t = useT();
  const styles = useThemedStyles(createStyles);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');

  const totalPhotos = useMemo(() => albums.reduce((sum, a) => {
    const photoCount = a.pages?.reduce((ps, p) =>
      ps + p.elements.filter(e => e.type === 'photo').length, 0
    ) || 0;
    return sum + photoCount;
  }, 0), [albums]);

  /* ─── Photo Pickers ─── */
  const pickImage = useCallback(async (type: 'profile' | 'cover') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      // 캐시 방지: 타임스탬프 쿼리 파라미터 추가
      const localUri = result.assets[0].uri;
      const cacheBustedUri = localUri.includes('?')
        ? `${localUri}&_t=${Date.now()}`
        : `${localUri}?_t=${Date.now()}`;
      // 로컬에 즉시 반영
      if (type === 'profile') {
        updateProfile({ photoURL: cacheBustedUri });
      } else {
        updateProfile({ coverURL: cacheBustedUri });
      }
      // Firebase Storage에 업로드 (백그라운드)
      if (user?.uid) {
        const upload = type === 'profile'
          ? StorageService.uploadProfilePhoto(user.uid, localUri)
          : StorageService.uploadCoverPhoto(user.uid, localUri);
        upload.then(downloadURL => {
          if (type === 'profile') {
            updateProfile({ photoURL: downloadURL });
          } else {
            updateProfile({ coverURL: downloadURL });
          }
        }).catch((err) => {
          console.warn('Photo upload failed:', err);
        });
      }
    }
  }, [updateProfile, user?.uid]);

  /* ─── Edit Profile Mode ─── */
  const handleStartEdit = useCallback(() => {
    setEditName(user?.displayName || '');
    setIsEditing(true);
  }, [user?.displayName]);

  const handleSaveEdit = useCallback(() => {
    const trimmed = editName.trim();
    if (trimmed.length === 0) {
      Alert.alert('이름을 입력해주세요');
      return;
    }
    updateProfile({ displayName: trimmed, initial: trimmed[0] });
    setIsEditing(false);
  }, [editName, updateProfile]);

  const handleCancelEdit = useCallback(() => {
    setEditName(user?.displayName || '');
    setIsEditing(false);
  }, [user?.displayName]);

  const settingsItems: MenuItem[] = [
    { icon: <Bell size={20} color={colors.accent} />, label: t.notificationSettings, screen: 'Notifications', badge: unreadCount > 0 ? unreadCount : undefined },
    { icon: <Palette size={20} color={colors.accent} />, label: t.themeChange, screen: 'ThemeSettings' },
    { icon: <Translate size={20} color={colors.accent} />, label: t.languageChange, screen: 'LanguageSettings' },
  ];

  const dataItems: MenuItem[] = [
    { icon: <CloudArrowUp size={20} color={colors.accent} />, label: t.backupRestore },
    { icon: <HardDrives size={20} color={colors.accent} />, label: t.storage },
  ];

  const supportItems: MenuItem[] = [
    { icon: <ShieldCheck size={20} color={colors.accent} />, label: t.privacy },
    { icon: <Question size={20} color={colors.accent} />, label: t.help },
  ];

  return (
    <View style={styles.root}>
      <WarmBackground />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.headerWrap, { paddingTop: insets.top }]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.myPage}</Text>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Vintage Frame Profile ─── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.profileSection}>
            {/* Ornate frame around cover */}
            <View style={styles.frameOuter}>
              {/* Frame border — wood/gold effect */}
              <LinearGradient
                colors={['#B8A080', '#A08A68', '#8A7458', '#7A6448', '#8A7458', '#A08A68']}
                style={styles.frameBorder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              {/* Frame inner bevel */}
              <View style={styles.frameInnerBevel} pointerEvents="none">
                <LinearGradient
                  colors={['rgba(255,240,210,0.15)', 'rgba(0,0,0,0.05)']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              </View>

              {/* Cover Photo inside frame */}
              <View style={styles.coverWrap}>
                {user?.coverURL ? (
                  <Image key={user.coverURL} source={{ uri: user.coverURL, cache: 'reload' }} style={styles.coverImage} resizeMode="cover" />
                ) : (
                  <LinearGradient
                    colors={['#C4A882', '#A89070', '#8E7860']}
                    style={styles.coverImage}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                {/* Warm amber glow */}
                <LinearGradient
                  colors={['rgba(212, 168, 80, 0.12)', 'transparent', 'rgba(0,0,0,0.12)']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.8, y: 1 }}
                />
                {/* Edit cover button */}
                {isEditing && (
                  <Pressable style={styles.editCoverBtn} onPress={() => pickImage('cover')}>
                    <ImageSquare size={16} color="#FFF" weight="bold" />
                  </Pressable>
                )}
              </View>

              {/* Frame corner ornaments */}
              <View style={[styles.frameCorner, styles.frameCornerTL]} pointerEvents="none" />
              <View style={[styles.frameCorner, styles.frameCornerTR]} pointerEvents="none" />
              <View style={[styles.frameCorner, styles.frameCornerBL]} pointerEvents="none" />
              <View style={[styles.frameCorner, styles.frameCornerBR]} pointerEvents="none" />
            </View>

            {/* Avatar — overlapping frame bottom edge */}
            <View style={styles.avatarAnchor}>
              <View style={styles.avatarOuterRing}>
                <Avatar
                  initial={user?.initial || t.guest[0]}
                  color={user?.avatarColor || colors.sage}
                  imageUrl={user?.photoURL}
                  size={AVATAR_SIZE}
                />
              </View>
              {isEditing && (
                <Pressable style={styles.avatarEditBtn} onPress={() => pickImage('profile')}>
                  <Camera size={14} color="#FFF" weight="fill" />
                </Pressable>
              )}
            </View>

            {/* Name + Email — centered below avatar */}
            <View style={styles.identityWrap}>
              {isEditing ? (
                <TextInput
                  style={styles.nameInput}
                  value={editName}
                  onChangeText={setEditName}
                  autoFocus
                  maxLength={20}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveEdit}
                  textAlign="center"
                />
              ) : (
                <Text style={styles.profileName}>{user?.displayName || t.guest}</Text>
              )}
              <Text style={styles.profileEmail}>{user?.email || t.collectingMemories}</Text>
            </View>

            {/* Edit Profile Button / Save-Cancel */}
            {isEditing ? (
              <View style={styles.editActions}>
                <Pressable style={styles.saveBtn} onPress={handleSaveEdit}>
                  <Check size={16} color="#FFF" weight="bold" />
                  <Text style={styles.saveBtnText}>저장</Text>
                </Pressable>
                <Pressable style={styles.cancelBtn} onPress={handleCancelEdit}>
                  <X size={16} color={colors.textSecondary} weight="bold" />
                  <Text style={styles.cancelBtnText}>취소</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.editProfileBtn} onPress={handleStartEdit}>
                <PencilSimple size={14} color={colors.textSecondary} />
                <Text style={styles.editProfileText}>{t.editProfile}</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* ─── Stats ─── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.sectionWrap}>
          <GlassCard style={styles.statsCard} padding={0} variant="stats">
            <View style={styles.statsRow}>
              <Pressable style={styles.statItem}>
                <Text style={styles.statNumber}>{albums.length}</Text>
                <Text style={styles.statLabel}>{t.albums}</Text>
              </Pressable>
              <View style={styles.statDivider} />
              <Pressable style={styles.statItem} onPress={() => navigation.navigate('Friends' as any)}>
                <Text style={styles.statNumber}>{friends.length}</Text>
                <Text style={styles.statLabel}>{t.friends}</Text>
              </Pressable>
              <View style={styles.statDivider} />
              <Pressable style={styles.statItem}>
                <Text style={styles.statNumber}>{totalPhotos}</Text>
                <Text style={styles.statLabel}>{t.photosLabel}</Text>
              </Pressable>
            </View>
          </GlassCard>
        </Animated.View>

        {/* ─── Settings ─── */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.sectionWrap}>
          <GlassCard padding={0}>
            {settingsItems.map((item, index) => (
              <MenuRow
                key={item.label}
                item={item}
                isLast={index === settingsItems.length - 1}
                onPress={() => { if (item.screen) navigation.navigate(item.screen as any); }}
              />
            ))}
          </GlassCard>
        </Animated.View>

        {/* ─── Data ─── */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.sectionWrap}>
          <GlassCard padding={0}>
            {dataItems.map((item, index) => (
              <MenuRow
                key={item.label}
                item={item}
                isLast={index === dataItems.length - 1}
                onPress={() => { if (item.screen) navigation.navigate(item.screen as any); }}
              />
            ))}
          </GlassCard>
        </Animated.View>

        {/* ─── Support ─── */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.sectionWrap}>
          <GlassCard padding={0}>
            {supportItems.map((item, index) => (
              <MenuRow
                key={item.label}
                item={item}
                isLast={index === supportItems.length - 1}
                onPress={() => { if (item.screen) navigation.navigate(item.screen as any); }}
              />
            ))}
          </GlassCard>
        </Animated.View>

        {/* ─── Sign Out ─── */}
        <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.sectionWrap}>
          <GlassCard padding={0}>
            <Pressable
              style={styles.signOutRow}
              onPress={async () => {
                await signOut();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              }}
            >
              <View style={styles.signOutIconWrap}>
                <SignOut size={20} color={colors.dustyRose} />
              </View>
              <Text style={styles.signOutText}>{t.signOut}</Text>
              <CaretRight size={14} color={colors.dustyRose} />
            </Pressable>
          </GlassCard>
        </Animated.View>

        {/* ─── App Info ─── */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.appInfo}>
          <Text style={styles.appName}>Hearth</Text>
          <Text style={styles.appVersion}>v0.1.0</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/* ─── Menu Row ─── */
function MenuRow({ item, isLast, onPress }: { item: MenuItem; isLast: boolean; onPress: () => void }) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pressed.value, [0, 1], [1, 0.92]),
    backgroundColor: interpolate(pressed.value, [0, 1], [0, 1]) > 0.5 ? 'rgba(160, 140, 110, 0.06)' : 'transparent',
  }));

  return (
    <AnimatedPressable
      style={[styles.menuRow, !isLast && styles.menuRowBorder, animStyle]}
      onPress={onPress}
      onPressIn={() => { pressed.value = withSpring(1, { damping: 25, stiffness: 500 }); }}
      onPressOut={() => { pressed.value = withSpring(0, { damping: 20, stiffness: 400 }); }}
    >
      <View style={styles.menuIconWrap}>{item.icon}</View>
      <Text style={styles.menuLabel}>{item.label}</Text>
      {item.badge && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{item.badge}</Text>
        </View>
      )}
      <CaretRight size={14} color={colors.textMuted} />
    </AnimatedPressable>
  );
}

const createStyles = (c: ReturnType<typeof useColors>) => ({
  root: { flex: 1 } as const,

  // Header
  headerWrap: { zIndex: 10 } as const,
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  headerTitle: { ...typography.title, color: c.textPrimary, fontSize: 20 },

  scrollView: { flex: 1 } as const,
  sectionWrap: { paddingHorizontal: spacing.lg, marginTop: 12 },

  // ─── Profile Section ───
  profileSection: {
    alignItems: 'center' as const,
  },

  // Vintage frame
  frameOuter: {
    width: SCREEN_WIDTH - 32,
    alignSelf: 'center' as const,
    borderRadius: 6,
    overflow: 'hidden' as const,
    shadowColor: '#3A2A18',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 14,
    elevation: 8,
  },
  frameBorder: {
    ...StyleSheet.absoluteFillObject,
  },
  frameInnerBevel: {
    position: 'absolute' as const,
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(180,160,130,0.20)',
    zIndex: 2,
  },
  frameCorner: {
    position: 'absolute' as const,
    width: 14,
    height: 14,
    borderColor: 'rgba(255,240,210,0.18)',
    zIndex: 3,
  },
  frameCornerTL: {
    top: 6,
    left: 6,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopLeftRadius: 2,
  },
  frameCornerTR: {
    top: 6,
    right: 6,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopRightRadius: 2,
  },
  frameCornerBL: {
    bottom: 6,
    left: 6,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomLeftRadius: 2,
  },
  frameCornerBR: {
    bottom: 6,
    right: 6,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomRightRadius: 2,
  },
  // Cover inside frame
  coverWrap: {
    margin: 6,
    height: COVER_HEIGHT,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  coverImage: {
    width: '100%' as const,
    height: '100%' as const,
  },
  editCoverBtn: {
    position: 'absolute' as const,
    bottom: 10,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  // Avatar — centered, overlapping cover
  avatarAnchor: {
    alignItems: 'center' as const,
    marginTop: -AVATAR_OVERLAP,
  },
  avatarOuterRing: {
    borderRadius: (AVATAR_SIZE + 8) / 2,
    padding: 4,
    backgroundColor: c.background,
  },
  avatarEditBtn: {
    position: 'absolute' as const,
    bottom: 4,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.accent,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2.5,
    borderColor: c.background,
  },

  // Identity
  identityWrap: {
    alignItems: 'center' as const,
    marginTop: 12,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: c.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center' as const,
  },
  nameInput: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: c.textPrimary,
    letterSpacing: -0.3,
    borderBottomWidth: 1.5,
    borderBottomColor: c.accent,
    paddingVertical: 4,
    paddingHorizontal: 12,
    minWidth: 120,
  },
  profileEmail: {
    ...typography.body,
    color: c.textMuted,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center' as const,
  },

  // Edit Profile Button
  editProfileBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(160, 140, 110, 0.25)',
    backgroundColor: 'rgba(255, 250, 242, 0.6)',
  },
  editProfileText: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600' as const,
    color: c.textSecondary,
  },

  // Edit mode actions
  editActions: {
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: 14,
  },
  saveBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: c.sage,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  cancelBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(160, 140, 110, 0.25)',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: c.textSecondary,
  },

  // ─── Stats ───
  statsCard: {},
  statsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 18,
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: c.accent,
    letterSpacing: -0.5,
  },
  statLabel: {
    ...typography.caption,
    color: c.textMuted,
    marginTop: 3,
    fontSize: 11,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: c.textMuted,
    opacity: 0.2,
  },

  // ─── Menu ───
  menuRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(160, 140, 110, 0.10)',
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(196, 146, 66, 0.08)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  menuLabel: {
    ...typography.body,
    color: c.textPrimary,
    flex: 1,
    marginLeft: 12,
    fontWeight: '500' as const,
  },
  menuBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: c.dustyRose,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 6,
    marginRight: 8,
  },
  menuBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700' as const,
  },

  // ─── Sign Out ───
  signOutRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  signOutIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(196, 134, 142, 0.08)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  signOutText: {
    ...typography.body,
    color: c.dustyRose,
    fontWeight: '500' as const,
    marginLeft: 12,
    flex: 1,
  },

  // ─── App Info ───
  appInfo: { alignItems: 'center' as const, marginTop: 28 },
  appName: {
    ...typography.caption,
    color: c.accent,
    fontWeight: '700' as const,
    letterSpacing: 4,
    textTransform: 'uppercase' as const,
  },
  appVersion: {
    ...typography.caption,
    color: c.textMuted,
    opacity: 0.4,
    marginTop: 4,
  },
});
