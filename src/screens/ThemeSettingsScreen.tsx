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
import { colors, typography, spacing } from '../theme';
import { ThemeMode } from '../theme/colors';
import { WarmBackground, IconButton, GlassCard } from '../components/common';
import { useThemeStore } from '../store/ThemeStore';

const THEME_OPTIONS: { mode: ThemeMode; icon: typeof Sun; label: string; desc: string }[] = [
  { mode: 'light', icon: Sun, label: '라이트 모드', desc: '밝은 따뜻한 테마' },
  { mode: 'dark', icon: Moon, label: '다크 모드', desc: '어두운 따뜻한 테마' },
  { mode: 'system', icon: DeviceMobile, label: '시스템 설정', desc: '기기 설정에 따라 자동 전환' },
];

export function ThemeSettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { mode, setMode } = useThemeStore();

  return (
    <View style={styles.root}>
      <WarmBackground />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </IconButton>
        <Text style={styles.headerTitle}>테마 변경</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {THEME_OPTIONS.map((option, index) => (
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
          <Text style={styles.previewLabel}>미리보기</Text>
          <View style={styles.previewCards}>
            <View style={[styles.previewCard, { backgroundColor: '#FDFAF5' }]}>
              <View style={[styles.previewShelf, { backgroundColor: '#D4BFA6' }]} />
              <Text style={[styles.previewText, { color: '#2C1F10' }]}>라이트</Text>
            </View>
            <View style={[styles.previewCard, { backgroundColor: '#1A1510' }]}>
              <View style={[styles.previewShelf, { backgroundColor: '#4A3E32' }]} />
              <Text style={[styles.previewText, { color: '#F0E8DB' }]}>다크</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: { ...typography.subtitle, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.cardBg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardActive: { borderColor: colors.accent },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(160, 149, 133, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: { backgroundColor: colors.accent },
  optionInfo: { flex: 1, marginLeft: 14 },
  optionLabel: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  optionDesc: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  preview: { marginTop: 24 },
  previewLabel: { ...typography.label, color: colors.textSecondary, marginBottom: 10 },
  previewCards: { flexDirection: 'row', gap: 12 },
  previewCard: {
    flex: 1,
    height: 100,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewShelf: { height: 6, borderRadius: 3, marginBottom: 8 },
  previewText: { ...typography.caption, fontWeight: '600' },
});
