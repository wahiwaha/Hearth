import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Keyboard,
  Image,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  X,
  Check,
  MagnifyingGlass,
  Heart,
  CheckCircle,
  LinkSimple,
  Camera,
} from 'phosphor-react-native';
import * as ImagePicker from 'expo-image-picker';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { RootStackParamList } from '../types/navigation';
import { useFriendStore } from '../store/FriendStore';
import { FriendTag } from '../types/friend';
import { WarmBackground, GlassCard, IconButton, Avatar } from '../components/common';
import { useT } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type AddFriendRoute = RouteProp<RootStackParamList, 'AddFriend'>;

const AVATAR_COLORS = [
  '#C4919A', '#7B8FA3', '#92A888', '#D4A855',
  '#A898B8', '#B8917A', '#859C78', '#5B6E85',
];

/* --- Mock Hearth users for account matching --- */
interface HearthUser {
  id: string;
  name: string;
  username: string;
  avatarColor: string;
  initial: string;
}

const MOCK_HEARTH_USERS: HearthUser[] = [
  { id: 'hu-1', name: '김하늘', username: 'haneul_k', avatarColor: '#C4919A', initial: '하' },
  { id: 'hu-2', name: '이서준', username: 'seojun.lee', avatarColor: '#7B8FA3', initial: '서' },
  { id: 'hu-3', name: '박지민', username: 'jimin_park', avatarColor: '#92A888', initial: '지' },
  { id: 'hu-4', name: '정다은', username: 'daeun.j', avatarColor: '#D4A855', initial: '다' },
  { id: 'hu-5', name: '최윤서', username: 'yunseo_c', avatarColor: '#A898B8', initial: '윤' },
  { id: 'hu-6', name: '강민지', username: 'minji.kang', avatarColor: '#B8917A', initial: '민' },
  { id: 'hu-7', name: '한소율', username: 'soyul.han', avatarColor: '#859C78', initial: '소' },
  { id: 'hu-8', name: '윤채원', username: 'chaewon.y', avatarColor: '#5B6E85', initial: '채' },
];

/* --- Account Search Result --- */
function AccountResult({
  user,
  onPress,
}: {
  user: HearthUser;
  onPress: () => void;
}) {
  const colors = useColors();
  const styles = useThemedStyles((c) => ({
    accountResult: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: 8,
      paddingHorizontal: 8,
      gap: 10,
      borderRadius: 10,
    },
    accountInfo: {
      flex: 1,
    },
    accountName: {
      ...typography.body,
      color: c.textPrimary,
      fontWeight: '600' as const,
      fontSize: 14,
    },
    accountHandle: {
      ...typography.caption,
      color: c.textMuted,
      fontSize: 11,
    },
  }));

  return (
    <Pressable style={styles.accountResult} onPress={onPress}>
      <Avatar initial={user.initial} color={user.avatarColor} size={36} />
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{user.name}</Text>
        <Text style={styles.accountHandle}>@{user.username}</Text>
      </View>
    </Pressable>
  );
}

/* ===============================================
   AddFriendScreen
   =============================================== */
