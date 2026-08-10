import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '@/components/GlassCard';
import { palette, radii } from '@/constants/theme';

interface StatCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  unit?: string;
  accent?: string;
}

export function StatCard({ icon, label, value, unit, accent }: StatCardProps) {
  const theme = useTheme();
  const color = accent ?? palette.vermillion;
  const ink = theme.dark ? palette.orchidWhite : palette.warmBlack;
  const muted = theme.dark ? palette.chromeWhite : palette.masala;

  return (
    <GlassCard style={styles.card} contentStyle={styles.content}>
      <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.label, { color: muted }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: ink }]}>{value}</Text>
        {unit ? <Text style={[styles.unit, { color: muted }]}>{unit}</Text> : null}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  content: { paddingVertical: 14 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: { fontSize: 12, fontWeight: '600' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  unit: { marginLeft: 4, fontSize: 12, fontWeight: '500' },
});
