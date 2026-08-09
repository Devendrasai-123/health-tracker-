export interface BloodTest {
  id: number;
  date: string;
  testType: string;
  value: number;
  unit: string;
  notes: string | null;
  photoUri: string | null;
  source: 'manual' | 'photo' | 'pdf';
  createdAt?: string;
}

export interface BloodTestInput {
  date: string;
  testType: string;
  value: number;
  unit: string;
  notes?: string | null;
  photoUri?: string | null;
  source?: 'manual' | 'photo' | 'pdf';
}

export interface DailyMetrics {
  id: number;
  date: string;
  heartRate: number | null;
  steps: number | null;
  sleepHours: number | null;
  stress: number | null;
  weight: number | null;
  recoveryScore: number | null;
  notes: string | null;
}

export interface DailyMetricsInput {
  date: string;
  heartRate?: number | null;
  steps?: number | null;
  sleepHours?: number | null;
  stress?: number | null;
  weight?: number | null;
  recoveryScore?: number | null;
  notes?: string | null;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodLogEntry {
  id: number;
  date: string;
  mealType: MealType;
  name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  photoUri: string | null;
  createdAt?: string;
}

export interface FoodLogInput {
  date: string;
  mealType: MealType;
  name: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  photoUri?: string | null;
}

export interface WorkoutEntry {
  id: number;
  date: string;
  name: string;
  durationMin: number | null;
  intensity: number | null;
  calories: number | null;
  notes: string | null;
  createdAt?: string;
}

export interface WorkoutInput {
  date: string;
  name: string;
  durationMin?: number | null;
  intensity?: number | null;
  calories?: number | null;
  notes?: string | null;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  units: 'metric' | 'imperial';
  syncEnabled: boolean;
}
