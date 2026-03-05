import { TextStyle } from 'react-native';

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  } as TextStyle,

  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  } as TextStyle,

  body: {
    fontSize: 16,
    fontWeight: '400',
  } as TextStyle,

  caption: {
    fontSize: 13,
    fontWeight: '400',
  } as TextStyle,

  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
} as const;
