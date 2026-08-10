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

  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payload TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'daily_summary',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue (created_at);
  `,
  // v2 — todos, hydration, wardrobe, grooming
  `
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    due_date TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS hydration_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount_ml INTEGER NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_hydration_date ON hydration_log (date);

  CREATE TABLE IF NOT EXISTS wardrobe_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    photo_uri TEXT,
    color TEXT,
    brand TEXT,
    notes TEXT,
    favorite INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_wardrobe_category ON wardrobe_items (category);

  CREATE TABLE IF NOT EXISTS grooming_routines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'skincare',
    time_of_day TEXT,
    schedule_days TEXT,
    notes TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  `,
  // v3 — brain knowledge, education, finance
  `
  CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    parent_id INTEGER,
    learned INTEGER NOT NULL DEFAULT 0,
    color TEXT NOT NULL DEFAULT '#EB5E28',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (parent_id) REFERENCES knowledge_nodes(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_knowledge_parent ON knowledge_nodes (parent_id);

  CREATE TABLE IF NOT EXISTS learning_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    creator TEXT,
    url TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    level INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS education_marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    exam TEXT,
    score REAL NOT NULL,
    max_score REAL NOT NULL DEFAULT 100,
    date TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS college_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT,
    status TEXT,
    hours REAL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS finance_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    source TEXT,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_finance_date ON finance_transactions (date);

  CREATE TABLE IF NOT EXISTS finance_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    next_due TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT,
    quantity REAL NOT NULL,
    avg_cost REAL NOT NULL,
    current_price REAL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
    DROP TABLE IF EXISTS sync_queue;
    DROP TABLE IF EXISTS todos;
    DROP TABLE IF EXISTS hydration_log;
    DROP TABLE IF EXISTS wardrobe_items;
    DROP TABLE IF EXISTS grooming_routines;
    DROP TABLE IF EXISTS knowledge_nodes;
    DROP TABLE IF EXISTS learning_media;
    DROP TABLE IF EXISTS skills;
    DROP TABLE IF EXISTS education_marks;
    DROP TABLE IF EXISTS college_activities;
    DROP TABLE IF EXISTS finance_transactions;
    DROP TABLE IF EXISTS finance_subscriptions;
    DROP TABLE IF EXISTS investments;
  `);
  await fresh.closeAsync();
  db = null;
  await getDb();
}
