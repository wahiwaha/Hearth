import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  Canvas,
  Rect,
  LinearGradient as SkiaGradient,
  vec,
  Line,
} from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { PencilSimple, CaretLeft, CaretRight } from 'phosphor-react-native';
import { AlbumPage } from '../types/album';
import { typography, spacing } from '../theme';
import { useColors } from '../store/ThemeStore';

// ─── Constants ──────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOOK_MARGIN = 16;
const SPINE_W = 6;
const SNAP_THRESHOLD = 0.25;
const DEAD_ZONE = 12;
const EDGE_THICKNESS = 4;

const PERSPECTIVE = 1200;
const THICK_EASING = Easing.bezier(0.25, 0.1, 0.25, 1.0);
const FLIP_MS = 600;
const COVER_MS = 700;

// ─── Types ──────────────────────────────────────────

// COVER: front cover centered
// SPREAD: 2-page spread with spine
// BACK_COVER: back cover centered
type BookPhase = 'COVER' | 'SPREAD' | 'BACK_COVER';

interface PageCurlBookProps {
  pages: AlbumPage[];
  coverColor?: string;
  spineColor?: string;
  title?: string;
  initialPageIndex?: number;
  pageWidth?: number;
  pageHeight?: number;
  onPageChange?: (index: number) => void;
  onPageTap?: (page: AlbumPage, index: number) => void;
}

// ─── Helpers ────────────────────────────────────────

function darkenColor(hex: string, amt: number): string {
  const c = hex.replace('#', '');
  const num = parseInt(c, 16);
  const r = Math.max(0, (num >> 16) - amt);
  const g = Math.max(0, ((num >> 8) & 0xff) - amt);
  const b = Math.max(0, (num & 0xff) - amt);
  return `rgb(${r},${g},${b})`;
}

function lightenColor(hex: string, amt: number): string {
  const c = hex.replace('#', '');
  const num = parseInt(c, 16);
  const r = Math.min(255, (num >> 16) + amt);
  const g = Math.min(255, ((num >> 8) & 0xff) + amt);
  const b = Math.min(255, (num & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

// ─── Sub-components ─────────────────────────────────

/** Render album page content */
function PageContent({
  page,
  width,
  height,
}: {
  page: AlbumPage;
  width: number;
  height: number;
}) {
  const colors = useColors();
  return (
    <View style={[s.pageContent, { width, height, backgroundColor: page.backgroundColor || '#FDFAF5' }]}>
      {page.elements.length > 0 ? (
        page.elements
          .filter(el => el.type === 'photo' && el.photoUri)
          .slice(0, 6)
          .map(el => (
            <Image
              key={el.id}
              source={{ uri: el.photoUri }}
              style={[
                s.elPreview,
                {
                  left: (el.x / 100) * width,
                  top: (el.y / 100) * height,
                  width: (el.width / 100) * width,
                  height: (el.height / 100) * height,
                  transform: [{ rotate: `${el.rotation}deg` }],
                  opacity: el.isBlurred ? 0.2 : (el.opacity ?? 1),
                },
              ]}
            />
          ))
      ) : (
        <View style={s.emptyPage}>
          <PencilSimple size={18} color={colors.textMuted} />
        </View>
      )}
      <Text style={[s.pageNum, { color: colors.textMuted }]}>{page.pageNumber + 1}</Text>

      {/* Subtle page texture lines */}
      <View style={s.pageTexture} pointerEvents="none">
        {[0.15, 0.30, 0.45, 0.60, 0.75, 0.88].map((p, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: height * p,
              left: width * 0.06,
              right: width * 0.06,
              height: StyleSheet.hairlineWidth,
              backgroundColor: 'rgba(160,140,110,0.08)',
            }}
          />
        ))}
      </View>
    </View>
  );
}

/** Cover front face */
function CoverFace({
  coverColor,
  title,
  width,
  height,
}: {
  coverColor: string;
  title?: string;
  width: number;
  height: number;
}) {
  return (
    <View style={[s.coverFace, { width, height }]}>
      <LinearGradient
        colors={[lightenColor(coverColor, 22), coverColor, darkenColor(coverColor, 30)] as any}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
      />
      {/* Leather grain */}
      <View style={s.leatherGrain} pointerEvents="none">
        {Array.from({ length: 24 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: i * (height / 24),
              left: 0,
              right: 0,
              height: StyleSheet.hairlineWidth,
              backgroundColor: '#000',
              opacity: 0.04 + (i % 3) * 0.02,
            }}
          />
        ))}
      </View>
      {/* Gold embossed frame */}
      <View style={s.coverFrame}>
        {title && (
          <Text style={s.coverTitle} numberOfLines={2}>{title}</Text>
        )}
      </View>
      {/* Corner ornaments */}
      <View style={[s.cornerOrnament, { top: 12, left: 12, borderTopWidth: 1.5, borderLeftWidth: 1.5 }]} />
      <View style={[s.cornerOrnament, { top: 12, right: 12, borderTopWidth: 1.5, borderRightWidth: 1.5 }]} />
      <View style={[s.cornerOrnament, { bottom: 12, left: 12, borderBottomWidth: 1.5, borderLeftWidth: 1.5 }]} />
      <View style={[s.cornerOrnament, { bottom: 12, right: 12, borderBottomWidth: 1.5, borderRightWidth: 1.5 }]} />
      {/* Top light reflection */}
      <LinearGradient
        colors={['rgba(255,252,245,0.22)', 'rgba(255,252,245,0)'] as any}
        style={[StyleSheet.absoluteFill, { height: height * 0.35 }]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />
    </View>
  );
}

