import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Eye,
  EyeSlash,
  Users,
  UserPlus,
  Trash,
  PencilSimple,
  ShareNetwork,
  Lock,
  Globe,
  CopySimple,
  Export,
  ListNumbers,
  DownloadSimple,
  Layout,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { RootStackParamList } from '../types/navigation';
import { useAlbumStore } from '../store/AlbumStore';
import { VisibilityLevel } from '../types/album';
import { WarmBackground, GlassCard, IconButton, Avatar } from '../components/common';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AlbumSettings'>;

export function AlbumSettingsScreen() {
  const colors = useColors();
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
    scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },

    section: { marginBottom: spacing.md },
    sectionLabel: {
      ...typography.label,
      color: c.textSecondary,
      marginBottom: spacing.sm,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },

    // Title
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleText: {
      ...typography.body,
      color: c.textPrimary,
      fontWeight: '500',
      fontSize: 18,
    },
    editTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    titleInput: {
      ...typography.body,
      color: c.textPrimary,
      flex: 1,
      borderBottomWidth: 1.5,
      borderBottomColor: c.accent,
      paddingVertical: 4,
      fontSize: 18,
    },
    saveText: {
      ...typography.caption,
      color: c.accent,
      fontWeight: '600',
    },

    // Visibility
    visibilityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    visibilityText: {
      flex: 1,
      marginLeft: 14,
    },
    visibilityLabel: {
      ...typography.body,
      color: c.textPrimary,
      fontWeight: '500',
    },
    visibilityDesc: {
      ...typography.caption,
      color: c.textMuted,
      marginTop: 1,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: c.textMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioActive: {
      borderColor: c.accent,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: c.accent,
    },

    // Collaborators
    inviteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: 'rgba(196, 139, 53, 0.1)',
    },
    inviteBtnText: {
      ...typography.caption,
      color: c.accent,
      fontWeight: '600',
    },
    collaboratorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    collaboratorInfo: {
      flex: 1,
      marginLeft: 12,
    },
    collaboratorName: {
      ...typography.body,
      color: c.textPrimary,
      fontWeight: '500',
    },
    collaboratorRole: {
      ...typography.caption,
      color: c.textMuted,
    },
    removeText: {
      ...typography.caption,
      color: '#E57373',
      fontWeight: '500',
    },
    emptyCollaborators: {
      ...typography.caption,
      color: c.textMuted,
      textAlign: 'center',
      paddingVertical: 12,
    },

    // Menu rows
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    menuLabel: {
      ...typography.body,
      color: c.textPrimary,
      flex: 1,
      marginLeft: 14,
    },
    menuValue: {
      ...typography.caption,
      color: c.textMuted,
    },
    menuDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.divider,
    },

    // Delete
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      marginTop: spacing.md,
    },
    deleteText: {
      ...typography.body,
      color: '#E57373',
      fontWeight: '500',
    },
  }));

  const VISIBILITY_OPTIONS: { value: VisibilityLevel; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: 'private', label: '나만 보기', desc: '나만 볼 수 있어요', icon: <Lock size={20} color={colors.textSecondary} /> },
    { value: 'friends', label: '친구 공개', desc: '친구에게만 공개해요', icon: <Users size={20} color={colors.textSecondary} /> },
    { value: 'public', label: '전체 공개', desc: '모든 사람이 볼 수 있어요', icon: <Globe size={20} color={colors.textSecondary} /> },
  ];

  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { getAlbum, updateAlbum, deleteAlbum, setVisibility, removeCollaborator, duplicateAlbum } = useAlbumStore();

  const album = getAlbum(route.params.albumId);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(album?.title || '');

  const handleSaveTitle = useCallback(() => {
    if (!album || !titleDraft.trim()) return;
    updateAlbum(album.id, { title: titleDraft.trim() });
    setIsEditingTitle(false);
  }, [album, titleDraft, updateAlbum]);

  const handleDelete = useCallback(() => {
    if (!album) return;
    Alert.alert(
      '앨범 삭제',
      `"${album.title}" 앨범을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            deleteAlbum(album.id);
            navigation.popToTop();
          },
        },
      ],
    );
  }, [album, deleteAlbum, navigation]);

  const handleRemoveCollaborator = useCallback((collaboratorId: string, name: string) => {
    if (!album) return;
    Alert.alert(
      '참여자 제거',
      `${name}님을 앨범에서 제거하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제거',
          style: 'destructive',
          onPress: () => removeCollaborator(album.id, collaboratorId),
        },
      ],
    );
  }, [album, removeCollaborator]);

  if (!album) return null;

  return (
    <View style={styles.root}>
      <WarmBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </IconButton>
        <Text style={styles.headerTitle}>앨범 설정</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title edit */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <GlassCard style={styles.section}>
            <Text style={styles.sectionLabel}>앨범 이름</Text>
            {isEditingTitle ? (
              <View style={styles.editTitleRow}>
                <TextInput
                  style={styles.titleInput}
                  value={titleDraft}
                  onChangeText={setTitleDraft}
                  autoFocus
                  maxLength={30}
                />
                <IconButton size={36} onPress={handleSaveTitle}>
                  <Text style={styles.saveText}>저장</Text>
                </IconButton>
              </View>
            ) : (
              <Pressable style={styles.titleRow} onPress={() => setIsEditingTitle(true)}>
                <Text style={styles.titleText}>{album.title}</Text>
                <PencilSimple size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </GlassCard>
        </Animated.View>

        {/* Visibility */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <GlassCard style={styles.section}>
            <Text style={styles.sectionLabel}>공개 범위</Text>
            {VISIBILITY_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={styles.visibilityRow}
                onPress={() => setVisibility(album.id, opt.value)}
              >
                {opt.icon}
                <View style={styles.visibilityText}>
                  <Text style={styles.visibilityLabel}>{opt.label}</Text>
                  <Text style={styles.visibilityDesc}>{opt.desc}</Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    album.visibility === opt.value && styles.radioActive,
                  ]}
                >
                  {album.visibility === opt.value && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            ))}
          </GlassCard>
        </Animated.View>

        {/* Collaborators */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>참여자</Text>
              <Pressable
                style={styles.inviteBtn}
                onPress={() => navigation.navigate('InviteCollaborator', { albumId: album.id })}
              >
                <UserPlus size={16} color={colors.accent} />
                <Text style={styles.inviteBtnText}>초대</Text>
              </Pressable>
            </View>

            {(album.collaborators || []).map((collab) => (
              <View key={collab.id} style={styles.collaboratorRow}>
                <Avatar initial={collab.initial} color={collab.avatarColor} imageUrl={collab.avatarUrl} size={36} />
                <View style={styles.collaboratorInfo}>
                  <Text style={styles.collaboratorName}>{collab.name}</Text>
                  <Text style={styles.collaboratorRole}>
                    {collab.role === 'owner' ? '관리자' : '편집자'}
                  </Text>
                </View>
                {collab.role !== 'owner' && (
                  <Pressable onPress={() => handleRemoveCollaborator(collab.id, collab.name)}>
                    <Text style={styles.removeText}>제거</Text>
                  </Pressable>
                )}
              </View>
            ))}

            {(!album.collaborators || album.collaborators.length === 0) && (
              <Text style={styles.emptyCollaborators}>
                아직 참여자가 없습니다
              </Text>
            )}
          </GlassCard>
        </Animated.View>

        {/* Page management */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <GlassCard style={styles.section}>
            <Pressable
              style={styles.menuRow}
              onPress={() => navigation.navigate('PageManager', { albumId: album.id })}
            >
              <ListNumbers size={22} color={colors.textSecondary} />
              <Text style={styles.menuLabel}>페이지 관리</Text>
              <Text style={styles.menuValue}>{album.pageCount}페이지</Text>
            </Pressable>
          </GlassCard>
        </Animated.View>

        {/* Import & Actions */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <GlassCard style={styles.section}>
            <Pressable
              style={styles.menuRow}
              onPress={() => navigation.navigate('AlbumImport', { albumId: album.id })}
            >
              <DownloadSimple size={22} color={colors.textSecondary} />
              <Text style={styles.menuLabel}>앨범 가져오기</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuRow}
              onPress={() => navigation.navigate('TemplateGallery')}
            >
              <Layout size={22} color={colors.textSecondary} />
              <Text style={styles.menuLabel}>템플릿 갤러리</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable style={styles.menuRow}>
              <Export size={22} color={colors.textSecondary} />
              <Text style={styles.menuLabel}>앨범 내보내기</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                duplicateAlbum(album.id);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                navigation.goBack();
              }}
            >
              <CopySimple size={22} color={colors.textSecondary} />
              <Text style={styles.menuLabel}>앨범 복제</Text>
            </Pressable>
          </GlassCard>
        </Animated.View>

        {/* Delete */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Trash size={20} color="#E57373" />
            <Text style={styles.deleteText}>앨범 삭제</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

