import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message?: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons
        name={icon}
        size={44}
        color={theme.colors.onSurfaceVariant}
        style={styles.icon}
      />
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
        {title}
      </Text>
      {message ? (
        <Text variant="bodySmall" style={[styles.msg, { color: theme.colors.onSurfaceVariant }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  icon: { marginBottom: 12, opacity: 0.7 },
  msg: { textAlign: 'center', marginTop: 4, opacity: 0.8 },
});
