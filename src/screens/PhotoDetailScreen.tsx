import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  PencilSimple,
  MapPin,
  UserCircle,
  NoteBlank,
  Check,
  Tag,
} from 'phosphor-react-native';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { RootStackParamList } from '../types/navigation';
import { WarmBackground, GlassCard, IconButton, Avatar } from '../components/common';
import { useFriendStore } from '../store/FriendStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PhotoDetail'>;

export function PhotoDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { friends } = useFriendStore();

  const [memo, setMemo] = useState('');
  const [memoScope, setMemoScope] = useState<'global' | 'album'>('album');
  const [taggedFriends, setTaggedFriends] = useState<string[]>([]);
  const [locationName, setLocationName] = useState('');
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [showFriendPicker, setShowFriendPicker] = useState(false);

  const styles = useThemedStyles((c) => ({
    root: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    headerTitle: {
      ...typography.subtitle,
      color: c.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.lg },

    // Photo
    photoContainer: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    photo: {
      width: SCREEN_WIDTH - spacing.lg * 2,
      height: (SCREEN_WIDTH - spacing.lg * 2) * 0.75,
      borderRadius: 12,
      backgroundColor: c.backgroundDark,
    },
    photoPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      ...typography.body,
      color: c.textMuted,
    },

    // Sections
    section: { marginBottom: spacing.md },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: spacing.sm,
    },
    sectionLabel: {
      ...typography.label,
      color: c.textSecondary,
    },

    // Memo
    memoInput: {
      ...typography.body,
      color: c.textPrimary,
      minHeight: 80,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: c.divider,
      borderRadius: 10,
      padding: 12,
      marginBottom: spacing.sm,
    },
    memoScopeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    scopeBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(160, 149, 133, 0.08)',
      alignItems: 'center',
    },
    scopeBtnActive: {
      backgroundColor: 'rgba(196, 139, 53, 0.15)',
    },
    scopeBtnText: {
      ...typography.caption,
      color: c.textMuted,
      fontWeight: '500',
    },
    scopeBtnTextActive: {
      color: c.accent,
      fontWeight: '600',
    },

    // Friend tags
    friendTagGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    friendTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 20,
      backgroundColor: 'rgba(160, 149, 133, 0.08)',
    },
    friendTagActive: {
      backgroundColor: 'rgba(196, 139, 53, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(196, 139, 53, 0.3)',
    },
    friendTagName: {
      ...typography.caption,
      color: c.textSecondary,
      fontWeight: '500',
    },
    friendTagNameActive: {
      color: c.accent,
    },

    // Location
    locationInput: {
      ...typography.body,
      color: c.textPrimary,
      borderWidth: 1,
      borderColor: c.divider,
      borderRadius: 10,
      padding: 12,
    },
  }));

  const toggleFriendTag = useCallback((friendId: string) => {
    setTaggedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  }, []);

  return (
    <View style={styles.root}>
      <WarmBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </IconButton>
        <Text style={styles.headerTitle}>사진 정보</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.photoContainer}>
          {route.params.photoUri ? (
            <Image
              source={{ uri: route.params.photoUri }}
              style={styles.photo}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={styles.placeholderText}>사진 미리보기</Text>
            </View>
          )}
        </Animated.View>

        {/* Memo */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <NoteBlank size={20} color={colors.textSecondary} />
              <Text style={styles.sectionLabel}>메모</Text>
            </View>

            <TextInput
              style={styles.memoInput}
              value={memo}
              onChangeText={setMemo}
              placeholder="이 사진에 대한 메모를 남겨보세요"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            <View style={styles.memoScopeRow}>
              <Pressable
                style={[styles.scopeBtn, memoScope === 'album' && styles.scopeBtnActive]}
                onPress={() => setMemoScope('album')}
              >
                <Text style={[styles.scopeBtnText, memoScope === 'album' && styles.scopeBtnTextActive]}>
                  이 앨범에서만
                </Text>
              </Pressable>
              <Pressable
                style={[styles.scopeBtn, memoScope === 'global' && styles.scopeBtnActive]}
                onPress={() => setMemoScope('global')}
              >
                <Text style={[styles.scopeBtnText, memoScope === 'global' && styles.scopeBtnTextActive]}>
                  항상 적용
                </Text>
              </Pressable>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Person tags */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <UserCircle size={20} color={colors.textSecondary} />
              <Text style={styles.sectionLabel}>사람 태그</Text>
            </View>

            <View style={styles.friendTagGrid}>
              {friends.map((friend) => (
                <Pressable
                  key={friend.id}
                  style={[
                    styles.friendTag,
                    taggedFriends.includes(friend.id) && styles.friendTagActive,
                  ]}
                  onPress={() => toggleFriendTag(friend.id)}
                >
                  <Avatar initial={friend.initial} color={friend.avatarColor} size={28} />
                  <Text style={[
                    styles.friendTagName,
                    taggedFriends.includes(friend.id) && styles.friendTagNameActive,
                  ]}>
                    {friend.name}
                  </Text>
                  {taggedFriends.includes(friend.id) && (
                    <Check size={14} color={colors.accent} weight="bold" />
                  )}
                </Pressable>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Location tag */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={colors.textSecondary} />
              <Text style={styles.sectionLabel}>위치 태그</Text>
            </View>
            <TextInput
              style={styles.locationInput}
              value={locationName}
              onChangeText={setLocationName}
              placeholder="촬영 장소를 입력하세요"
              placeholderTextColor={colors.textMuted}
            />
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

