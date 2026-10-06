import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '@/components/GlassCard';
import { palette, radii } from '@/constants/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface MetricsCardProps {
  heartRate?: number | null;
  steps?: number | null;
  sleepHours?: number | null;
  stress?: number | null;
}

function MetricCell({
  icon,
  label,
  value,
  unit,
}: {
  icon: IconName;
  label: string;
  value: string;
  unit?: string;
}) {
  const theme = useTheme();
  const ink = theme.dark ? palette.orchidWhite : palette.warmBlack;
  const muted = theme.dark ? palette.chromeWhite : palette.masala;

  return (
    <View style={styles.cell}>
      <View style={[styles.icon, { backgroundColor: palette.vermillion + '18' }]}>
        <MaterialCommunityIcons name={icon} size={16} color={palette.vermillion} />
      </View>
      <Text style={[styles.label, { color: muted }]}>{label}</Text>
      <Text style={[styles.value, { color: ink }]}>
        {value}
        {unit ? <Text style={[styles.unit, { color: muted }]}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

export function MetricsCard({ heartRate, steps, sleepHours, stress }: MetricsCardProps) {
  return (
    <GlassCard style={styles.card} contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>BODY SIGNALS</Text>
        <MaterialCommunityIcons name="arrow-top-right" size={18} color={palette.vermillion} />
      </View>
      <View style={styles.grid}>
        <MetricCell
          icon="heart-outline"
          label="Heart"
          value={heartRate != null ? String(heartRate) : '—'}
          unit="bpm"
        />
        <MetricCell
          icon="shoe-print"
          label="Steps"
          value={steps != null ? String(steps) : '—'}
        />
        <MetricCell
          icon="moon-waning-crescent"
          label="Sleep"
          value={sleepHours != null ? String(sleepHours) : '—'}
          unit="h"
        />
        <MetricCell
          icon="brain"
          label="Stress"
          value={stress != null ? String(stress) : '—'}
          unit="/10"
        />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 12 },
  content: { paddingVertical: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  eyebrow: { color: palette.masala, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 18 },
  cell: { width: '50%', alignItems: 'flex-start', paddingLeft: 4 },
  icon: {
    width: 30,
    height: 30,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  label: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  value: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  unit: { fontSize: 11, fontWeight: '500' },
});
