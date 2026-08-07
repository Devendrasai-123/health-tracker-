import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDb } from './database';
import { encryptionService } from './encryption';
import { listBloodTests } from './blood-test-service';
import { listFoodBetween } from './meal-service';
import { listWorkouts } from './workout-service';
import { listDailyMetricsBetween, listRecentMetrics } from './metrics-service';
import { getSettings } from './settings-service';

export async function exportAllData(): Promise<{ uri: string; fileSize: number }> {
  const db = await getDb();

  const bloodTests = await listBloodTests(100000);
  const metrics = await listRecentMetrics(20000);
  const food = await listFoodBetween('1970-01-01', '2999-12-31');
  const workouts = await listWorkouts(100000);

  const settingsRows = await db.getAllAsync<{ key: string; value: string }>(`SELECT * FROM settings`);

  const payload = {
    app: 'lif.os',
    exportedAt: new Date().toISOString(),
    encryptedAtRest: true,
    settings: await getSettings(),
    settingsRows,
    bloodTests,
    dailyMetrics: metrics,
    foodLog: food,
    workouts,
  };

  const json = JSON.stringify(payload, null, 2);
  const file = new File(Paths.document, `lifos-export-${Date.now()}.json`);
  file.create({ overwrite: true });
  file.write(json);
  const info = file.info();
  return { uri: file.uri, fileSize: info.size ?? json.length };
}

export async function shareExport(): Promise<{ uri: string } | null> {
  const { uri } = await exportAllData();
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export lif.os data',
    UTI: 'public.json',
  });
  return { uri };
}

export function isUnlockedForExport(): boolean {
  return encryptionService.isUnlocked();
}
