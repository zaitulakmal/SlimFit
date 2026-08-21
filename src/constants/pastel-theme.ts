// Slimora palette — single source of truth is src/theme/cute.ts (the Home
// screen's look). This file used to carry a separate Figma brand (Ruby #C41E3A
// / Navy #1A2B5C / warm-brown text), which is why screens built on it clashed
// with Home. Every key is kept so existing screens keep compiling; the values
// now resolve to the cute palette.
import { cute, withAlpha } from '@/theme/cute';

export const pastelColors = {
  // Was navy; now the soft ink used across Home so "dark" surfaces match.
  navy: cute.ink,
  navyLight: cute.inkSoft,
  navyDark: '#2C1F2D',

  // Primary — cute coral
  primary: cute.coral,
  primaryLight: '#FFB1A8',
  primaryDark: cute.coralDeep,

  // Accent — butter
  amber: cute.carbs,
  amberDark: '#E0A800',
  amberLight: '#FFF6DB',

  // Greens — cute mint
  green: cute.mintDeep,
  greenLight: '#DFF7EE',
  greenDark: '#25A886',

  // Supporting palette
  coral: cute.coral,
  pink: withAlpha(cute.coral, 0.18),
  blue: cute.sky,
  purple: cute.lavender,
  orange: cute.fat,
  yellow: cute.carbs,
  skyBlue: cute.water,

  // Neutrals — cute cream
  white: cute.white,
  background: cute.cream,
  surface: cute.card,
  card: cute.card,
  border: cute.line,
  borderLight: '#F8F1ED',

  // Text
  textPrimary: cute.ink,
  textSecondary: cute.inkSoft,
  textTertiary: cute.inkFaint,
  textOnAccent: '#FFFFFF',
  textOnDark: '#FFFFFF',
  textOnAmber: cute.ink,
  textPlaceholder: cute.inkFaint,
  text: cute.ink,

  // Card tints — same hues as the Home bento cards
  cardMint: withAlpha(cute.mint, 0.16),
  cardYellow: withAlpha(cute.carbs, 0.16),
  cardPink: withAlpha(cute.coral, 0.14),
  cardBlue: withAlpha(cute.water, 0.14),
  cardPurple: withAlpha(cute.lavender, 0.18),
  cardOrange: withAlpha(cute.fat, 0.16),
  cardCoral: withAlpha(cute.coral, 0.14),
  cardCream: cute.cream,

  // Status
  success: cute.success,
  warning: cute.warn,
  danger: cute.danger,
  error: cute.danger,
  secondary: cute.line,
  selectedTint: withAlpha(cute.coral, 0.12),

  // Header backgrounds — the cute hero gradient stops
  headerTop: cute.coral,
  headerMid: cute.butter,
  headerBottom: cute.cream,

  // Overlay
  overlay: 'rgba(61,44,62,0.45)',
  overlayLight: 'rgba(61,44,62,0.22)',

  // Shadows
  shadow: '#E0A6A0',
} as const;

export const pastelSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const pastelRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 999,
} as const;

export const pastelTypography = {
  heading: {
    fontSize: 26,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    color: pastelColors.textPrimary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    color: pastelColors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: pastelColors.textPrimary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: pastelColors.textSecondary,
  },
  small: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: pastelColors.textSecondary,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: pastelColors.textTertiary,
  },
} as const;

export const pastelShadow = {
  sm: {
    shadowColor: '#E0A6A0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#E0A6A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#E0A6A0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// Meal type colors — matching Figma tint cards
// Meal accents drawn from the cute palette so the Food Log reads as the same
// brand as Home. (`icon` is unused — the screens render <MealCharacter/> art.)
export const mealColors = {
  breakfast: { color: '#E0A800', bg: withAlpha(cute.carbs, 0.16) },
  lunch:     { color: cute.mintDeep, bg: withAlpha(cute.mint, 0.16) },
  dinner:    { color: cute.grape, bg: withAlpha(cute.lavender, 0.18) },
  snack:     { color: cute.fat, bg: withAlpha(cute.fat, 0.16) },
} as const;
