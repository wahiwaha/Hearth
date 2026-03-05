import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Album } from '../types/album';
import { AlbumSpine } from './AlbumSpine';

interface ShelfRowProps {
  albums: Album[];
  onAlbumPress: (album: Album) => void;
  albumWidth: number;
}

export function ShelfRow({ albums, onAlbumPress, albumWidth }: ShelfRowProps) {
  return (
    <View style={styles.container}>
      {/* Albums sitting on the shelf */}
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

      {/* The shelf itself — wooden plank */}
      <View style={styles.shelfPlank}>
        {/* Wood grain effect */}
        <View style={styles.woodGrain}>
          <View style={[styles.grainLine, { top: 3 }]} />
          <View style={[styles.grainLine, { top: 8 }]} />
          <View style={[styles.grainLine, { top: 14 }]} />
        </View>

        {/* Front face of shelf (3D edge) */}
        <View style={styles.shelfFrontFace} />

        {/* Shadow under the shelf plank */}
        <View style={styles.shelfUnderShadow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  albumsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 2,
    minHeight: 200,
  },
  shelfPlank: {
    height: 18,
    backgroundColor: '#D4BFA6',
    marginHorizontal: 8,
    borderRadius: 2,
    // Shadow from albums above
    shadowColor: '#6B5A48',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
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
    height: 1,
    backgroundColor: 'rgba(187, 166, 138, 0.2)',
  },
  shelfFrontFace: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#BBA68A',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  shelfUnderShadow: {
    position: 'absolute',
    bottom: -14,
    left: 4,
    right: 4,
    height: 8,
    backgroundColor: 'transparent',
    shadowColor: '#6B5A48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
});
