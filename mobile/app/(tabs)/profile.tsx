import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, ProgressBar, Text, useTheme } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { getAchievements, getUserRank, type Achievement, type UserRank } from '@/services/gamification-service';
import { LOCAL_USER_ID, RANKS } from '@/constants/gamification';
import { palette, spacing } from '@/constants/theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const [rank, setRank] = useState<UserRank | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const load = useCallback(async () => {
    const [nextRank, nextAchievements] = await Promise.all([
      getUserRank(LOCAL_USER_ID),
      getAchievements(LOCAL_USER_ID),
    ]);
    setRank(nextRank);
    setAchievements(nextAchievements);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!rank) {
    return <Screen title="Profile"><Text>Loading profile...</Text></Screen>;
  }

  const current = RANKS[rank.currentRank - 1] ?? RANKS[0];
  const next = RANKS[rank.currentRank];
  const progress = next
    ? Math.min(1, (rank.totalPoints - current.minPoints) / (next.minPoints - current.minPoints))
    : 1;

  return (
    <Screen title="Profile" subtitle="Your health journey at a glance">
      <Card style={[styles.rankCard, { backgroundColor: theme.colors.primary }]}>
        <Card.Content style={styles.center}>
          <Text style={styles.rankIcon}>{current.icon}</Text>
          <Text variant="headlineSmall" style={styles.onPrimary}>{current.name}</Text>
          <Text variant="titleMedium" style={styles.onPrimary}>{rank.totalPoints.toLocaleString()} points</Text>
          <ProgressBar progress={progress} color={palette.lime} style={styles.progress} />
          <Text style={styles.onPrimary}>
            {next ? `${next.minPoints - rank.totalPoints} points to ${next.name}` : 'Top rank reached'}
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.stats}>
        {[
          ['Weekly', rank.weeklyPoints.toLocaleString()],
          ['Current streak', `${rank.currentStreak} days`],
          ['Best streak', `${rank.bestStreak} days`],
        ].map(([label, value]) => (
          <Card key={label} style={styles.statCard}>
            <Card.Content>
              <Text variant="labelMedium">{label}</Text>
              <Text variant="titleLarge" style={{ color: theme.colors.primary }}>{value}</Text>
            </Card.Content>
          </Card>
        ))}
      </View>

      <Text variant="titleLarge" style={styles.sectionTitle}>
        Achievements ({achievements.filter((item) => item.isCompleted).length}/{achievements.length})
      </Text>
      {achievements.map((achievement) => (
        <Card key={achievement.id} style={[styles.achievement, !achievement.isCompleted && styles.incomplete]}>
          <Card.Content style={styles.achievementContent}>
            <Text style={styles.badge}>{achievement.badgeIcon}</Text>
            <View style={styles.flex}>
              <Text variant="titleMedium">{achievement.name}</Text>
              <Text variant="bodySmall">{achievement.description}</Text>
            </View>
            <Text style={{ color: theme.colors.primary }}>+{achievement.pointsReward}</Text>
          </Card.Content>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  rankCard: { marginBottom: spacing.md },
  center: { alignItems: 'center' },
  rankIcon: { fontSize: 56, marginBottom: spacing.sm },
  onPrimary: { color: '#fff' },
  progress: { alignSelf: 'stretch', height: 8, marginVertical: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1 },
  sectionTitle: { marginBottom: spacing.sm },
  achievement: { marginBottom: spacing.sm },
  incomplete: { opacity: 0.58 },
  achievementContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { fontSize: 30 },
  flex: { flex: 1 },
});
