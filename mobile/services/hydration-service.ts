import { getDb } from './database';
import type { HydrationEntry } from '@/types';

interface Row {
  id: number;
  date: string;
  amount_ml: number;
  note: string | null;
  created_at: string;
}

function mapRow(row: Row): HydrationEntry {
  return {
    id: row.id,
    date: row.date,
    amountMl: row.amount_ml,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function addHydration(date: string, amountMl: number, note?: string | null): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO hydration_log (date, amount_ml, note) VALUES (?, ?, ?)`,
    date,
    amountMl,
    note ?? null,
  );
  return result.lastInsertRowId;
}

export async function listHydrationByDate(date: string): Promise<HydrationEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    `SELECT * FROM hydration_log WHERE date = ? ORDER BY id DESC`,
    date,
  );
  return rows.map(mapRow);
}

export async function totalHydrationMl(date: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT COALESCE(SUM(amount_ml), 0) AS total FROM hydration_log WHERE date = ?`,
    date,
  );
  return row?.total ?? 0;
}

export async function deleteHydration(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM hydration_log WHERE id = ?`, id);
}
