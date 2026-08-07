import { getDb } from './database';
import { encryptionService } from './encryption';
import type { BloodTest, BloodTestInput } from '@/types';

interface BloodTestRow {
  id: number;
  date: string;
  test_type: string;
  value_enc: string;
  unit: string;
  notes_enc: string | null;
  photo_uri: string | null;
  source: string;
  created_at: string;
}

function rowToBloodTest(row: BloodTestRow): BloodTest {
  return {
    id: row.id,
    date: row.date,
    testType: row.test_type,
    value: Number(encryptionService.decrypt(row.value_enc)),
    unit: row.unit,
    notes: row.notes_enc ? encryptionService.decrypt(row.notes_enc) : null,
    photoUri: row.photo_uri,
    source: row.source as BloodTest['source'],
    createdAt: row.created_at,
  };
}

export async function addBloodTest(input: BloodTestInput): Promise<number> {
  const db = await getDb();
  const valueEnc = encryptionService.encrypt(String(input.value));
  const notesEnc = input.notes ? encryptionService.encrypt(input.notes) : null;
  const result = await db.runAsync(
    `INSERT INTO blood_tests (date, test_type, value_enc, unit, notes_enc, photo_uri, source)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.date,
    input.testType,
    valueEnc,
    input.unit ?? '',
    notesEnc,
    input.photoUri ?? null,
    input.source ?? 'manual',
  );
  return result.lastInsertRowId;
}

export async function listBloodTests(limit = 200): Promise<BloodTest[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<BloodTestRow>(
    `SELECT * FROM blood_tests ORDER BY date DESC, id DESC LIMIT ?`,
    limit,
  );
  return rows.map(rowToBloodTest);
}

export async function listBloodTestsByType(testType: string, limit = 100): Promise<BloodTest[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<BloodTestRow>(
    `SELECT * FROM blood_tests WHERE test_type = ? ORDER BY date ASC LIMIT ?`,
    testType,
    limit,
  );
  return rows.map(rowToBloodTest);
}

export async function deleteBloodTest(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM blood_tests WHERE id = ?', id);
}

export async function reencryptAll(oldKeyHex: string, newKeyHex: string): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<BloodTestRow>(`SELECT * FROM blood_tests`);
  for (const row of rows) {
    const value = encryptionService.decryptWithKey(row.value_enc, oldKeyHex);
    const valueEnc = encryptionService.encryptWithKey(value, newKeyHex);
    let notesEnc: string | null = null;
    if (row.notes_enc) {
      const notes = encryptionService.decryptWithKey(row.notes_enc, oldKeyHex);
      notesEnc = encryptionService.encryptWithKey(notes, newKeyHex);
    }
    await db.runAsync(
      `UPDATE blood_tests SET value_enc = ?, notes_enc = ? WHERE id = ?`,
      valueEnc,
      notesEnc,
      row.id,
    );
  }
}

encryptionService.setReencryptor(reencryptAll);
