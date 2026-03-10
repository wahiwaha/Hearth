import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import {
  Canvas,
  Fill,
  Rect,
  Group,
  Turbulence,
  FractalNoise,
  LinearGradient as SkiaGradient,
  ColorMatrix,
  Blur,
  vec,
  Blend,
} from '@shopify/react-native-skia';

const { width, height } = Dimensions.get('window');

// Color matrix: maps turbulence noise → warm brown wood tones
// Turbulence outputs values ~0-1 per channel; this remaps to brown palette
const WOOD_MATRIX = [
  // R     G     B     A   offset
  0.30, 0.20, 0.10, 0, 0.22, // Red:   warm amber
  0.18, 0.14, 0.06, 0, 0.12, // Green: muted olive
  0.06, 0.05, 0.03, 0, 0.04, // Blue:  almost none
  0, 0, 0, 1, 0,       // Alpha: opaque
];

// Secondary layer: darker grain variation
const GRAIN_MATRIX = [
  0.20, 0.15, 0.08, 0, 0.15,
  0.12, 0.10, 0.05, 0, 0.08,
  0.04, 0.03, 0.02, 0, 0.02,
  0, 0, 0, 0.6, 0,
];

export function WoodBackground() {
  return (
    <Canvas style={StyleSheet.absoluteFill}>
      {/* Layer 1: Base dark brown fill */}
      <Fill color="#3A2214" />

      {/* Layer 2: Primary wood grain — stretched turbulence (vertical grain) */}
      <Group>
        <Blur blur={10} />
        <Fill>
          <Turbulence
            freqX={0.008}
            freqY={0.08}
            octaves={5}
            seed={14}
            tileWidth={width}
            tileHeight={height}
          />
          <ColorMatrix matrix={WOOD_MATRIX} />
        </Fill>
      </Group>

      {/* Layer 3: Fine grain detail — fractal noise for organic texture */}
      <Group>
        <Blur blur={4} />
        <Fill>
          <FractalNoise
            freqX={0.02}
            freqY={0.12}
            octaves={6}
            seed={7}
            tileWidth={width}
            tileHeight={height}
          />
          <ColorMatrix matrix={GRAIN_MATRIX} />
        </Fill>
      </Group>

      {/* Layer 4: Large-scale color variation — knots & light spots */}
      <Group>
        <Blur blur={40} />
        <Fill>
          <Turbulence
            freqX={0.004}
            freqY={0.006}
            octaves={3}
            seed={42}
            tileWidth={width}
            tileHeight={height}
          />
          <ColorMatrix
            matrix={[
              0.15, 0.10, 0.05, 0, 0.08,
              0.08, 0.06, 0.03, 0, 0.04,
              0.02, 0.02, 0.01, 0, 0.01,
              0, 0, 0, 0.45, 0,
            ]}
          />
        </Fill>
      </Group>

      {/* Layer 5: Warm center glow — light hitting the surface */}
      <Rect x={0} y={0} width={width} height={height} opacity={0.35}>
        <SkiaGradient
          start={vec(width * 0.5, height * 0.15)}
          end={vec(width * 0.5, height * 0.85)}
          colors={['transparent', '#A06A30', '#B07838', '#905828', 'transparent']}
          positions={[0, 0.25, 0.45, 0.65, 1]}
        />
      </Rect>

      {/* Layer 6: Vignette — darker edges */}
      <Rect x={0} y={0} width={width} height={height}>
        <SkiaGradient
          start={vec(width * 0.5, 0)}
          end={vec(width * 0.5, height * 0.35)}
          colors={['rgba(20, 12, 4, 0.55)', 'transparent']}
        />
      </Rect>
      <Rect x={0} y={height * 0.65} width={width} height={height * 0.35}>
        <SkiaGradient
          start={vec(width * 0.5, height * 0.65)}
          end={vec(width * 0.5, height)}
          colors={['transparent', 'rgba(20, 12, 4, 0.60)']}
        />
      </Rect>
      <Rect x={0} y={0} width={width * 0.2} height={height}>
        <SkiaGradient
          start={vec(0, height * 0.5)}
          end={vec(width * 0.2, height * 0.5)}
          colors={['rgba(15, 8, 2, 0.45)', 'transparent']}
        />
      </Rect>
      <Rect x={width * 0.8} y={0} width={width * 0.2} height={height}>
        <SkiaGradient
          start={vec(width * 0.8, height * 0.5)}
          end={vec(width, height * 0.5)}
          colors={['transparent', 'rgba(15, 8, 2, 0.40)']}
        />
      </Rect>
    </Canvas>
  );
}
