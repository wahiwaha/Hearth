import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Dimensions, Image } from 'react-native';
import {
  Canvas,
  Group,
  Rect,
  Image as SkiaImage,
  LinearGradient,
  vec,
  Skia,
  useImage,
  Path as SkiaPath,
  Fill,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useDerivedValue,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AlbumPage } from '../types/album';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';

// ─── Constants ──────────────────────────────────────

const SPRING_TURN = { damping: 22, stiffness: 180, mass: 0.6 };
const SPRING_SNAP = { damping: 26, stiffness: 300, mass: 0.4 };
const SNAP_THRESHOLD = 0.25;
const DRAG_DEAD_ZONE = 12;

// ─── Types ──────────────────────────────────────────

interface PageCurlBookProps {
  pages: AlbumPage[];
  initialPageIndex?: number;
  pageWidth: number;
  pageHeight: number;
  onPageChange?: (index: number) => void;
  onPageTap?: (page: AlbumPage, index: number) => void;
}

// ─── Fold geometry utilities (worklet) ──────────────

function clampVal(v: number, min: number, max: number): number {
  'worklet';
  return Math.max(min, Math.min(max, v));
}

/** Compute the position of the dragged corner based on progress */
function cornerPosition(
  t: number,
  W: number,
  H: number,
  dir: number, // 1 = forward (peel from right), -1 = backward (peel from left)
): { x: number; y: number } {
  'worklet';
  // Parametric curve: corner traces arc from bottom-right to upper-left
  const ox = dir > 0 ? W : 0;
  const cx = ox + dir * (-2.1 * t + 1.05 * t * t) * W;
  const cy = H * (1 - 1.4 * t + 0.5 * t * t);
  return { x: cx, y: cy };
}

/** Determine which side of the fold line a point is on */
function sideOfLine(
  px: number, py: number,
  mx: number, my: number,
  nx: number, ny: number,
): number {
  'worklet';
  return (px - mx) * ny - (py - my) * nx;
}

/**
 * Build the "unpeeled" clip polygon — the part of the page that stays flat.
 * Returns an array of {x,y} points in clockwise order.
 */
function computeUnpeeledPolygon(
  t: number, W: number, H: number, dir: number,
): { x: number; y: number }[] {
  'worklet';

  if (t < 0.002) return [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }];
  if (t > 0.998) return [];

  const corner = cornerPosition(t, W, H, dir);
  const ox = dir > 0 ? W : 0;

  // Fold line = perpendicular bisector of [corner, original_corner]
  const mx = (corner.x + ox) / 2;
  const my = (corner.y + H) / 2;
  const dx = corner.x - ox;
  const dy = corner.y - H;
  const nx = -dy; // fold direction (perpendicular)
  const ny = dx;

  // Page corners (clockwise)
  const corners = [
    { x: 0, y: 0 },
    { x: W, y: 0 },
    { x: W, y: H },
    { x: 0, y: H },
  ];
  const edges = [
    { from: 0, to: 1, name: 'top' },
    { from: 1, to: 2, name: 'right' },
    { from: 2, to: 3, name: 'bottom' },
    { from: 3, to: 0, name: 'left' },
  ];

  // Which side is "unpeeled" — the side containing (0,0) for forward, (W,0) for backward
  const refX = dir > 0 ? 0 : W;
  const refSide = sideOfLine(refX, 0, mx, my, nx, ny);

  // Find fold-line intersections with each edge
  const edgeIntersections: Record<string, { x: number; y: number } | null> = {
    top: null, right: null, bottom: null, left: null,
  };

  // Top edge: y=0
  if (Math.abs(ny) > 0.001) {
    const s = -my / ny;
    const ix = mx + nx * s;
    if (ix >= -1 && ix <= W + 1) edgeIntersections.top = { x: clampVal(ix, 0, W), y: 0 };
  }
  // Bottom edge: y=H
  if (Math.abs(ny) > 0.001) {
    const s = (H - my) / ny;
    const ix = mx + nx * s;
    if (ix >= -1 && ix <= W + 1) edgeIntersections.bottom = { x: clampVal(ix, 0, W), y: H };
  }
  // Left edge: x=0
  if (Math.abs(nx) > 0.001) {
    const s = -mx / nx;
    const iy = my + ny * s;
    if (iy >= -1 && iy <= H + 1) edgeIntersections.left = { x: 0, y: clampVal(iy, 0, H) };
  }
  // Right edge: x=W
  if (Math.abs(nx) > 0.001) {
    const s = (W - mx) / nx;
    const iy = my + ny * s;
    if (iy >= -1 && iy <= H + 1) edgeIntersections.right = { x: W, y: clampVal(iy, 0, H) };
  }

  // Walk boundary, collecting points for the unpeeled polygon
  const poly: { x: number; y: number }[] = [];
  for (const edge of edges) {
    const c = corners[edge.from];
    const cSide = sideOfLine(c.x, c.y, mx, my, nx, ny);
    const isUnpeeled = Math.sign(cSide) === Math.sign(refSide) || Math.abs(cSide) < 0.01;
    if (isUnpeeled) poly.push(c);
    const inter = edgeIntersections[edge.name];
    if (inter) poly.push(inter);
  }

  return poly;
}

