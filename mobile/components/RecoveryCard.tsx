import { StyleSheet, View } from 'react-native';
import { Card, ProgressBar, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RecoveryCardProps {
  score: number | null;
  note?: string | null;
}

function colorFor(score: number): string {
  if (score >= 80) return '#2E7D32';
  if (score >= 60) return '#2F6FED';
  if (score >= 40) return '#EF6C00';
  return '#C62828';
}

function labelFor(score: number): string {
  if (score >= 80) return 'Ready to perform';
  if (score >= 60) return 'Good recovery';
  if (score >= 40) return 'Fair, take it easy';
  return 'Needs rest';
}

export function RecoveryCard({ score, note }: RecoveryCardProps) {
  const theme = useTheme();
  const color = score != null ? colorFor(score) : theme.colors.onSurfaceVariant;
  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
            <MaterialCommunityIcons name="heart-pulse" size={26} color={color} />
          </View>
          <View style={styles.textWrap}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              Recovery Score
            </Text>
            {score != null ? (
              <Text variant="bodySmall" style={{ color: color, fontWeight: '700' }}>
                {labelFor(score)}
              </Text>
            ) : (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Log daily metrics to see your score
              </Text>
            )}
          </View>
          {score != null ? (
            <Text variant="headlineMedium" style={[styles.score, { color }]}>
              {score}
            </Text>
          ) : null}
        </View>
        {score != null ? (
          <ProgressBar
            progress={score / 100}
            color={color}
            style={styles.bar}
            theme={{ colors: { primary: color } }}
          />
        ) : null}
        {note ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 10 }}>
            {note}
          </Text>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: { flex: 1 },
  score: { fontWeight: '800', marginLeft: 12 },
  bar: { height: 8, borderRadius: 4, marginTop: 14 },
});
