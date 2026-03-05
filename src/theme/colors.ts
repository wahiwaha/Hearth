/** Light theme colors */
const lightColors = {
  // Warm backgrounds (docs: Aged Paper + Warm White base)
  background: '#F7F2EA',      // Aged Paper
  backgroundDark: '#F0E8DB',
  warmWhite: '#FDFAF5',       // 밝은 페이지

  // Wood & shelf tones
  shelfLight: '#D4BFA6',
  shelfMid: '#BBA68A',
  shelfDark: '#8B7560',
  shelfShadow: '#6B5A48',

  // Album spine colors
  spineDustyRose: '#C4919A',
  spineSage: '#92A888',
  spineAmber: '#D4A855',
  spineSlate: '#7B8FA3',
  spineCream: '#DDD0B8',
  spineLavender: '#A898B8',
  spineTerra: '#B8917A',
  spineMoss: '#8A9E78',
  spineNavy: '#5B6E85',
  spinePeach: '#D4A898',

  // Text (docs: Deep Espresso ink)
  textPrimary: '#2C1F10',
  textSecondary: '#6B5E50',
  textMuted: '#A09585',
  textOnDark: '#FAF6F0',

  // Accents (docs: Amber + Sage + Dusty Rose)
  accent: '#C48B35',
  accentSoft: '#D4A855',
  sage: '#859C78',
  sageSoft: '#A8B89A',
  dustyRose: '#B8818A',
  dustyRoseSoft: '#D4A8AE',

  // UI
  overlay: 'rgba(44, 31, 16, 0.45)',
  cardBg: 'rgba(253, 250, 245, 0.92)',
  glass: 'rgba(247, 242, 234, 0.72)',
  divider: 'rgba(160, 149, 133, 0.12)',

  // Status
  success: '#6B9E6B',
  error: '#C4616A',
  warning: '#D4A855',
  info: '#7B8FA3',
} as const;

/** Dark theme colors */
const darkColors = {
  // Warm dark backgrounds
  background: '#1A1510',
  backgroundDark: '#12100C',
  warmWhite: '#252017',

  // Wood & shelf tones (darker)
  shelfLight: '#4A3E32',
  shelfMid: '#3A3028',
  shelfDark: '#2A221A',
  shelfShadow: '#1A1510',

  // Album spine colors stay the same (accent)
  spineDustyRose: '#C4919A',
  spineSage: '#92A888',
  spineAmber: '#D4A855',
  spineSlate: '#7B8FA3',
  spineCream: '#DDD0B8',
  spineLavender: '#A898B8',
  spineTerra: '#B8917A',
  spineMoss: '#8A9E78',
  spineNavy: '#5B6E85',
  spinePeach: '#D4A898',

  // Text (inverted)
  textPrimary: '#F0E8DB',
  textSecondary: '#B8A898',
  textMuted: '#7A6E60',
  textOnDark: '#FAF6F0',

  // Accents (slightly brighter for dark bg)
  accent: '#D4A048',
  accentSoft: '#E0B86A',
  sage: '#95B088',
  sageSoft: '#B8C8AA',
  dustyRose: '#C89098',
  dustyRoseSoft: '#D8B0B8',

  // UI
  overlay: 'rgba(10, 8, 5, 0.65)',
  cardBg: 'rgba(38, 32, 24, 0.92)',
  glass: 'rgba(30, 25, 18, 0.72)',
  divider: 'rgba(120, 108, 92, 0.15)',

  // Status
  success: '#7AB07A',
  error: '#D47880',
  warning: '#E0B86A',
  info: '#8AA0B8',
} as const;

export type ThemeColors = typeof lightColors;
export type ThemeMode = 'light' | 'dark' | 'system';

/** Default exported colors (light mode) */
export const colors = lightColors;
export { lightColors, darkColors };