/** Build the "peeled" region polygon (complement of unpeeled within page bounds) */
function computePeeledPolygon(
  t: number, W: number, H: number, dir: number,
): { x: number; y: number }[] {
  'worklet';

  if (t < 0.002) return [];
  if (t > 0.998) return [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }];

  const corner = cornerPosition(t, W, H, dir);
  const ox = dir > 0 ? W : 0;

  const mx = (corner.x + ox) / 2;
  const my = (corner.y + H) / 2;
  const dx = corner.x - ox;
  const dy = corner.y - H;
  const nx = -dy;
  const ny = dx;

  const corners = [
    { x: 0, y: 0 },
    { x: W, y: 0 },
    { x: W, y: H },
    { x: 0, y: H },
  ];
  const edges = [
    { from: 0, to: 1, name: 'top' },
    { from: 1, to: 2, name: 'right' },
    { from: 2, to: 3, name: 'bottom' },
    { from: 3, to: 0, name: 'left' },
  ];

  const refX = dir > 0 ? 0 : W;
  const refSide = sideOfLine(refX, 0, mx, my, nx, ny);

  const edgeIntersections: Record<string, { x: number; y: number } | null> = {
    top: null, right: null, bottom: null, left: null,
  };
  if (Math.abs(ny) > 0.001) {
    const s1 = -my / ny; const ix1 = mx + nx * s1;
    if (ix1 >= -1 && ix1 <= W + 1) edgeIntersections.top = { x: clampVal(ix1, 0, W), y: 0 };
    const s2 = (H - my) / ny; const ix2 = mx + nx * s2;
    if (ix2 >= -1 && ix2 <= W + 1) edgeIntersections.bottom = { x: clampVal(ix2, 0, W), y: H };
  }
  if (Math.abs(nx) > 0.001) {
    const s1 = -mx / nx; const iy1 = my + ny * s1;
    if (iy1 >= -1 && iy1 <= H + 1) edgeIntersections.left = { x: 0, y: clampVal(iy1, 0, H) };
    const s2 = (W - mx) / nx; const iy2 = my + ny * s2;
    if (iy2 >= -1 && iy2 <= H + 1) edgeIntersections.right = { x: W, y: clampVal(iy2, 0, H) };
  }

  const poly: { x: number; y: number }[] = [];
  for (const edge of edges) {
    const c = corners[edge.from];
    const cSide = sideOfLine(c.x, c.y, mx, my, nx, ny);
    const isPeeled = Math.sign(cSide) !== Math.sign(refSide) && Math.abs(cSide) > 0.01;
    if (isPeeled) poly.push(c);
    const inter = edgeIntersections[edge.name];
    if (inter) poly.push(inter);
  }

  return poly;
}

