import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ImageSquare,
  SmileySticker,
  TextT,
  PaintBrush,
  Palette,
  Trash,
  Check,
  ArrowCounterClockwise,
  ArrowClockwise,
  CopySimple,
  ArrowsOutSimple,
  Lock,
  LockOpen,
  Eye,
  EyeSlash,
  Stack,
  CaretUp,
  CaretDown,
  Eraser,
  FloppyDisk,
} from 'phosphor-react-native';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { RootStackParamList } from '../types/navigation';
import { useAlbumStore } from '../store/AlbumStore';
import { PageElement, DrawingPath } from '../types/album';
import { WarmBackground, IconButton, BottomSheet } from '../components/common';
import { useEditorHistory } from '../hooks/useEditorHistory';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AlbumEditor'>;

type ToolMode = 'select' | 'photo' | 'sticker' | 'text' | 'draw' | 'background' | 'eraser';

const EMOJIS_BY_CATEGORY = {
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🩷', '🤎', '🖤', '🤍', '💕', '💞', '💗', '💖', '💌'],
  nature: ['🌸', '🌺', '🌻', '🌷', '🍀', '🌿', '🌙', '⭐', '✨', '☀️', '🌈', '🪻', '🌾', '🍁', '🍂'],
  food: ['☕', '🍰', '🧁', '🍩', '🍪', '🍫', '🍡', '🍓', '🍑', '🍒', '🧸', '🎂', '🍷', '🫖', '🍵'],
  travel: ['✈️', '🏖️', '🏔️', '🗼', '🎠', '🎡', '🌊', '🏠', '🚗', '🚢', '🏰', '⛺', '🗺️', '🧭', '🌅'],
  celebration: ['🎀', '🎈', '🎉', '🎊', '🎄', '🎁', '🪄', '💫', '🔮', '👑', '🎵', '🎶', '🥂', '🎆', '🎇'],
  faces: ['😊', '🥰', '😍', '🤗', '😴', '🥺', '😂', '🤣', '😎', '🤭', '😇', '🥳', '😘', '🫶', '💪'],
  animals: ['🐾', '🦋', '🐰', '🐱', '🐶', '🦊', '🐻', '🐼', '🦜', '🐠', '🦢', '🕊️', '🐿️', '🦔', '🐝'],
  weather: ['☁️', '🌤️', '🌧️', '❄️', '🌈', '⚡', '🌊', '💧', '🌬️', '🌸', '🍃', '🌿', '☔', '🌞', '🌨️'],
};

const STICKER_CATEGORIES = [
  { key: 'hearts', label: '하트', emoji: '❤️' },
  { key: 'nature', label: '자연', emoji: '🌸' },
  { key: 'food', label: '음식', emoji: '☕' },
  { key: 'travel', label: '여행', emoji: '✈️' },
  { key: 'celebration', label: '축하', emoji: '🎀' },
  { key: 'faces', label: '표정', emoji: '😊' },
  { key: 'animals', label: '동물', emoji: '🐾' },
  { key: 'weather', label: '날씨', emoji: '☁️' },
] as const;

const BG_COLORS = [
  '#F4EDE2', '#EAE0D0', '#E0D2BC', '#F0E4D0', '#E8DCC8',
  '#FFF0E8', '#F0F5E8', '#E8F0F5', '#F5E8F0', '#F0E8E8',
  '#E8E8F0', '#F5F5E0', '#DDD0B8', '#D4C8B0',
  '#C4919A', '#7B8FA3', '#92A888', '#D4A855', '#A898B8', '#B8917A',
];

const DRAWING_COLORS = [
  '#2C1F10', '#6B5E50', '#C48B35', '#859C78', '#B8818A',
  '#7B8FA3', '#A898B8', '#D4A855', '#E57373', '#4CAF50',
];

const DRAWING_WIDTHS = [2, 4, 8, 12];

