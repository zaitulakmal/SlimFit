// Figma-Inspired Modern Weight Loss Tracker Theme
// Clean, minimal design with warm food colors

export const colors = {
  // Primary Colors
  primary: '#A6171C',          // Deep Red (tomato/apple)
  primaryLight: '#C62828',
  primaryDark: '#8B1215',
  
  // Secondary Colors
  secondary: '#D6D0C5',        // Beige
  secondaryLight: '#E8E4DE',
  
  // Accent
  accent: '#F1C045',           // Golden Yellow
  accentLight: '#FFF8E1',
  accentDark: '#D4A820',

  // Background & Surface
  background: '#FDF8F0',       // Warm Off-white
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#4A4A4A',            // Dark Gray
  textSecondary: '#7A7A7A',
  textTertiary: '#A0A0A0',
  textInverse: '#FFFFFF',
  textPlaceholder: '#B0B0B0',

  // Semantic
  success: '#4CAF50',         // Green
  successLight: '#E8F5E9',
  warning: '#FF9800',         // Orange
  warningLight: '#FFF3E0',
  danger: '#A6171C',          // Red
  dangerLight: '#FFEBEE',

  // Borders
  border: '#E8E4DE',
  borderLight: '#F2EEE7',

  // Cards
  cardBackground: '#FFFFFF',
  cardShadow: 'rgba(0,0,0,0.08)',

  // Progress/Stats
  progressBg: '#F2EEE7',
  progressFill: '#A6171C',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',

  // White
  white: '#FFFFFF',
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
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

// Figma-style shadows
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
} as const;

// Meal type colors for food log
export const mealColors = {
  breakfast: { color: '#F1C045', bg: '#FFF8E1', icon: '🌅' },
  lunch:     { color: '#4CAF50', bg: '#E8F5E9', icon: '☀️' },
  dinner:    { color: '#A6171C', bg: '#FFEBEE', icon: '🌙' },
  snack:     { color: '#FF9800', bg: '#FFF3E0', icon: '☕' },
} as const;
