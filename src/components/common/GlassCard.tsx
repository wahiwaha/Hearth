import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemedStyles } from '../../theme';
import { useColors, useIsDark } from '../../store/ThemeStore';

type GlassVariant = 'default' | 'stats' | 'elevated';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
  variant?: GlassVariant;
}

export function GlassCard({ children, style, padding = 20, variant = 'default' }: GlassCardProps) {
  const colors = useColors();
  const isDark = useIsDark();

  const styles = useThemedStyles((c) => ({
    card: {
      borderRadius: 16,
      overflow: 'hidden' as const,
    },
    // Default: clean, subtle card for settings/menus
    default: {
      backgroundColor: isDark ? 'rgba(38,32,24,0.88)' : 'rgba(253,250,245,0.90)',
      shadowColor: isDark ? '#000' : '#8A7A60',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.15 : 0.08,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(120,108,92,0.12)' : 'rgba(200,185,160,0.25)',
    },
    // Stats: emphasized, slightly warmer with inner glow
    stats: {
      backgroundColor: isDark ? 'rgba(42,35,26,0.92)' : 'rgba(255,252,248,0.95)',
      shadowColor: isDark ? '#000' : '#A08A60',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.20 : 0.12,
      shadowRadius: 12,
      elevation: 5,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(180,150,100,0.10)' : 'rgba(200,170,120,0.18)',
    },
    // Elevated: floating card with stronger depth
    elevated: {
      backgroundColor: isDark ? 'rgba(45,38,28,0.94)' : 'rgba(255,253,250,0.95)',
      shadowColor: isDark ? '#000' : '#6A5A40',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.25 : 0.15,
      shadowRadius: 16,
      elevation: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(140,120,90,0.12)' : 'rgba(180,160,130,0.20)',
    },
  }));

  const variantStyle = styles[variant];

  return (
    <View style={[styles.card, variantStyle, { padding }, style]}>
      {/* Top edge highlight — light catching on card edge */}
      {variant === 'stats' && (
        <LinearGradient
          colors={[
            isDark ? 'rgba(200,170,110,0.06)' : 'rgba(255,245,220,0.5)',
            'transparent',
          ]}
          style={innerStyles.topHighlight}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      )}
      {children}
    </View>
  );
}

const innerStyles = StyleSheet.create({
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});
