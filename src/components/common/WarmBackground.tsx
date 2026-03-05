import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function WarmBackground() {
  return (
    <LinearGradient
      colors={['#FDFAF5', '#F7F2EA', '#F0E8DB', '#E8DFCF']}
      style={StyleSheet.absoluteFill}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    />
  );
}
