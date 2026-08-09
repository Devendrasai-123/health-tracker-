import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '@/services/supabase';

export type SupabaseAuthStatus = 'uninitialized' | 'signedOut' | 'signedIn';

interface SupabaseAuthState {
  status: SupabaseAuthStatus;
  user: User | null;
  session: Session | null;
  error: string | null;
  busy: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

let initialized = false;

export const useSupabaseAuthStore = create<SupabaseAuthState>((set, get) => ({
  status: 'uninitialized',
  user: null,
  session: null,
  error: null,
  busy: false,

  init: async () => {
    if (initialized) return;
    initialized = true;

    const client = getSupabase();
    if (!client) {
      set({ status: 'signedOut', user: null, session: null });
      return;
    }

    const { data } = await client.auth.getSession();
    set({
      status: data.session ? 'signedIn' : 'signedOut',
      user: data.session?.user ?? null,
      session: data.session ?? null,
    });

    client.auth.onAuthStateChange((_event, session) => {
      set({
        status: session ? 'signedIn' : 'signedOut',
        user: session?.user ?? null,
        session: session ?? null,
      });
    });
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured()) {
      set({ error: 'Supabase is not configured. Add your keys to .env' });
      return false;
    }
    set({ busy: true, error: null });
    try {
      const client = getSupabase()!;
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        set({ error: error.message, busy: false });
        return false;
      }
      set({ busy: false, error: null });
      return true;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Sign in failed.', busy: false });
      return false;
    }
  },

  signUp: async (email, password) => {
    if (!isSupabaseConfigured()) {
      set({ error: 'Supabase is not configured. Add your keys to .env' });
      return false;
    }
    set({ busy: true, error: null });
    try {
      const client = getSupabase()!;
      const { error } = await client.auth.signUp({ email, password });
      if (error) {
        set({ error: error.message, busy: false });
        return false;
      }
      set({ busy: false, error: null });
      return true;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Sign up failed.', busy: false });
      return false;
    }
  },

  signOut: async () => {
    const client = getSupabase();
    if (client) {
      await client.auth.signOut();
    }
    set({ status: 'signedOut', user: null, session: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
