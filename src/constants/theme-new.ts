import { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  background: '#F7F3FF',       // soft lavender background
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  primary: '#B39DDB',          // pastel purple
  primaryDark: '#9575CD',
  primaryLight: '#CE93D8',
  primaryMuted: '#F3EEFF',
  primarySubtle: '#F8F4FF',

  secondary: '#60C8F5',        // sky blue
  secondaryMuted: '#E0F4FF',

  accent: '#FB923C',           // warm orange
  accentMuted: '#FFF0E6',

  pink: '#F9A8D4',             // pastel pink
  pinkMuted: '#FDF2F8',
  pinkDark: '#EC4899',

  mint: '#6EE7B7',             // mint green
  mintMuted: '#ECFDF5',
  mintDark: '#10B981',

  yellow: '#FDE68A',           // soft yellow
  yellowMuted: '#FFFBEB',
  yellowDark: '#F59E0B',

  danger: '#F87171',
  dangerMuted: '#FEF2F2',

  success: '#34D399',
  successMuted: '#ECFDF5',

  warning: '#FB923C',
  warningMuted: '#FFF7ED',

  purple: '#B39DDB',
  purpleMuted: '#F3EEFF',

  text: '#3D2C6B',             // deep indigo text
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textPlaceholder: '#C4B5FD',

  border: '#E9D5FF',
  borderLight: '#F3E8FF',
  borderFocus: '#A78BFA',

  shadow: '#7C3AED',
  overlay: 'rgba(0,0,0,0.35)',
  overlayLight: 'rgba(124,58,237,0.06)',

  streak: '#FB923C',
  streakBg: '#FFF7ED',

  gold: '#FCD34D',
  goldMuted: '#FFFBEB',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const shadow = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  } as ViewStyle,
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  } as ViewStyle,
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  } as ViewStyle,
  xl: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  } as ViewStyle,
  inner: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  } as ViewStyle,
} as const;

export const typography: Record<string, TextStyle> = {
  displayLarge: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  display: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  body: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  bodySm: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  micro: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
};

export const fontFamily = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
} as const;

export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  } as const,
  springBounce: {
    damping: 10,
    stiffness: 200,
    mass: 0.8,
  } as const,
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Typography = TextStyle;
