import { getDb } from './database';
import type { KnowledgeNode } from '@/types';

interface Row {
  id: number;
  title: string;
  parent_id: number | null;
  learned: number;
  color: string;
  notes: string | null;
}

function map(row: Row): KnowledgeNode {
  return {
    id: row.id,
    title: row.title,
    parentId: row.parent_id,
    learned: !!row.learned,
    color: row.color,
    notes: row.notes,
  };
}

export async function listKnowledgeNodes(): Promise<KnowledgeNode[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(`SELECT * FROM knowledge_nodes ORDER BY id ASC`);
  return rows.map(map);
}

export async function addKnowledgeNode(input: {
  title: string;
  parentId?: number | null;
  color?: string;
  notes?: string | null;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO knowledge_nodes (title, parent_id, color, notes) VALUES (?, ?, ?, ?)`,
    input.title.trim(),
    input.parentId ?? null,
    input.color ?? '#EB5E28',
    input.notes ?? null,
  );
  return result.lastInsertRowId;
}

export async function setNodeLearned(id: number, learned: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE knowledge_nodes SET learned = ? WHERE id = ?`, learned ? 1 : 0, id);
}

export async function deleteKnowledgeNode(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM knowledge_nodes WHERE parent_id = ?`, id);
  await db.runAsync(`DELETE FROM knowledge_nodes WHERE id = ?`, id);
}
