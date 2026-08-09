import { getDb } from './database';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { getDailyMetrics, listDailyMetricsBetween } from './metrics-service';
import { listFoodByDate, listFoodBetween } from './meal-service';
import { listWorkouts, listWorkoutsForDate } from './workout-service';
import type { DailyMetricsRow, MealsRow, WorkoutsRow } from '@/types/supabase';
import type { DailyMetrics, FoodLogEntry, WorkoutEntry } from '@/types';
import type { Database } from '@/types/supabase';

type SyncKind = 'daily_metrics' | 'meal' | 'workout';

interface SyncQueueRow {
  id: number;
  payload: string;
  kind: SyncKind;
  created_at: string;
}

export interface SyncResult {
  pushed: number;
  remaining: number;
  error: string | null;
}

function today(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toMetricsRow(m: DailyMetrics): Omit<DailyMetricsRow, 'user_id'> {
  return {
    metric_date: m.date,
    resting_heart_rate_bpm: m.heartRate,
    daily_steps: m.steps,
    sleep_duration_hours: m.sleepHours,
    stress_level: m.stress,
    weight_kg: m.weight,
    overall_day_rating: m.recoveryScore,
    notes: m.notes,
  };
}

function toMealRow(f: FoodLogEntry): Omit<MealsRow, 'user_id'> {
  return {
    meal_date: f.date,
    meal_type: f.mealType,
    food_items: [
      {
        name: f.name,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
      },
    ],
    total_calories: f.calories,
    total_protein_g: f.protein,
    total_carbs_g: f.carbs,
    total_fat_g: f.fat,
    notes: null,
    photo_path: f.photoUri,
  };
}

function toWorkoutRow(w: WorkoutEntry): Omit<WorkoutsRow, 'user_id'> {
  return {
    workout_date: w.date,
    workout_name: w.name,
    total_duration_minutes: w.durationMin,
    perceived_intensity: w.intensity,
    estimated_calories_burned: w.calories,
    notes: w.notes,
  };
}

async function enqueue(kind: SyncKind, payload: object): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sync_queue (payload, kind) VALUES (?, ?)`,
    JSON.stringify(payload),
    kind,
  );
}

export async function enqueueDailyMetrics(date: string): Promise<void> {
  const m = await getDailyMetrics(date);
  if (!m) return;
  await enqueue('daily_metrics', toMetricsRow(m));
}

export async function enqueueMeals(date: string): Promise<void> {
  const meals = await listFoodByDate(date);
  for (const meal of meals) {
    await enqueue('meal', toMealRow(meal));
  }
}

export async function enqueueWorkouts(date: string): Promise<void> {
  const workouts = await listWorkoutsForDate(date);
  for (const w of workouts) {
    await enqueue('workout', toWorkoutRow(w));
  }
}

export async function enqueueAllHistory(): Promise<void> {
  const db = await getDb();
  const from = await db.getFirstAsync<{ min: string | null }>(
    `SELECT MIN(date) AS min FROM (
       SELECT date FROM daily_metrics
       UNION SELECT date FROM food_log
       UNION SELECT date FROM workouts
     )`,
  );
  const start = from?.min ?? today();
  const end = today();

  const metrics = await listDailyMetricsBetween(start, end);
  for (const m of metrics) await enqueue('daily_metrics', toMetricsRow(m));

  const meals = await listFoodBetween(start, end);
  for (const meal of meals) await enqueue('meal', toMealRow(meal));

  const workouts = await listWorkouts(10000);
  for (const w of workouts) await enqueue('workout', toWorkoutRow(w));
}

async function dequeueNext(): Promise<SyncQueueRow | null> {
  const db = await getDb();
  return db.getFirstAsync<SyncQueueRow>(
    `SELECT * FROM sync_queue ORDER BY id ASC LIMIT 1`,
  );
}

async function removeFromQueue(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', id);
}

export async function queueLength(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM sync_queue`,
  );
  return row?.count ?? 0;
}

async function currentUserId(): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

async function pushRow(row: SyncQueueRow, userId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const payload = JSON.parse(row.payload) as Record<string, unknown>;

  switch (row.kind) {
    case 'daily_metrics': {
      const { error } = await client
        .from('daily_metrics')
        .upsert(
          { ...payload, user_id: userId } as never,
          { onConflict: 'user_id,metric_date' },
        );
      return !error;
    }
    case 'meal': {
      const { error } = await client
        .from('meals')
        .insert({ ...payload, user_id: userId } as never);
      return !error;
    }
    case 'workout': {
      const { error } = await client
        .from('workouts')
        .insert({ ...payload, user_id: userId } as never);
      return !error;
    }
    default:
      return false;
  }
}

export async function flushQueue(maxItems = 100): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { pushed: 0, remaining: await queueLength(), error: 'Supabase is not configured.' };
  }

  const userId = await currentUserId();
  if (!userId) {
    return {
      pushed: 0,
      remaining: await queueLength(),
      error: 'Sign in to sync your data.',
    };
  }

  let pushed = 0;
  let error: string | null = null;

  for (let i = 0; i < maxItems; i++) {
    const row = await dequeueNext();
    if (!row) break;
    try {
      const ok = await pushRow(row, userId);
      if (ok) {
        await removeFromQueue(row.id);
        pushed++;
      } else {
        error = 'Supabase rejected the write. Check RLS policies and table schema.';
        break;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Sync failed.';
      break;
    }
  }

  return { pushed, remaining: await queueLength(), error };
}

export async function syncLatest(): Promise<SyncResult> {
  const date = today();
  await enqueueDailyMetrics(date);
  await enqueueMeals(date);
  await enqueueWorkouts(date);
  return flushQueue();
}

export async function syncAll(): Promise<SyncResult> {
  await enqueueAllHistory();
  return flushQueue();
}
