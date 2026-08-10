import { getDb } from './database';
import type { GroomingRoutine } from '@/types';

interface Row {
  id: number;
  title: string;
  kind: string;
  time_of_day: string | null;
  schedule_days: string | null;
  notes: string | null;
  active: number;
  created_at: string;
}

function mapRow(row: Row): GroomingRoutine {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind as GroomingRoutine['kind'],
    timeOfDay: row.time_of_day,
    scheduleDays: row.schedule_days,
    notes: row.notes,
    active: !!row.active,
    createdAt: row.created_at,
  };
}

export async function listRoutines(): Promise<GroomingRoutine[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    `SELECT * FROM grooming_routines ORDER BY active DESC, id DESC`,
  );
  return rows.map(mapRow);
}

export async function addRoutine(input: {
  title: string;
  kind?: GroomingRoutine['kind'];
  timeOfDay?: string | null;
  scheduleDays?: string | null;
  notes?: string | null;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO grooming_routines (title, kind, time_of_day, schedule_days, notes)
     VALUES (?, ?, ?, ?, ?)`,
    input.title.trim(),
    input.kind ?? 'skincare',
    input.timeOfDay ?? null,
    input.scheduleDays ?? null,
    input.notes ?? null,
  );
  return result.lastInsertRowId;
}

export async function deleteRoutine(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM grooming_routines WHERE id = ?`, id);
}
