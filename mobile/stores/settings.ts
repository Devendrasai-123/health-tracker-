import { create } from 'zustand';
import { getSettings, setSetting } from '@/services/settings-service';
import type { AppSettings } from '@/types';

interface SettingsState {
  theme: AppSettings['theme'];
  units: AppSettings['units'];
  loaded: boolean;
  load: () => Promise<void>;
  setTheme: (theme: AppSettings['theme']) => Promise<void>;
  setUnits: (units: AppSettings['units']) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  units: 'metric',
  loaded: false,

  load: async () => {
    const settings = await getSettings();
    set({ theme: settings.theme, units: settings.units, loaded: true });
  },

  setTheme: async (theme) => {
    await setSetting('theme', theme);
    set({ theme });
  },

  setUnits: async (units) => {
    await setSetting('units', units);
    set({ units });
  },
}));
