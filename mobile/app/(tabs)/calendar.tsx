import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { Screen } from '@/components/Screen';
import { MonthCalendar } from '@/components/MonthCalendar';
import { GlassCard } from '@/components/GlassCard';
import { useDataStore } from '@/stores/data';
import { todayStr } from '@/constants/metrics';
import { palette } from '@/constants/theme';

export default function CalendarScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [date, setDate] = useState(todayStr());
  const loadDashboard = useDataStore((s) => s.loadDashboard);
  const metrics = useDataStore((s) => s.metrics);
  const workouts = useDataStore((s) => s.workouts);
  const bloodTests = useDataStore((s) => s.bloodTests);
  const foodByDate = useDataStore((s) => s.foodByDate);
  const loadFood = useDataStore((s) => s.loadFood);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
      loadFood(date);
    }, [loadDashboard, loadFood, date]),
  );

  const marked = useMemo(() => {
    const set = new Set<string>();
    metrics.forEach((m) => set.add(m.date));
    workouts.forEach((w) => set.add(w.date));
    bloodTests.forEach((t) => set.add(t.date));
    Object.keys(foodByDate).forEach((d) => {
      if ((foodByDate[d]?.length ?? 0) > 0) set.add(d);
    });
    return [...set];
  }, [metrics, workouts, bloodTests, foodByDate]);

  const dayWorkouts = workouts.filter((w) => w.date === date);
  const dayTests = bloodTests.filter((t) => t.date === date);
  const dayMeals = foodByDate[date] ?? [];
  const dayMetric = metrics.find((m) => m.date === date);
  const ink = theme.dark ? palette.orchidWhite : palette.warmBlack;
  const muted = theme.dark ? palette.chromeWhite : palette.masala;

  return (
    <Screen title="Calendar" subtitle="Your month at a glance">
      <MonthCalendar
        value={date}
        onChange={(d) => {
          setDate(d);
          loadFood(d);
        }}
        markedDates={marked}
        maximumDate={new Date()}
      />

      <GlassCard style={styles.dayCard} contentStyle={styles.dayContent}>
        <Text style={[styles.dayTitle, { color: ink }]}>On this day</Text>
        <Text style={{ color: muted, marginTop: 6 }}>
          {dayMetric
            ? `Steps ${dayMetric.steps ?? '—'} · Sleep ${dayMetric.sleepHours ?? '—'}h · HR ${dayMetric.heartRate ?? '—'}`
            : 'No metrics logged'}
        </Text>
        <Text style={{ color: muted, marginTop: 4 }}>
          {dayMeals.length} meals · {dayWorkouts.length} workouts · {dayTests.length} labs
        </Text>
        <Text
          style={styles.link}
          onPress={() => router.push('/(tabs)/health/fuel' as Href)}>
          Open Food & Hydration →
        </Text>
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dayCard: { marginTop: 14 },
  dayContent: { paddingVertical: 16 },
  dayTitle: { fontSize: 16, fontWeight: '800' },
  link: { marginTop: 12, color: palette.vermillion, fontWeight: '700' },
});
