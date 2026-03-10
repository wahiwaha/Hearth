import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  X,
  Check,
  ImageSquare,
  Users,
} from 'phosphor-react-native';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { RootStackParamList } from '../types/navigation';
import { useAlbumStore } from '../store/AlbumStore';
import { WarmBackground, IconButton, GlassCard } from '../components/common';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const COVER_COLORS = [
  '#C4919A', '#7B8FA3', '#92A888', '#DDD0B8',
  '#D4A855', '#A898B8', '#B8917A', '#8A9E78',
  '#5B6E85', '#D4A898', '#859C78', '#C48B35',
];

const SPINE_COLORS = [
  '#B07880', '#6A7E92', '#7E9474', '#C8BCA4',
  '#C09640', '#9484A4', '#A47D66', '#768A64',
  '#4A5D74', '#C09484', '#728868', '#B07C28',
];

export function CreateAlbumScreen() {
  const colors = useColors();
  const styles = useThemedStyles((c) => ({
    root: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    headerTitle: {
      ...typography.subtitle,
      color: c.textPrimary,
    },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

    // Preview
    previewContainer: { alignItems: 'center', marginBottom: spacing.xl },
    previewCover: {
      width: 160,
      height: 220,
      borderRadius: 8,
      flexDirection: 'row',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 3, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    previewSpine: {
      width: 16,
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
    },
    previewContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    previewTitle: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      marginVertical: 12,
    },
    previewLine: {
      width: '60%',
      height: 1.5,
      borderRadius: 1,
      opacity: 0.3,
    },
    previewHighlight: {
      position: 'absolute',
      top: 0,
      left: 16,
      right: 0,
      height: '45%',
      backgroundColor: 'rgba(255,248,232,0.03)',
      borderTopRightRadius: 8,
    },

    // Sections
    section: { marginBottom: spacing.md },
    sectionLabel: {
      ...typography.label,
      color: c.textSecondary,
      marginBottom: spacing.sm,
    },
    titleInput: {
      ...typography.body,
      color: c.textPrimary,
      borderBottomWidth: 1.5,
      borderBottomColor: c.divider,
      paddingVertical: spacing.sm,
      fontSize: 18,
    },
    charCount: {
      ...typography.caption,
      color: c.textMuted,
      textAlign: 'right',
      marginTop: 4,
    },

    // Color grid
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorOption: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
    colorSelected: {
      borderWidth: 2.5,
      borderColor: c.textPrimary,
      shadowOpacity: 0.12,
      shadowRadius: 4,
    },

    // Options
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionText: {
      flex: 1,
      marginLeft: 14,
    },
    optionLabel: {
      ...typography.body,
      color: c.textPrimary,
      fontWeight: '500',
    },
    optionDesc: {
      ...typography.caption,
      color: c.textMuted,
      marginTop: 2,
    },
    toggle: {
      width: 48,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.divider,
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    toggleActive: {
      backgroundColor: c.sage,
    },
    toggleDot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    toggleDotActive: {
      alignSelf: 'flex-end',
    },

    // Create button
    createButton: {
      backgroundColor: c.accent,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: spacing.md,
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 4,
    },
    createButtonText: {
      ...typography.body,
      color: c.warmWhite,
      fontWeight: '600',
      fontSize: 17,
    },
  }));

  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { createAlbum } = useAlbumStore();

  const [title, setTitle] = useState('');
  const [selectedCover, setSelectedCover] = useState(0);
  const [isShared, setIsShared] = useState(false);

  const handleCreate = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('앨범 이름', '앨범 이름을 입력해주세요.');
      return;
    }
    const album = createAlbum(
      title.trim(),
      COVER_COLORS[selectedCover],
      SPINE_COLORS[selectedCover],
    );
    navigation.replace('AlbumViewer', { albumId: album.id });
  }, [title, selectedCover, createAlbum, navigation]);

  const lightenColor = (color: string, amount: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
    const b = Math.min(255, (num & 0x0000FF) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <View style={styles.root}>
      <WarmBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton onPress={() => navigation.goBack()}>
          <X size={24} color={colors.textPrimary} />
        </IconButton>
        <Text style={styles.headerTitle}>새 앨범</Text>
        <IconButton onPress={handleCreate}>
          <Check size={24} color={colors.accent} weight="bold" />
        </IconButton>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Album Preview */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.previewContainer}>
          <View
            style={[
              styles.previewCover,
              { backgroundColor: COVER_COLORS[selectedCover] },
            ]}
          >
            <View style={[styles.previewSpine, { backgroundColor: SPINE_COLORS[selectedCover] }]} />
            <View style={styles.previewContent}>
              <View style={[styles.previewLine, { backgroundColor: lightenColor(COVER_COLORS[selectedCover], 40) }]} />
              <Text
                style={[
                  styles.previewTitle,
                  { color: lightenColor(COVER_COLORS[selectedCover], 80) },
                ]}
                numberOfLines={2}
              >
                {title || '앨범 이름'}
              </Text>
              <View style={[styles.previewLine, { backgroundColor: lightenColor(COVER_COLORS[selectedCover], 40) }]} />
            </View>
            <View style={styles.previewHighlight} />
          </View>
        </Animated.View>

        {/* Title Input */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <GlassCard style={styles.section}>
            <Text style={styles.sectionLabel}>앨범 이름</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="추억에 이름을 붙여주세요"
              placeholderTextColor={colors.textMuted}
              maxLength={30}
              autoFocus
            />
            <Text style={styles.charCount}>{title.length}/30</Text>
          </GlassCard>
        </Animated.View>

        {/* Cover Color Selection */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <GlassCard style={styles.section}>
            <Text style={styles.sectionLabel}>커버 색상</Text>
            <View style={styles.colorGrid}>
              {COVER_COLORS.map((color, index) => (
                <Pressable
                  key={color}
                  onPress={() => setSelectedCover(index)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedCover === index && styles.colorSelected,
                  ]}
                >
                  {selectedCover === index && (
                    <Check size={18} color="#fff" weight="bold" />
                  )}
                </Pressable>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Options */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <GlassCard style={styles.section}>
            <Pressable
              style={styles.optionRow}
              onPress={() => setIsShared(!isShared)}
            >
              <Users size={22} color={colors.textSecondary} />
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>공유 앨범으로 만들기</Text>
                <Text style={styles.optionDesc}>친구와 함께 꾸밀 수 있어요</Text>
              </View>
              <View style={[styles.toggle, isShared && styles.toggleActive]}>
                <Animated.View
                  style={[
                    styles.toggleDot,
                    isShared && styles.toggleDotActive,
                  ]}
                />
              </View>
            </Pressable>
          </GlassCard>
        </Animated.View>

        {/* Create Button */}
        <Animated.View entering={FadeInUp.delay(500).duration(500)}>
          <Pressable style={styles.createButton} onPress={handleCreate}>
            <Text style={styles.createButtonText}>앨범 만들기</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

