import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Sun, Moon, DeviceMobile, Check } from 'phosphor-react-native';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { ThemeMode } from '../theme/colors';
import { WarmBackground, IconButton, GlassCard } from '../components/common';
import { useThemeStore } from '../store/ThemeStore';
import { useT } from '../i18n';

function useThemeOptions() {
  const t = useT();
  return [
    { mode: 'light' as ThemeMode, icon: Sun, label: t.lightMode, desc: t.lightModeDesc },
    { mode: 'dark' as ThemeMode, icon: Moon, label: t.darkMode, desc: t.darkModeDesc },
    { mode: 'system' as ThemeMode, icon: DeviceMobile, label: t.systemMode, desc: t.systemModeDesc },
  ];
}

export function ThemeSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { mode, setMode } = useThemeStore();
  const t = useT();
  const themeOptions = useThemeOptions();

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
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: 'rgba(160, 140, 110, 0.08)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    iconWrapActive: { backgroundColor: c.accent },
    optionInfo: { flex: 1, marginLeft: 14 },
    optionLabel: { ...typography.body, color: c.textPrimary, fontWeight: '600' as const },
    optionDesc: { ...typography.caption, color: c.textMuted, marginTop: 2 },

    preview: { marginTop: 24 },
    previewLabel: { ...typography.label, color: c.textSecondary, marginBottom: 10 },
    previewCards: { flexDirection: 'row' as const, gap: 12 },
    previewCard: {
      flex: 1,
      height: 100,
      borderRadius: 10,
      padding: 12,
      justifyContent: 'flex-end' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 3,
    },
    previewShelf: { height: 6, borderRadius: 3, marginBottom: 8 },
    previewText: { ...typography.caption, fontWeight: '600' as const },
  }));

  return (
    <View style={styles.root}>
      <WarmBackground />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </IconButton>
        <Text style={styles.headerTitle}>{t.themeChange}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {themeOptions.map((option, index) => (
          <Animated.View key={option.mode} entering={FadeInDown.delay(100 + index * 80).duration(400)}>
            <Pressable
              style={[styles.optionCard, mode === option.mode && styles.optionCardActive]}
              onPress={() => setMode(option.mode)}
            >
              <View style={[styles.iconWrap, mode === option.mode && styles.iconWrapActive]}>
                <option.icon
                  size={28}
                  color={mode === option.mode ? colors.warmWhite : colors.textSecondary}
                  weight={mode === option.mode ? 'fill' : 'regular'}
                />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDesc}>{option.desc}</Text>
              </View>
              {mode === option.mode && (
                <Check size={20} color={colors.accent} weight="bold" />
              )}
            </Pressable>
          </Animated.View>
        ))}

        {/* Preview */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.preview}>
          <Text style={styles.previewLabel}>{t.preview}</Text>
          <View style={styles.previewCards}>
            <View style={[styles.previewCard, { backgroundColor: '#F5EDE4' }]}>
              <View style={[styles.previewShelf, { backgroundColor: '#C4A882' }]} />
              <Text style={[styles.previewText, { color: '#3C2E20' }]}>{t.light}</Text>
            </View>
            <View style={[styles.previewCard, { backgroundColor: '#1A1310' }]}>
              <View style={[styles.previewShelf, { backgroundColor: '#443828' }]} />
              <Text style={[styles.previewText, { color: '#EDE3D2' }]}>{t.dark}</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
