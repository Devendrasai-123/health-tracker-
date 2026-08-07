import { getDb } from './database';
import type { WorkoutEntry, WorkoutInput } from '@/types';

interface WorkoutRow {
  id: number;
  date: string;
  name: string;
  duration_min: number | null;
  intensity: number | null;
  calories: number | null;
  notes: string | null;
  created_at: string;
}

function rowToWorkout(row: WorkoutRow): WorkoutEntry {
  return {
    id: row.id,
    date: row.date,
    name: row.name,
    durationMin: row.duration_min,
    intensity: row.intensity,
    calories: row.calories,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function addWorkout(input: WorkoutInput): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO workouts (date, name, duration_min, intensity, calories, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.date,
    input.name,
    input.durationMin ?? null,
    input.intensity ?? null,
    input.calories ?? null,
    input.notes ?? null,
  );
  return result.lastInsertRowId;
}

export async function listWorkouts(limit = 100): Promise<WorkoutEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<WorkoutRow>(
    `SELECT * FROM workouts ORDER BY date DESC, id DESC LIMIT ?`,
    limit,
  );
  return rows.map(rowToWorkout);
}

export async function listWorkoutsForDate(date: string): Promise<WorkoutEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<WorkoutRow>(
    `SELECT * FROM workouts WHERE date = ? ORDER BY id DESC`,
    date,
  );
  return rows.map(rowToWorkout);
}

export async function deleteWorkout(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM workouts WHERE id = ?', id);
}
