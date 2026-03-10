import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { ThemeColors } from './colors';
import { useColors } from '../store/ThemeStore';

/**
 * 테마 컬러에 반응하는 동적 StyleSheet 생성
 * colors 객체가 바뀔 때(테마 전환)만 재생성
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ThemeColors) => T,
): T {
  const colors = useColors();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
}
