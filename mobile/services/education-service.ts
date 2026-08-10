import { getDb } from './database';
import type { CollegeActivity, EducationMark, Skill } from '@/types';

export async function listSkills(): Promise<Skill[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    category: string;
    level: number;
    notes: string | null;
  }>(`SELECT * FROM skills ORDER BY level DESC, id DESC`);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    level: r.level,
    notes: r.notes,
  }));
}

export async function addSkill(input: {
  name: string;
  category?: string;
  level?: number;
  notes?: string | null;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO skills (name, category, level, notes) VALUES (?, ?, ?, ?)`,
    input.name.trim(),
    input.category ?? 'general',
    input.level ?? 1,
    input.notes ?? null,
  );
  return result.lastInsertRowId;
}

export async function deleteSkill(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM skills WHERE id = ?`, id);
}

export async function listMarks(): Promise<EducationMark[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    subject: string;
    exam: string | null;
    score: number;
    max_score: number;
    date: string | null;
    notes: string | null;
  }>(`SELECT * FROM education_marks ORDER BY date DESC, id DESC`);
  return rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    exam: r.exam,
    score: r.score,
    maxScore: r.max_score,
    date: r.date,
    notes: r.notes,
  }));
}

export async function addMark(input: {
  subject: string;
  exam?: string | null;
  score: number;
  maxScore?: number;
  date?: string | null;
  notes?: string | null;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO education_marks (subject, exam, score, max_score, date, notes) VALUES (?, ?, ?, ?, ?, ?)`,
    input.subject.trim(),
    input.exam ?? null,
    input.score,
    input.maxScore ?? 100,
    input.date ?? null,
    input.notes ?? null,
  );
  return result.lastInsertRowId;
}

export async function deleteMark(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM education_marks WHERE id = ?`, id);
}

export async function listCollegeActivities(kind?: CollegeActivity['kind']): Promise<CollegeActivity[]> {
  const db = await getDb();
  const rows = kind
    ? await db.getAllAsync<{
        id: number;
        kind: string;
        title: string;
        date: string | null;
        status: string | null;
        hours: number | null;
        notes: string | null;
      }>(`SELECT * FROM college_activities WHERE kind = ? ORDER BY date DESC, id DESC`, kind)
    : await db.getAllAsync<{
        id: number;
        kind: string;
        title: string;
        date: string | null;
        status: string | null;
        hours: number | null;
        notes: string | null;
      }>(`SELECT * FROM college_activities ORDER BY date DESC, id DESC`);
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind as CollegeActivity['kind'],
    title: r.title,
    date: r.date,
    status: r.status,
    hours: r.hours,
    notes: r.notes,
  }));
}

export async function addCollegeActivity(input: {
  kind: CollegeActivity['kind'];
  title: string;
  date?: string | null;
  status?: string | null;
  hours?: number | null;
  notes?: string | null;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO college_activities (kind, title, date, status, hours, notes) VALUES (?, ?, ?, ?, ?, ?)`,
    input.kind,
    input.title.trim(),
    input.date ?? null,
    input.status ?? null,
    input.hours ?? null,
    input.notes ?? null,
  );
  return result.lastInsertRowId;
}

export async function deleteCollegeActivity(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM college_activities WHERE id = ?`, id);
}
