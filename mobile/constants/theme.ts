import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

export const brandColors = {
  primary: '#0F9D7A',
  onPrimary: '#FFFFFF',
  secondary: '#2F6FED',
  tertiary: '#B54BD6',
  background: '#F5F7F8',
  surface: '#FFFFFF',
  surfaceVariant: '#E9EEF0',
  error: '#C62828',
  warning: '#EF6C00',
  success: '#2E7D32',
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brandColors.primary,
    onPrimary: brandColors.onPrimary,
    secondary: brandColors.secondary,
    background: brandColors.background,
    surface: brandColors.surface,
    surfaceVariant: brandColors.surfaceVariant,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4FD6B0',
    secondary: '#8AB4FF',
    tertiary: '#D590F5',
  },
};

export function getTheme(mode: 'light' | 'dark'): MD3Theme {
  return mode === 'dark' ? darkTheme : lightTheme;
}
