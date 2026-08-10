import { create } from 'zustand';

interface UiState {
  selectedTab: string;
  isLoading: boolean;
  error: string | null;
  setTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedTab: 'dashboard',
  isLoading: false,
  error: null,

  setTab: (tab) => set({ selectedTab: tab }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
