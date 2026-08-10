import { getDb } from './database';
import type { FoodLogEntry, FoodLogInput, MealType } from '@/types';

interface FoodRow {
  id: number;
  date: string;
  meal_type: string;
  name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  photo_uri: string | null;
  created_at: string;
}

function rowToFood(row: FoodRow): FoodLogEntry {
  return {
    id: row.id,
    date: row.date,
    mealType: row.meal_type as MealType,
    name: row.name,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    photoUri: row.photo_uri,
    createdAt: row.created_at,
  };
}

export async function addFoodLog(input: FoodLogInput): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO food_log (date, meal_type, name, calories, protein, carbs, fat, photo_uri)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    input.date,
    input.mealType,
    input.name,
    input.calories ?? null,
    input.protein ?? null,
    input.carbs ?? null,
    input.fat ?? null,
    input.photoUri ?? null,
  );
  return result.lastInsertRowId;
}

export async function listFoodByDate(date: string): Promise<FoodLogEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<FoodRow>(
    `SELECT * FROM food_log WHERE date = ? ORDER BY id ASC`,
    date,
  );
  return rows.map(rowToFood);
}

export async function listFoodBetween(fromDate: string, toDate: string): Promise<FoodLogEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<FoodRow>(
    `SELECT * FROM food_log WHERE date >= ? AND date <= ? ORDER BY date ASC, id ASC`,
    fromDate,
    toDate,
  );
  return rows.map(rowToFood);
}

export async function updateFoodLog(id: number, input: FoodLogInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE food_log
     SET date = ?, meal_type = ?, name = ?, calories = ?, protein = ?, carbs = ?, fat = ?, photo_uri = ?
     WHERE id = ?`,
    input.date,
    input.mealType,
    input.name,
    input.calories ?? null,
    input.protein ?? null,
    input.carbs ?? null,
    input.fat ?? null,
    input.photoUri ?? null,
    id,
  );
}

export async function deleteFoodLog(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM food_log WHERE id = ?', id);
}

export async function caloriesForDate(date: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT COALESCE(SUM(calories), 0) AS total FROM food_log WHERE date = ?`,
    date,
  );
  return row?.total ?? 0;
}