/** Compute two points on the fold line (within page bounds) */
function computeFoldEndpoints(
  t: number, W: number, H: number, dir: number,
): { start: { x: number; y: number }; end: { x: number; y: number } } {
  'worklet';
  const corner = cornerPosition(t, W, H, dir);
  const ox = dir > 0 ? W : 0;
  const mx = (corner.x + ox) / 2;
  const my = (corner.y + H) / 2;
  const dx = corner.x - ox;
  const dy = corner.y - H;
  const nx = -dy;
  const ny = dx;

  const points: { x: number; y: number }[] = [];

  if (Math.abs(ny) > 0.001) {
    const s = -my / ny; const ix = mx + nx * s;
    if (ix >= -1 && ix <= W + 1) points.push({ x: clampVal(ix, 0, W), y: 0 });
    const s2 = (H - my) / ny; const ix2 = mx + nx * s2;
    if (ix2 >= -1 && ix2 <= W + 1) points.push({ x: clampVal(ix2, 0, W), y: H });
  }
  if (Math.abs(nx) > 0.001) {
    const s = -mx / nx; const iy = my + ny * s;
    if (iy >= -1 && iy <= H + 1) points.push({ x: 0, y: clampVal(iy, 0, H) });
    const s2 = (W - mx) / nx; const iy2 = my + ny * s2;
    if (iy2 >= -1 && iy2 <= H + 1) points.push({ x: W, y: clampVal(iy2, 0, H) });
  }

  if (points.length >= 2) return { start: points[0], end: points[1] };
  return { start: { x: W, y: 0 }, end: { x: W, y: H } };
}

/** Convert polygon points to a Skia Path */
function polygonToPath(points: { x: number; y: number }[]): any {
  'worklet';
  const path = Skia.Path.Make();
  if (points.length < 3) return path;
  path.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    path.lineTo(points[i].x, points[i].y);
  }
  path.close();
  return path;
}

/** Build a thin shadow strip along the fold line */
function buildShadowStrip(
  foldStart: { x: number; y: number },
  foldEnd: { x: number; y: number },
  width: number,
  dir: number,
): any {
  'worklet';
  // Direction from fold into the unpeeled area
  const fdx = foldEnd.x - foldStart.x;
  const fdy = foldEnd.y - foldStart.y;
  const len = Math.sqrt(fdx * fdx + fdy * fdy);
  if (len < 1) return Skia.Path.Make();

  // Normal pointing into unpeeled side
  const perpX = dir > 0 ? -fdy / len : fdy / len;
  const perpY = dir > 0 ? fdx / len : -fdx / len;
  const shadowWidth = width * 0.06;

  const path = Skia.Path.Make();
  path.moveTo(foldStart.x, foldStart.y);
  path.lineTo(foldEnd.x, foldEnd.y);
  path.lineTo(foldEnd.x + perpX * shadowWidth, foldEnd.y + perpY * shadowWidth);
  path.lineTo(foldStart.x + perpX * shadowWidth, foldStart.y + perpY * shadowWidth);
  path.close();
  return path;
}

// ─── Photo element for Skia ─────────────────────────

function SkiaPhoto({
  uri, x, y, width, height,
}: {
  uri: string; x: number; y: number; width: number; height: number;
}) {
  const image = useImage(uri);
  if (!image) return null;
  return <SkiaImage image={image} x={x} y={y} width={width} height={height} fit="cover" />;
}

// ─── Render a single page's content in Skia ─────────

function SkiaPageContent({
  page, width, height,
}: {
  page: AlbumPage; width: number; height: number;
}) {
  const colors = useColors();
  const bgColor = page.backgroundColor || colors.warmWhite;

  return (
    <>
      <Rect x={0} y={0} width={width} height={height} color={bgColor} />
      {page.elements
        .filter((el) => el.type === 'photo' && el.photoUri)
        .slice(0, 8)
        .map((el) => (
          <SkiaPhoto
            key={el.id}
            uri={el.photoUri!}
            x={(el.x / 100) * width}
            y={(el.y / 100) * height}
            width={(el.width / 100) * width}
            height={(el.height / 100) * height}
          />
        ))}
    </>
  );
}

// ─── Main PageCurlBook Component ────────────────────

