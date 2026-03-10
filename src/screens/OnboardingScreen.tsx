import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  FlatList,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BookOpen,
  UsersThree,
  Sparkle,
  Bell,
  ArrowRight,
} from 'phosphor-react-native';
import { typography, spacing, useThemedStyles } from '../theme';
import { useColors } from '../store/ThemeStore';
import { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../store/AuthStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface OnboardingPage {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  gradient: string[];
}

export function OnboardingScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { completeOnboarding } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const PAGES: OnboardingPage[] = [
    {
      icon: <BookOpen size={64} color={colors.accent} weight="duotone" />,
      title: '소중한 추억을\n함께 간직해요',
      subtitle: 'Hearth에 오신 것을 환영해요',
      description: '디지털로 만드는 아날로그 감성의 앨범.\n사진을 모아 나만의 앨범을 꾸며보세요.',
      gradient: ['#F8F2EA', '#F5EDE4', '#EAE0D4'],
    },
    {
      icon: <UsersThree size={64} color={colors.dustyRose} weight="duotone" />,
      title: '함께 만드는\n우리의 앨범',
      subtitle: '공유 앨범',
      description: '친구, 연인, 가족과 함께 앨범을 만들어요.\n실시간으로 함께 꾸미고 추억을 나눠요.',
      gradient: ['#F8F2EA', '#F5EDE4', '#EAE0D4'],
    },
    {
      icon: <Sparkle size={64} color={colors.sage} weight="duotone" />,
      title: '스티커, 그리기,\n자유롭게 꾸미기',
      subtitle: '데코레이션',
      description: '스티커, 텍스트, 그리기 도구로\n세상에 하나뿐인 앨범을 만들어보세요.',
      gradient: ['#F8F2EA', '#F5EDE4', '#EAE0D4'],
    },
    {
      icon: <Bell size={64} color={colors.accentSoft} weight="duotone" />,
      title: '추억이 생기면\n바로 알려줄게요',
      subtitle: '알림 설정',
      description: '새 사진 추가, 앨범 초대 등\n중요한 소식을 놓치지 마세요.',
      gradient: ['#F8F2EA', '#F5EDE4', '#EAE0D4'],
    },
  ];

  const handleNext = useCallback(() => {
    if (currentPage < PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentPage + 1, animated: true });
      setCurrentPage(currentPage + 1);
    } else {
      handleComplete();
    }
  }, [currentPage]);

  const handleComplete = useCallback(() => {
    completeOnboarding();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }, [completeOnboarding, navigation]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const renderPage = useCallback(({ item, index }: { item: OnboardingPage; index: number }) => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <LinearGradient
        colors={item.gradient as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={[styles.pageContent, { paddingTop: insets.top + 80 }]}>
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.iconContainer}>
          {item.icon}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    </View>
  ), [insets.top]);

  return (
    <View style={styles.root}>
      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentPage(idx);
        }}
        scrollEventThrottle={16}
      />

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
        {/* Page dots */}
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                currentPage === i && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.bottomActions}>
          {currentPage < PAGES.length - 1 ? (
            <>
              <Pressable onPress={handleSkip}>
                <Text style={styles.skipText}>건너뛰기</Text>
              </Pressable>
              <Pressable style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>다음</Text>
                <ArrowRight size={18} color={colors.warmWhite} />
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.startBtn} onPress={handleComplete}>
              <Text style={styles.startBtnText}>시작하기</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (c: ReturnType<typeof useColors>) => ({
  root: { flex: 1, backgroundColor: c.background } as const,
  page: { flex: 1 } as const,
  pageContent: {
    flex: 1,
    paddingHorizontal: 40,
    alignItems: 'center' as const,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(200, 185, 165, 0.3)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 4,
  },
  subtitle: {
    ...typography.label,
    color: c.accent,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  title: {
    ...typography.title,
    color: c.textPrimary,
    textAlign: 'center' as const,
    fontSize: 26,
    lineHeight: 34,
    marginBottom: 16,
  },
  description: {
    ...typography.body,
    color: c.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
  },

  bottomBar: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
  },
  dots: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: c.textMuted,
    opacity: 0.3,
  },
  dotActive: {
    width: 18,
    opacity: 1,
    backgroundColor: c.accent,
  },
  bottomActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  skipText: {
    ...typography.body,
    color: c.textMuted,
  },
  nextBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: c.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextBtnText: {
    ...typography.body,
    color: c.warmWhite,
    fontWeight: '600' as const,
  },
  startBtn: {
    flex: 1,
    backgroundColor: c.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    shadowColor: c.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  startBtnText: {
    ...typography.subtitle,
    color: c.warmWhite,
    fontWeight: '700' as const,
  },
});
