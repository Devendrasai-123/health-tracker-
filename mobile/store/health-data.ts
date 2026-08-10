/**
 * Compatibility health-data store matching the prompt API,
 * backed by the existing `@/stores/data` implementation.
 */
import { create } from 'zustand';
import type { BloodTest, BloodTestInput, DailyMetrics, FoodLogEntry, FoodLogInput, WorkoutEntry, WorkoutInput } from '@/types';
import { useDataStore } from '@/stores/data';
import { addBloodTest as insertBloodTest } from '@/services/blood-test-service';
import { addFoodLog } from '@/services/meal-service';
import { addWorkout as insertWorkout } from '@/services/workout-service';
import { calculateRecoveryFromMetrics } from '@/services/ai-engine';

interface HealthDataState {
  bloodTests: BloodTest[];
  dailyMetrics: DailyMetrics[];
  meals: FoodLogEntry[];
  workouts: WorkoutEntry[];
  recoveryScore: number;
  loadData: () => Promise<void>;
  addBloodTest: (data: BloodTestInput) => Promise<void>;
  addMeal: (data: FoodLogInput) => Promise<void>;
  addWorkout: (data: WorkoutInput) => Promise<void>;
}

export const useHealthDataStore = create<HealthDataState>((set) => ({
  bloodTests: [],
  dailyMetrics: [],
  meals: [],
  workouts: [],
  recoveryScore: 0,

  loadData: async () => {
    await useDataStore.getState().loadDashboard();
    const data = useDataStore.getState();
    const today = data.foodDate;
    set({
      bloodTests: data.bloodTests,
      dailyMetrics: data.metrics,
      meals: data.foodByDate[today] ?? [],
      workouts: data.workouts,
      recoveryScore: calculateRecoveryFromMetrics(data.metrics) ?? 0,
    });
  },

  addBloodTest: async (data) => {
    await insertBloodTest(data);
    await useDataStore.getState().reloadBloodTests();
    set({ bloodTests: useDataStore.getState().bloodTests });
  },

  addMeal: async (data) => {
    await addFoodLog(data);
    await useDataStore.getState().loadFood(data.date);
    const store = useDataStore.getState();
    set({ meals: store.foodByDate[data.date] ?? [] });
  },

  addWorkout: async (data) => {
    await insertWorkout(data);
    await useDataStore.getState().reloadWorkouts();
    set({ workouts: useDataStore.getState().workouts });
  },
}));
