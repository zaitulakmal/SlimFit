/**
 * SlimTrack Design System Constants
 * Matches UI-SPEC Phase 1 specification exactly.
 * Light theme only — dark mode is out of scope for v1.
 */

export const colors = {
  // 60% dominant — screen backgrounds
  white: '#FFFFFF',
  // 30% secondary — card backgrounds, tab bar surface, input fills
  background: '#F5F7FA',
  // 10% accents
  primary: '#4CAF50',       // CTA buttons, active tab, selected states
  vividGreen: '#00C853',    // Calorie ring filled arc (on-track)
  coral: '#FF6B6B',         // Destructive actions only (delete, confirmation)
  amber: '#FFB300',         // Over-budget state (positive framing — never red)
  skyBlue: '#2196F3',       // Water ring and water tab accent
  purple: '#9C27B0',        // Onboarding progress bar fill
  // Text
  textPrimary: '#1A1A2E',   // Body text, headings on white
  textSecondary: '#6B7280', // Sublabels, helper text, placeholders
  textOnAccent: '#FFFFFF',  // Text on filled accent backgrounds
  // Structure
  border: '#E5E7EB',        // Card borders, dividers, input borders
  selectedTint: '#E8F5E9',  // Activity card selected background tint
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

export const typography = {
  display: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 17,
  },
} as const;

// ---------------------------------------------------------------------------
// Legacy compat exports — used by template components only
// These components will be replaced in Phase 2; do not use in new code.
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

// Font config (system fonts — Nunito loaded separately via useFonts)
export const Fonts = {
  sans: 'system-ui',
  serif: 'ui-serif',
  rounded: 'ui-rounded',
  mono: 'ui-monospace',
} as const;

// Legacy numeric spacing map (maps to our spacing tokens)
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