export function PageCurlBook({
  pages,
  initialPageIndex = 0,
  pageWidth,
  pageHeight,
  onPageChange,
  onPageTap,
}: PageCurlBookProps) {
  const colors = useColors();
  const styles = useThemedStyles((c) => ({
    container: {
      alignItems: 'center',
    },
    indicator: {
      marginTop: spacing.smd,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: c.cardBg,
      borderRadius: 12,
    },
    indicatorText: {
      ...typography.caption,
      color: c.textSecondary,
      fontWeight: '600',
    },
  }));

  const [currentIndex, setCurrentIndex] = useState(initialPageIndex);
  const progress = useSharedValue(0);       // 0 = no curl, 1 = fully turned
  const direction = useSharedValue(0);      // 1 = forward, -1 = backward, 0 = none
  const isDragging = useSharedValue(false);

  const currentPage = pages[currentIndex] ?? null;
  const nextPage = pages[currentIndex + 1] ?? null;
  const prevPage = pages[currentIndex - 1] ?? null;

  // ── Page navigation ──
  const goForward = useCallback(() => {
    if (currentIndex < pages.length - 1) {
      const newIdx = currentIndex + 1;
      setCurrentIndex(newIdx);
      onPageChange?.(newIdx);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentIndex, pages.length, onPageChange]);

  const goBackward = useCallback(() => {
    if (currentIndex > 0) {
      const newIdx = currentIndex - 1;
      setCurrentIndex(newIdx);
      onPageChange?.(newIdx);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentIndex, onPageChange]);

  // ── Derived Skia values ──

  const unpeeledClip = useDerivedValue(() => {
    if (progress.value < 0.002 || direction.value === 0) {
      const p = Skia.Path.Make();
      p.addRect(Skia.XYWHRect(0, 0, pageWidth, pageHeight));
      return p;
    }
    const poly = computeUnpeeledPolygon(progress.value, pageWidth, pageHeight, direction.value);
    return polygonToPath(poly);
  });

  const peeledClip = useDerivedValue(() => {
    if (progress.value < 0.002 || direction.value === 0) return Skia.Path.Make();
    const poly = computePeeledPolygon(progress.value, pageWidth, pageHeight, direction.value);
    return polygonToPath(poly);
  });

  const foldShadow = useDerivedValue(() => {
    if (progress.value < 0.01 || direction.value === 0) return Skia.Path.Make();
    const fold = computeFoldEndpoints(progress.value, pageWidth, pageHeight, direction.value);
    return buildShadowStrip(fold.start, fold.end, pageWidth, direction.value);
  });

  const foldPoints = useDerivedValue(() => {
    if (progress.value < 0.01 || direction.value === 0) {
      return { sx: pageWidth, sy: 0, ex: pageWidth, ey: pageHeight };
    }
    const fold = computeFoldEndpoints(progress.value, pageWidth, pageHeight, direction.value);
    return { sx: fold.start.x, sy: fold.start.y, ex: fold.end.x, ey: fold.end.y };
  });

  // Gradient endpoints for curl-back shading (from fold into peeled area)
  const curlGradStart = useDerivedValue(() =>
    vec(foldPoints.value.sx, foldPoints.value.sy)
  );
  const curlGradEnd = useDerivedValue(() => {
    const f = foldPoints.value;
    const fdx = f.ex - f.sx;
    const fdy = f.ey - f.sy;
    const len = Math.sqrt(fdx * fdx + fdy * fdy) || 1;
    const dir = direction.value || 1;
    const perpX = dir > 0 ? fdy / len : -fdy / len;
    const perpY = dir > 0 ? -fdx / len : fdx / len;
    const midX = (f.sx + f.ex) / 2 + perpX * pageWidth * 0.3;
    const midY = (f.sy + f.ey) / 2 + perpY * pageWidth * 0.3;
    return vec(midX, midY);
  });

  // Shadow gradient endpoints
  const shadowGradStart = useDerivedValue(() => {
    const f = foldPoints.value;
    return vec((f.sx + f.ex) / 2, (f.sy + f.ey) / 2);
  });
  const shadowGradEnd = useDerivedValue(() => {
    const f = foldPoints.value;
    const fdx = f.ex - f.sx;
    const fdy = f.ey - f.sy;
    const len = Math.sqrt(fdx * fdx + fdy * fdy) || 1;
    const dir = direction.value || 1;
    const perpX = dir > 0 ? -fdy / len : fdy / len;
    const perpY = dir > 0 ? fdx / len : -fdx / len;
    const midX = (f.sx + f.ex) / 2 + perpX * pageWidth * 0.06;
    const midY = (f.sy + f.ey) / 2 + perpY * pageWidth * 0.06;
    return vec(midX, midY);
  });

  // ── Gestures ──

  const panGesture = Gesture.Pan()
    .activeOffsetX([-DRAG_DEAD_ZONE, DRAG_DEAD_ZONE])
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((e) => {
      const tx = e.translationX;
      if (direction.value === 0) {
        if (tx < -DRAG_DEAD_ZONE) direction.value = 1;      // swipe left → forward
        else if (tx > DRAG_DEAD_ZONE) direction.value = -1;  // swipe right → backward
        else return;
      }

      // Guard: don't turn past the first/last page
      if (direction.value === 1 && !nextPage) { progress.value = 0; return; }
      if (direction.value === -1 && !prevPage) { progress.value = 0; return; }

      const raw = Math.abs(tx) / pageWidth;
      progress.value = clampVal(raw, 0, 0.999);
    })
    .onEnd((e) => {
      isDragging.value = false;
      const vel = Math.abs(e.velocityX);

      if (progress.value > SNAP_THRESHOLD || vel > 800) {
        // Complete the turn
        progress.value = withSpring(1, SPRING_TURN, (finished) => {
          if (finished) {
            if (direction.value === 1) runOnJS(goForward)();
            else if (direction.value === -1) runOnJS(goBackward)();
            progress.value = 0;
            direction.value = 0;
          }
        });
      } else {
        // Snap back
        progress.value = withSpring(0, SPRING_SNAP, () => {
          direction.value = 0;
        });
      }
    })
    .onFinalize(() => {
      isDragging.value = false;
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (onPageTap && currentPage) {
      runOnJS(onPageTap)(currentPage, currentIndex);
    }
  });

  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  // ── Determine which "under" page to show ──
  const underPage = direction.value >= 0 ? nextPage : prevPage;

  // ── Render ──
  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <View style={{ width: pageWidth, height: pageHeight }}>
          <Canvas style={{ width: pageWidth, height: pageHeight }}>

            {/* Layer 0: Background fill */}
            <Rect
              x={0} y={0}
              width={pageWidth}
              height={pageHeight}
              color={colors.backgroundDark}
            />

            {/* Layer 1: Under page (next or prev, fully visible behind) */}
            {nextPage && (
              <Group opacity={direction.value === 1 ? 1 : 0}>
                <SkiaPageContent page={nextPage} width={pageWidth} height={pageHeight} />
              </Group>
            )}
            {prevPage && (
              <Group opacity={direction.value === -1 ? 1 : 0}>
                <SkiaPageContent page={prevPage} width={pageWidth} height={pageHeight} />
              </Group>
            )}

            {/* Layer 2: Current page — clipped to unpeeled region */}
            {currentPage && (
              <Group clip={unpeeledClip}>
                <SkiaPageContent page={currentPage} width={pageWidth} height={pageHeight} />
              </Group>
            )}

            {/* Layer 3: Back of curled page (peeled region with tint) */}
            <Group clip={peeledClip}>
              <Rect x={0} y={0} width={pageWidth} height={pageHeight}>
                <LinearGradient
                  start={curlGradStart}
                  end={curlGradEnd}
                  colors={['#E8DFD4', '#D8CFBF']}
                />
              </Rect>
              {/* Subtle shadow near the fold on the back */}
              <Rect x={0} y={0} width={pageWidth} height={pageHeight}>
                <LinearGradient
                  start={curlGradStart}
                  end={curlGradEnd}
                  colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.0)']}
                />
              </Rect>
            </Group>

            {/* Layer 4: Drop shadow along the fold line */}
            <SkiaPath path={foldShadow}>
              <LinearGradient
                start={shadowGradStart}
                end={shadowGradEnd}
                colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.0)']}
              />
            </SkiaPath>

          </Canvas>
        </View>
      </GestureDetector>

      {/* Page indicator */}
      <View style={styles.indicator}>
        <Text style={styles.indicatorText}>
          {currentIndex + 1} / {pages.length}
        </Text>
      </View>
    </View>
  );
}

