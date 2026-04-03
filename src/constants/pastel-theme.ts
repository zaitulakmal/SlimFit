// Pastel theme for SlimTrack - fresh, healthy, colorful design

export const pastelColors = {
  // Primary - soft mint green
  primary: '#56AB91',
  primaryLight: '#A8E6CF',
  primaryDark: '#379D76',
  
  // Pastel accents
  amber: '#FFD93D',
  coral: '#FF8A80',
  pink: '#FFB5E8',
  blue: '#7EC8E3',
  purple: '#B5A8D8',
  orange: '#FFB74D',
  yellow: '#FFF59D',
  skyBlue: '#7EC8E3',
  
  // Neutrals
  white: '#FFFFFF',
  background: '#F5FBF8',  // very light mint
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#D4EDE3',
  borderLight: '#E8F4F0',
  
  // Text
  textPrimary: '#2D4A3E',
  textSecondary: '#6B8E7A',
  textTertiary: '#A5C4B4',
  textOnAccent: '#FFFFFF',
  textPlaceholder: '#A5C4B4',
  text: '#2D4A3E',
  
  // Card backgrounds - pastel
  cardMint: '#E8F8F0',
  cardYellow: '#FFF9E6',
  cardPink: '#FFEAF0',
  cardBlue: '#E8F4F8',
  cardPurple: '#F0EBF8',
  cardOrange: '#FFF2E6',
  cardCoral: '#FFE8E8',
  
  // Status
  success: '#81C784',
  warning: '#FFD93D',
  danger: '#FF8A80',
  error: '#FF8A80',
  secondary: '#A8E6CF',
  selectedTint: '#E8F8F0',
  
  // Header gradient
  headerTop: '#A8E6CF',
  headerMid: '#88D8B0',
  headerBottom: '#56AB91',
  
  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
  
  // Shadows
  shadow: '#000000',
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
  full: 999,
} as const;

export const pastelTypography = {
  heading: {
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -0.4,
    color: pastelColors.textPrimary,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    color: pastelColors.textPrimary,
  },
  body: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: pastelColors.textPrimary,
  },
  label: {
    fontSize: 14,
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
    shadowColor: pastelColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: pastelColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: pastelColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// Meal type colors
export const mealColors = {
  breakfast: { color: '#FFB74D', bg: '#FFF2E6', icon: '🌅' },
  lunch:     { color: '#56AB91', bg: '#E8F8F0', icon: '☀️' },
  dinner:    { color: '#B5A8D8', bg: '#F0EBF8', icon: '🌙' },
  snack:     { color: '#FF8A80', bg: '#FFEAF0', icon: '☕' },
} as const;
