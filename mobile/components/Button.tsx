import { Button as PaperButton } from 'react-native-paper';

interface ButtonProps {
  children: string;
  onPress: () => void;
  mode?: 'contained' | 'outlined' | 'text' | 'contained-tonal';
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  icon?: string;
  style?: object;
}

/** Shared primary action button. */
export function Button({
  children,
  onPress,
  mode = 'contained',
  loading,
  disabled,
  compact,
  icon,
  style,
}: ButtonProps) {
  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled || loading}
      compact={compact}
      icon={icon}
      style={[{ borderRadius: 12 }, style]}>
      {children}
    </PaperButton>
  );
}