/** Cover inner (back of front cover) */
function CoverInner({ width, height }: { width: number; height: number }) {
  return (
    <View style={[s.coverInner, { width, height }]}>
      {/* Marbled endpaper pattern */}
      <View style={s.endpaperPattern} pointerEvents="none">
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: i * (height / 12),
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: 'rgba(160,140,100,0.06)',
            }}
          />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={`v${i}`}
            style={{
              position: 'absolute',
              left: i * (width / 8),
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: 'rgba(160,140,100,0.04)',
            }}
          />
        ))}
      </View>
    </View>
  );
}

/** Spine between pages in spread view */
function BookSpineView({ height }: { height: number }) {
  const totalW = SPINE_W + 20; // gutter shadows included
  return (
    <Canvas style={{ width: totalW, height }} pointerEvents="none">
      {/* Left gutter shadow */}
      <Rect x={0} y={0} width={10} height={height}>
        <SkiaGradient
          start={vec(0, 0)}
          end={vec(10, 0)}
          colors={['transparent', 'rgba(0,0,0,0.08)']}
        />
      </Rect>
      {/* Spine body */}
      <Rect x={10} y={0} width={SPINE_W} height={height}>
        <SkiaGradient
          start={vec(10, 0)}
          end={vec(10 + SPINE_W, 0)}
          colors={['rgba(0,0,0,0.20)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.20)']}
        />
      </Rect>
      {/* Right gutter shadow */}
      <Rect x={10 + SPINE_W} y={0} width={10} height={height}>
        <SkiaGradient
          start={vec(10 + SPINE_W, 0)}
          end={vec(totalW, 0)}
          colors={['rgba(0,0,0,0.08)', 'transparent']}
        />
      </Rect>
    </Canvas>
  );
}

/** Page edge stack — shows thickness of remaining pages */
function EdgeStack({
  side,
  count,
  height,
}: {
  side: 'left' | 'right';
  count: number;
  height: number;
}) {
  const thickness = Math.min(count * 0.7, 8);
  if (thickness < 0.5) return null;
  const w = Math.ceil(thickness) + 2;

  return (
    <Canvas
      style={{
        position: 'absolute',
        width: w,
        height,
        [side === 'left' ? 'left' : 'right']: -w + 1,
        top: 0,
      }}
      pointerEvents="none"
    >
      {/* Layered page lines */}
      {Array.from({ length: Math.min(Math.ceil(count / 2), 6) }).map((_, i) => {
        const x = side === 'left' ? w - 1 - i * (thickness / 6) : 1 + i * (thickness / 6);
        return (
          <Line
            key={i}
            p1={vec(x, 3)}
            p2={vec(x, height - 3)}
            color={`rgba(230,220,205,${0.7 - i * 0.08})`}
            style="stroke"
            strokeWidth={0.7}
          />
        );
      })}
      {/* Solid edge body */}
      <Rect
        x={side === 'left' ? w - thickness : 0}
        y={1}
        width={thickness}
        height={height - 2}
      >
        <SkiaGradient
          start={vec(side === 'left' ? w - thickness : 0, 0)}
          end={vec(side === 'left' ? w : thickness, 0)}
          colors={
            side === 'left'
              ? ['#DDD5C5', '#EDE6D8', '#F2ECE2', '#EDE6D8']
              : ['#EDE6D8', '#F2ECE2', '#EDE6D8', '#DDD5C5']
          }
        />
      </Rect>
    </Canvas>
  );
}

/** Thick page edge visible at ~90 degrees during flip */
function FlipEdge({
  coverColor,
  isCover,
  height,
}: {
  coverColor: string;
  isCover?: boolean;
  height: number;
}) {
  return (
    <View style={{ width: EDGE_THICKNESS, height, overflow: 'hidden' }}>
      {isCover ? (
        <LinearGradient
          colors={[darkenColor(coverColor, 10), coverColor, darkenColor(coverColor, 15)] as any}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      ) : (
        <LinearGradient
          colors={['#E0D8CA', '#F0EAE0', '#E8E0D2'] as any}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      )}
    </View>
  );
}

// ─── Main Component ─────────────────────────────────

