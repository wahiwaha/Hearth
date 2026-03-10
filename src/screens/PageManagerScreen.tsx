import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Plus,
  Trash,
  DotsSixVertical,
  PencilSimple,
  CopySimple,
  ArrowsDownUp,
} from 'phosphor-react-native';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { RootStackParamList } from '../types/navigation';
import { useAlbumStore } from '../store/AlbumStore';
import { WarmBackground, GlassCard, IconButton } from '../components/common';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PageManager'>;

export function PageManagerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { getAlbum, addPage, deletePage } = useAlbumStore();

  const styles = useThemedStyles((c) => ({
    root: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { ...typography.subtitle, color: c.textPrimary, fontSize: 20 },
    headerSubtitle: { ...typography.caption, color: c.textSecondary, marginTop: 2 },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },

    pageCard: { marginBottom: 4 },
    pageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    pagePreview: {
      width: 56,
      height: 72,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    pagePreviewNum: {
      ...typography.subtitle,
      color: c.textMuted,
      fontSize: 18,
      opacity: 0.4,
    },
    elementCount: {
      ...typography.caption,
      color: c.textMuted,
      fontSize: 9,
      marginTop: 2,
    },
    pageInfo: { flex: 1, marginLeft: 14 },
    pageName: { ...typography.body, color: c.textPrimary, fontWeight: '500' },
    pageDetail: { ...typography.caption, color: c.textMuted, marginTop: 2 },
    pageActions: { flexDirection: 'row', gap: 8 },
    actionSmallBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: 'rgba(160, 149, 133, 0.06)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Insert button
    insertBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 12,
    },
    insertLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.divider,
    },
    insertCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: 'rgba(196, 139, 53, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 8,
    },
  }));

  const album = getAlbum(route.params.albumId);
  const pages = useMemo(() => album?.pages || [], [album]);

  const handleAddPage = useCallback((afterPageId?: string) => {
    if (!album) return;
    addPage(album.id, afterPageId);
  }, [album, addPage]);

  const handleDeletePage = useCallback((pageId: string, pageNum: number) => {
    if (!album) return;
    if (pages.length <= 1) {
      Alert.alert('삭제 불가', '최소 1개의 페이지가 필요합니다.');
      return;
    }
    Alert.alert(
      '페이지 삭제',
      `${pageNum + 1}페이지를 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => deletePage(album.id, pageId),
        },
      ],
    );
  }, [album, pages, deletePage]);

  const handleEditPage = useCallback((pageId: string) => {
    if (!album) return;
    navigation.navigate('AlbumEditor', { albumId: album.id, pageId });
  }, [album, navigation]);

  if (!album) return null;

  return (
    <View style={styles.root}>
      <WarmBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </IconButton>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>페이지 관리</Text>
          <Text style={styles.headerSubtitle}>{pages.length}페이지</Text>
        </View>
        <IconButton
          size={36}
          backgroundColor={colors.accent}
          onPress={() => handleAddPage()}
        >
          <Plus size={20} color={colors.warmWhite} weight="bold" />
        </IconButton>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {pages.map((page, index) => (
          <Animated.View
            key={page.id}
            entering={FadeInDown.delay(50 + index * 40).duration(350)}
          >
            <GlassCard style={styles.pageCard} padding={0}>
              <Pressable
                style={styles.pageRow}
                onPress={() => handleEditPage(page.id)}
              >
                {/* Page preview */}
                <View style={[styles.pagePreview, { backgroundColor: page.backgroundColor }]}>
                  <Text style={styles.pagePreviewNum}>{page.pageNumber + 1}</Text>
                  {page.elements.length > 0 && (
                    <Text style={styles.elementCount}>
                      {page.elements.length}개 요소
                    </Text>
                  )}
                </View>

                {/* Page info */}
                <View style={styles.pageInfo}>
                  <Text style={styles.pageName}>
                    {page.pageNumber === 0 ? '표지 (앞)' :
                     page.pageNumber === 1 ? '표지 (뒤)' :
                     `${page.pageNumber + 1}페이지`}
                  </Text>
                  <Text style={styles.pageDetail}>
                    {page.elements.length === 0 ? '비어있음' :
                     `사진 ${page.elements.filter(e => e.type === 'photo').length} · 스티커 ${page.elements.filter(e => e.type === 'sticker').length}`}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.pageActions}>
                  <Pressable
                    style={styles.actionSmallBtn}
                    onPress={() => handleEditPage(page.id)}
                  >
                    <PencilSimple size={16} color={colors.textSecondary} />
                  </Pressable>
                  <Pressable
                    style={styles.actionSmallBtn}
                    onPress={() => handleDeletePage(page.id, page.pageNumber)}
                  >
                    <Trash size={16} color="#E57373" />
                  </Pressable>
                </View>
              </Pressable>

              {/* Insert page button between pages */}
              <Pressable
                style={styles.insertBtn}
                onPress={() => handleAddPage(page.id)}
              >
                <View style={styles.insertLine} />
                <View style={styles.insertCircle}>
                  <Plus size={10} color={colors.accent} weight="bold" />
                </View>
                <View style={styles.insertLine} />
              </Pressable>
            </GlassCard>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

