import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors, ThemeMode } from '../theme/colors';

interface ThemeStoreContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const ThemeStoreContext = createContext<ThemeStoreContextType | null>(null);

export function ThemeStoreProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('light');

  const isDark = useMemo(() => {
    if (mode === 'system') return systemScheme === 'dark';
    return mode === 'dark';
  }, [mode, systemScheme]);

  const themeColors = useMemo<ThemeColors>(() => {
    return isDark ? (darkColors as unknown as ThemeColors) : lightColors;
  }, [isDark]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
  }, []);

  return (
    <ThemeStoreContext.Provider value={{ mode, isDark, colors: themeColors, setMode }}>
      {children}
    </ThemeStoreContext.Provider>
  );
}

export function useThemeStore() {
  const context = useContext(ThemeStoreContext);
  if (!context) throw new Error('useThemeStore must be used within ThemeStoreProvider');
  return context;
}

/** 현재 테마 컬러 반환 (다크/라이트 자동 전환) */
export function useColors(): ThemeColors {
  const { colors } = useThemeStore();
  return colors;
}

/** 현재 다크모드 여부 */
export function useIsDark(): boolean {
  const { isDark } = useThemeStore();
  return isDark;
}
