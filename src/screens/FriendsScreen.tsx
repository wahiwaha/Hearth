import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  TextInput,
  Keyboard,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus, Export } from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { Friend, FriendTag } from '../types/friend';
import { RootStackParamList } from '../types/navigation';
import { useFriendStore } from '../store/FriendStore';
import { Avatar, WarmBackground } from '../components/common';
import { useT } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_TAGS: FriendTag[] = ['가족', '연인', '친구'];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* ─── Friend Avatar Card with album cover background ─── */
function FriendCard({
  friend,
  index,
  onPress,
}: {
  friend: Friend;
  index: number;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.92]) }],
  }));

  const hasAlbum = !!friend.albumCoverColor;

  return (
    <Animated.View entering={ZoomIn.delay(80 + index * 50).duration(350).springify()}>
      <AnimatedPressable
        style={[styles.friendCard, animStyle]}
        onPress={onPress}
        onPressIn={() => {
          pressed.value = withSpring(1, { damping: 25, stiffness: 500 });
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, { damping: 20, stiffness: 400 });
        }}
      >
        {/* Album cover background with avatar at bottom */}
        <View style={styles.cardVisual}>
          <View style={[
            styles.albumCoverBg,
            { backgroundColor: hasAlbum ? friend.albumCoverColor : '#F5F0EA' },
          ]}>
            {hasAlbum && friend.albumCoverUrl ? (
              <Image
                source={{ uri: friend.albumCoverUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : hasAlbum ? (
              <LinearGradient
                colors={['rgba(255,255,255,0.18)', 'rgba(0,0,0,0.06)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
              />
            ) : (
              <View style={styles.emptyAlbumBorder} />
            )}
          </View>
          {/* Profile avatar at bottom of card */}
          <View style={styles.avatarOverlayBottom}>
            <Avatar initial={friend.initial} color={friend.avatarColor} size={44} imageUrl={friend.avatarUrl} />
          </View>
        </View>

        <Text style={styles.friendName} numberOfLines={1}>
          {friend.name}
        </Text>
        {(friend.memo || friend.relation) ? (
          <Text style={styles.friendRelation} numberOfLines={1}>
            {friend.memo || friend.relation}
          </Text>
        ) : null}
      </AnimatedPressable>
    </Animated.View>
  );
}

/* ─── Add Friend Button (circle with +) ─── */
function AddButton({
  index,
  onPress,
  label,
}: {
  index: number;
  onPress: () => void;
  label: string;
}) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.9]) }],
  }));

  return (
    <Animated.View entering={ZoomIn.delay(80 + index * 50).duration(350).springify()}>
      <AnimatedPressable
        style={[styles.addButtonWrap, animStyle]}
        onPress={onPress}
        onPressIn={() => {
          pressed.value = withSpring(1, { damping: 25, stiffness: 500 });
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, { damping: 20, stiffness: 400 });
        }}
      >
        <View style={styles.addCircle}>
          <Plus size={20} color={colors.textMuted} weight="regular" />
        </View>
        <Text style={styles.addLabel}>{label}</Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

