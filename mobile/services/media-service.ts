import { getDb } from './database';
import type { LearningMedia } from '@/types';

interface Row {
  id: number;
  kind: string;
  title: string;
  creator: string | null;
  url: string | null;
  status: string;
  notes: string | null;
}

function map(row: Row): LearningMedia {
  return {
    id: row.id,
    kind: row.kind as LearningMedia['kind'],
    title: row.title,
    creator: row.creator,
    url: row.url,
    status: row.status as LearningMedia['status'],
    notes: row.notes,
  };
}

export async function listMedia(kind?: LearningMedia['kind']): Promise<LearningMedia[]> {
  const db = await getDb();
  const rows = kind
    ? await db.getAllAsync<Row>(`SELECT * FROM learning_media WHERE kind = ? ORDER BY id DESC`, kind)
    : await db.getAllAsync<Row>(`SELECT * FROM learning_media ORDER BY id DESC`);
  return rows.map(map);
}

export async function addMedia(input: {
  kind: LearningMedia['kind'];
  title: string;
  creator?: string | null;
  url?: string | null;
  status?: LearningMedia['status'];
  notes?: string | null;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO learning_media (kind, title, creator, url, status, notes) VALUES (?, ?, ?, ?, ?, ?)`,
    input.kind,
    input.title.trim(),
    input.creator ?? null,
    input.url ?? null,
    input.status ?? 'todo',
    input.notes ?? null,
  );
  return result.lastInsertRowId;
}

export async function setMediaStatus(id: number, status: LearningMedia['status']): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE learning_media SET status = ? WHERE id = ?`, status, id);
}

export async function deleteMedia(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM learning_media WHERE id = ?`, id);
}