export function AddFriendScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<AddFriendRoute>();
  const { addFriend } = useFriendStore();
  const t = useT();

  const presetTag = route.params?.tag;
  const isCustomTag = presetTag ? !['가족', '연인', '친구'].includes(presetTag) : false;
  const displayTag = presetTag ? (t.tagMap[presetTag] || presetTag) : t.tagMap['친구'];

  const [name, setName] = useState('');
  const [selectedTag, setSelectedTag] = useState<FriendTag>(
    (presetTag as FriendTag) || '친구',
  );
  const [relation, setRelation] = useState('');
  const [memo, setMemo] = useState('');
  const [customProfileUri, setCustomProfileUri] = useState<string | null>(null);

  // Account matching
  const [accountQuery, setAccountQuery] = useState('');
  const [linkedUser, setLinkedUser] = useState<HearthUser | null>(null);
  const [showAccountSearch, setShowAccountSearch] = useState(false);

  const accountResults = useMemo(() => {
    if (accountQuery.trim().length === 0) return [];
    const q = accountQuery.toLowerCase();
    return MOCK_HEARTH_USERS.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q),
    ).slice(0, 5);
  }, [accountQuery]);

  // Success state
  const [added, setAdded] = useState(false);

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCustomProfileUri(result.assets[0].uri);
    }
  }, []);

  const handleAdd = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('이름 입력', '이름을 입력해주세요.');
      return;
    }
    addFriend({
      name: name.trim(),
      tag: selectedTag,
      relation: isCustomTag ? relation.trim() || undefined : undefined,
      memo: memo.trim() || undefined,
      avatarColor: linkedUser?.avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      initial: linkedUser?.initial || name.trim()[0],
      isAppUser: !!linkedUser,
      sharedAlbumCount: 0,
      photoCount: 0,
    });

    setAdded(true);
    setTimeout(() => navigation.goBack(), 1600);
  }, [name, selectedTag, relation, memo, linkedUser, isCustomTag, addFriend, navigation]);

  const handleLinkUser = useCallback((user: HearthUser) => {
    if (linkedUser?.id === user.id) {
      setLinkedUser(null);
    } else {
      setLinkedUser(user);
      if (!name.trim()) setName(user.name);
      setShowAccountSearch(false);
      setAccountQuery('');
      Keyboard.dismiss();
    }
  }, [linkedUser, name]);

  // Determine avatar display
  const avatarColor = linkedUser?.avatarColor || colors.textMuted;
  const avatarInitial = linkedUser?.initial || (name.trim() ? name.trim()[0] : '?');

  const styles = useThemedStyles((c) => ({
    root: { flex: 1 },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    headerTitle: { ...typography.subtitle, color: c.textPrimary },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.lg },

    // Avatar
    avatarPreview: { alignItems: 'center' as const, marginVertical: spacing.lg },
    avatarRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 16,
    },
    bigAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5,
    },
    bigAvatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },
    bigAvatarText: { color: c.textOnDark, fontSize: 32, fontWeight: '700' as const },
    setImageButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: 'rgba(160,149,133,0.08)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.glassBorder,
    },
    setImageText: {
      ...typography.caption,
      color: c.textSecondary,
      fontWeight: '500' as const,
      fontSize: 12,
    },
    linkedBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      marginTop: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: 'rgba(138,170,120,0.1)',
    },
    linkedBadgeText: {
      ...typography.caption,
      color: c.sage,
      fontWeight: '600' as const,
      fontSize: 12,
    },

    section: { marginBottom: spacing.md },
    label: { ...typography.label, color: c.textSecondary, marginBottom: 6 },
    labelHint: {
      ...typography.caption,
      color: c.textMuted,
      fontSize: 11,
      marginBottom: 10,
      marginTop: -2,
    },
    input: {
      ...typography.body,
      color: c.textPrimary,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
      paddingVertical: 8,
    },

    // Account search
    accountSearchBar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: 'rgba(160,149,133,0.06)',
      borderRadius: 10,
      paddingHorizontal: 10,
      height: 38,
      gap: 8,
    },
    accountSearchInput: {
      ...typography.body,
      color: c.textPrimary,
      flex: 1,
      padding: 0,
      fontSize: 14,
    },
    accountResultsContainer: {
      marginTop: 8,
      borderRadius: 12,
      overflow: 'hidden' as const,
    },
    linkedUserRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 10,
      backgroundColor: 'rgba(138,170,120,0.08)',
    },
    linkedUserName: {
      ...typography.body,
      color: c.textPrimary,
      fontWeight: '600' as const,
      fontSize: 14,
    },
    linkedUserHandle: {
      ...typography.caption,
      color: c.textMuted,
      fontSize: 11,
      flex: 1,
    },
    noResultText: {
      ...typography.caption,
      color: c.textMuted,
      textAlign: 'center' as const,
      paddingVertical: 12,
    },

    // Tags
    tagRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
    tagBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: 'rgba(160, 149, 133, 0.08)',
    },
    tagBtnActive: {
      backgroundColor: c.accent,
    },
    tagBtnText: { ...typography.caption, color: c.textSecondary, fontWeight: '500' as const },
    tagBtnTextActive: { color: c.warmWhite },

    // Add button
    addButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      backgroundColor: c.dustyRose,
      paddingVertical: 16,
      borderRadius: 14,
      shadowColor: c.dustyRose,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    addButtonText: { ...typography.body, color: c.warmWhite, fontWeight: '700' as const },

    // Notification hint
    notifHint: {
      ...typography.caption,
      color: c.textMuted,
      textAlign: 'center' as const,
      marginTop: 14,
      lineHeight: 18,
      fontSize: 12,
    },

    // Success
    successContainer: {
      flex: 1,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.xl,
    },
    successAvatarWrap: {
      marginBottom: 28,
    },
    successHeart: {
      position: 'absolute' as const,
      bottom: -4,
      right: -4,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.dustyRose,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: 3,
      borderColor: c.background,
      shadowColor: c.dustyRose,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    successTitle: {
      ...typography.subtitle,
      color: c.textPrimary,
      textAlign: 'center' as const,
      fontSize: 20,
      lineHeight: 28,
      marginBottom: 12,
    },
    successSubtitle: {
      ...typography.body,
      color: c.textSecondary,
      textAlign: 'center' as const,
      fontSize: 14,
      lineHeight: 22,
    },
  }));

  // Success screen
  if (added) {
    return (
      <View style={styles.root}>
        <WarmBackground />
        <View style={[styles.successContainer, { paddingTop: insets.top + 80 }]}>
          <Animated.View entering={ZoomIn.duration(500).springify()} style={styles.successAvatarWrap}>
            {customProfileUri ? (
              <Image source={{ uri: customProfileUri }} style={styles.bigAvatarImage} />
            ) : (
              <View style={[styles.bigAvatar, { backgroundColor: avatarColor }]}>
                <Text style={styles.bigAvatarText}>{avatarInitial}</Text>
              </View>
            )}
            <Animated.View entering={ZoomIn.delay(300).duration(400).springify()} style={styles.successHeart}>
              <Heart size={20} color="#FFF" weight="fill" />
            </Animated.View>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(400).duration(500)} style={styles.successTitle}>
            {name.trim()}{t.addedSuccessTitle}
          </Animated.Text>

          {linkedUser && (
            <Animated.Text entering={FadeInDown.delay(600).duration(500)} style={styles.successSubtitle}>
              {t.addedSuccessNotification}
            </Animated.Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <WarmBackground />

      {/* Header -- title shows category */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton onPress={() => navigation.goBack()}>
          <X size={24} color={colors.textPrimary} />
        </IconButton>
        <Text style={styles.headerTitle}>{t.addToCategory(displayTag)}</Text>
        <IconButton onPress={handleAdd}>
          <Check size={24} color={colors.accent} weight="bold" />
        </IconButton>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar preview */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.avatarPreview}>
          <View style={styles.avatarRow}>
            {/* Avatar */}
            {customProfileUri ? (
              <Image source={{ uri: customProfileUri }} style={styles.bigAvatarImage} />
            ) : (
              <View style={[styles.bigAvatar, { backgroundColor: avatarColor }]}>
                <Text style={styles.bigAvatarText}>{avatarInitial}</Text>
              </View>
            )}

            {/* Set profile image button */}
            <Pressable style={styles.setImageButton} onPress={handlePickImage}>
              <Camera size={16} color={colors.textSecondary} />
              <Text style={styles.setImageText}>{t.setProfileImage}</Text>
            </Pressable>
          </View>

          {/* Linked badge */}
          {linkedUser && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.linkedBadge}>
              <LinkSimple size={12} color={colors.sage} />
              <Text style={styles.linkedBadgeText}>@{linkedUser.username}</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Name */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <GlassCard style={styles.section}>
            <Text style={styles.label}>{t.nameLabel}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t.namePlaceholder}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
          </GlassCard>
        </Animated.View>

        {/* Account Matching */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <GlassCard style={styles.section}>
            <Text style={styles.label}>{t.accountMatchLabel}</Text>
            <Text style={styles.labelHint}>{t.accountMatchHint}</Text>

            {linkedUser ? (
              <Pressable
                style={styles.linkedUserRow}
                onPress={() => {
                  setLinkedUser(null);
                  setShowAccountSearch(true);
                }}
              >
                <Avatar initial={linkedUser.initial} color={linkedUser.avatarColor} size={32} />
                <Text style={styles.linkedUserName}>{linkedUser.name}</Text>
                <Text style={styles.linkedUserHandle}>@{linkedUser.username}</Text>
                <X size={16} color={colors.textMuted} />
              </Pressable>
            ) : (
              <>
                <View style={styles.accountSearchBar}>
                  <MagnifyingGlass size={16} color={colors.textMuted} />
                  <TextInput
                    style={styles.accountSearchInput}
                    value={accountQuery}
                    onChangeText={(text) => {
                      setAccountQuery(text);
                      setShowAccountSearch(true);
                    }}
                    onFocus={() => setShowAccountSearch(true)}
                    placeholder={t.searchPlaceholder}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {accountQuery.length > 0 && (
                    <Pressable onPress={() => { setAccountQuery(''); setShowAccountSearch(false); }}>
                      <X size={14} color={colors.textMuted} />
                    </Pressable>
                  )}
                </View>

                {showAccountSearch && accountResults.length > 0 && (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.accountResultsContainer}>
                    {accountResults.map((user) => (
                      <AccountResult
                        key={user.id}
                        user={user}
                        onPress={() => handleLinkUser(user)}
                      />
                    ))}
                  </Animated.View>
                )}

                {showAccountSearch && accountQuery.trim().length > 0 && accountResults.length === 0 && (
                  <Animated.View entering={FadeIn.duration(200)}>
                    <Text style={styles.noResultText}>{t.noResults}</Text>
                  </Animated.View>
                )}
              </>
            )}
          </GlassCard>
        </Animated.View>

        {/* Tag -- hide if preset from category */}
        {!presetTag && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <GlassCard style={styles.section}>
              <Text style={styles.label}>{t.tagLabel}</Text>
              <View style={styles.tagRow}>
                {(['가족', '연인', '친구'] as FriendTag[]).map((tag) => (
                  <Pressable
                    key={tag}
                    style={[styles.tagBtn, selectedTag === tag && styles.tagBtnActive]}
                    onPress={() => setSelectedTag(tag)}
                  >
                    <Text style={[styles.tagBtnText, selectedTag === tag && styles.tagBtnTextActive]}>
                      {t.tagMap[tag] || tag}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Relation -- only for custom tags */}
        {isCustomTag && (
          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <GlassCard style={styles.section}>
              <Text style={styles.label}>{t.relationLabel}</Text>
              <TextInput
                style={styles.input}
                value={relation}
                onChangeText={setRelation}
                placeholder={t.relationPlaceholder}
                placeholderTextColor={colors.textMuted}
              />
            </GlassCard>
          </Animated.View>
        )}

        {/* Memo */}
        <Animated.View entering={FadeInDown.delay(isCustomTag ? 400 : 350).duration(400)}>
          <GlassCard style={styles.section}>
            <Text style={styles.label}>{t.memoLabel}</Text>
            <TextInput
              style={styles.input}
              value={memo}
              onChangeText={setMemo}
              placeholder={t.memoPlaceholder}
              placeholderTextColor={colors.textMuted}
            />
          </GlassCard>
        </Animated.View>

        {/* Add button */}
        <Animated.View entering={FadeInDown.delay(isCustomTag ? 450 : 400).duration(400)}>
          <Pressable style={styles.addButton} onPress={handleAdd}>
            <Heart size={20} color={colors.warmWhite} weight="fill" />
            <Text style={styles.addButtonText}>{t.addButtonEmotional}</Text>
          </Pressable>
        </Animated.View>

        {/* Notification hint */}
        {linkedUser && (
          <Animated.View entering={FadeIn.delay(500).duration(300)}>
            <Text style={styles.notifHint}>{t.addedSuccessNotification}</Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
