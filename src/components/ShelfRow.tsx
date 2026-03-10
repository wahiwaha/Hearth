import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Album } from '../types/album';
import { AlbumSpine } from './AlbumSpine';

const { width: SCREEN_W } = Dimensions.get('window');

interface ShelfRowProps {
  albums: Album[];
  onAlbumPress: (album: Album) => void;
  albumWidth: number;
}

export function ShelfRow({ albums, onAlbumPress, albumWidth }: ShelfRowProps) {
  return (
    <View style={styles.container}>
      {/* LED backlight glow — warm ambient light behind albums */}
      <View style={styles.ledGlowContainer}>
        <LinearGradient
          colors={[
            'rgba(255, 195, 100, 0)',
            'rgba(255, 200, 120, 0.03)',
            'rgba(255, 205, 130, 0.08)',
            'rgba(255, 210, 140, 0.15)',
            'rgba(255, 215, 150, 0.22)',
          ]}
          style={styles.ledGlowUp}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        {/* LED strip — concentrated warm line */}
        <View style={styles.ledStrip} />
        {/* LED hot spot center */}
        <LinearGradient
          colors={['rgba(255, 220, 160, 0.18)', 'rgba(255, 220, 160, 0)']}
          style={styles.ledHotSpot}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
        />
      </View>

      <View style={styles.albumsRow}>
        {albums.map((album, index) => (
          <AlbumSpine
            key={album.id}
            album={album}
            index={index}
            onPress={onAlbumPress}
            width={albumWidth}
          />
        ))}
      </View>

      {/* ═══ Shelf plank — thick solid oak with realistic depth ═══ */}
      <View style={styles.shelfPlank}>
        {/* Main wood surface — rich warm oak */}
        <LinearGradient
          colors={['#A88A64', '#9A7E58', '#8E7450', '#826A44', '#7A6038']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.8, y: 0.8 }}
        />

        {/* Wood grain texture — natural flowing lines */}
        <View style={styles.woodGrain}>
          {/* Varied grain lines simulating real wood */}
          <View style={[styles.grainLine, { top: 2, opacity: 0.05 }]} />
          <View style={[styles.grainLineThick, { top: 4, opacity: 0.10, left: 20, right: 40 }]} />
          <View style={[styles.grainLine, { top: 7, opacity: 0.04 }]} />
          <View style={[styles.grainLineThick, { top: 9, opacity: 0.14 }]} />
          <View style={[styles.grainLine, { top: 12, opacity: 0.06 }]} />
          <View style={[styles.grainLineThick, { top: 14, opacity: 0.08, left: 40, right: 20 }]} />
          <View style={[styles.grainLine, { top: 17, opacity: 0.04 }]} />
          <View style={[styles.grainLineThick, { top: 19, opacity: 0.12 }]} />
          <View style={[styles.grainLine, { top: 22, opacity: 0.05 }]} />
          <View style={[styles.grainLine, { top: 25, opacity: 0.08 }]} />
          <View style={[styles.grainLineThick, { top: 27, opacity: 0.06, left: 10, right: 60 }]} />
          {/* Knot-like grain variation */}
          <View style={styles.grainKnot} />
          <View style={[styles.grainKnot, { right: 120, top: 12, width: 8, height: 5 }]} />
        </View>

        {/* Top edge highlight — polished wood catching light */}
        <View style={styles.shelfHighlight} />
        <LinearGradient
          colors={['rgba(255, 235, 190, 0.22)', 'rgba(255, 230, 180, 0.06)', 'rgba(255, 230, 180, 0)']}
          style={styles.shelfTopGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Front face — thick lip with oak depth */}
        <View style={styles.shelfFrontFace}>
          <LinearGradient
            colors={['#6E5638', '#644E30', '#5A4428', '#4E3C22', '#443420']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          {/* Front face top edge — light catch on lip */}
          <View style={styles.frontFaceHighlight} />
          {/* Front face wood grain */}
          <View style={[styles.frontGrainLine, { top: 2 }]} />
          <View style={[styles.frontGrainLine, { top: 5, opacity: 0.06 }]} />
          <View style={[styles.frontGrainLine, { top: 8 }]} />
          <View style={[styles.frontGrainLine, { top: 11, opacity: 0.08 }]} />
          <View style={[styles.frontGrainLine, { top: 14 }]} />
          {/* Front face bottom shadow */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.15)']}
            style={styles.frontFaceBottomShadow}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          {/* Routed edge — decorative groove on front face */}
          <View style={styles.routedGroove} />
        </View>

        {/* ─── Metal bracket (left) ─── */}
        <View style={[styles.bracket, styles.bracketLeft]}>
          <LinearGradient
            colors={['#8A7A68', '#6E6050', '#584A3C', '#4A3E32']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.bracketHighlight} />
          <View style={styles.bracketScrew} />
        </View>

        {/* ─── Metal bracket (right) ─── */}
        <View style={[styles.bracket, styles.bracketRight]}>
          <LinearGradient
            colors={['#8A7A68', '#6E6050', '#584A3C', '#4A3E32']}
            style={StyleSheet.absoluteFill}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.bracketHighlight} />
          <View style={styles.bracketScrew} />
        </View>

        {/* Bracket shadow hints on wood */}
        <LinearGradient
          colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0)']}
          style={styles.bracketShadowLeft}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.12)']}
          style={styles.bracketShadowRight}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>

      {/* LED glow below shelf */}
      <View style={styles.ledGlowBelow}>
        <LinearGradient
          colors={[
            'rgba(255, 210, 140, 0.16)',
            'rgba(255, 210, 140, 0.08)',
            'rgba(255, 210, 140, 0.03)',
            'rgba(255, 210, 140, 0)',
          ]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Shelf shadow on wall */}
      <View style={styles.shelfShadow}>
        <LinearGradient
          colors={['rgba(10, 6, 2, 0.35)', 'rgba(10, 6, 2, 0.10)', 'rgba(10, 6, 2, 0)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  ledGlowContainer: {
    position: 'absolute',
    bottom: 30,
    left: 12,
    right: 12,
    height: 210,
    zIndex: -1,
  },
  ledGlowUp: {
    ...StyleSheet.absoluteFillObject,
  },
  ledStrip: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2.5,
    backgroundColor: 'rgba(255, 220, 160, 0.25)',
    borderRadius: 1,
    shadowColor: 'rgba(255, 200, 120, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  ledHotSpot: {
    position: 'absolute',
    bottom: 0,
    left: SCREEN_W * 0.2,
    right: SCREEN_W * 0.2,
    height: 45,
  },
  albumsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 2,
    minHeight: 210,
  },
  shelfPlank: {
    height: 30,
    marginHorizontal: 4,
    borderRadius: 2,
    overflow: 'visible',
  },
  woodGrain: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 2,
  },
  grainLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(80, 55, 25, 0.25)',
  },
  grainLineThick: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(80, 55, 25, 0.18)',
  },
  grainKnot: {
    position: 'absolute',
    top: 8,
    right: 60,
    width: 14,
    height: 8,
    borderRadius: 7,
    backgroundColor: 'rgba(80, 55, 25, 0.07)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(80, 55, 25, 0.04)',
  },
  shelfHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: 'rgba(255, 235, 190, 0.30)',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  shelfTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  shelfFrontFace: {
    position: 'absolute',
    bottom: -16,
    left: 0,
    right: 0,
    height: 16,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    overflow: 'hidden',
  },
  frontFaceHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 225, 165, 0.18)',
  },
  frontGrainLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(60, 40, 20, 0.10)',
  },
  frontFaceBottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  routedGroove: {
    position: 'absolute',
    top: 4,
    left: 30,
    right: 30,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 0.5,
  },

  // Metal brackets
  bracket: {
    position: 'absolute',
    bottom: -16,
    width: 8,
    height: 26,
    borderRadius: 2,
    overflow: 'hidden',
    zIndex: 5,
  },
  bracketLeft: {
    left: 18,
  },
  bracketRight: {
    right: 18,
  },
  bracketHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(180,165,140,0.25)',
  },
  bracketScrew: {
    position: 'absolute',
    top: 6,
    left: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(100,85,65,0.5)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(180,165,140,0.20)',
  },

  bracketShadowLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: -16,
    width: 22,
    zIndex: -1,
  },
  bracketShadowRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: -16,
    width: 22,
    zIndex: -1,
  },
  ledGlowBelow: {
    marginHorizontal: 16,
    height: 45,
    marginTop: 10,
  },
  shelfShadow: {
    marginHorizontal: 10,
    height: 14,
    marginTop: -4,
  },
});
