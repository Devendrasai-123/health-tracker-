import { getDb } from './database';
import type { DailyMetrics, DailyMetricsInput } from '@/types';

interface MetricsRow {
  id: number;
  date: string;
  heart_rate: number | null;
  steps: number | null;
  sleep_hours: number | null;
  stress: number | null;
  weight: number | null;
  recovery_score: number | null;
  notes: string | null;
}

function rowToMetrics(row: MetricsRow): DailyMetrics {
  return {
    id: row.id,
    date: row.date,
    heartRate: row.heart_rate,
    steps: row.steps,
    sleepHours: row.sleep_hours,
    stress: row.stress,
    weight: row.weight,
    recoveryScore: row.recovery_score,
    notes: row.notes,
  };
}

export async function upsertDailyMetrics(input: DailyMetricsInput): Promise<number> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM daily_metrics WHERE date = ?`,
    input.date,
  );
  if (existing) {
    await db.runAsync(
      `UPDATE daily_metrics SET
         heart_rate = COALESCE(?, heart_rate),
         steps = COALESCE(?, steps),
         sleep_hours = COALESCE(?, sleep_hours),
         stress = COALESCE(?, stress),
         weight = COALESCE(?, weight),
         recovery_score = COALESCE(?, recovery_score),
         notes = COALESCE(?, notes)
       WHERE id = ?`,
      input.heartRate ?? null,
      input.steps ?? null,
      input.sleepHours ?? null,
      input.stress ?? null,
      input.weight ?? null,
      input.recoveryScore ?? null,
      input.notes ?? null,
      existing.id,
    );
    return existing.id;
  }
  const result = await db.runAsync(
    `INSERT INTO daily_metrics (date, heart_rate, steps, sleep_hours, stress, weight, recovery_score, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    input.date,
    input.heartRate ?? null,
    input.steps ?? null,
    input.sleepHours ?? null,
    input.stress ?? null,
    input.weight ?? null,
    input.recoveryScore ?? null,
    input.notes ?? null,
  );
  return result.lastInsertRowId;
}

export async function getDailyMetrics(date: string): Promise<DailyMetrics | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<MetricsRow>(
    `SELECT * FROM daily_metrics WHERE date = ?`,
    date,
  );
  return row ? rowToMetrics(row) : null;
}

export async function listDailyMetricsBetween(fromDate: string, toDate: string): Promise<DailyMetrics[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MetricsRow>(
    `SELECT * FROM daily_metrics WHERE date >= ? AND date <= ? ORDER BY date ASC`,
    fromDate,
    toDate,
  );
  return rows.map(rowToMetrics);
}

export async function listRecentMetrics(days: number): Promise<DailyMetrics[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MetricsRow>(
    `SELECT * FROM daily_metrics ORDER BY date DESC LIMIT ?`,
    days,
  );
  return rows.map(rowToMetrics).reverse();
}
