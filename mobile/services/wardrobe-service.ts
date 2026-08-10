import { getDb } from './database';
import type { WardrobeCategory, WardrobeItem, WardrobeItemInput } from '@/types';

interface Row {
  id: number;
  category: string;
  name: string;
  photo_uri: string | null;
  color: string | null;
  brand: string | null;
  notes: string | null;
  favorite: number;
  created_at: string;
}

function mapRow(row: Row): WardrobeItem {
  return {
    id: row.id,
    category: row.category as WardrobeCategory,
    name: row.name,
    photoUri: row.photo_uri,
    color: row.color,
    brand: row.brand,
    notes: row.notes,
    favorite: !!row.favorite,
    createdAt: row.created_at,
  };
}

export async function addWardrobeItem(input: WardrobeItemInput): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO wardrobe_items (category, name, photo_uri, color, brand, notes, favorite)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.category,
    input.name,
    input.photoUri ?? null,
    input.color ?? null,
    input.brand ?? null,
    input.notes ?? null,
    input.favorite ? 1 : 0,
  );
  return result.lastInsertRowId;
}

export async function listWardrobe(category?: WardrobeCategory): Promise<WardrobeItem[]> {
  const db = await getDb();
  const rows = category
    ? await db.getAllAsync<Row>(
        `SELECT * FROM wardrobe_items WHERE category = ? ORDER BY favorite DESC, id DESC`,
        category,
      )
    : await db.getAllAsync<Row>(`SELECT * FROM wardrobe_items ORDER BY favorite DESC, id DESC`);
  return rows.map(mapRow);
}

export async function deleteWardrobeItem(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM wardrobe_items WHERE id = ?`, id);
}

export async function updateWardrobeItem(id: number, input: WardrobeItemInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE wardrobe_items
     SET category = ?, name = ?, photo_uri = ?, color = ?, brand = ?, notes = ?, favorite = ?
     WHERE id = ?`,
    input.category,
    input.name,
    input.photoUri ?? null,
    input.color ?? null,
    input.brand ?? null,
    input.notes ?? null,
    input.favorite ? 1 : 0,
    id,
  );
}
