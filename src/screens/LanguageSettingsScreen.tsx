import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Check } from 'phosphor-react-native';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { Locale } from '../i18n/translations';
import { useT } from '../i18n';
import { useLanguageStore } from '../store/LanguageStore';
import { WarmBackground, IconButton } from '../components/common';

const LANGUAGE_OPTIONS: { locale: Locale; label: string; nativeLabel: string }[] = [
  { locale: 'ko', label: '한국어', nativeLabel: '한국어' },
  { locale: 'en', label: 'English', nativeLabel: 'English' },
];

export function LanguageSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const t = useT();
  const { locale, setLocale } = useLanguageStore();

  const styles = useThemedStyles((c) => ({
    root: { flex: 1 },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    headerTitle: { ...typography.subtitle, color: c.textPrimary, flex: 1, textAlign: 'center' as const },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: 8,
    },
    optionCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 16,
      borderRadius: 12,
      backgroundColor: c.cardBg,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    optionCardActive: { borderColor: c.accent },
    optionInfo: { flex: 1 },
    optionLabel: { ...typography.body, color: c.textPrimary, fontWeight: '600' as const },
    optionDesc: { ...typography.caption, color: c.textMuted, marginTop: 2 },
  }));

  return (
    <View style={styles.root}>
      <WarmBackground />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </IconButton>
        <Text style={styles.headerTitle}>{t.languageTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {LANGUAGE_OPTIONS.map((option, index) => (
          <Animated.View key={option.locale} entering={FadeInDown.delay(100 + index * 80).duration(400)}>
            <Pressable
              style={[styles.optionCard, locale === option.locale && styles.optionCardActive]}
              onPress={() => setLocale(option.locale)}
            >
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDesc}>{option.nativeLabel}</Text>
              </View>
              {locale === option.locale && (
                <Check size={20} color={colors.accent} weight="bold" />
              )}
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
