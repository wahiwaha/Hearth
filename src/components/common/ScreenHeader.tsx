import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'phosphor-react-native';
import { colors, typography, spacing } from '../../theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  leftAction?: ReactNode;
  animated?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  leftAction,
  animated = true,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.leftSlot}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={8} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.textPrimary} weight="regular" />
          </Pressable>
        ) : leftAction || <View style={styles.placeholder} />}
      </View>

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.rightSlot}>
        {rightAction || <View style={styles.placeholder} />}
      </View>
    </View>
  );

  if (animated) {
    return (
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        {content}
      </Animated.View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  leftSlot: {
    width: 44,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  rightSlot: {
    width: 44,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 44,
  },
  backButton: {
    padding: 4,
  },
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontSize: 20,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