export function PageCurlBook({
  pages,
  coverColor = '#6B4C3B',
  spineColor = '#5A3D2E',
  title,
  onPageChange,
  onPageTap,
}: PageCurlBookProps) {
  const colors = useColors();

  // Layout
  const SPREAD_W = SCREEN_WIDTH - BOOK_MARGIN * 2;
  const PAGE_W = Math.floor((SPREAD_W - SPINE_W) / 2);
  const PAGE_H = Math.round(PAGE_W * 1.42);
  const COVER_W = PAGE_W + 8; // cover slightly wider than a single page
  const COVER_H = PAGE_H;
  const HALF_PW = PAGE_W / 2;

  // How much to shift book from cover-centered to spread-centered
  const SHIFT_X = (SPREAD_W - COVER_W) / 2;

  // ── State ──
  const [phase, setPhase] = useState<BookPhase>('COVER');
  // In spread mode: spreadIdx 0 = pages[0](left) + pages[1](right)
  const [spreadIdx, setSpreadIdx] = useState(0);
  const [flipping, setFlipping] = useState(false);

  const totalPages = pages.length;
  const maxSpread = Math.max(0, Math.ceil(totalPages / 2) - 1);

  // Shared values
  const bookShiftX = useSharedValue(0);
  const coverFlip = useSharedValue(0); // 0=closed, 1=opened
  const pageFlip = useSharedValue(0); // 0=flat, 1=fully flipped
  const flipDirection = useSharedValue<0 | 1 | -1>(0); // 1=forward, -1=backward
  const backCoverFlip = useSharedValue(0); // 0=open, 1=closed

  // Page helpers
  const leftPage = (sp: number) => { const i = sp * 2; return i < totalPages ? pages[i] : null; };
  const rightPage = (sp: number) => { const i = sp * 2 + 1; return i < totalPages ? pages[i] : null; };

  const curLeft = leftPage(spreadIdx);
  const curRight = rightPage(spreadIdx);
  const nxtLeft = leftPage(spreadIdx + 1);
  const nxtRight = rightPage(spreadIdx + 1);
  const prvLeft = leftPage(spreadIdx - 1);
  const prvRight = rightPage(spreadIdx - 1);

  const canForward = spreadIdx < maxSpread;
  const canBackward = spreadIdx > 0;

  // ── Open cover ──
  const openCover = useCallback(() => {
    if (flipping) return;
    setFlipping(true);
    setPhase('SPREAD');

    bookShiftX.value = withTiming(-SHIFT_X, { duration: COVER_MS, easing: Easing.bezier(0.4, 0, 0.2, 1) });
    coverFlip.value = withTiming(1, { duration: COVER_MS, easing: THICK_EASING }, fin => {
      if (fin) runOnJS(setFlipping)(false);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPageChange?.(0);
  }, [flipping, SHIFT_X]);

  // ── Close cover ──
  const closeCover = useCallback(() => {
    if (flipping) return;
    setFlipping(true);

    bookShiftX.value = withTiming(0, { duration: COVER_MS, easing: Easing.bezier(0.4, 0, 0.2, 1) });
    coverFlip.value = withTiming(0, { duration: COVER_MS, easing: THICK_EASING }, fin => {
      if (fin) {
        runOnJS(setPhase)('COVER');
        runOnJS(setSpreadIdx)(0);
        runOnJS(setFlipping)(false);
      }
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [flipping, SHIFT_X]);

  // ── Close back cover (from spread to BACK_COVER) ──
  const closeBackCover = useCallback(() => {
    if (flipping) return;
    setFlipping(true);
    setPhase('BACK_COVER');

    bookShiftX.value = withTiming(SHIFT_X, { duration: COVER_MS, easing: Easing.bezier(0.4, 0, 0.2, 1) });
    backCoverFlip.value = withTiming(1, { duration: COVER_MS, easing: THICK_EASING }, fin => {
      if (fin) runOnJS(setFlipping)(false);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [flipping, SHIFT_X]);

  // ── Open back cover (from BACK_COVER to spread) ──
  const openBackCover = useCallback(() => {
    if (flipping) return;
    setFlipping(true);

    bookShiftX.value = withTiming(-SHIFT_X, { duration: COVER_MS, easing: Easing.bezier(0.4, 0, 0.2, 1) });
    backCoverFlip.value = withTiming(0, { duration: COVER_MS, easing: THICK_EASING }, fin => {
      if (fin) {
        runOnJS(setPhase)('SPREAD');
        runOnJS(setFlipping)(false);
      }
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [flipping, SHIFT_X]);

  // ── Page flip forward ──
  const flipForward = useCallback(() => {
    if (flipping || !canForward) return;

    // If on last spread, close back cover instead
    if (spreadIdx === maxSpread - 1 && !rightPage(spreadIdx + 1)) {
      // Actually there are more pages, just flip normally
    }

    setFlipping(true);
    flipDirection.value = 1;
    pageFlip.value = 0;
    pageFlip.value = withTiming(1, { duration: FLIP_MS, easing: THICK_EASING }, fin => {
      if (fin) {
        runOnJS(commitForward)();
      }
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPageChange?.((spreadIdx + 1) * 2);
  }, [flipping, canForward, spreadIdx, maxSpread]);

  const commitForward = useCallback(() => {
    setSpreadIdx(prev => Math.min(prev + 1, maxSpread));
    pageFlip.value = 0;
    flipDirection.value = 0;
    setFlipping(false);
  }, [maxSpread]);

  // ── Page flip backward ──
  const flipBackward = useCallback(() => {
    if (flipping || !canBackward) return;
    setFlipping(true);
    flipDirection.value = -1;
    pageFlip.value = 0;
    pageFlip.value = withTiming(1, { duration: FLIP_MS, easing: THICK_EASING }, fin => {
      if (fin) {
        runOnJS(commitBackward)();
      }
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPageChange?.((spreadIdx - 1) * 2);
  }, [flipping, canBackward, spreadIdx]);

  const commitBackward = useCallback(() => {
    setSpreadIdx(prev => Math.max(prev - 1, 0));
    pageFlip.value = 0;
    flipDirection.value = 0;
    setFlipping(false);
  }, []);

  // ── Gesture (drag to flip) ──
  const panGesture = Gesture.Pan()
    .activeOffsetX([-DEAD_ZONE, DEAD_ZONE])
    .onUpdate(e => {
      if (flipping) return;
      const tx = e.translationX;

      if (phase === 'COVER') {
        if (tx < -DEAD_ZONE) {
          const p = Math.min(0.99, Math.abs(tx) / (COVER_W * 1.1));
          coverFlip.value = p;
          bookShiftX.value = -SHIFT_X * p;
        }
      } else if (phase === 'BACK_COVER') {
        if (tx > DEAD_ZONE) {
          const p = Math.min(0.99, Math.abs(tx) / (COVER_W * 1.1));
          backCoverFlip.value = 1 - p;
          bookShiftX.value = SHIFT_X * (1 - p);
        }
      } else {
        // SPREAD
        if (tx < -DEAD_ZONE && canForward) {
          flipDirection.value = 1;
          pageFlip.value = Math.min(0.99, Math.abs(tx) / (PAGE_W * 1.1));
        } else if (tx > DEAD_ZONE && canBackward) {
          flipDirection.value = -1;
          pageFlip.value = Math.min(0.99, Math.abs(tx) / (PAGE_W * 1.1));
        } else if (tx > DEAD_ZONE && !canBackward) {
          // Close cover
          const p = Math.min(0.99, Math.abs(tx) / (PAGE_W * 1.1));
          coverFlip.value = 1 - p;
          bookShiftX.value = -SHIFT_X * (1 - p);
        } else if (tx < -DEAD_ZONE && !canForward) {
          // Close back cover
          flipDirection.value = 0;
          const p = Math.min(0.99, Math.abs(tx) / (PAGE_W * 1.1));
          backCoverFlip.value = p;
          bookShiftX.value = -SHIFT_X + SHIFT_X * 2 * p;
        }
      }
    })
    .onEnd(e => {
      if (flipping) return;
      const vel = Math.abs(e.velocityX);
      const fast = vel > 500;

      if (phase === 'COVER') {
        if (coverFlip.value > SNAP_THRESHOLD || fast) {
          runOnJS(openCover)();
        } else {
          coverFlip.value = withSpring(0, { damping: 26, stiffness: 300 });
          bookShiftX.value = withSpring(0, { damping: 26, stiffness: 300 });
        }
        return;
      }

      if (phase === 'BACK_COVER') {
        if (backCoverFlip.value < 1 - SNAP_THRESHOLD || fast) {
          runOnJS(openBackCover)();
        } else {
          backCoverFlip.value = withSpring(1, { damping: 26, stiffness: 300 });
          bookShiftX.value = withSpring(SHIFT_X, { damping: 26, stiffness: 300 });
        }
        return;
      }

      // SPREAD
      if (flipDirection.value === 1 && (pageFlip.value > SNAP_THRESHOLD || fast)) {
        pageFlip.value = withTiming(1, { duration: 280, easing: THICK_EASING }, fin => {
          if (fin) runOnJS(commitForward)();
        });
      } else if (flipDirection.value === -1 && (pageFlip.value > SNAP_THRESHOLD || fast)) {
        pageFlip.value = withTiming(1, { duration: 280, easing: THICK_EASING }, fin => {
          if (fin) runOnJS(commitBackward)();
        });
      } else if (flipDirection.value === 0 && e.translationX > DEAD_ZONE && !canBackward) {
        // Closing cover from spread
        if (coverFlip.value < 1 - SNAP_THRESHOLD || fast) {
          runOnJS(closeCover)();
        } else {
          coverFlip.value = withSpring(1, { damping: 26, stiffness: 300 });
          bookShiftX.value = withSpring(-SHIFT_X, { damping: 26, stiffness: 300 });
        }
      } else if (flipDirection.value === 0 && e.translationX < -DEAD_ZONE && !canForward) {
        // Closing back cover
        if (backCoverFlip.value > SNAP_THRESHOLD || fast) {
          runOnJS(closeBackCover)();
        } else {
          backCoverFlip.value = withSpring(0, { damping: 26, stiffness: 300 });
          bookShiftX.value = withSpring(-SHIFT_X, { damping: 26, stiffness: 300 });
        }
      } else {
        pageFlip.value = withSpring(0, { damping: 26, stiffness: 300 });
        flipDirection.value = 0;
      }
    });

  const tapGesture = Gesture.Tap().onEnd(e => {
    if (flipping) return;
    if (phase === 'COVER') {
      runOnJS(openCover)();
    } else if (phase === 'BACK_COVER') {
      runOnJS(openBackCover)();
    } else {
      // Spread: left or right tap
      const mid = SPREAD_W / 2;
      if (e.x < mid && curLeft && onPageTap) {
        runOnJS(onPageTap)(curLeft, spreadIdx * 2);
      } else if (e.x >= mid && curRight && onPageTap) {
        runOnJS(onPageTap)(curRight, spreadIdx * 2 + 1);
      }
    }
  });

  const gesture = Gesture.Exclusive(panGesture, tapGesture);

  // ── Animated styles ──

  const bookStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bookShiftX.value }],
  }));

  // Cover front
  const coverFrontAnim = useAnimatedStyle(() => {
    const rot = interpolate(coverFlip.value, [0, 1], [0, -180], Extrapolation.CLAMP);
    return {
      transform: [
        { perspective: PERSPECTIVE },
        { translateX: -COVER_W / 2 },
        { rotateY: `${rot}deg` },
        { translateX: COVER_W / 2 },
      ],
      backfaceVisibility: 'hidden' as const,
      zIndex: 12,
    };
  });

  // Cover back (inner endpaper — revealed when cover opens)
  const coverBackAnim = useAnimatedStyle(() => {
    const rot = interpolate(coverFlip.value, [0, 1], [180, 0], Extrapolation.CLAMP);
    return {
      transform: [
        { perspective: PERSPECTIVE },
        { translateX: -PAGE_W / 2 },
        { rotateY: `${rot}deg` },
        { translateX: PAGE_W / 2 },
      ],
      backfaceVisibility: 'hidden' as const,
      zIndex: 12,
    };
  });

  // Cover edge
  const coverEdgeAnim = useAnimatedStyle(() => {
    const rot = interpolate(coverFlip.value, [0, 1], [0, -180], Extrapolation.CLAMP);
    const dist = Math.abs(Math.abs(rot) - 90);
    return {
      transform: [
        { perspective: PERSPECTIVE },
        { translateX: -COVER_W / 2 },
        { rotateY: `${rot}deg` },
        { translateX: COVER_W / 2 },
      ],
      opacity: interpolate(dist, [0, 40], [1, 0], Extrapolation.CLAMP),
      zIndex: 13,
    };
  });

  // Back cover front (visible when back cover is closed)
  const backCoverFrontAnim = useAnimatedStyle(() => {
    const rot = interpolate(backCoverFlip.value, [0, 1], [0, 180], Extrapolation.CLAMP);
    return {
      transform: [
        { perspective: PERSPECTIVE },
        { translateX: COVER_W / 2 },
        { rotateY: `${rot}deg` },
        { translateX: -COVER_W / 2 },
      ],
      backfaceVisibility: 'hidden' as const,
      zIndex: 12,
    };
  });

  // Back cover inner (endpaper, visible when back cover is open)
  const backCoverInnerAnim = useAnimatedStyle(() => {
    const rot = interpolate(backCoverFlip.value, [0, 1], [0, 180], Extrapolation.CLAMP);
    return {
      transform: [
        { perspective: PERSPECTIVE },
        { translateX: PAGE_W / 2 },
        { rotateY: `${rot}deg` },
        { translateX: -PAGE_W / 2 },
      ],
      backfaceVisibility: 'hidden' as const,
      zIndex: 12,
    };
  });

  // Back cover edge
  const backCoverEdgeAnim = useAnimatedStyle(() => {
    const rot = interpolate(backCoverFlip.value, [0, 1], [0, 180], Extrapolation.CLAMP);
    const dist = Math.abs(Math.abs(rot) - 90);
    return {
      transform: [
        { perspective: PERSPECTIVE },
        { translateX: COVER_W / 2 },
        { rotateY: `${rot}deg` },
        { translateX: -COVER_W / 2 },
      ],
      opacity: interpolate(dist, [0, 40], [1, 0], Extrapolation.CLAMP),
      zIndex: 13,
    };
  });

  // Forward flip: front face (current right page peeling away)
  const fwdFrontAnim = useAnimatedStyle(() => {
    if (flipDirection.value !== 1) return { opacity: 0, zIndex: 0 };
    const rot = interpolate(pageFlip.value, [0, 1], [0, -180], Extrapolation.CLAMP);
    return {
      transform: [
        { perspective: PERSPECTIVE },
        { translateX: -HALF_PW },
        { rotateY: `${rot}deg` },
        { translateX: HALF_PW },
      ],
      backfaceVisibility: 'hidden' as const,
      zIndex: 8,
    };
  });

  // Forward flip: back face (next left page appearing)
  const fwdBackAnim = useAnimatedStyle(() => {
    if (flipDirection.value !== 1) return { opacity: 0, zIndex: 0 };
    const rot = interpolate(pageFlip.value, [0, 1], [180, 0], Extrapolation.CLAMP);
    return {
      transform: [
        { perspective: PERSPECTIVE },
        { translateX: -HALF_PW },
        { rotateY: `${rot}deg` },
        { translateX: HALF_PW },
      ],
      backfaceVisibility: 'hidden' as const,
      zIndex: 8,
    };
  });

  // Forward flip edge
  const fwdEdgeAnim = useAnimatedStyle(() => {
    if (flipDirection.value !== 1) return { opacity: 0 };
    const rot = interpolate(pageFlip.value, [0, 1], [0, -180], Extrapolation.CLAMP);
    const dist = Math.abs(Math.abs(rot) - 90);
    return {
      transform: [
        { perspective: PERSPECTIVE },
        { translateX: -HALF_PW },
        { rotateY: `${rot}deg` },
        { translateX: HALF_PW },
      ],
      opacity: interpolate(dist, [0, 35], [1, 0], Extrapolation.CLAMP),
      zIndex: 9,
    };
  });

  // Backward flip: front face (current left page peeling right)
  const bwdFrontAnim = useAnimatedStyle(() => {
    if (flipDirection.value !== -1) return { opacity: 0, zIndex: 0 };
    const rot = interpolate(pageFlip.value, [0, 1], [0, 180], Extrapolation.CLAMP);
    return {
      transform: [
        { perspective: PERSPECTIVE },
        { translateX: HALF_PW },
        { rotateY: `${rot}deg` },
        { translateX: -HALF_PW },
      ],
      backfaceVisibility: 'hidden' as const,
      zIndex: 8,
    };
  });

  // Backward flip: back face (prev right page appearing)
  const bwdBackAnim = useAnimatedStyle(() => {
    if (flipDirection.value !== -1) return { opacity: 0, zIndex: 0 };
    const rot = interpolate(pageFlip.value, [0, 1], [-180, 0], Extrapolation.CLAMP);
    return {
      transform: [
        { perspective: PERSPECTIVE },
        { translateX: HALF_PW },
        { rotateY: `${rot}deg` },
        { translateX: -HALF_PW },
      ],
      backfaceVisibility: 'hidden' as const,
      zIndex: 8,
    };
  });

  // Backward flip edge
  const bwdEdgeAnim = useAnimatedStyle(() => {
    if (flipDirection.value !== -1) return { opacity: 0 };
    const rot = interpolate(pageFlip.value, [0, 1], [0, 180], Extrapolation.CLAMP);
    const dist = Math.abs(Math.abs(rot) - 90);
    return {
      transform: [
        { perspective: PERSPECTIVE },
        { translateX: HALF_PW },
        { rotateY: `${rot}deg` },
        { translateX: -HALF_PW },
      ],
      opacity: interpolate(dist, [0, 35], [1, 0], Extrapolation.CLAMP),
      zIndex: 9,
    };
  });

  // ── Flip shadow on underlying page ──
  const fwdShadowAnim = useAnimatedStyle(() => {
    if (flipDirection.value !== 1) return { opacity: 0 };
    // Shadow strongest at middle of flip, fades at start/end
    const shadowOpacity = interpolate(
      pageFlip.value,
      [0, 0.3, 0.5, 0.7, 1],
      [0, 0.15, 0.25, 0.15, 0],
      Extrapolation.CLAMP,
    );
    return { opacity: shadowOpacity, zIndex: 2 };
  });

  const bwdShadowAnim = useAnimatedStyle(() => {
    if (flipDirection.value !== -1) return { opacity: 0 };
    const shadowOpacity = interpolate(
      pageFlip.value,
      [0, 0.3, 0.5, 0.7, 1],
      [0, 0.15, 0.25, 0.15, 0],
      Extrapolation.CLAMP,
    );
    return { opacity: shadowOpacity, zIndex: 2 };
  });

  // ── Drop shadow for book ──
  const bookShadowAnim = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(
      Math.max(pageFlip.value, coverFlip.value, backCoverFlip.value),
      [0, 0.5, 1],
      [0.12, 0.28, 0.12],
      Extrapolation.CLAMP,
    ),
  }));

  // ── Navigation ──
  const handlePrev = useCallback(() => {
    if (flipping) return;
    if (phase === 'BACK_COVER') { openBackCover(); return; }
    if (phase === 'SPREAD' && canBackward) { flipBackward(); return; }
    if (phase === 'SPREAD' && !canBackward) { closeCover(); return; }
  }, [phase, flipping, canBackward, openBackCover, flipBackward, closeCover]);

  const handleNext = useCallback(() => {
    if (flipping) return;
    if (phase === 'COVER') { openCover(); return; }
    if (phase === 'SPREAD' && canForward) { flipForward(); return; }
    if (phase === 'SPREAD' && !canForward) { closeBackCover(); return; }
  }, [phase, flipping, canForward, openCover, flipForward, closeBackCover]);

  // ── Indicator ──
  const indicatorText = useMemo(() => {
    if (phase === 'COVER') return '표지';
    if (phase === 'BACK_COVER') return '뒷표지';
    const l = spreadIdx * 2 + 1;
    const r = Math.min(spreadIdx * 2 + 2, totalPages);
    return l === r ? `${l} / ${totalPages}` : `${l}-${r} / ${totalPages}`;
  }, [phase, spreadIdx, totalPages]);

  const leftStackCount = spreadIdx * 2;
  const rightStackCount = totalPages - (spreadIdx * 2 + 2);

  // ── Render ──
  return (
    <View style={s.root}>
      <GestureDetector gesture={gesture}>
        <View style={{ alignItems: 'center' }}>
          <Animated.View
            style={[
              s.bookWrap,
              bookStyle,
              bookShadowAnim,
              {
                width: phase === 'SPREAD' ? SPREAD_W : COVER_W,
                height: phase === 'SPREAD' ? PAGE_H : COVER_H,
              },
            ]}
          >
            {/* ═══ COVER PHASE ═══ */}
            {phase === 'COVER' && (
              <>
                {/* Cover front */}
                <Animated.View style={[s.absPage, { width: COVER_W, height: COVER_H }, coverFrontAnim]}>
                  <CoverFace coverColor={coverColor} title={title} width={COVER_W} height={COVER_H} />
                </Animated.View>
                {/* Cover edge */}
                <Animated.View style={[s.absPage, { width: EDGE_THICKNESS, height: COVER_H, left: 0 }, coverEdgeAnim]}>
                  <FlipEdge coverColor={coverColor} isCover height={COVER_H} />
                </Animated.View>
              </>
            )}

            {/* ═══ SPREAD PHASE ═══ */}
            {phase === 'SPREAD' && (
              <>
                {/* Book interior bg */}
                <View style={[s.bookInterior, { width: SPREAD_W, height: PAGE_H }]}>
                  {/* Outer book shadow (Skia) */}
                  <Canvas style={[StyleSheet.absoluteFill, { left: -4, top: -3, width: SPREAD_W + 8, height: PAGE_H + 6 }]} pointerEvents="none">
                    <Rect x={0} y={0} width={SPREAD_W + 8} height={PAGE_H + 6} color="rgba(0,0,0,0.03)">
                    </Rect>
                  </Canvas>
                </View>

                {/* Spine */}
                <View style={[s.spinePos, { left: PAGE_W - 10, height: PAGE_H }]} pointerEvents="none">
                  <BookSpineView height={PAGE_H} />
                </View>

                {/* Left static page */}
                <View style={[s.absPage, { left: 0, width: PAGE_W, height: PAGE_H, zIndex: 3, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, overflow: 'hidden' }]}>
                  {curLeft ? <PageContent page={curLeft} width={PAGE_W} height={PAGE_H} /> : <View style={[s.blank, { width: PAGE_W, height: PAGE_H }]} />}
                  <EdgeStack side="left" count={leftStackCount} height={PAGE_H} />
                </View>

                {/* Right static page */}
                <View style={[s.absPage, { left: PAGE_W + SPINE_W, width: PAGE_W, height: PAGE_H, zIndex: 3, borderTopRightRadius: 4, borderBottomRightRadius: 4, overflow: 'hidden' }]}>
                  {curRight ? <PageContent page={curRight} width={PAGE_W} height={PAGE_H} /> : <View style={[s.blank, { width: PAGE_W, height: PAGE_H }]} />}
                  <EdgeStack side="right" count={rightStackCount} height={PAGE_H} />
                </View>

                {/* Cover still visible at spine left */}
                <Animated.View style={[s.absPage, { left: PAGE_W + SPINE_W, width: PAGE_W, height: PAGE_H }, coverBackAnim]}>
                  <CoverInner width={PAGE_W} height={PAGE_H} />
                </Animated.View>

                {/* Cover front flipping away */}
                <Animated.View style={[s.absPage, { left: PAGE_W + SPINE_W, width: COVER_W, height: COVER_H }, coverFrontAnim]}>
                  <CoverFace coverColor={coverColor} title={title} width={COVER_W} height={COVER_H} />
                </Animated.View>

                {/* Cover edge */}
                <Animated.View style={[s.absPage, { left: PAGE_W + SPINE_W - 1, width: EDGE_THICKNESS, height: COVER_H }, coverEdgeAnim]}>
                  <FlipEdge coverColor={coverColor} isCover height={COVER_H} />
                </Animated.View>

                {/* ── Forward flip layers ── */}
                {/* Under: next right page */}
                {nxtRight && (
                  <View style={[s.absPage, { left: PAGE_W + SPINE_W, width: PAGE_W, height: PAGE_H, zIndex: 1 }]}>
                    <PageContent page={nxtRight} width={PAGE_W} height={PAGE_H} />
                  </View>
                )}

                {/* Shadow cast by flipping page onto underlying page */}
                <Animated.View
                  style={[s.absPage, { left: PAGE_W + SPINE_W, width: PAGE_W, height: PAGE_H, backgroundColor: '#000' }, fwdShadowAnim]}
                  pointerEvents="none"
                />

                {/* Flip front: current right */}
                <Animated.View style={[s.absPage, { left: PAGE_W + SPINE_W, width: PAGE_W, height: PAGE_H }, fwdFrontAnim]}>
                  {curRight && <PageContent page={curRight} width={PAGE_W} height={PAGE_H} />}
                </Animated.View>

                {/* Flip back: next left (mirrored) */}
                <Animated.View style={[s.absPage, { left: PAGE_W + SPINE_W, width: PAGE_W, height: PAGE_H }, fwdBackAnim]}>
                  <View style={{ transform: [{ scaleX: -1 }] }}>
                    {nxtLeft ? <PageContent page={nxtLeft} width={PAGE_W} height={PAGE_H} /> : <View style={[s.blank, { width: PAGE_W, height: PAGE_H }]} />}
                  </View>
                </Animated.View>

                {/* Flip edge: forward */}
                <Animated.View style={[s.absPage, { left: PAGE_W + SPINE_W - 1, width: EDGE_THICKNESS, height: PAGE_H }, fwdEdgeAnim]}>
                  <FlipEdge coverColor={coverColor} height={PAGE_H} />
                </Animated.View>

                {/* ── Backward flip layers ── */}
                {/* Under: prev left page */}
                {prvLeft && (
                  <View style={[s.absPage, { left: 0, width: PAGE_W, height: PAGE_H, zIndex: 1 }]}>
                    <PageContent page={prvLeft} width={PAGE_W} height={PAGE_H} />
                  </View>
                )}

                {/* Shadow cast by flipping page onto underlying page */}
                <Animated.View
                  style={[s.absPage, { left: 0, width: PAGE_W, height: PAGE_H, backgroundColor: '#000' }, bwdShadowAnim]}
                  pointerEvents="none"
                />

                {/* Flip front: current left */}
                <Animated.View style={[s.absPage, { left: 0, width: PAGE_W, height: PAGE_H }, bwdFrontAnim]}>
                  {curLeft && <PageContent page={curLeft} width={PAGE_W} height={PAGE_H} />}
                </Animated.View>

                {/* Flip back: prev right (mirrored) */}
                <Animated.View style={[s.absPage, { left: 0, width: PAGE_W, height: PAGE_H }, bwdBackAnim]}>
                  <View style={{ transform: [{ scaleX: -1 }] }}>
                    {prvRight ? <PageContent page={prvRight} width={PAGE_W} height={PAGE_H} /> : <View style={[s.blank, { width: PAGE_W, height: PAGE_H }]} />}
                  </View>
                </Animated.View>

                {/* Flip edge: backward */}
                <Animated.View style={[s.absPage, { left: PAGE_W - 1, width: EDGE_THICKNESS, height: PAGE_H }, bwdEdgeAnim]}>
                  <FlipEdge coverColor={coverColor} height={PAGE_H} />
                </Animated.View>

                {/* ── Back cover layers ── */}
                {/* Back cover inner (endpaper on right side) */}
                <Animated.View style={[s.absPage, { left: 0, width: PAGE_W, height: PAGE_H }, backCoverInnerAnim]}>
                  <CoverInner width={PAGE_W} height={PAGE_H} />
                </Animated.View>

                {/* Back cover front */}
                <Animated.View style={[s.absPage, { left: 0, width: COVER_W, height: COVER_H }, backCoverFrontAnim]}>
                  <View style={[s.coverFace, { width: COVER_W, height: COVER_H }]}>
                    <LinearGradient
                      colors={[darkenColor(coverColor, 5), darkenColor(coverColor, 20), darkenColor(coverColor, 40)] as any}
                      locations={[0, 0.5, 1]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0.2, y: 0 }}
                      end={{ x: 0.8, y: 1 }}
                    />
                  </View>
                </Animated.View>

                {/* Back cover edge */}
                <Animated.View style={[s.absPage, { left: PAGE_W - 1, width: EDGE_THICKNESS, height: COVER_H }, backCoverEdgeAnim]}>
                  <FlipEdge coverColor={coverColor} isCover height={COVER_H} />
                </Animated.View>
              </>
            )}

            {/* ═══ BACK COVER PHASE ═══ */}
            {phase === 'BACK_COVER' && (
              <>
                <Animated.View style={[s.absPage, { width: COVER_W, height: COVER_H }, backCoverFrontAnim]}>
                  <View style={[s.coverFace, { width: COVER_W, height: COVER_H }]}>
                    <LinearGradient
                      colors={[darkenColor(coverColor, 5), darkenColor(coverColor, 20), darkenColor(coverColor, 40)] as any}
                      locations={[0, 0.5, 1]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0.2, y: 0 }}
                      end={{ x: 0.8, y: 1 }}
                    />
                  </View>
                </Animated.View>
                <Animated.View style={[s.absPage, { width: EDGE_THICKNESS, height: COVER_H, right: 0 }, backCoverEdgeAnim]}>
                  <FlipEdge coverColor={coverColor} isCover height={COVER_H} />
                </Animated.View>
              </>
            )}
          </Animated.View>
        </View>
      </GestureDetector>

      {/* ── Controls ── */}
      <View style={s.controls}>
        <Pressable
          style={[s.navBtn, { backgroundColor: colors.cardBg }, phase === 'COVER' && s.navDisabled]}
          onPress={handlePrev}
          disabled={phase === 'COVER' || flipping}
        >
          <CaretLeft size={18} color={phase === 'COVER' ? colors.textMuted : colors.textPrimary} weight="bold" />
        </Pressable>

        <View style={[s.indicator, { backgroundColor: colors.cardBg }]}>
          <Text style={[s.indicatorText, { color: colors.textSecondary }]}>{indicatorText}</Text>
        </View>

        <Pressable
          style={[s.navBtn, { backgroundColor: colors.cardBg }, phase === 'BACK_COVER' && s.navDisabled]}
          onPress={handleNext}
          disabled={phase === 'BACK_COVER' || flipping}
        >
          <CaretRight size={18} color={phase === 'BACK_COVER' ? colors.textMuted : colors.textPrimary} weight="bold" />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  bookWrap: {
    shadowColor: '#1A0E00',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  bookInterior: {
    backgroundColor: '#F5F0E8',
    borderRadius: 4,
  },
  spinePos: {
    position: 'absolute',
    top: 0,
    zIndex: 15,
  },
  absPage: {
    position: 'absolute',
    top: 0,
  },
  blank: {
    backgroundColor: '#FDFAF5',
  },
  pageContent: {
    overflow: 'hidden',
  },
  elPreview: {
    position: 'absolute',
    borderRadius: 2,
  },
  emptyPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  pageNum: {
    position: 'absolute',
    bottom: 5,
    right: 7,
    fontSize: 9,
    opacity: 0.45,
  },
  pageTexture: {
    ...StyleSheet.absoluteFillObject,
  },

  // Cover
  coverFace: {
    overflow: 'hidden',
    borderRadius: 4,
  },
  leatherGrain: {
    ...StyleSheet.absoluteFillObject,
  },
  coverFrame: {
    flex: 1,
    margin: 18,
    borderWidth: 1,
    borderColor: 'rgba(212,175,105,0.35)',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 2,
  },
  coverTitle: {
    fontFamily: 'Georgia',
    fontSize: 15,
    color: 'rgba(212,175,105,0.85)',
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  cornerOrnament: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: 'rgba(212,175,105,0.45)',
    zIndex: 3,
  },

  // Cover inner (endpaper)
  coverInner: {
    backgroundColor: '#E8E0D0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  endpaperPattern: {
    ...StyleSheet.absoluteFillObject,
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navDisabled: {
    opacity: 0.3,
  },
  indicator: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 14,
    minWidth: 90,
    alignItems: 'center',
  },
  indicatorText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
});