/* ─── Section Component ─── */
function Section({
  tag,
  displayName,
  friends,
  groupIndex,
  onAddPress,
  onFriendPress,
}: {
  tag: string;
  displayName: string;
  friends: Friend[];
  groupIndex: number;
  onAddPress: () => void;
  onFriendPress: (friendId: string) => void;
}) {
  const styles = useThemedStyles(createStyles);
  const t = useT();

  return (
    <Animated.View
      entering={FadeInDown.delay(100 + groupIndex * 60).duration(400).springify()}
      style={styles.sectionContainer}
    >
      <View style={styles.sectionLabelRow}>
        <Text style={styles.sectionLabel}>{displayName}</Text>
        {friends.length > 0 && (
          <Text style={styles.sectionCount}>{friends.length}</Text>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.friendsRow}
      >
        {friends.map((friend, idx) => (
          <FriendCard
            key={friend.id}
            friend={friend}
            index={idx}
            onPress={() => onFriendPress(friend.id)}
          />
        ))}
        <AddButton
          index={friends.length}
          onPress={onAddPress}
          label={t.addFriend}
        />
      </ScrollView>
    </Animated.View>
  );
}

/* ─── Custom Category Input Section ─── */
function CustomCategorySection({
  groupIndex,
  onCategoryCreate,
}: {
  groupIndex: number;
  onCategoryCreate: (name: string) => void;
}) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const t = useT();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed.length > 0) {
      onCategoryCreate(trimmed);
      setText('');
      setIsEditing(false);
      Keyboard.dismiss();
    }
  }, [text, onCategoryCreate]);

  const handleAddPress = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  return (
    <Animated.View
      entering={FadeInDown.delay(100 + groupIndex * 60).duration(400).springify()}
      style={styles.sectionContainer}
    >
      <View style={styles.sectionLabelRow}>
        <Text style={styles.sectionLabel}>{t.customCategory}</Text>
      </View>

      {isEditing ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.customInputRow}
        >
          <View style={styles.customInputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.customInput}
              value={text}
              onChangeText={setText}
              placeholder={t.customCategoryPlaceholder}
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
              autoFocus
            />
          </View>
          <Pressable
            style={[
              styles.customSubmitButton,
              text.trim().length === 0 && styles.customSubmitDisabled,
            ]}
            onPress={handleSubmit}
            disabled={text.trim().length === 0}
          >
            <Plus size={18} color="#FFF" weight="bold" />
          </Pressable>
        </Animated.View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.friendsRow}
        >
          <AddButton
            index={0}
            onPress={handleAddPress}
            label={t.addFriend}
          />
        </ScrollView>
      )}
    </Animated.View>
  );
}

/* ─── Share Button ─── */
function ShareButton({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.88]) }],
    opacity: interpolate(pressed.value, [0, 1], [1, 0.7]),
  }));

  return (
    <AnimatedPressable
      style={[styles.shareButton, animStyle]}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withSpring(1, { damping: 25, stiffness: 500 });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 20, stiffness: 400 });
      }}
    >
      <Export size={20} color={colors.textPrimary} weight="regular" />
    </AnimatedPressable>
  );
}

/* ═══════════════════════════════════════════
   Main Screen
   ═══════════════════════════════════════════ */
export function FriendsScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { friends } = useFriendStore();
  const t = useT();

  // Custom categories added by user
  const [customTags, setCustomTags] = useState<string[]>([]);

  // Compute all tags to show (default + custom from friends + manually added)
  const allTags = useMemo(() => {
    const friendCustomTags = friends
      .map((f) => f.tag)
      .filter((tag) => !DEFAULT_TAGS.includes(tag) && !customTags.includes(tag));
    const uniqueCustom = [...new Set([...customTags, ...friendCustomTags])];
    return [...DEFAULT_TAGS, ...uniqueCustom];
  }, [friends, customTags]);

  // Group friends by tag
  const friendsByTag = useMemo(() => {
    const groups: Record<string, Friend[]> = {};
    for (const friend of friends) {
      if (!groups[friend.tag]) groups[friend.tag] = [];
      groups[friend.tag].push(friend);
    }
    return groups;
  }, [friends]);

  // Handle native share
  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: t.shareMessage,
        // url: 'https://hearth.app/invite', // Add real URL when available
      });
    } catch (_e) {
      // User cancelled
    }
  }, [t]);

  // Handle adding a custom category
  const handleCreateCategory = useCallback((name: string) => {
    if (!allTags.includes(name)) {
      setCustomTags((prev) => [...prev, name]);
    }
  }, [allTags]);

  // Navigate to add friend with pre-selected tag
  const handleAddFriend = useCallback(
    (tag: string) => {
      navigation.navigate('AddFriend', { tag });
    },
    [navigation],
  );

  return (
    <View style={styles.root}>
      <WarmBackground />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.headerWrap, { paddingTop: insets.top }]}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle}>{t.hearth}</Text>
            <Text style={styles.headerSubtitle}>
              {t.friendCount(friends.length)}
            </Text>
          </View>
          <ShareButton onPress={handleShare} />
        </View>
        <View style={styles.headerDivider} />
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Default + custom tag sections */}
        {allTags.map((tag, groupIndex) => (
          <Section
            key={tag}
            tag={tag}
            displayName={t.tagMap[tag] || tag}
            friends={friendsByTag[tag] || []}
            groupIndex={groupIndex}
            onAddPress={() => handleAddFriend(tag)}
            onFriendPress={(friendId) =>
              navigation.navigate('FriendProfile', { friendId })
            }
          />
        ))}

        {/* 직접입력 (Custom category creator) — always at bottom */}
        <CustomCategorySection
          groupIndex={allTags.length}
          onCategoryCreate={handleCreateCategory}
        />
      </ScrollView>
    </View>
  );
}

