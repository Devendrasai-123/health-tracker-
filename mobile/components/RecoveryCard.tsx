import { StyleSheet, View } from 'react-native';
import { ProgressBar, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '@/components/GlassCard';
import { palette, radii } from '@/constants/theme';

interface RecoveryCardProps {
  score: number | null;
  note?: string | null;
}

function labelFor(score: number): string {
  if (score >= 80) return 'Ready to perform';
  if (score >= 60) return 'Good recovery';
  if (score >= 40) return 'Fair — take it easy';
  return 'Needs rest';
}

export function RecoveryCard({ score, note }: RecoveryCardProps) {
  const theme = useTheme();
  const ink = theme.dark ? palette.orchidWhite : palette.warmBlack;
  const muted = theme.dark ? palette.chromeWhite : palette.masala;
  const accent = score == null ? muted : score >= 80 ? palette.lime : score >= 60 ? palette.vermillion : palette.masala;

  return (
    <GlassCard
      style={{ backgroundColor: score != null && score >= 80 ? palette.warmBlack : undefined }}
      contentStyle={styles.content}>
      <View style={styles.topline}>
        <Text style={[styles.eyebrow, { color: score != null && score >= 80 ? palette.chromeWhite : muted }]}>
          DAILY READINESS
        </Text>
        <MaterialCommunityIcons name="dots-horizontal" size={22} color={score != null && score >= 80 ? palette.chromeWhite : muted} />
      </View>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
          <MaterialCommunityIcons name="heart-pulse" size={26} color={accent} />
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.label, { color: score != null && score >= 80 ? palette.chromeWhite : muted }]}>Recovery / Today</Text>
          <Text style={[styles.status, { color: accent }]}>
            {score != null ? labelFor(score) : 'Log metrics to unlock'}
          </Text>
        </View>
        <Text style={[styles.score, { color: score != null && score >= 80 ? palette.orchidWhite : ink }]}>{score != null ? score : '—'}</Text>
      </View>
      {score != null ? (
        <ProgressBar
          progress={score / 100}
          color={accent}
          style={styles.bar}
        />
      ) : null}
      {note ? (
        <Text style={[styles.note, { color: muted }]} numberOfLines={2}>
          {note}
        </Text>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 18 },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  status: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  score: { fontSize: 40, fontWeight: '800', letterSpacing: -1, marginLeft: 8 },
  bar: { height: 6, borderRadius: 3, marginTop: 14, backgroundColor: 'rgba(204,197,185,0.35)' },
  note: { marginTop: 10, fontSize: 13, lineHeight: 18 },
});
