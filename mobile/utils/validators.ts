export const VALIDATION_RULES = {
  heartRate: { min: 30, max: 200, label: 'Heart rate' },
  sleepHours: { min: 0, max: 12, label: 'Sleep hours' },
  steps: { min: 0, max: 50_000, label: 'Steps' },
  stress: { min: 1, max: 10, label: 'Stress' },
  weight: { min: 30, max: 300, label: 'Weight' },
  recoveryScore: { min: 0, max: 100, label: 'Recovery score' },
  calories: { min: 0, max: 20_000, label: 'Calories' },
  protein: { min: 0, max: 1_000, label: 'Protein' },
  carbs: { min: 0, max: 2_000, label: 'Carbohydrates' },
  fat: { min: 0, max: 1_000, label: 'Fat' },
  durationMin: { min: 1, max: 1_440, label: 'Duration' },
} as const;

export type ValidationKey = keyof typeof VALIDATION_RULES;

export function validateNumber(
  key: ValidationKey,
  value: number | null,
): { valid: boolean; error?: string } {
  if (value == null) return { valid: true };
  const rule = VALIDATION_RULES[key];
  if (!Number.isFinite(value)) return { valid: false, error: `${rule.label} must be a number.` };
  if (value < rule.min) return { valid: false, error: `${rule.label} must be at least ${rule.min}.` };
  if (value > rule.max) return { valid: false, error: `${rule.label} cannot exceed ${rule.max}.` };
  return { valid: true };
}
