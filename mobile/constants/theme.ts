import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

/** Official lif.os brand palette — Soft Glass Bento */
export const palette = {
  orchidWhite: '#FFFCF2',
  chromeWhite: '#CCC5B9',
  masala: '#403D39',
  warmBlack: '#252422',
  vermillion: '#EB5E28',
} as const;

export const brandColors = {
  primary: palette.vermillion,
  onPrimary: '#FFFFFF',
  secondary: palette.masala,
  tertiary: palette.chromeWhite,
  background: palette.orchidWhite,
  surface: '#FFFFFF',
  surfaceVariant: '#F3EFE6',
  outline: palette.chromeWhite,
  error: '#C62828',
  warning: palette.vermillion,
  success: '#3D7A5A',
  glassLight: 'rgba(255, 252, 242, 0.72)',
  glassDark: 'rgba(64, 61, 57, 0.55)',
  glassBorder: 'rgba(204, 197, 185, 0.55)',
};

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 28,
  pill: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: brandColors.primary,
    onPrimary: brandColors.onPrimary,
    primaryContainer: '#FFD8C8',
    onPrimaryContainer: palette.warmBlack,
    secondary: brandColors.secondary,
    onSecondary: '#FFFFFF',
    secondaryContainer: brandColors.surfaceVariant,
    onSecondaryContainer: palette.warmBlack,
    tertiary: palette.masala,
    background: brandColors.background,
    onBackground: palette.warmBlack,
    surface: brandColors.surface,
    onSurface: palette.warmBlack,
    surfaceVariant: brandColors.surfaceVariant,
    onSurfaceVariant: palette.masala,
    outline: brandColors.outline,
    outlineVariant: '#E6E0D6',
    error: brandColors.error,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: brandColors.surface,
      level2: brandColors.surfaceVariant,
      level3: '#EFEAE0',
      level4: '#EBE6DC',
      level5: '#E7E2D8',
    },
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 3,
  colors: {
    ...MD3DarkTheme.colors,
    primary: palette.vermillion,
    onPrimary: '#FFFFFF',
    primaryContainer: '#5A2A16',
    onPrimaryContainer: '#FFD8C8',
    secondary: palette.chromeWhite,
    onSecondary: palette.warmBlack,
    secondaryContainer: palette.masala,
    onSecondaryContainer: palette.orchidWhite,
    tertiary: palette.chromeWhite,
    background: palette.warmBlack,
    onBackground: palette.orchidWhite,
    surface: '#2E2C29',
    onSurface: palette.orchidWhite,
    surfaceVariant: palette.masala,
    onSurfaceVariant: palette.chromeWhite,
    outline: '#6A655E',
    outlineVariant: '#4A4641',
    error: '#FF8A80',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: 'transparent',
      level1: '#2E2C29',
      level2: '#353330',
      level3: '#3C3A36',
      level4: '#403E3A',
      level5: '#454340',
    },
  },
};

export function getTheme(mode: 'light' | 'dark'): MD3Theme {
  return mode === 'dark' ? darkTheme : lightTheme;
}
