import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Check, Crop } from 'phosphor-react-native';
import { colors, typography, spacing } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { useAlbumStore } from '../store/AlbumStore';
import { WarmBackground, IconButton } from '../components/common';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PhotoCrop'>;

const CROP_PRESETS = [
  { label: '자유', ratio: 0 },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '3:4', ratio: 3 / 4 },
  { label: '16:9', ratio: 16 / 9 },
];

export function PhotoCropScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { updateElement } = useAlbumStore();

  const { photoUri, albumId, pageId, elementId } = route.params;
  const [selectedPreset, setSelectedPreset] = useState(0);

  const imageSize = SCREEN_WIDTH - 48;

  // Crop region (normalized 0-1)
  const cropX = useSharedValue(0.1);
  const cropY = useSharedValue(0.1);
  const cropW = useSharedValue(0.8);
  const cropH = useSharedValue(0.8);

  const cropStyle = useAnimatedStyle(() => ({
    left: cropX.value * imageSize,
    top: cropY.value * imageSize,
    width: cropW.value * imageSize,
    height: cropH.value * imageSize,
  }));

  const handleApply = useCallback(() => {
    updateElement(albumId, pageId, elementId, {
      photoCrop: {
        x: cropX.value,
        y: cropY.value,
        width: cropW.value,
        height: cropH.value,
      },
    });
    navigation.goBack();
  }, [albumId, pageId, elementId, updateElement, navigation, cropX, cropY, cropW, cropH]);

  const handlePreset = useCallback((ratio: number) => {
    if (ratio === 0) {
      cropX.value = withSpring(0.1);
      cropY.value = withSpring(0.1);
      cropW.value = withSpring(0.8);
      cropH.value = withSpring(0.8);
    } else if (ratio >= 1) {
      const h = 0.7 / ratio;
      cropX.value = withSpring(0.1);
      cropY.value = withSpring((1 - h) / 2);
      cropW.value = withSpring(0.8);
      cropH.value = withSpring(h);
    } else {
      const w = 0.7 * ratio;
      cropX.value = withSpring((1 - w) / 2);
      cropY.value = withSpring(0.1);
      cropW.value = withSpring(w);
      cropH.value = withSpring(0.8);
    }
  }, [cropX, cropY, cropW, cropH]);

  return (
    <View style={styles.root}>
      <WarmBackground />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </IconButton>
        <Text style={styles.headerTitle}>사진 크롭</Text>
        <IconButton onPress={handleApply}>
          <Check size={24} color={colors.accent} weight="bold" />
        </IconButton>
      </View>

      <View style={styles.imageContainer}>
        <Image source={{ uri: photoUri }} style={[styles.image, { width: imageSize, height: imageSize }]} resizeMode="contain" />
        {/* Crop overlay */}
        <View style={[styles.overlayFull, { width: imageSize, height: imageSize }]}>
          <Animated.View style={[styles.cropRect, cropStyle]}>
            <View style={[styles.cropCorner, styles.cropTL]} />
            <View style={[styles.cropCorner, styles.cropTR]} />
            <View style={[styles.cropCorner, styles.cropBL]} />
            <View style={[styles.cropCorner, styles.cropBR]} />
          </Animated.View>
        </View>
      </View>

      <View style={styles.presets}>
        {CROP_PRESETS.map((preset, i) => (
          <Pressable
            key={preset.label}
            style={[styles.presetBtn, selectedPreset === i && styles.presetBtnActive]}
            onPress={() => {
              setSelectedPreset(i);
              handlePreset(preset.ratio);
            }}
          >
            <Text style={[styles.presetLabel, selectedPreset === i && styles.presetLabelActive]}>
              {preset.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  image: { borderRadius: 8 },
  overlayFull: {
    position: 'absolute',
    backgroundColor: 'rgba(44, 31, 16, 0.3)',
    borderRadius: 8,
  },
  cropRect: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.warmWhite,
    backgroundColor: 'transparent',
  },
  cropCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.warmWhite,
  },
  cropTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 },
  cropTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 },
  cropBL: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 },
  cropBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 },
  presets: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.cardBg,
  },
  presetBtnActive: { backgroundColor: colors.accent },
  presetLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  presetLabelActive: { color: colors.warmWhite },
});
