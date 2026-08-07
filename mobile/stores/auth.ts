import { create } from 'zustand';
import { encryptionService } from '@/services/encryption';
import { resetDatabase } from '@/services/database';

export type AuthStatus = 'uninitialized' | 'locked' | 'unlocked';

export const MIN_PASSWORD_LENGTH = 6;

interface AuthState {
  status: AuthStatus;
  bootstrapped: boolean;
  error: string | null;
  init: () => Promise<void>;
  setup: (password: string) => Promise<boolean>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => Promise<void>;
  changePassword: (current: string, next: string) => Promise<boolean>;
  resetAll: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'uninitialized',
  bootstrapped: false,
  error: null,

  init: async () => {
    const initialized = await encryptionService.isInitialized();
    set({
      status: initialized ? 'locked' : 'uninitialized',
      bootstrapped: true,
      error: null,
    });
  },

  setup: async (password) => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      set({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
      return false;
    }
    try {
      await encryptionService.setup(password);
      set({ status: 'unlocked', error: null });
      return true;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Setup failed.' });
      return false;
    }
  },

  unlock: async (password) => {
    const ok = await encryptionService.unlock(password);
    if (ok) {
      set({ status: 'unlocked', error: null });
    } else {
      set({ error: 'Incorrect password.' });
    }
    return ok;
  },

  lock: async () => {
    encryptionService.lock();
    set({ status: 'locked', error: null });
  },

  changePassword: async (current, next) => {
    if (next.length < MIN_PASSWORD_LENGTH) {
      set({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
      return false;
    }
    const ok = await encryptionService.changePassword(current, next);
    if (!ok) {
      set({ error: 'Current password is incorrect.' });
    } else {
      set({ status: 'unlocked', error: null });
    }
    return ok;
  },

  resetAll: async () => {
    await resetDatabase();
    await encryptionService.reset();
    set({ status: 'uninitialized', bootstrapped: true, error: null });
  },

  clearError: () => set({ error: null }),
}));
