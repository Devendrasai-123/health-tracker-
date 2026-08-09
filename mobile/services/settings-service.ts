import { getDb } from './database';
import type { AppSettings } from '@/types';

const DEFAULTS: AppSettings = {
  theme: 'system',
  units: 'metric',
  syncEnabled: false,
};

export async function getSetting(key: keyof AppSettings): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = ?`,
    key,
  );
  return row?.value ?? null;
}

export async function setSetting(key: keyof AppSettings, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value,
  );
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>(`SELECT * FROM settings`);
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  const theme = (map.theme as AppSettings['theme']) ?? DEFAULTS.theme;
  const units = (map.units as AppSettings['units']) ?? DEFAULTS.units;
  return {
    theme: ['light', 'dark', 'system'].includes(theme) ? theme : DEFAULTS.theme,
    units: units === 'imperial' ? 'imperial' : 'metric',
    syncEnabled: map.syncEnabled === 'true',
  };
}
