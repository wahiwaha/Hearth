import { Platform, TextStyle } from 'react-native';

const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export const typography = {
  title: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: serifFont,
    letterSpacing: -0.5,
    lineHeight: 32,
  } as TextStyle,

  subtitle: {
    fontSize: 19,
    fontWeight: '600',
    fontFamily: serifFont,
    letterSpacing: -0.2,
    lineHeight: 25,
  } as TextStyle,

  body: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.1,
    lineHeight: 22,
  } as TextStyle,

  caption: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 16,
  } as TextStyle,

  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    lineHeight: 14,
  } as TextStyle,
} as const;
