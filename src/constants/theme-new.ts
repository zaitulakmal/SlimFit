// Slimora theme for the hidden feature screens.
// Values are sourced from src/theme/cute.ts — the Home screen's palette is the
// single source of truth. This file previously hand-copied approximations of
// those colours (cream #FFF7F2 vs #FFF8F3, ink #4A4458 vs #3D2C3E, a different
// mint/sky/butter), which is why screens drifted apart. Key names are kept for
// compatibility with the screens that already import them.
import { cute, withAlpha } from '@/theme/cute';

export const colors = {
  // Primary — cute coral
  primary: cute.coral,
  primaryLight: '#FFB1A8',
  primaryDark: cute.coralDeep,

  // Secondary — soft stone
  secondary: cute.line,
  secondaryLight: '#F8F1ED',

  // Accent — butter yellow
  accent: cute.butter,
  accentLight: '#FFF6DB',
  accentDark: '#E0A800',

  // Brand hues (multi-colour, not pink-only)
  coral: cute.coral,
  butter: cute.butter,
  mint: cute.mint,
  sky: cute.sky,
  lavender: cute.lavender,

  // Background & Surface
  background: cute.cream,
  bg: cute.cream,
  navy: cute.cream, // header base — kept name for compat
  surface: cute.card,
  surfaceElevated: cute.card,

  // Text
  text: cute.ink,
  textPrimary: cute.ink,
  textSecondary: cute.inkSoft,
  textTertiary: cute.inkFaint,
  textInverse: '#FFFFFF',
  textPlaceholder: cute.inkFaint,
  ink: cute.ink,
  inkSoft: cute.inkSoft,
  inkFaint: cute.inkFaint,

  // Semantic
  success: cute.success,
  successLight: withAlpha(cute.mint, 0.16),
  warning: cute.warn,
  warningLight: withAlpha(cute.warn, 0.16),
  danger: cute.danger,
  dangerLight: withAlpha(cute.danger, 0.14),

  // Borders
  border: cute.line,
  borderLight: '#F8F1ED',
  line: cute.line,

  // Cards
  cardBackground: cute.card,
  cardShadow: 'rgba(224,166,160,0.12)',
  cardBlue: withAlpha(cute.water, 0.14),
  cardMint: withAlpha(cute.mint, 0.16),
  cardYellow: withAlpha(cute.carbs, 0.16),

  // Progress/Stats
  progressBg: cute.line,
  progressFill: cute.coral,

  // Tints used across screens
  primarySubtle: withAlpha(cute.coral, 0.14),
  streakBg: withAlpha(cute.coral, 0.14),
  purpleMuted: withAlpha(cute.lavender, 0.18),
  accentMuted: withAlpha(cute.carbs, 0.16),
  secondaryMuted: '#F8F1ED',
  purple: cute.lavender,
  blue: cute.sky,

  // Overlay
  overlay: 'rgba(61,44,62,0.45)',
  overlayLight: 'rgba(61,44,62,0.28)',

  // White
  white: cute.white,
  black: '#000000',
  transparent: 'transparent',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 80,
  xxxl: 96,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  xxl: 32,
  full: 9999,
} as const;

// Figma-style soft shadows (cute, high float)
export const shadow = {
  sm: {
    shadowColor: '#E0A6A0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#E0A6A0',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 4,
  },
  lg: {
    shadowColor: '#E0A6A0',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 8,
  },
} as const;

// Animation timings (referenced by recipes-hidden)
export const animation = {
  spring: { damping: 18, stiffness: 140 },
  duration: { fast: 160, base: 260, slow: 420 },
} as const;

export const typography = {
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8 },
  heading: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.4 },
  title: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.3 },
  subtitle: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  // Extra sizes referenced by hidden screens
  micro: { fontSize: 10, fontWeight: '600' as const },
  bodySm: { fontSize: 13, fontWeight: '500' as const },
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.2 },
  caption: { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0.2 },
  xxxl: { fontSize: 40, fontWeight: '900' as const, letterSpacing: -1 },
} as const;

// Meal type colors for food log
export const mealColors = {
  breakfast: { color: '#E0A800', bg: withAlpha(cute.carbs, 0.16) },
  lunch:     { color: cute.mintDeep, bg: withAlpha(cute.mint, 0.16) },
  dinner:    { color: cute.grape, bg: withAlpha(cute.lavender, 0.18) },
  snack:     { color: cute.water, bg: withAlpha(cute.water, 0.14) },
} as const;
