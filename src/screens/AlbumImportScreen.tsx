import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Check,
  Copy,
  Link,
  ArrowUp,
  ArrowDown,
  BookOpen,
} from 'phosphor-react-native';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { RootStackParamList } from '../types/navigation';
import { useAlbumStore } from '../store/AlbumStore';
import { WarmBackground, IconButton, GlassCard } from '../components/common';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AlbumImport'>;

type ImportMode = 'copy' | 'link';
type ImportPosition = 'start' | 'end';

export function AlbumImportScreen() {
  const colors = useColors();
  const styles = useThemedStyles((c) => ({
    root: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    headerTitle: { ...typography.subtitle, color: c.textPrimary, flex: 1, textAlign: 'center' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.lg },

    sectionTitle: {
      ...typography.label,
      color: c.textSecondary,
      marginTop: 20,
      marginBottom: 10,
    },

    modeRow: { flexDirection: 'row', gap: 12 },
    modeCard: {
      flex: 1,
      padding: 16,
      borderRadius: 14,
      backgroundColor: c.cardBg,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
      gap: 6,
    },
    modeCardActive: { borderColor: c.accent },
    modeLabel: { ...typography.body, color: c.textPrimary, fontWeight: '600' },
    modeLabelActive: { color: c.accent },
    modeDesc: { ...typography.caption, color: c.textMuted, textAlign: 'center' },

    posCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 14,
      borderRadius: 14,
      backgroundColor: c.cardBg,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    posCardActive: { borderColor: c.accent },
    posLabel: { ...typography.body, color: c.textPrimary, fontWeight: '500' },
    posLabelActive: { color: c.accent },

    albumRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      marginBottom: 6,
    },
    albumRowActive: { backgroundColor: 'rgba(196, 139, 53, 0.08)' },
    albumThumb: {
      width: 44,
      height: 44,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    albumInfo: { flex: 1, marginLeft: 12 },
    albumTitle: { ...typography.body, color: c.textPrimary, fontWeight: '500' },
    albumMeta: { ...typography.caption, color: c.textMuted, marginTop: 2 },
    emptyText: { ...typography.body, color: c.textMuted, textAlign: 'center', marginTop: 40 },
  }));

  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { albums, getAlbum, importAlbum } = useAlbumStore();

  const targetAlbum = getAlbum(route.params.albumId);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('copy');
  const [position, setPosition] = useState<ImportPosition>('end');

  const availableAlbums = useMemo(
    () => albums.filter(a => a.id !== route.params.albumId),
    [albums, route.params.albumId]
  );

  const handleImport = useCallback(() => {
    if (!selectedAlbumId || !targetAlbum) return;
    importAlbum(targetAlbum.id, selectedAlbumId, position, importMode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  }, [selectedAlbumId, targetAlbum, importAlbum, position, importMode, navigation]);

  if (!targetAlbum) return null;

  return (
    <View style={styles.root}>
      <WarmBackground />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </IconButton>
        <Text style={styles.headerTitle}>앨범 가져오기</Text>
        <IconButton onPress={handleImport} disabled={!selectedAlbumId}>
          <Check size={24} color={selectedAlbumId ? colors.accent : colors.textMuted} weight="bold" />
        </IconButton>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode selection */}
        <Text style={styles.sectionTitle}>가져오기 방식</Text>
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeCard, importMode === 'copy' && styles.modeCardActive]}
            onPress={() => setImportMode('copy')}
          >
            <Copy size={24} color={importMode === 'copy' ? colors.accent : colors.textSecondary} />
            <Text style={[styles.modeLabel, importMode === 'copy' && styles.modeLabelActive]}>복사</Text>
            <Text style={styles.modeDesc}>독립적인 복사본</Text>
          </Pressable>
          <Pressable
            style={[styles.modeCard, importMode === 'link' && styles.modeCardActive]}
            onPress={() => setImportMode('link')}
          >
            <Link size={24} color={importMode === 'link' ? colors.accent : colors.textSecondary} />
            <Text style={[styles.modeLabel, importMode === 'link' && styles.modeLabelActive]}>연결</Text>
            <Text style={styles.modeDesc}>원본과 동기화</Text>
          </Pressable>
        </View>

        {/* Position selection */}
        <Text style={styles.sectionTitle}>삽입 위치</Text>
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.posCard, position === 'start' && styles.posCardActive]}
            onPress={() => setPosition('start')}
          >
            <ArrowUp size={20} color={position === 'start' ? colors.accent : colors.textSecondary} />
            <Text style={[styles.posLabel, position === 'start' && styles.posLabelActive]}>맨 앞</Text>
          </Pressable>
          <Pressable
            style={[styles.posCard, position === 'end' && styles.posCardActive]}
            onPress={() => setPosition('end')}
          >
            <ArrowDown size={20} color={position === 'end' ? colors.accent : colors.textSecondary} />
            <Text style={[styles.posLabel, position === 'end' && styles.posLabelActive]}>맨 뒤</Text>
          </Pressable>
        </View>

        {/* Album selection */}
        <Text style={styles.sectionTitle}>가져올 앨범 선택</Text>
        {availableAlbums.map((album, index) => (
          <Animated.View key={album.id} entering={FadeInDown.delay(index * 50).duration(300)}>
            <Pressable
              style={[styles.albumRow, selectedAlbumId === album.id && styles.albumRowActive]}
              onPress={() => setSelectedAlbumId(album.id)}
            >
              <View style={[styles.albumThumb, { backgroundColor: album.coverColor }]}>
                <BookOpen size={20} color={colors.textOnDark} />
              </View>
              <View style={styles.albumInfo}>
                <Text style={styles.albumTitle} numberOfLines={1}>{album.title}</Text>
                <Text style={styles.albumMeta}>{album.pageCount}페이지</Text>
              </View>
              {selectedAlbumId === album.id && (
                <Check size={20} color={colors.accent} weight="bold" />
              )}
            </Pressable>
          </Animated.View>
        ))}

        {availableAlbums.length === 0 && (
          <Text style={styles.emptyText}>가져올 수 있는 앨범이 없습니다</Text>
        )}
      </ScrollView>
    </View>
  );
}

