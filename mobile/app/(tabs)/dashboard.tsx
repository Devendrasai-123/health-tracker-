import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Modal, Portal, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { Screen } from '@/components/Screen';
import { StatCard } from '@/components/StatCard';
import { RecoveryCard } from '@/components/RecoveryCard';
import { AlertBanner } from '@/components/AlertBanner';
import { TrendChart } from '@/components/TrendChart';
import { NumberField } from '@/components/NumberField';
import { DateField } from '@/components/DateField';
import { computeAlerts, shortDate, todayStr } from '@/constants/metrics';
import { useDataStore } from '@/stores/data';
import { upsertDailyMetrics } from '@/services/metrics-service';
import { calculateRecoveryScore, generateInsights } from '@/services/ai-engine';
import { useSettingsStore } from '@/stores/settings';
import { syncLatest } from '@/services/sync-manager';
import type { DailyMetrics, DailyMetricsInput } from '@/types';

type ChartKey = 'recovery' | 'weight' | 'steps';

export default function DashboardScreen() {
  const theme = useTheme();
  const loadDashboard = useDataStore((s) => s.loadDashboard);
  const metrics = useDataStore((s) => s.metrics);
  const bloodTests = useDataStore((s) => s.bloodTests);
  const workouts = useDataStore((s) => s.workouts);
  const foodByDate = useDataStore((s) => s.foodByDate);
  const caloriesByDate = useDataStore((s) => s.caloriesByDate);

  const [showMetrics, setShowMetrics] = useState(false);
  const [chart, setChart] = useState<ChartKey>('recovery');
  const syncEnabled = useSettingsStore((s) => s.syncEnabled);

  const syncIfEnabled = useCallback(async () => {
    if (syncEnabled) {
      try {
        await syncLatest();
      } catch (e) {
        console.error('Sync failed:', e);
      }
    }
  }, [syncEnabled]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const today = todayStr();
  const latest: DailyMetrics | null = metrics.length ? metrics[metrics.length - 1] : null;
  const todayCalories = caloriesByDate[today] ?? 0;
  const todayMeals = foodByDate[today] ?? [];
  const alerts = computeAlerts(
    bloodTests.map((t) => ({ testType: t.testType, value: t.value, unit: t.unit })),
  );

  const insights = generateInsights({ metrics, workouts });

  const chartData = (key: ChartKey) => {
    return metrics
      .map((m) => ({
        value: key === 'recovery' ? m.recoveryScore : key === 'weight' ? m.weight : m.steps,
        label: shortDate(m.date),
      }))
      .filter((p): p is { value: number; label: string } => p.value != null);
  };

  return (
    <Screen
      title="Today"
      subtitle={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      action={
        <Button mode="contained-tonal" compact onPress={() => setShowMetrics(true)}>
          Log metrics
        </Button>
      }>
      <RecoveryCard
        score={latest?.recoveryScore ?? null}
        note={latest?.notes ?? null}
      />

      <View style={styles.statRow}>
        <StatCard icon="shoe-print" label="Steps" value={latest?.steps != null ? String(latest.steps) : '—'} />
        <StatCard icon="moon-waning-crescent" label="Sleep" value={latest?.sleepHours != null ? String(latest.sleepHours) : '—'} unit="h" />
      </View>
      <View style={styles.statRow}>
        <StatCard icon="heart" label="Resting HR" value={latest?.heartRate != null ? String(latest.heartRate) : '—'} unit="bpm" />
        <StatCard icon="scale-bathroom" label="Weight" value={latest?.weight != null ? String(latest.weight) : '—'} unit="kg" />
      </View>

      <Card style={[styles.foodCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.foodRow}>
            <View>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Calories today
              </Text>
              <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                {todayCalories} <Text variant="bodySmall">kcal</Text>
              </Text>
            </View>
            <View>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Meals
              </Text>
              <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                {todayMeals.length}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            Trends
          </Text>
          <SegmentedButtons
            value={chart}
            onValueChange={(v) => setChart(v as ChartKey)}
            density="small"
            buttons={[
              { value: 'recovery', label: 'Recovery', icon: 'heart-pulse' },
              { value: 'weight', label: 'Weight', icon: 'scale-bathroom' },
              { value: 'steps', label: 'Steps', icon: 'shoe-print' },
            ]}
          />
        </View>
        <TrendChart
          data={chartData(chart)}
          color={chart === 'recovery' ? '#2F6FED' : chart === 'weight' ? '#B54BD6' : theme.colors.primary}
          yLabelSuffix={chart === 'recovery' ? '' : chart === 'weight' ? ' kg' : ''}
          area
        />
      </View>

      <View style={styles.alerts}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          Alerts
        </Text>
        <AlertBanner alerts={alerts} />
      </View>

      {insights.length > 0 ? (
        <View style={styles.alerts}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            Insights
          </Text>
          <View style={styles.insightList}>
            {insights.map((insight, i) => {
              const color =
                insight.level === 'positive'
                  ? '#2E7D32'
                  : insight.level === 'warning'
                    ? '#EF6C00'
                    : '#2F6FED';
              const icon =
                insight.level === 'positive'
                  ? 'trending-up'
                  : insight.level === 'warning'
                    ? 'alert'
                    : 'information-outline';
              return (
                <Card
                  key={i}
                  style={[
                    styles.insightCard,
                    { backgroundColor: theme.colors.surface, borderLeftColor: color },
                  ]}>
                  <Card.Content style={styles.insightContent}>
                    <MaterialCommunityIcons name={icon} size={20} color={color} />
                    <View style={styles.insightText}>
                      <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
                        {insight.title}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {insight.message}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        </View>
      ) : null}

      <Portal>
        <EditDailyMetricsModal
          visible={showMetrics}
          onDismiss={() => setShowMetrics(false)}
          initial={latest ?? null}
          onSaved={() => {
            setShowMetrics(false);
            loadDashboard();
            syncIfEnabled();
          }}
        />
      </Portal>
    </Screen>
  );
}

interface EditDailyMetricsModalProps {
  visible: boolean;
  onDismiss: () => void;
  initial: DailyMetrics | null;
  onSaved: () => void;
}

function EditDailyMetricsModal({ visible, onDismiss, initial, onSaved }: EditDailyMetricsModalProps) {
  const theme = useTheme();
  const [date, setDate] = useState(todayStr());
  const [heartRate, setHeartRate] = useState('');
  const [steps, setSteps] = useState('');
  const [sleep, setSleep] = useState('');
  const [stress, setStress] = useState('');
  const [weight, setWeight] = useState('');
  const [recovery, setRecovery] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [autoRecovery, setAutoRecovery] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setDate(initial?.date ?? todayStr());
      setHeartRate(initial?.heartRate != null ? String(initial.heartRate) : '');
      setSteps(initial?.steps != null ? String(initial.steps) : '');
      setSleep(initial?.sleepHours != null ? String(initial.sleepHours) : '');
      setStress(initial?.stress != null ? String(initial.stress) : '');
      setWeight(initial?.weight != null ? String(initial.weight) : '');
      setRecovery(initial?.recoveryScore != null ? String(initial.recoveryScore) : '');
      setNotes(initial?.notes ?? '');
      setAutoRecovery(null);
    }
  }, [visible, initial]);

  useEffect(() => {
    if (recovery) {
      setAutoRecovery(null);
      return;
    }
    const computed = calculateRecoveryScore({
      sleepHours: sleep ? Number(sleep) : null,
      stress: stress ? Number(stress) : null,
      heartRate: heartRate ? Number(heartRate) : null,
    });
    setAutoRecovery(computed);
  }, [recovery, sleep, stress, heartRate]);

  const save = async () => {
    setBusy(true);
    const heartRateValue = heartRate ? Number(heartRate) : null;
    const sleepHours = sleep ? Number(sleep) : null;
    const stressNum = stress ? Number(stress) : null;
    const manualRecovery = recovery ? Math.max(0, Math.min(100, Number(recovery))) : null;
    const recoveryScore =
      manualRecovery ??
      calculateRecoveryScore({ sleepHours, stress: stressNum, heartRate: heartRateValue });
    const input: DailyMetricsInput = {
      date,
      heartRate: heartRateValue,
      steps: steps ? Number(steps) : null,
      sleepHours,
      stress: stressNum,
      weight: weight ? Number(weight) : null,
      recoveryScore,
      notes: notes || null,
    };
    await upsertDailyMetrics(input);
    setBusy(false);
    onSaved();
  };

  return (
    <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
      <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
        Daily metrics
      </Text>
      <DateField value={date} onChange={setDate} maximumDate={new Date()} />
      <NumberField label="Steps" value={steps} onChange={setSteps} />
      <NumberField label="Resting heart rate (bpm)" value={heartRate} onChange={setHeartRate} />
      <NumberField label="Sleep (hours)" value={sleep} onChange={setSleep} decimal />
      <NumberField label="Weight (kg)" value={weight} onChange={setWeight} decimal />
      <NumberField label="Stress (1-10)" value={stress} onChange={setStress} />
      <NumberField label="Recovery score (0-100)" value={recovery} onChange={setRecovery} />
      {autoRecovery != null ? (
        <HelperText type="info">Auto-calculated from sleep, stress and HR: {autoRecovery}</HelperText>
      ) : null}
      <TextInput
        mode="outlined"
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        style={styles.notes}
      />
      <View style={styles.modalActions}>
        <Button mode="text" onPress={onDismiss}>
          Cancel
        </Button>
        <Button mode="contained" onPress={save} loading={busy} disabled={busy}>
          Save
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  statRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  foodCard: { marginTop: 12, borderRadius: 16, elevation: 1 },
  foodRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4 },
  chartSection: { marginTop: 20 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  alerts: { marginTop: 20 },
  insightList: { gap: 8 },
  insightCard: { borderRadius: 14, borderLeftWidth: 4, elevation: 1 },
  insightContent: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  insightText: { flex: 1, marginLeft: 10 },
  modal: {
    margin: 24,
    borderRadius: 18,
    padding: 20,
    maxHeight: '85%',
  },
  notes: { marginTop: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 8 },
});