export function AlbumEditorScreen() {
  const colors = useColors();
  const styles = useThemedStyles((c) => ({
    root: { flex: 1 },
    notFound: { ...typography.body, color: c.textMuted, textAlign: 'center', marginTop: 100 },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingBottom: 4,
    },
    headerTitle: {
      ...typography.body,
      color: c.textSecondary,
      flex: 1,
      textAlign: 'center',
      fontWeight: '500',
    },
    headerActions: { flexDirection: 'row', gap: 2 },

    // Element actions
    elementActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      gap: 6,
    },
    actionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: c.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.divider,
    },
    actionChipText: { ...typography.caption, color: c.textSecondary, fontSize: 11 },

    // Canvas
    canvasContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    canvas: {
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    element: {
      position: 'absolute',
      overflow: 'hidden',
    },
    elementSelected: {
      borderWidth: 2,
      borderColor: c.accent,
      borderStyle: 'dashed',
      borderRadius: 4,
    },
    photoWrapper: { width: '100%', height: '100%', borderRadius: 4, overflow: 'hidden' },
    photoElement: { width: '100%', height: '100%' },
    blurredPhoto: { opacity: 0.3 },
    blurOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(240, 232, 219, 0.7)',
      borderRadius: 4,
    },
    stickerElement: { textAlign: 'center' },
    textElement: { padding: 4 },
    drawDot: { position: 'absolute' },
    resizeHandle: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: c.accent,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 3,
    },
    emptyCanvas: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyCanvasText: { ...typography.body, color: c.textMuted, textAlign: 'center', lineHeight: 24 },

    // Drawing toolbar
    drawToolbar: {
      paddingVertical: 8,
      paddingHorizontal: spacing.md,
      backgroundColor: c.cardBg,
      marginHorizontal: spacing.md,
      borderRadius: 16,
      marginBottom: 4,
    },
    drawToolRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    drawColorDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    drawColorDotActive: {
      borderWidth: 3,
      borderColor: c.accent,
    },
    drawDivider: { width: 1, height: 24, backgroundColor: c.divider, marginHorizontal: 4 },
    drawWidthBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    drawWidthBtnActive: { backgroundColor: 'rgba(196, 139, 53, 0.15)' },
    drawWidthPreview: { backgroundColor: c.textPrimary },

    // Toolbar
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 10,
      paddingHorizontal: spacing.md,
      backgroundColor: c.cardBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 5,
    },
    toolBtn: {
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 12,
    },
    toolBtnActive: { backgroundColor: 'rgba(196, 139, 53, 0.1)' },
    toolLabel: { ...typography.caption, color: c.textSecondary, marginTop: 2, fontSize: 10 },
    toolLabelActive: { color: c.accent, fontWeight: '600' },

    // Sticker sheet
    categoryScroll: { marginBottom: 8 },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: 'rgba(160, 149, 133, 0.08)',
      marginRight: 6,
      gap: 4,
    },
    categoryChipActive: { backgroundColor: 'rgba(196, 139, 53, 0.15)' },
    categoryEmoji: { fontSize: 16 },
    categoryLabel: { ...typography.caption, color: c.textSecondary, fontSize: 12 },
    categoryLabelActive: { color: c.accent, fontWeight: '600' },
    stickerGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      paddingBottom: 20,
    },
    stickerOption: {
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
    },
    stickerOptionText: { fontSize: 28 },

    // Background sheet
    bgGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      paddingBottom: 20,
    },
    bgOption: {
      width: 52,
      height: 52,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    bgOptionSelected: { borderWidth: 3, borderColor: c.accent },

    // Text input
    textInputContainer: { flex: 1, paddingTop: spacing.sm },
    textInputField: {
      ...typography.body,
      color: c.textPrimary,
      borderBottomWidth: 1.5,
      borderBottomColor: c.divider,
      paddingVertical: spacing.sm,
      minHeight: 50,
      textAlignVertical: 'top',
    },
    textFontRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    fontChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: 'rgba(160, 149, 133, 0.08)',
    },
    fontChipText: { ...typography.caption, color: c.textSecondary },
    textAddBtn: {
      backgroundColor: c.accent,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    textAddBtnDisabled: { opacity: 0.4 },
    textAddBtnText: { ...typography.body, color: c.warmWhite, fontWeight: '600' },

    // Layer sheet
    layerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 4,
    },
    layerRowActive: { backgroundColor: 'rgba(196, 139, 53, 0.1)' },
    layerIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: 'rgba(160, 149, 133, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    layerInfo: { flex: 1, marginLeft: 10 },
    layerName: { ...typography.body, color: c.textPrimary, fontSize: 14 },
    layerMeta: { ...typography.caption, color: c.textMuted, fontSize: 10 },
    layerEmpty: { ...typography.body, color: c.textMuted, textAlign: 'center', paddingTop: 40 },
  }));

  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { getAlbum, addElement, updateElement, deleteElement, updatePage, batchUpdateElements } = useAlbumStore();

  const album = getAlbum(route.params.albumId);
  const page = album?.pages?.find(p => p.id === route.params.pageId);

  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showStickerSheet, setShowStickerSheet] = useState(false);
  const [showBgSheet, setShowBgSheet] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [showLayerSheet, setShowLayerSheet] = useState(false);
  const [textDraft, setTextDraft] = useState('');
  const [stickerCategory, setStickerCategory] = useState<string>('hearts');
  const [drawingColor, setDrawingColor] = useState('#2C1F10');
  const [drawingWidth, setDrawingWidth] = useState(4);
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Undo/Redo
  const history = useEditorHistory({
    initialElements: page?.elements || [],
    initialBackground: page?.backgroundColor || '#FDFAF5',
  });

  // Canvas dimensions
  const CANVAS_PADDING = 16;
  const canvasWidth = SCREEN_WIDTH - CANVAS_PADDING * 2;
  const canvasHeight = canvasWidth * (4 / 3);

  const selectedElement = useMemo(() => {
    if (!selectedElementId || !page) return null;
    return page.elements.find(el => el.id === selectedElementId) || null;
  }, [selectedElementId, page]);

  // Save state before modifications for undo
  const saveHistory = useCallback(() => {
    if (!page) return;
    history.pushState(page.elements, page.backgroundColor, page.backgroundImage);
  }, [page, history]);

  const handleUndo = useCallback(() => {
    if (!album || !page) return;
    const state = history.undo();
    if (state) {
      batchUpdateElements(album.id, page.id, state.elements);
      updatePage(album.id, page.id, { backgroundColor: state.backgroundColor });
      setSelectedElementId(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [album, page, history, batchUpdateElements, updatePage]);

  const handleRedo = useCallback(() => {
    if (!album || !page) return;
    const state = history.redo();
    if (state) {
      batchUpdateElements(album.id, page.id, state.elements);
      updatePage(album.id, page.id, { backgroundColor: state.backgroundColor });
      setSelectedElementId(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [album, page, history, batchUpdateElements, updatePage]);

  const handleAddPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (!result.canceled && album && page) {
      saveHistory();
      result.assets.forEach((asset, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        addElement(album.id, page.id, {
          type: 'photo',
          photoUri: asset.uri,
          x: 5 + col * 48,
          y: 5 + row * 35,
          width: 44,
          height: 32,
          rotation: (Math.random() - 0.5) * 6,
          zIndex: (page.elements?.length || 0) + index + 1,
          opacity: 1,
        });
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [album, page, addElement, saveHistory]);

  const handleAddSticker = useCallback((emoji: string) => {
    if (!album || !page) return;
    saveHistory();
    addElement(album.id, page.id, {
      type: 'sticker',
      stickerEmoji: emoji,
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
      width: 12,
      height: 12,
      rotation: (Math.random() - 0.5) * 20,
      zIndex: (page.elements?.length || 0) + 1,
      opacity: 1,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowStickerSheet(false);
  }, [album, page, addElement, saveHistory]);

  const handleAddText = useCallback(() => {
    if (!album || !page || !textDraft.trim()) return;
    saveHistory();
    addElement(album.id, page.id, {
      type: 'text',
      textContent: textDraft.trim(),
      textColor: colors.textPrimary,
      textFontSize: 16,
      textFontFamily: 'pretendard',
      textAlign: 'left',
      x: 10,
      y: 40,
      width: 80,
      height: 15,
      rotation: 0,
      zIndex: (page.elements?.length || 0) + 1,
      opacity: 1,
    });
    setTextDraft('');
    setShowTextInput(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [album, page, textDraft, addElement, saveHistory]);

  const handleChangeBg = useCallback((color: string) => {
    if (!album || !page) return;
    saveHistory();
    updatePage(album.id, page.id, { backgroundColor: color });
    setShowBgSheet(false);
  }, [album, page, updatePage, saveHistory]);

  const handleDeleteElement = useCallback(() => {
    if (!album || !page || !selectedElementId) return;
    saveHistory();
    deleteElement(album.id, page.id, selectedElementId);
    setSelectedElementId(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [album, page, selectedElementId, deleteElement, saveHistory]);

  const handleDuplicateElement = useCallback(() => {
    if (!album || !page || !selectedElement) return;
    saveHistory();
    const { id, ...rest } = selectedElement;
    addElement(album.id, page.id, {
      ...rest,
      x: rest.x + 5,
      y: rest.y + 5,
      zIndex: (page.elements?.length || 0) + 1,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [album, page, selectedElement, addElement, saveHistory]);

  const handleToggleBlur = useCallback(() => {
    if (!album || !page || !selectedElementId || !selectedElement) return;
    saveHistory();
    updateElement(album.id, page.id, selectedElementId, {
      isBlurred: !selectedElement.isBlurred,
    });
  }, [album, page, selectedElementId, selectedElement, updateElement, saveHistory]);

  const handleToggleLock = useCallback(() => {
    if (!album || !page || !selectedElementId || !selectedElement) return;
    updateElement(album.id, page.id, selectedElementId, {
      isLocked: !selectedElement.isLocked,
    });
  }, [album, page, selectedElementId, selectedElement, updateElement]);

  const handleLayerUp = useCallback(() => {
    if (!album || !page || !selectedElementId) return;
    saveHistory();
    const elements = [...page.elements];
    const idx = elements.findIndex(el => el.id === selectedElementId);
    if (idx < elements.length - 1) {
      const maxZ = Math.max(...elements.map(el => el.zIndex));
      elements[idx] = { ...elements[idx], zIndex: maxZ + 1 };
      batchUpdateElements(album.id, page.id, elements);
    }
  }, [album, page, selectedElementId, batchUpdateElements, saveHistory]);

  const handleLayerDown = useCallback(() => {
    if (!album || !page || !selectedElementId) return;
    saveHistory();
    const elements = [...page.elements];
    const idx = elements.findIndex(el => el.id === selectedElementId);
    if (idx >= 0) {
      const minZ = Math.min(...elements.map(el => el.zIndex));
      elements[idx] = { ...elements[idx], zIndex: Math.max(0, minZ - 1) };
      batchUpdateElements(album.id, page.id, elements);
    }
  }, [album, page, selectedElementId, batchUpdateElements, saveHistory]);

  // Drawing gesture handler
  const handleDrawStart = useCallback((x: number, y: number) => {
    setIsDrawing(true);
    setCurrentDrawingPoints([{ x: (x / canvasWidth) * 100, y: (y / canvasHeight) * 100 }]);
  }, [canvasWidth, canvasHeight]);

  const handleDrawMove = useCallback((x: number, y: number) => {
    if (!isDrawing) return;
    setCurrentDrawingPoints(prev => [
      ...prev,
      { x: (x / canvasWidth) * 100, y: (y / canvasHeight) * 100 },
    ]);
  }, [isDrawing, canvasWidth, canvasHeight]);

  const handleDrawEnd = useCallback(() => {
    if (!album || !page || currentDrawingPoints.length < 2) {
      setIsDrawing(false);
      setCurrentDrawingPoints([]);
      return;
    }
    saveHistory();
    const path: DrawingPath = {
      id: `path-${Date.now()}`,
      points: currentDrawingPoints,
      color: drawingColor,
      strokeWidth: drawingWidth,
      opacity: 1,
    };
    addElement(album.id, page.id, {
      type: 'drawing',
      drawingPaths: [path],
      drawingColor,
      drawingWidth,
      x: 0, y: 0,
      width: 100, height: 100,
      rotation: 0,
      zIndex: (page.elements?.length || 0) + 1,
      opacity: 1,
    });
    setIsDrawing(false);
    setCurrentDrawingPoints([]);
  }, [album, page, currentDrawingPoints, drawingColor, drawingWidth, addElement, saveHistory]);

  if (!album || !page) {
    return (
      <View style={styles.root}>
        <WarmBackground />
        <Text style={styles.notFound}>페이지를 찾을 수 없습니다</Text>
      </View>
    );
  }

  const sortedElements = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <View style={styles.root}>
      <WarmBackground />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 4 }]}
      >
        <IconButton onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </IconButton>

        <View style={styles.headerActions}>
          <IconButton onPress={handleUndo} disabled={!history.canUndo}>
            <ArrowCounterClockwise size={20} color={history.canUndo ? colors.textPrimary : colors.textMuted} />
          </IconButton>
          <IconButton onPress={handleRedo} disabled={!history.canRedo}>
            <ArrowClockwise size={20} color={history.canRedo ? colors.textPrimary : colors.textMuted} />
          </IconButton>
        </View>

        <Text style={styles.headerTitle}>p.{page.pageNumber + 1}</Text>

        <View style={styles.headerActions}>
          {selectedElementId && (
            <>
              <IconButton onPress={handleDuplicateElement}>
                <CopySimple size={20} color={colors.textSecondary} />
              </IconButton>
              <IconButton onPress={handleDeleteElement}>
                <Trash size={20} color="#E57373" />
              </IconButton>
            </>
          )}
          <IconButton onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.goBack();
          }}>
            <Check size={24} color={colors.accent} weight="bold" />
          </IconButton>
        </View>
      </Animated.View>

      {/* Element action bar when selected */}
      {selectedElement && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.elementActions}>
          <Pressable style={styles.actionChip} onPress={handleToggleLock}>
            {selectedElement.isLocked ?
              <Lock size={16} color={colors.accent} /> :
              <LockOpen size={16} color={colors.textSecondary} />
            }
            <Text style={styles.actionChipText}>{selectedElement.isLocked ? '잠금' : '잠금해제'}</Text>
          </Pressable>
          {selectedElement.type === 'photo' && (
            <Pressable style={styles.actionChip} onPress={handleToggleBlur}>
              {selectedElement.isBlurred ?
                <EyeSlash size={16} color={colors.dustyRose} /> :
                <Eye size={16} color={colors.textSecondary} />
              }
              <Text style={styles.actionChipText}>{selectedElement.isBlurred ? '블러됨' : '블러'}</Text>
            </Pressable>
          )}
          <Pressable style={styles.actionChip} onPress={handleLayerUp}>
            <CaretUp size={16} color={colors.textSecondary} />
            <Text style={styles.actionChipText}>앞으로</Text>
          </Pressable>
          <Pressable style={styles.actionChip} onPress={handleLayerDown}>
            <CaretDown size={16} color={colors.textSecondary} />
            <Text style={styles.actionChipText}>뒤로</Text>
          </Pressable>
          {selectedElement.type === 'photo' && (
            <Pressable
              style={styles.actionChip}
              onPress={() => {
                navigation.navigate('PhotoCrop', {
                  photoUri: selectedElement.photoUri!,
                  albumId: album.id,
                  pageId: page.id,
                  elementId: selectedElement.id,
                });
              }}
            >
              <ArrowsOutSimple size={16} color={colors.textSecondary} />
              <Text style={styles.actionChipText}>크롭</Text>
            </Pressable>
          )}
        </Animated.View>
      )}

      {/* Canvas */}
      <View style={styles.canvasContainer}>
        <Animated.View
          entering={FadeIn.delay(150).duration(400)}
          style={[
            styles.canvas,
            { width: canvasWidth, height: canvasHeight, backgroundColor: page.backgroundColor },
          ]}
        >
          {/* Render elements */}
          {sortedElements.map((el) => (
            <DraggableElement
              key={el.id}
              element={el}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              isSelected={selectedElementId === el.id}
              onSelect={() => {
                if (toolMode === 'select') {
                  setSelectedElementId(selectedElementId === el.id ? null : el.id);
                  Haptics.selectionAsync();
                }
              }}
              onDragEnd={(newX, newY) => {
                if (el.isLocked) return;
                saveHistory();
                updateElement(album.id, page.id, el.id, { x: newX, y: newY });
              }}
              onResizeEnd={(newW, newH) => {
                if (el.isLocked) return;
                saveHistory();
                updateElement(album.id, page.id, el.id, { width: newW, height: newH });
              }}
              disabled={toolMode === 'draw' || toolMode === 'eraser'}
              styles={styles}
            />
          ))}

          {/* Drawing overlay */}
          {(toolMode === 'draw' || toolMode === 'eraser') && (
            <Pressable
              style={StyleSheet.absoluteFill}
              onTouchStart={(e) => {
                const touch = e.nativeEvent;
                handleDrawStart(touch.locationX, touch.locationY);
              }}
              onTouchMove={(e) => {
                const touch = e.nativeEvent;
                handleDrawMove(touch.locationX, touch.locationY);
              }}
              onTouchEnd={handleDrawEnd}
            >
              {/* Render current drawing path */}
              {currentDrawingPoints.length > 1 && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  {currentDrawingPoints.map((point, i) => {
                    if (i === 0) return null;
                    return (
                      <View
                        key={i}
                        style={[
                          styles.drawDot,
                          {
                            left: (point.x / 100) * canvasWidth - drawingWidth / 2,
                            top: (point.y / 100) * canvasHeight - drawingWidth / 2,
                            width: drawingWidth,
                            height: drawingWidth,
                            borderRadius: drawingWidth / 2,
                            backgroundColor: toolMode === 'eraser' ? page.backgroundColor : drawingColor,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              )}
            </Pressable>
          )}

          {/* Empty state */}
          {page.elements.length === 0 && !isDrawing && (
            <View style={styles.emptyCanvas}>
              <Text style={styles.emptyCanvasText}>
                아래 도구를 사용해서{'\n'}이 페이지를 꾸며보세요
              </Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Drawing toolbar (when in draw mode) */}
      {(toolMode === 'draw' || toolMode === 'eraser') && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.drawToolbar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.drawToolRow}>
              {DRAWING_COLORS.map(c => (
                <Pressable
                  key={c}
                  style={[
                    styles.drawColorDot,
                    { backgroundColor: c },
                    drawingColor === c && styles.drawColorDotActive,
                  ]}
                  onPress={() => { setDrawingColor(c); setToolMode('draw'); }}
                />
              ))}
              <View style={styles.drawDivider} />
              {DRAWING_WIDTHS.map(w => (
                <Pressable
                  key={w}
                  style={[styles.drawWidthBtn, drawingWidth === w && styles.drawWidthBtnActive]}
                  onPress={() => setDrawingWidth(w)}
                >
                  <View style={[styles.drawWidthPreview, { width: w, height: w, borderRadius: w / 2 }]} />
                </Pressable>
              ))}
              <View style={styles.drawDivider} />
              <Pressable
                style={[styles.drawWidthBtn, toolMode === 'eraser' && styles.drawWidthBtnActive]}
                onPress={() => setToolMode(toolMode === 'eraser' ? 'draw' : 'eraser')}
              >
                <Eraser size={20} color={toolMode === 'eraser' ? colors.accent : colors.textSecondary} />
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* Bottom toolbar */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(400)}
        style={[styles.toolbar, { paddingBottom: insets.bottom + 8 }]}
      >
        {[
          { mode: 'photo' as ToolMode, Icon: ImageSquare, label: '사진', onPress: () => { setToolMode('photo'); handleAddPhoto(); } },
          { mode: 'sticker' as ToolMode, Icon: SmileySticker, label: '스티커', onPress: () => { setToolMode('sticker'); setShowStickerSheet(true); } },
          { mode: 'text' as ToolMode, Icon: TextT, label: '텍스트', onPress: () => { setToolMode('text'); setShowTextInput(true); } },
          { mode: 'draw' as ToolMode, Icon: PaintBrush, label: '그리기', onPress: () => { setToolMode(toolMode === 'draw' ? 'select' : 'draw'); setSelectedElementId(null); } },
          { mode: 'background' as ToolMode, Icon: Palette, label: '배경', onPress: () => { setToolMode('background'); setShowBgSheet(true); } },
          { mode: 'select' as ToolMode, Icon: Stack, label: '레이어', onPress: () => setShowLayerSheet(true) },
        ].map(({ mode, Icon, label, onPress }) => {
          const isActive = toolMode === mode || (mode === 'draw' && (toolMode === 'draw' || toolMode === 'eraser'));
          return (
            <Pressable key={mode} style={[styles.toolBtn, isActive && styles.toolBtnActive]} onPress={onPress}>
              <Icon size={22} color={isActive ? colors.accent : colors.textSecondary} weight={isActive ? 'fill' : 'regular'} />
              <Text style={[styles.toolLabel, isActive && styles.toolLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </Animated.View>

      {/* Sticker bottom sheet */}
      <BottomSheet visible={showStickerSheet} onClose={() => setShowStickerSheet(false)} title="스티커" height={SCREEN_HEIGHT * 0.5}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {STICKER_CATEGORIES.map(cat => (
            <Pressable
              key={cat.key}
              style={[styles.categoryChip, stickerCategory === cat.key && styles.categoryChipActive]}
              onPress={() => setStickerCategory(cat.key)}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[styles.categoryLabel, stickerCategory === cat.key && styles.categoryLabelActive]}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.stickerGrid}>
            {(EMOJIS_BY_CATEGORY[stickerCategory as keyof typeof EMOJIS_BY_CATEGORY] || []).map((emoji) => (
              <Pressable key={emoji} style={styles.stickerOption} onPress={() => handleAddSticker(emoji)}>
                <Text style={styles.stickerOptionText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </BottomSheet>

      {/* Background bottom sheet */}
      <BottomSheet visible={showBgSheet} onClose={() => setShowBgSheet(false)} title="배경 색상" height={SCREEN_HEIGHT * 0.4}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.bgGrid}>
            {BG_COLORS.map((color) => (
              <Pressable
                key={color}
                style={[styles.bgOption, { backgroundColor: color }, page.backgroundColor === color && styles.bgOptionSelected]}
                onPress={() => handleChangeBg(color)}
              >
                {page.backgroundColor === color && <Check size={18} color={colors.textPrimary} weight="bold" />}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </BottomSheet>

      {/* Text input bottom sheet */}
      <BottomSheet visible={showTextInput} onClose={() => setShowTextInput(false)} title="텍스트 추가" height={SCREEN_HEIGHT * 0.35}>
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInputField}
            value={textDraft}
            onChangeText={setTextDraft}
            placeholder="텍스트를 입력하세요"
            placeholderTextColor={colors.textMuted}
            multiline
            autoFocus
          />
          <View style={styles.textFontRow}>
            {(['pretendard', 'serif', 'caveat'] as const).map(font => (
              <Pressable
                key={font}
                style={[styles.fontChip, { opacity: 1 }]}
                onPress={() => {/* font selection for future */}}
              >
                <Text style={[styles.fontChipText, font === 'caveat' && { fontStyle: 'italic' }]}>
                  {font === 'pretendard' ? '본문' : font === 'serif' ? '세리프' : '손글씨'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={[styles.textAddBtn, !textDraft.trim() && styles.textAddBtnDisabled]}
            onPress={handleAddText}
            disabled={!textDraft.trim()}
          >
            <Text style={styles.textAddBtnText}>추가</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Layer management bottom sheet */}
      <BottomSheet visible={showLayerSheet} onClose={() => setShowLayerSheet(false)} title="레이어" height={SCREEN_HEIGHT * 0.5}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {[...page.elements].sort((a, b) => b.zIndex - a.zIndex).map((el) => (
            <Pressable
              key={el.id}
              style={[styles.layerRow, selectedElementId === el.id && styles.layerRowActive]}
              onPress={() => { setSelectedElementId(el.id); setShowLayerSheet(false); }}
            >
              <View style={styles.layerIcon}>
                {el.type === 'photo' && <ImageSquare size={20} color={colors.textSecondary} />}
                {el.type === 'sticker' && <Text style={{ fontSize: 18 }}>{el.stickerEmoji}</Text>}
                {el.type === 'text' && <TextT size={20} color={colors.textSecondary} />}
                {el.type === 'drawing' && <PaintBrush size={20} color={colors.textSecondary} />}
              </View>
              <View style={styles.layerInfo}>
                <Text style={styles.layerName} numberOfLines={1}>
                  {el.type === 'photo' ? '사진' : el.type === 'sticker' ? el.stickerEmoji : el.type === 'text' ? (el.textContent || '텍스트') : '그리기'}
                </Text>
                <Text style={styles.layerMeta}>z: {el.zIndex}</Text>
              </View>
              {el.isLocked && <Lock size={14} color={colors.textMuted} />}
              {el.isBlurred && <EyeSlash size={14} color={colors.dustyRose} style={{ marginLeft: 4 }} />}
            </Pressable>
          ))}
          {page.elements.length === 0 && (
            <Text style={styles.layerEmpty}>레이어가 없습니다</Text>
          )}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

/** Draggable element wrapper with pan gesture */
function DraggableElement({
  element,
  canvasWidth,
  canvasHeight,
  isSelected,
  onSelect,
  onDragEnd,
  onResizeEnd,
  disabled,
  styles,
}: {
  element: PageElement;
  canvasWidth: number;
  canvasHeight: number;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (newX: number, newY: number) => void;
  onResizeEnd: (newW: number, newH: number) => void;
  disabled?: boolean;
  styles: any;
}) {
  const colors = useColors();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const scaleVal = useSharedValue(1);

  const elLeft = (element.x / 100) * canvasWidth;
  const elTop = (element.y / 100) * canvasHeight;
  const elWidth = (element.width / 100) * canvasWidth;
  const elHeight = (element.height / 100) * canvasHeight;

  const panGesture = Gesture.Pan()
    .enabled(!disabled && !element.isLocked)
    .onStart(() => {
      startX.current = translateX.value;
      startY.current = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = startX.current + e.translationX;
      translateY.value = startY.current + e.translationY;
    })
    .onEnd(() => {
      const newX = element.x + (translateX.value / canvasWidth) * 100;
      const newY = element.y + (translateY.value / canvasHeight) * 100;
      translateX.value = 0;
      translateY.value = 0;
      runOnJS(onDragEnd)(
        Math.max(0, Math.min(100 - element.width, newX)),
        Math.max(0, Math.min(100 - element.height, newY))
      );
    });

  const pinchGesture = Gesture.Pinch()
    .enabled(!disabled && !element.isLocked)
    .onUpdate((e) => {
      scaleVal.value = e.scale;
    })
    .onEnd(() => {
      const newW = Math.max(5, Math.min(100, element.width * scaleVal.value));
      const newH = Math.max(5, Math.min(100, element.height * scaleVal.value));
      scaleVal.value = 1;
      runOnJS(onResizeEnd)(newW, newH);
    });

  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .onEnd(() => {
      runOnJS(onSelect)();
    });

  const composed = Gesture.Simultaneous(
    panGesture,
    pinchGesture,
    tapGesture
  );

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scaleVal.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          styles.element,
          {
            left: elLeft,
            top: elTop,
            width: elWidth,
            height: elHeight,
            transform: [{ rotate: `${element.rotation}deg` }],
            zIndex: element.zIndex,
            opacity: element.opacity ?? 1,
          },
          animStyle,
          isSelected && styles.elementSelected,
        ]}
      >
        {element.type === 'photo' && element.photoUri && (
          <View style={[styles.photoWrapper, element.isBlurred && styles.blurredPhoto]}>
            <Image source={{ uri: element.photoUri }} style={styles.photoElement} resizeMode="cover" />
            {element.isBlurred && <View style={styles.blurOverlay} />}
          </View>
        )}
        {element.type === 'sticker' && (
          <Text style={[styles.stickerElement, { fontSize: elWidth * 0.7 }]}>
            {element.stickerEmoji}
          </Text>
        )}
        {element.type === 'text' && (
          <Text
            style={[
              styles.textElement,
              {
                color: element.textColor || colors.textPrimary,
                fontSize: element.textFontSize || 16,
                fontWeight: (element.textFontWeight as any) || '400',
                textAlign: element.textAlign || 'left',
              },
            ]}
            numberOfLines={0}
          >
            {element.textContent}
          </Text>
        )}
        {element.type === 'drawing' && element.drawingPaths && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {element.drawingPaths.map(path => (
              path.points.map((pt, i) => {
                if (i === 0) return null;
                return (
                  <View
                    key={`${path.id}-${i}`}
                    style={{
                      position: 'absolute',
                      left: (pt.x / 100) * elWidth - path.strokeWidth / 2,
                      top: (pt.y / 100) * elHeight - path.strokeWidth / 2,
                      width: path.strokeWidth,
                      height: path.strokeWidth,
                      borderRadius: path.strokeWidth / 2,
                      backgroundColor: path.color,
                      opacity: path.opacity,
                    }}
                  />
                );
              })
            ))}
          </View>
        )}

        {/* Resize handle */}
        {isSelected && !element.isLocked && (
          <View style={styles.resizeHandle}>
            <ArrowsOutSimple size={12} color={colors.warmWhite} />
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const startX = { current: 0 };
const startY = { current: 0 };
