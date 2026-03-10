import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Sparkle, BookmarkSimple } from 'phosphor-react-native';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { WarmBackground, IconButton, GlassCard } from '../components/common';
import { useTemplateStore } from '../store/TemplateStore';
import { DecoTemplate } from '../types/album';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - 12) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

export function TemplateGalleryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { templates } = useTemplateStore();

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

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
      marginTop: 8,
    },
    sectionTitle: { ...typography.label, color: c.textSecondary },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

    card: { width: CARD_WIDTH, marginBottom: 4 },
    cardPreview: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 10,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    slotPreview: {
      position: 'absolute',
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    slotText: { ...typography.caption, color: c.textMuted, fontSize: 9 },
    cardInfo: { paddingTop: 6, paddingHorizontal: 2 },
    cardName: { ...typography.body, color: c.textPrimary, fontSize: 13, fontWeight: '500' },
    cardMeta: { ...typography.caption, color: c.textMuted, fontSize: 10, marginTop: 1 },
    userBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      backgroundColor: c.cardBg,
      borderRadius: 10,
      padding: 4,
    },
  }));

  const renderTemplate = useCallback((template: DecoTemplate, index: number) => {
    const photoSlots = template.elements.filter(e => e.type === 'photo').length;
    const textSlots = template.elements.filter(e => e.type === 'text').length;

    return (
      <Animated.View key={template.id} entering={FadeInDown.delay(80 + index * 50).duration(350)}>
        <Pressable style={styles.card}>
          <View style={[styles.cardPreview, { backgroundColor: template.backgroundColor }]}>
            {/* Render template element slots */}
            {template.elements.map((el, i) => (
              <View
                key={i}
                style={[
                  styles.slotPreview,
                  {
                    left: (el.x / 100) * CARD_WIDTH,
                    top: (el.y / 100) * CARD_HEIGHT,
                    width: (el.width / 100) * CARD_WIDTH,
                    height: (el.height / 100) * CARD_HEIGHT,
                    transform: [{ rotate: `${el.rotation}deg` }],
                    backgroundColor: el.type === 'photo' ? 'rgba(160, 149, 133, 0.15)' : 'transparent',
                    borderWidth: el.type === 'photo' ? 1 : 0,
                    borderColor: 'rgba(160, 149, 133, 0.2)',
                    borderStyle: 'dashed',
                  },
                ]}
              >
                {el.type === 'text' && (
                  <Text style={styles.slotText} numberOfLines={1}>
                    {el.textContent || 'Aa'}
                  </Text>
                )}
              </View>
            ))}
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>{template.name}</Text>
            <Text style={styles.cardMeta}>
              {photoSlots > 0 ? `사진 ${photoSlots}장` : ''}
              {photoSlots > 0 && textSlots > 0 ? ' · ' : ''}
              {textSlots > 0 ? `텍스트 ${textSlots}` : ''}
            </Text>
          </View>
          {!template.isPublic && (
            <View style={styles.userBadge}>
              <BookmarkSimple size={12} color={colors.accent} weight="fill" />
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  }, []);

  const builtIn = templates.filter(t => t.createdBy === 'system');
  const userMade = templates.filter(t => t.createdBy !== 'system');

  return (
    <View style={styles.root}>
      <WarmBackground />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </IconButton>
        <Text style={styles.headerTitle}>템플릿</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Built-in templates */}
        <View style={styles.sectionHeader}>
          <Sparkle size={16} color={colors.accent} weight="fill" />
          <Text style={styles.sectionTitle}>기본 템플릿</Text>
        </View>
        <View style={styles.grid}>
          {builtIn.map((t, i) => renderTemplate(t, i))}
        </View>

        {/* User templates */}
        {userMade.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <BookmarkSimple size={16} color={colors.dustyRose} weight="fill" />
              <Text style={styles.sectionTitle}>내 템플릿</Text>
            </View>
            <View style={styles.grid}>
              {userMade.map((t, i) => renderTemplate(t, i + builtIn.length))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

