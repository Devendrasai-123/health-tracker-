import { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from 'react-native-paper';
import { brandColors, radii } from '@/constants/theme';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  onPress?: () => void;
}

/** Soft frosted card — Soft Glass Bento surface. */
export function GlassCard({
  children,
  style,
  contentStyle,
  intensity = 42,
}: GlassCardProps) {
  const theme = useTheme();
  const isDark = theme.dark;
  const tint = isDark ? 'dark' : 'light';
  const fallbackBg = isDark ? brandColors.glassDark : brandColors.glassLight;

  return (
    <View
      style={[
        styles.wrap,
        {
          borderColor: isDark ? 'rgba(204,197,185,0.22)' : brandColors.glassBorder,
          backgroundColor: Platform.OS === 'android' ? fallbackBg : 'transparent',
        },
        style,
      ]}>
      {Platform.OS !== 'android' ? (
        <BlurView
          intensity={intensity}
          tint={tint}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <BlurView
          intensity={intensity}
          tint={tint}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    shadowColor: '#111214',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 1,
  },
  content: {
    padding: 18,
  },
});
