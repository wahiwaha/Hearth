import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemedStyles } from '../../theme';
import { useColors } from '../../store/ThemeStore';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface IconButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  size?: number;
  backgroundColor?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

export function IconButton({
  children,
  onPress,
  size = 40,
  backgroundColor = 'transparent',
  style,
  disabled = false,
}: IconButtonProps) {
  const colors = useColors();
  const pressed = useSharedValue(0);

  const styles = useThemedStyles((colors) => ({
    button: {
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      overflow: 'hidden' as const,
    },
    buttonWithBg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.20,
      shadowRadius: 6,
      elevation: 4,
    },
  }));

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.90]);
    const translateY = interpolate(pressed.value, [0, 1], [0, 1]);
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const hasBg = backgroundColor !== 'transparent';

  return (
    <AnimatedPressable
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          opacity: disabled ? 0.4 : 1,
        },
        hasBg && styles.buttonWithBg,
        animatedStyle,
        style,
      ]}
      onPress={onPress}
      onPressIn={() => { pressed.value = withSpring(1, { damping: 25, stiffness: 500 }); }}
      onPressOut={() => { pressed.value = withSpring(0, { damping: 20, stiffness: 400 }); }}
      disabled={disabled}
    >
      {hasBg && (
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      )}
      {children}
    </AnimatedPressable>
  );
}
