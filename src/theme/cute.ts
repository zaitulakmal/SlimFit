/**
 * Slimora "cute" design system.
 *
 * A single source of truth for the playful, modern, healthy branding.
 * Soft pastel palette with a coral→mint brand signature, friendly radii,
 * chunky but gentle shadows, and a responsive font scale.
 *
 * Older theme files (theme.ts / theme-new.ts / pastel-theme.ts) still exist
 * for the *-hidden screens; this file is the target design language that the
 * flagship screens (Home / Food Log / Profile) now adopt.
 */

// ── Brand palette ───────────────────────────────────────────────────────────
export const cute = {
  // Brand signature
  coral: '#FF8FA3', // primary cute pink-coral
  coralDeep: '#FF6B8A',
  pink: '#FF6FB5', // vivid cute pink (gradient mid)
  periwinkle: '#A9B8F8', // soft blue-lavender (gradient mid)
  mint: '#5BD6B4', // secondary healthy mint
  mintDeep: '#34C6A0',
  peach: '#FFC9A8',
  butter: '#FFE09A', // sunny accent (kept for chips only)
  lavender: '#C3B4F0',
  blush: '#FBB8DB', // saturated card pink from the reference
  action: '#161616', // primary CTA — the reference's near-black
  sky: '#8FD3F4',
  grape: '#9B8BE0',

  // Functional
  white: '#FFFFFF',
  cream: '#FAF4E4', // page background — warm cream from the reference design
  card: '#FFFFFF',
  ink: '#3D2C3E', // warm near-black text
  inkSoft: '#6E5C6E', // muted text
  inkFaint: '#A99BA8', // very faint text
  line: '#F2E7E2', // hairline borders

  // Macro / track tints
  protein: '#FF8FA3',
  carbs: '#FFC53D',
  fat: '#FFA45B',
  water: '#5BC8F4',

  // State
  success: '#34C6A0',
  warn: '#FFB454',
  danger: '#FF6B6B',

  // Glassy overlays
  white70: 'rgba(255,255,255,0.70)',
  white50: 'rgba(255,255,255,0.50)',
  white30: 'rgba(255,255,255,0.30)',
  ink10: 'rgba(61,44,62,0.10)',
  ink06: 'rgba(61,44,62,0.06)',
} as const;

// Soft gradient stops used by headers / hero surfaces.
export const cuteGrads = {
  brand: ['#FFB1A8', '#FF8FA3', '#FF8FA3'] as [string, string, string],
  hero: ['#FFD9C2', '#FFB1A8', '#FF8FA3'] as [string, string, string],
  mint: ['#9DECCF', '#5BD6B4'] as [string, string],
  peach: ['#FFE3CC', '#FFC9A8'] as [string, string],
  butter: ['#FFF0C2', '#FFE09A'] as [string, string],
  lavender: ['#DED4FB', '#C3B4F0'] as [string, string],
  sky: ['#C7E9FB', '#8FD3F4'] as [string, string],
} as const;

// ── Spacing ──────────────────────────────────────────────────────────────────
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ── Radius ───────────────────────────────────────────────────────────────────
export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
  pill: 999,
} as const;

// ── Soft shadow set (cute = big, soft, low-opacity) ───────────────────────────
export const cuteShadow = {
  sm: {
    shadowColor: '#E0A6A0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#E0A6A0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  lg: {
    shadowColor: '#C98B86',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 7,
  },
} as const;

// ── Typography scale (responsive but simple) ─────────────────────────────────
export function font(dim: number): number {
  // base design width 390; scale gently so big phones don't blow up.
  return Math.round(dim);
}

export const type = {
  display: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6 } as const,
  h1: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 } as const,
  h2: { fontSize: 19, fontWeight: '700', letterSpacing: -0.3 } as const,
  title: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 } as const,
  body: { fontSize: 14, fontWeight: '500' } as const,
  caption: { fontSize: 12, fontWeight: '600' } as const,
};

// Card fills, matching the Slimora assistant card: a saturated pastel (not a
// pale wash), a 1px border one step deeper in the same hue, radius.xl corners
// and no shadow. `blush` is literally the assistant card's pink, so a stack of
// these reads as the same family. Baked hexes rather than withAlpha() — alpha
// over the warm cream page shifts each hue differently and the set ends up
// looking unevenly weighted.
export const cardTints = {
  sky: '#A8D8F5',
  butter: '#FBE08A',
  mint: '#A5E8CE',
  lavender: '#C9B8F2',
  blush: '#FBB8DB',
  peach: '#FCC9A6',
} as const;

/** One step deeper than each fill — used at ~50% alpha for the card border. */
export const cardBorder = {
  sky: '#6BB8E0',
  butter: '#E0BC4A',
  mint: '#62C7A3',
  lavender: '#A38EE0',
  blush: '#E894C4',
  peach: '#E8A170',
} as const;

export const cardTintOrder = ['sky', 'butter', 'mint', 'lavender', 'blush', 'peach'] as const;

/**
 * Shared card shape. Spread this next to a backgroundColor from cardTints and
 * a borderColor from cardBorder to get the assistant card's look.
 */
export const cardStyle = {
  borderRadius: 28, // radius.xl
  borderWidth: 1,
} as const;

// Tiny helper to tint a hex with alpha (for soft tracks / glows).
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

// A playful multi-stop gradient for hero headers / rings — coral → pink →
// periwinkle → sky. Inspired by the cute health-app look (pink/purple/blue,
// no yellow). Use the stops in an SVG LinearGradient.
export const cuteHeaderStops: { offset: string; color: string }[] = [
  { offset: '0%', color: cute.coral },
  { offset: '35%', color: cute.pink },
  { offset: '68%', color: cute.periwinkle },
  { offset: '100%', color: cute.sky },
];

// Which brand accent to use where (rotation keeps it lively, not pink-only).
export const accents = {
  food: cute.coral,
  water: cute.sky,
  weight: cute.lavender,
  workout: cute.mint,
  fasting: cute.grape,
  recipe: cute.butter,
  profile: cute.coral,
  progress: cute.mint,
} as const;

