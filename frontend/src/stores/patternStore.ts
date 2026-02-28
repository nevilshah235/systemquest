/**
 * Pattern Store — F-003 Mistake Patterns
 * Manages the AI-generated anti-pattern report on the Profile page.
 */
import { create } from 'zustand';
import { MistakePattern } from '../data/types';
import { patternsApi } from '../data/api';

interface PatternState {
  patterns: MistakePattern[];
  hasEnoughData: boolean;
  completedCount: number;
  requiredCount: number;
  isLoading: boolean;
  fetchPatterns: () => Promise<void>;
  refreshPatterns: () => Promise<void>;
}

export const usePatternStore = create<PatternState>((set) => ({
  patterns: [],
  hasEnoughData: false,
  completedCount: 0,
  requiredCount: 3,
  isLoading: false,

  fetchPatterns: async () => {
    set({ isLoading: true });
    try {
      const data = await patternsApi.get();
      set({
        patterns: data.patterns ?? [],
        hasEnoughData: data.hasEnoughData ?? false,
        completedCount: data.completedCount ?? 0,
        requiredCount: data.requiredCount ?? 3,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  refreshPatterns: async () => {
    set({ isLoading: true });
    try {
      const data = await patternsApi.refresh();
      set({
        patterns: data.patterns ?? [],
        hasEnoughData: true,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
