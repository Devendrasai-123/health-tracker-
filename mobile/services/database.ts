import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'lifos.db';

const MIGRATIONS: string[] = [
  `
  PRAGMA journal_mode = 'wal';
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS blood_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    test_type TEXT NOT NULL,
    value_enc TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT '',
    notes_enc TEXT,
    photo_uri TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_blood_tests_date ON blood_tests (date);
  CREATE INDEX IF NOT EXISTS idx_blood_tests_type ON blood_tests (test_type);

  CREATE TABLE IF NOT EXISTS daily_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    heart_rate INTEGER,
    steps INTEGER,
    sleep_hours REAL,
    stress INTEGER,
    weight REAL,
    recovery_score INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS food_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    meal_type TEXT NOT NULL DEFAULT 'snack',
    name TEXT NOT NULL,
    calories INTEGER,
    protein REAL,
    carbs REAL,
    fat REAL,
    photo_uri TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_food_date ON food_log (date);

  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    name TEXT NOT NULL,
    duration_min INTEGER,
    intensity INTEGER,
    calories INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts (date);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  `,
];

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  const instance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await migrate(instance);
  db = instance;
  return db;
}

async function migrate(instance: SQLite.SQLiteDatabase): Promise<void> {
  let { user_version: version } =
    (await instance.getFirstAsync<{ user_version: number }>('PRAGMA user_version')) ?? {
      user_version: 0,
    };
  for (let i = version; i < MIGRATIONS.length; i++) {
    await instance.execAsync(MIGRATIONS[i]);
    await instance.execAsync(`PRAGMA user_version = ${i + 1}`);
  }
}

export async function resetDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
  const fresh = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await fresh.execAsync(`
    DROP TABLE IF EXISTS blood_tests;
    DROP TABLE IF EXISTS daily_metrics;
    DROP TABLE IF EXISTS food_log;
    DROP TABLE IF EXISTS workouts;
    DROP TABLE IF EXISTS settings;
  `);
  await fresh.closeAsync();
  db = null;
  await getDb();
}
