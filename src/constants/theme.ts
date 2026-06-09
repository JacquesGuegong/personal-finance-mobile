import type { TextStyle, ViewStyle } from 'react-native';

// ─── Design system ───────────────────────────────────────────────────────────
// Single source of truth for color, type, spacing, radius, and elevation.
// A refined fintech palette: navy as the trust anchor, sage/coral for
// positive/negative money, warm cream/white surfaces.

export const colors = {
  navy: '#0F2B4C', // primary text, trust anchor
  slate: '#2D4A6B', // secondary actions
  sage: '#4A9E8A', // income, positive, success
  coral: '#E8634A', // expenses, warnings, exceeded
  cream: '#F7F5F1', // background
  white: '#FFFFFF', // card surfaces
  mist: '#EBE8E3', // dividers, borders
  inkLight: '#7A8A9A', // secondary text
} as const;

export type ColorToken = keyof typeof colors;

type TypographyToken =
  | 'displayXL'
  | 'displayLG'
  | 'displayMD'
  | 'titleLG'
  | 'titleMD'
  | 'body'
  | 'caption'
  | 'number';

// Annotated as Record<_, TextStyle> so the literal fontWeight/fontVariant values
// are contextually typed (and validated) without `as const` widening them.
export const typography: Record<TypographyToken, TextStyle> = {
  displayXL: { fontSize: 40, fontWeight: '700', letterSpacing: -1.5 },
  displayLG: { fontSize: 32, fontWeight: '700', letterSpacing: -1 },
  displayMD: { fontSize: 24, fontWeight: '600', letterSpacing: -0.5 },
  titleLG: { fontSize: 20, fontWeight: '600' },
  titleMD: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' },
  number: { fontVariant: ['tabular-nums'] }, // align digits in columns
};

// 4px base scale.
export const spacing = [4, 8, 12, 16, 20, 24, 32, 40, 48] as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 24,
} as const;

export const shadows: Record<'card' | 'float', ViewStyle> = {
  card: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  float: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const theme = { colors, typography, spacing, radius, shadows } as const;
