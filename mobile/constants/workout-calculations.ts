export const INTENSITY_MULTIPLIERS = {
  low: 1,
  moderate: 1.5,
  high: 2,
  intense: 2.5,
} as const;

export const WORKOUT_INTENSITY_MAP: Record<number, keyof typeof INTENSITY_MULTIPLIERS> = {
  1: 'low',
  2: 'low',
  3: 'moderate',
  4: 'high',
  5: 'intense',
};

export const WORKOUT_CALORIE_RATES: Record<string, number> = {
  running: 12,
  walking: 4,
  cycling: 8,
  swimming: 10,
  gym: 6,
  yoga: 3,
  hiit: 15,
  strength: 7,
  basketball: 11,
  soccer: 13,
  tennis: 12,
  rowing: 9,
  elliptical: 7,
  jump_rope: 14,
};

function normalizeWorkoutType(workoutType: string): string {
  return workoutType.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function calculateWorkoutCalories(
  workoutType: string,
  durationMinutes: number,
  intensity: number | null,
  userWeight?: number,
): number {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return 0;
  const baseRate = WORKOUT_CALORIE_RATES[normalizeWorkoutType(workoutType)] ?? 6;
  const intensityName = intensity == null ? 'moderate' : WORKOUT_INTENSITY_MAP[intensity] ?? 'moderate';
  const multiplier = INTENSITY_MULTIPLIERS[intensityName];
  const weightMultiplier = userWeight && userWeight > 0 ? userWeight / 70 : 1;
  return Math.round(baseRate * durationMinutes * multiplier * weightMultiplier);
}