/* ═══════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════ */
const createStyles = (c: ReturnType<typeof useColors>) => ({
  root: { flex: 1 } as const,

  /* Header */
  headerWrap: {
    zIndex: 10,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  headerTitleArea: {
    alignItems: 'flex-start' as const,
  },
  headerTitle: {
    ...typography.title,
    color: c.textPrimary,
    fontSize: 28,
  },
  headerSubtitle: {
    ...typography.caption,
    color: c.textMuted,
    marginTop: 2,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.divider,
    marginHorizontal: spacing.lg,
  },

  /* Share Button */
  shareButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: c.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.glassBorder,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#1E1408',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  /* Scroll */
  scrollView: { flex: 1 } as const,
  scrollContent: { paddingTop: 4 },

  /* Section */
  sectionContainer: {
    marginTop: 20,
  },
  sectionLabelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    marginBottom: 14,
  },
  sectionLabel: {
    ...typography.subtitle,
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  sectionCount: {
    ...typography.caption,
    color: c.textMuted,
    fontSize: 12,
    marginLeft: 6,
  },

  /* Friends Row */
  friendsRow: {
    paddingHorizontal: spacing.lg,
    gap: 16,
    paddingBottom: 4,
    alignItems: 'flex-start' as const,
  },
  friendCard: {
    alignItems: 'center' as const,
    width: 94,
  },
  cardVisual: {
    width: 94,
    height: 148,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
  },
  albumCoverBg: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 18,
    borderRadius: 14,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyAlbumBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(200, 180, 150, 0.20)',
    backgroundColor: 'rgba(255, 250, 242, 0.40)',
  },
  avatarOverlayBottom: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: -4,
  },
  friendName: {
    ...typography.caption,
    color: c.textPrimary,
    fontWeight: '600' as const,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  friendRelation: {
    ...typography.caption,
    color: c.textMuted,
    fontSize: 10,
    marginTop: 1,
    textAlign: 'center' as const,
  },

  /* Add Button */
  addButtonWrap: {
    alignItems: 'center' as const,
    width: 94,
    paddingTop: 48,
  },
  addCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1.8,
    borderColor: c.glassBorder,
    borderStyle: 'dashed' as const,
    backgroundColor: c.glass,
  },
  addLabel: {
    ...typography.caption,
    color: c.textMuted,
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center' as const,
  },

  /* Custom Category Input */
  customInputRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  customInputContainer: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: c.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.glassBorder,
    justifyContent: 'center' as const,
    paddingHorizontal: 14,
  },
  customInput: {
    ...typography.body,
    color: c.textPrimary,
    fontSize: 15,
    padding: 0,
  },
  customSubmitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.dustyRose,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: c.dustyRose,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  customSubmitDisabled: {
    opacity: 0.4,
  },
});
