import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Canvas,
  Fill,
  FractalNoise,
  ColorMatrix,
  Blur,
  Group,
  Rect,
  LinearGradient as SkiaGradient,
  vec,
} from '@shopify/react-native-skia';
import { useColors, useIsDark } from '../../store/ThemeStore';

const { width, height } = Dimensions.get('window');

// Paper texture: maps noise to warm cream/beige tones
const PAPER_MATRIX_LIGHT = [
  // R     G     B     A    offset
  0.03, 0.02, 0.01, 0, 0.92, // Red:   warm cream base
  0.03, 0.02, 0.01, 0, 0.89, // Green: slightly less
  0.02, 0.01, 0.01, 0, 0.84, // Blue:  least (warm bias)
  0, 0, 0, 0.12, 0,          // Alpha: subtle
];

const PAPER_MATRIX_DARK = [
  0.03, 0.02, 0.01, 0, 0.06,
  0.02, 0.02, 0.01, 0, 0.05,
  0.01, 0.01, 0.01, 0, 0.03,
  0, 0, 0, 0.10, 0,
];

export function WarmBackground() {
  const colors = useColors();
  const isDark = useIsDark();

  const gradientColors = isDark
    ? [colors.warmWhite, colors.background, colors.backgroundDark, '#0E0C08'] as const
    : [colors.warmWhite, colors.background, colors.backgroundDark, '#E8DFCF'] as const;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Base gradient */}
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Paper texture overlay via Skia */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Fine paper grain — subtle fiber texture */}
        <Group>
          <Blur blur={0.8} />
          <Fill>
            <FractalNoise
              freqX={0.35}
              freqY={0.35}
              octaves={4}
              seed={23}
              tileWidth={width}
              tileHeight={height}
            />
            <ColorMatrix matrix={isDark ? PAPER_MATRIX_DARK : PAPER_MATRIX_LIGHT} />
          </Fill>
        </Group>

        {/* Coarser paper texture — aged paper spots */}
        <Group>
          <Blur blur={3} />
          <Fill>
            <FractalNoise
              freqX={0.06}
              freqY={0.06}
              octaves={3}
              seed={11}
              tileWidth={width}
              tileHeight={height}
            />
            <ColorMatrix
              matrix={isDark ? [
                0.04, 0.03, 0.01, 0, 0.04,
                0.03, 0.02, 0.01, 0, 0.03,
                0.01, 0.01, 0.01, 0, 0.01,
                0, 0, 0, 0.08, 0,
              ] : [
                0.04, 0.03, 0.01, 0, 0.90,
                0.04, 0.02, 0.01, 0, 0.86,
                0.02, 0.01, 0.01, 0, 0.80,
                0, 0, 0, 0.06, 0,
              ]}
            />
          </Fill>
        </Group>

        {/* Warm vignette — darker edges for coziness */}
        <Rect x={0} y={0} width={width} height={height}>
          <SkiaGradient
            start={vec(width * 0.5, height * 0.5)}
            end={vec(0, 0)}
            colors={[
              'transparent',
              isDark ? 'rgba(8,5,2,0.25)' : 'rgba(140,120,90,0.08)',
            ]}
          />
        </Rect>
      </Canvas>
    </View>
  );
}
