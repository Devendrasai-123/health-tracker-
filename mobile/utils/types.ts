/** Re-export app domain types for a stable import path. */
export type {
  BloodTest,
  BloodTestInput,
  DailyMetrics,
  DailyMetricsInput,
  FoodLogEntry,
  FoodLogInput,
  MealType,
  WorkoutEntry,
  WorkoutInput,
  AppSettings,
} from '@/types';

export type { HealthAlert } from '@/constants/metrics';

/** Local passcode user (SecureStore-backed; no username table). */
export interface User {
  id: number;
  username: string;
  passwordHash: string;
  createdAt: string;
}
