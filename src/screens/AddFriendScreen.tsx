import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  X,
  Check,
  MagnifyingGlass,
  UserPlus,
  PaperPlaneTilt,
} from 'phosphor-react-native';
import { colors, typography, spacing } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { useFriendStore } from '../store/FriendStore';
import { FriendTag } from '../types/friend';
import { WarmBackground, GlassCard, IconButton } from '../components/common';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TAG_OPTIONS: FriendTag[] = ['가족', '연인', '친구', '직장', '기타'];
const AVATAR_COLORS = [
  '#C4919A', '#7B8FA3', '#92A888', '#D4A855',
  '#A898B8', '#B8917A', '#859C78', '#5B6E85',
];

export function AddFriendScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { addFriend } = useFriendStore();

  const [name, setName] = useState('');
  const [selectedTag, setSelectedTag] = useState<FriendTag>('친구');
  const [relation, setRelation] = useState('');
  const [memo, setMemo] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedColor, setSelectedColor] = useState(0);

  const handleAdd = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('이름 입력', '친구의 이름을 입력해주세요.');
      return;
    }
    addFriend({
      name: name.trim(),
      tag: selectedTag,
      relation: relation.trim() || undefined,
      memo: memo.trim() || undefined,
      phone: phone.trim() || undefined,
      avatarColor: AVATAR_COLORS[selectedColor],
      initial: name.trim()[0],
      isAppUser: false,
      sharedAlbumCount: 0,
      photoCount: 0,
    });
    navigation.goBack();
  }, [name, selectedTag, relation, memo, phone, selectedColor, addFriend, navigation]);

  return (
    <View style={styles.root}>
      <WarmBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton onPress={() => navigation.goBack()}>
          <X size={24} color={colors.textPrimary} />
        </IconButton>
        <Text style={styles.headerTitle}>친구 추가</Text>
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
          <View style={[styles.bigAvatar, { backgroundColor: AVATAR_COLORS[selectedColor] }]}>
            <Text style={styles.bigAvatarText}>{name.trim() ? name.trim()[0] : '?'}</Text>
          </View>
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map((color, i) => (
              <Pressable
                key={color}
                style={[
                  styles.colorDot,
                  { backgroundColor: color },
                  selectedColor === i && styles.colorDotSelected,
                ]}
                onPress={() => setSelectedColor(i)}
              />
            ))}
          </View>
        </Animated.View>

        {/* Name */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <GlassCard style={styles.section}>
            <Text style={styles.label}>이름 *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="이름을 입력하세요"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
          </GlassCard>
        </Animated.View>

        {/* Tag */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <GlassCard style={styles.section}>
            <Text style={styles.label}>관계</Text>
            <View style={styles.tagRow}>
              {TAG_OPTIONS.map((tag) => (
                <Pressable
                  key={tag}
                  style={[styles.tagBtn, selectedTag === tag && styles.tagBtnActive]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Text style={[styles.tagBtnText, selectedTag === tag && styles.tagBtnTextActive]}>
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Detail */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <GlassCard style={styles.section}>
            <Text style={styles.label}>상세 관계 (선택)</Text>
            <TextInput
              style={styles.input}
              value={relation}
              onChangeText={setRelation}
              placeholder="예: 아빠, 대학 동기"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>메모 (선택)</Text>
            <TextInput
              style={styles.input}
              value={memo}
              onChangeText={setMemo}
              placeholder="메모를 남겨보세요"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>전화번호 (선택)</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="010-0000-0000"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
          </GlassCard>
        </Animated.View>

        {/* Invite note */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <View style={styles.inviteNote}>
            <PaperPlaneTilt size={18} color={colors.textMuted} />
            <Text style={styles.inviteNoteText}>
              추가 후 Hearth 초대 메시지를 보낼 수 있어요
            </Text>
          </View>
        </Animated.View>

        {/* Add button */}
        <Animated.View entering={FadeInDown.delay(550).duration(400)}>
          <Pressable style={styles.addButton} onPress={handleAdd}>
            <UserPlus size={20} color={colors.warmWhite} />
            <Text style={styles.addButtonText}>친구 추가하기</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: { ...typography.subtitle, color: colors.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg },

  // Avatar
  avatarPreview: { alignItems: 'center', marginVertical: spacing.lg },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  bigAvatarText: { color: colors.textOnDark, fontSize: 32, fontWeight: '700' },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: colors.warmWhite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },

  section: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: 6 },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingVertical: 8,
  },

  // Tags
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(160, 149, 133, 0.08)',
  },
  tagBtnActive: {
    backgroundColor: colors.accent,
  },
  tagBtnText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },
  tagBtnTextActive: { color: colors.warmWhite },

  // Invite note
  inviteNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  inviteNoteText: { ...typography.caption, color: colors.textMuted, flex: 1 },

  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: { ...typography.body, color: colors.warmWhite, fontWeight: '600' },
});
