import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemedStyles } from '../../theme';
import { useColors } from '../../store/ThemeStore';

interface AvatarProps {
  initial: string;
  color: string;
  size?: number;
  style?: ViewStyle;
  imageUrl?: string;
}

const lighten = (hex: string, amount: number) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
  const b = Math.min(255, (num & 0xFF) + amount);
  return `rgb(${r}, ${g}, ${b})`;
};

const darken = (hex: string, amount: number) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
  const b = Math.max(0, (num & 0xFF) - amount);
  return `rgb(${r}, ${g}, ${b})`;
};

export const Avatar = React.memo(function Avatar({ initial, color, size = 44, style, imageUrl }: AvatarProps) {
  const colors = useColors();
  const styles = useThemedStyles((colors) => ({
    container: {
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      overflow: 'hidden' as const,
      shadowColor: '#1E1408',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 4,
    },
    borderOverlay: {
      ...StyleSheet.absoluteFillObject,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 250, 240, 0.35)',
    },
    avatarHighlight: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      height: '45%' as unknown as number,
    },
    initial: {
      color: colors.textOnDark,
      fontWeight: '700' as const,
      textShadowColor: 'rgba(0,0,0,0.2)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  }));

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      {imageUrl ? (
        <Image
          key={imageUrl}
          source={{ uri: imageUrl, cache: 'reload' }}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          resizeMode="cover"
        />
      ) : (
        <>
          <LinearGradient
            colors={[lighten(color, 15), color, darken(color, 15)]}
            style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
          />
          {/* Top light reflection */}
          <LinearGradient
            colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
            style={[styles.avatarHighlight, { borderTopLeftRadius: size / 2, borderTopRightRadius: size / 2 }]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <Text style={[styles.initial, { fontSize: size * 0.36 }]}>
            {initial}
          </Text>
        </>
      )}
      {/* Thin cream border */}
      <View
        style={[
          styles.borderOverlay,
          { borderRadius: size / 2 },
        ]}
      />
    </View>
  );
});
