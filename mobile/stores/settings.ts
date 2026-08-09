import { create } from 'zustand';
import { getSettings, setSetting } from '@/services/settings-service';
import type { AppSettings } from '@/types';

interface SettingsState {
  theme: AppSettings['theme'];
  units: AppSettings['units'];
  syncEnabled: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  setTheme: (theme: AppSettings['theme']) => Promise<void>;
  setUnits: (units: AppSettings['units']) => Promise<void>;
  setSyncEnabled: (enabled: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  units: 'metric',
  syncEnabled: false,
  loaded: false,

  load: async () => {
    const settings = await getSettings();
    set({ theme: settings.theme, units: settings.units, syncEnabled: settings.syncEnabled, loaded: true });
  },

  setTheme: async (theme) => {
    await setSetting('theme', theme);
    set({ theme });
  },

  setUnits: async (units) => {
    await setSetting('units', units);
    set({ units });
  },

  setSyncEnabled: async (enabled) => {
    await setSetting('syncEnabled', String(enabled));
    set({ syncEnabled: enabled });
  },
}));
