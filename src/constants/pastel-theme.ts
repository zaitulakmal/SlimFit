// Figma: "Modernize Weight Loss Tracker UI"
// Palette 1 (Dashboard): Ruby #C41E3A · Papyrus #E8DCC4 · Citron #F0C808

export const pastelColors = {
  // Primary — Ruby red
  primary: '#C41E3A',
  primaryLight: '#E53558',
  primaryDark: '#A01830',

  // Accent — Sunny Citron yellow
  amber: '#F0C808',
  amberDark: '#D4AF07',
  amberLight: '#FFF9E6',

  // Greens (vegetables/success)
  green: '#10B981',
  greenLight: '#D1FAE5',
  greenDark: '#059669',

  // Supporting palette
  coral: '#C41E3A',
  pink: '#FFEDD5',
  blue: '#BFDBFE',
  purple: '#DDD6FE',
  orange: '#FB923C',
  yellow: '#F0C808',
  skyBlue: '#93C5FD',

  // Neutrals — warm cream
  white: '#FFFFFF',
  background: '#F5EFE7',     // warm cream page bg
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#EDE8DF',
  borderLight: '#F5F0E8',

  // Text
  textPrimary: '#3D2B1F',    // warm dark brown
  textSecondary: '#7A6A5A',
  textTertiary: '#A89880',
  textOnAccent: '#FFFFFF',
  textOnDark: '#FFFFFF',
  textOnAmber: '#3D2B1F',    // dark text on yellow buttons
  textPlaceholder: '#B0A090',
  text: '#3D2B1F',

  // Card tints matching Figma stat cards
  cardMint: '#D1FAE5',       // green (meals)
  cardYellow: '#FFF9E6',     // yellow (calories)
  cardPink: '#FFE4E6',       // pink/red (weight)
  cardBlue: '#DBEAFE',       // blue (water)
  cardPurple: '#EDE9FE',     // purple
  cardOrange: '#FFEDD5',     // orange (burned)
  cardCoral: '#FFE4E6',
  cardCream: '#F5EFE7',

  // Status
  success: '#10B981',
  warning: '#F0C808',
  danger: '#C41E3A',
  error: '#C41E3A',
  secondary: '#E8DCC4',
  selectedTint: '#FFF9E6',

  // Header backgrounds per screen (matching Figma)
  headerTop: '#E8DCC4',      // Dashboard: papyrus beige
  headerMid: '#F5EFE7',      // warm cream mid
  headerBottom: '#FFF9E6',   // light citron bottom

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.25)',

  // Shadows
  shadow: '#C41E3A',
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
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// Meal type colors — matching Figma tint cards
export const mealColors = {
  breakfast: { color: '#F59E0B', bg: '#FFF9E6', icon: '🌅' },
  lunch:     { color: '#10B981', bg: '#D1FAE5', icon: '☀️' },
  dinner:    { color: '#8B5CF6', bg: '#EDE9FE', icon: '🌙' },
  snack:     { color: '#FB923C', bg: '#FFEDD5', icon: '☕' },
} as const;
