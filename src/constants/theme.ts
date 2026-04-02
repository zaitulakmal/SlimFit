export const colors = {
  white: '#FFFFFF',
  background: '#F6F7FB',
  card: '#FFFFFF',
  primary: '#4CAF50',
  vividGreen: '#00C853',
  coral: '#FF6B6B',
  amber: '#FFB300',
  skyBlue: '#2196F3',
  purple: '#9C27B0',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textOnAccent: '#FFFFFF',
  border: '#E9ECF0',
  borderLight: '#F3F4F6',
  selectedTint: '#E8F5E9',
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
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

// Shadow presets (iOS + Android)
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export const typography = {
  display: {
    fontSize: 30,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 15,
    letterSpacing: 0.2,
  },
} as const;

// ---------------------------------------------------------------------------
// Legacy compat
// ---------------------------------------------------------------------------
export const Colors = {
  light: {
    text: colors.textPrimary,
    background: colors.white,
    backgroundElement: colors.background,
    backgroundSelected: '#E0E1E6',
    textSecondary: colors.textSecondary,
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  sans: 'system-ui',
  serif: 'ui-serif',
  rounded: 'ui-rounded',
  mono: 'ui-monospace',
} as const;

export const Spacing = {
  half: 2,
  one: spacing.xs,
  two: spacing.sm,
  three: spacing.md,
  four: spacing.lg,
  five: spacing.xl,
  six: spacing['3xl'],
} as const;

export const MaxContentWidth = 800;
export const BottomTabInset = 50;
