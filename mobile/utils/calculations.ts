import type { FoodLogEntry } from '@/types';
import { calculateRecoveryScore as calculateRecoveryFromFactors } from '@/services/ai-engine';
import { toDateStr } from '@/constants/metrics';

/** Prompt-style recovery score from HR, sleep, and stress (0–100). */
export function calculateRecoveryScore(
  heartRate: number,
  sleepHours: number,
  stressLevel: number,
): number {
  return (
    calculateRecoveryFromFactors({
      heartRate,
      sleepHours,
      stress: stressLevel,
    }) ?? 50
  );
}

export function calculateMacroTotals(meals: FoodLogEntry[]) {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function formatDate(date: Date): string {
  return toDateStr(date);
}

export function getTodayDate(): string {
  return formatDate(new Date());
}

/** Weekly workout summary for the last 7 days (including today). */
export function summarizeWorkoutsWeek(
  workouts: { date: string; durationMin: number | null; calories: number | null }[],
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);
  const from = toDateStr(cutoff);
  const week = workouts.filter((w) => w.date >= from);
  return {
    count: week.length,
    durationMin: week.reduce((s, w) => s + (w.durationMin ?? 0), 0),
    calories: week.reduce((s, w) => s + (w.calories ?? 0), 0),
  };
}
