import type { DailyMetrics, FoodLogEntry, WorkoutEntry } from '@/types';
import type { HealthAlert } from '@/constants/metrics';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export interface RecoveryFactors {
  sleepHours: number | null;
  stress: number | null;
  heartRate: number | null;
  weight: number | null;
}

export function calculateRecoveryScore(f: RecoveryFactors): number | null {
  const hasMetric = f.sleepHours != null || f.stress != null || f.heartRate != null || f.weight != null;
  if (!hasMetric) return null;

  let score = 50;
  if (f.sleepHours != null) {
    if (f.sleepHours >= 7 && f.sleepHours <= 9) score += 20;
    else if ((f.sleepHours >= 5 && f.sleepHours < 7) || (f.sleepHours > 9 && f.sleepHours <= 10)) score += 10;
  }
  if (f.heartRate != null) {
    if (f.heartRate >= 60 && f.heartRate <= 100) score += 20;
    else if ((f.heartRate >= 50 && f.heartRate < 60) || (f.heartRate > 100 && f.heartRate <= 120)) score += 10;
  }
  if (f.stress != null) {
    if (f.stress >= 1 && f.stress <= 3) score += 20;
    else if (f.stress >= 4 && f.stress <= 6) score += 10;
  }
  if (f.weight != null) {
    const assumedHeightMeters = 1.75;
    const bmi = f.weight / (assumedHeightMeters * assumedHeightMeters);
    if (bmi >= 18.5 && bmi <= 25) score += 10;
  }
  return clamp(score, 0, 100);
}

export function calculateRecoveryFromMetrics(metrics: DailyMetrics[]): number | null {
  if (metrics.length === 0) return null;
  const latest = metrics[metrics.length - 1];
  return calculateRecoveryScore({
    sleepHours: latest.sleepHours,
    stress: latest.stress,
    heartRate: latest.heartRate,
    weight: latest.weight,
  });
}

export function predictStress(metrics: DailyMetrics[]): number | null {
  const recent = metrics.slice(-7).filter((m) => m.stress != null);
  const avg = average(recent.map((m) => m.stress!));
  if (avg == null) return null;
  const recentSleep = metrics.slice(-3).filter((m) => m.sleepHours != null);
  const avgSleep = average(recentSleep.map((m) => m.sleepHours!));
  let predicted = avg;
  if (avgSleep != null && avgSleep < 6) predicted += 1.5;
  if (avgSleep != null && avgSleep > 8) predicted -= 0.5;
  return clamp(Math.round(predicted), 1, 10);
}

export function predictSleep(metrics: DailyMetrics[]): number | null {
  const recent = metrics.slice(-7).filter((m) => m.sleepHours != null);
  const avg = average(recent.map((m) => m.sleepHours!));
  if (avg == null) return null;
  return Math.round(avg * 10) / 10;
}

export interface NutritionAdvice {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  messages: string[];
}

export function optimizeNutrition(meals: FoodLogEntry[], targetCalories = 2000): NutritionAdvice | null {
  if (meals.length === 0) return null;
  const calories = Math.round(meals.reduce((s, m) => s + (m.calories ?? 0), 0));
  const protein = meals.reduce((s, m) => s + (m.protein ?? 0), 0);
  const carbs = meals.reduce((s, m) => s + (m.carbs ?? 0), 0);
  const fat = meals.reduce((s, m) => s + (m.fat ?? 0), 0);

  const messages: string[] = [];
  if (calories > 0) {
    const proteinCal = protein * 4;
    const pct = Math.round((proteinCal / calories) * 100);
    if (pct < 20) messages.push(`Protein is ${pct}% of calories — aim for at least 20%.`);
    else if (pct > 40) messages.push(`Protein is ${pct}% of calories, which is high.`);
  }
  if (calories > targetCalories * 1.2) {
    messages.push(`Calories (${calories}) are well above your target of ${targetCalories}.`);
  }
  if (calories > 0 && calories < targetCalories * 0.5) {
    messages.push(`Calories (${calories}) are well below your target of ${targetCalories}.`);
  }
  if (messages.length === 0) messages.push('Your macro balance looks reasonable today.');
  return { calories, protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat), messages };
}

export interface Insight {
  level: 'positive' | 'warning' | 'info';
  title: string;
  message: string;
}

export interface InsightData {
  metrics: DailyMetrics[];
  workouts: WorkoutEntry[];
  meals?: FoodLogEntry[];
}

function sliceWindow<T extends { date: string }>(values: T[], fromDate: string, toDate: string): T[] {
  return values.filter((v) => v.date >= fromDate && v.date <= toDate);
}

function dateDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function generateInsights(data: InsightData): Insight[] {
  const insights: Insight[] = [];
  const { metrics, workouts } = data;
  const today = dateDaysAgo(0);
  const weekAgo = dateDaysAgo(7);
  const twoWeeksAgo = dateDaysAgo(14);

  const thisWeek = sliceWindow(metrics, weekAgo, today);
  const lastWeek = sliceWindow(metrics, twoWeeksAgo, dateDaysAgo(7));

  const sleepNow = average(thisWeek.filter((m) => m.sleepHours != null).map((m) => m.sleepHours!));
  const sleepBefore = average(lastWeek.filter((m) => m.sleepHours != null).map((m) => m.sleepHours!));
  if (sleepNow != null && sleepBefore != null) {
    const diff = sleepNow - sleepBefore;
    if (diff >= 0.5) {
      insights.push({ level: 'positive', title: 'Sleep improving', message: `Your average sleep is up ${diff.toFixed(1)}h this week (${sleepNow.toFixed(1)}h).` });
    } else if (diff <= -0.5) {
      insights.push({ level: 'warning', title: 'Sleep declining', message: `Your average sleep dropped ${Math.abs(diff).toFixed(1)}h this week (${sleepNow.toFixed(1)}h).` });
    }
  }

  const stepsNow = average(thisWeek.filter((m) => m.steps != null).map((m) => m.steps!));
  if (stepsNow != null) {
    if (stepsNow < 5000) {
      insights.push({ level: 'warning', title: 'Low activity', message: `Averaging ${Math.round(stepsNow)} steps/day — try for at least 7,000.` });
    } else if (stepsNow >= 7000) {
      insights.push({ level: 'positive', title: 'Staying active', message: `Averaging ${Math.round(stepsNow)} steps/day this week.` });
    }
  }

  const weekWorkouts = sliceWindow(workouts, weekAgo, today).length;
  if (weekWorkouts === 0) {
    insights.push({ level: 'info', title: 'No workouts this week', message: 'Even a 20-minute walk counts toward your training load.' });
  } else if (weekWorkouts >= 3) {
    insights.push({ level: 'positive', title: 'Consistent training', message: `${weekWorkouts} workouts logged in the last 7 days.` });
  } else {
    insights.push({ level: 'info', title: 'Light training week', message: `${weekWorkouts} workout(s) logged in the last 7 days.` });
  }

  const weightNow = average(thisWeek.filter((m) => m.weight != null).map((m) => m.weight!));
  const weightBefore = average(lastWeek.filter((m) => m.weight != null).map((m) => m.weight!));
  if (weightNow != null && weightBefore != null) {
    const diff = weightNow - weightBefore;
    if (Math.abs(diff) >= 0.5) {
      const direction = diff > 0 ? 'up' : 'down';
      insights.push({ level: 'info', title: `Weight trending ${direction}`, message: `Your average weight changed ${Math.abs(diff).toFixed(1)}kg over the past two weeks.` });
    }
  }

  const recoveryTrend = metrics.filter((m) => m.recoveryScore != null).slice(-7);
  if (recoveryTrend.length >= 3) {
    const first = recoveryTrend[0].recoveryScore!;
    const last = recoveryTrend[recoveryTrend.length - 1].recoveryScore!;
    const delta = last - first;
    if (delta >= 10) {
      insights.push({ level: 'positive', title: 'Recovery rising', message: `Recovery score moved from ${first} to ${last} recently.` });
    } else if (delta <= -10) {
      insights.push({ level: 'warning', title: 'Recovery falling', message: `Recovery score moved from ${first} to ${last} recently. Consider more rest.` });
    }
  }

  return insights;
}

export function checkMetricsAlerts(metrics: DailyMetrics[]): HealthAlert[] {
  const alerts: HealthAlert[] = [];
  if (metrics.length === 0) return alerts;
  const latest = metrics[metrics.length - 1];

  if (latest.heartRate != null && latest.heartRate > 90) {
    alerts.push({
      level: 'high',
      title: 'Elevated resting heart rate',
      message: `Latest resting heart rate is ${latest.heartRate} bpm, above the typical 60-80 range.`,
    });
  }
  if (latest.sleepHours != null && latest.sleepHours < 6) {
    alerts.push({
      level: 'low',
      title: 'Short sleep',
      message: `Latest sleep was ${latest.sleepHours}h — below the recommended 7-9h.`,
    });
  }
  if (latest.stress != null && latest.stress >= 8) {
    alerts.push({
      level: 'high',
      title: 'High stress',
      message: `Latest stress level is ${latest.stress}/10. Consider a rest or breathing exercise.`,
    });
  }
  return alerts;
}

/** Alias for checkMetricsAlerts (prompt API). */
export const checkHealthAlerts = checkMetricsAlerts;
