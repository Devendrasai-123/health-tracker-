import { getDb } from './database';
import type { TodoItem } from '@/types';

interface Row {
  id: number;
  title: string;
  done: number;
  due_date: string | null;
  category: string;
  created_at: string;
}

function mapRow(row: Row): TodoItem {
  return {
    id: row.id,
    title: row.title,
    done: !!row.done,
    dueDate: row.due_date,
    category: row.category,
    createdAt: row.created_at,
  };
}

export async function listTodos(): Promise<TodoItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    `SELECT * FROM todos ORDER BY done ASC, id DESC`,
  );
  return rows.map(mapRow);
}

export async function addTodo(title: string, category = 'general', dueDate?: string | null): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO todos (title, category, due_date) VALUES (?, ?, ?)`,
    title.trim(),
    category,
    dueDate ?? null,
  );
  return result.lastInsertRowId;
}

export async function setTodoDone(id: number, done: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE todos SET done = ? WHERE id = ?`, done ? 1 : 0, id);
}

export async function deleteTodo(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM todos WHERE id = ?`, id);
}
