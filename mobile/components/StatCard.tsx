import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StatCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  unit?: string;
  accent?: string;
}

export function StatCard({ icon, label, value, unit, accent }: StatCardProps) {
  const theme = useTheme();
  const color = accent ?? theme.colors.primary;
  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <Text variant="labelSmall" style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.valueRow}>
          <Text variant="titleLarge" style={[styles.value, { color: theme.colors.onSurface }]}>
            {value}
          </Text>
          {unit ? (
            <Text variant="labelSmall" style={styles.unit}>
              {unit}
            </Text>
          ) : null}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, elevation: 1 },
  content: { paddingVertical: 12 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: { opacity: 0.7 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  value: { fontWeight: '700' },
  unit: { marginLeft: 4, opacity: 0.7 },
});
