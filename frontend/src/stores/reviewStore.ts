/**
 * Review Store — F-005 Spaced Repetition
 * Manages the due-for-review queue on the dashboard.
 */
import { create } from 'zustand';
import { ReviewQueueItem } from '../data/types';
import { reviewApi } from '../data/api';

interface ReviewState {
  queue: ReviewQueueItem[];
  dueCount: number;
  totalCount: number;
  isLoading: boolean;
  fetchQueue: () => Promise<void>;
  snoozeItem: (missionSlug: string) => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  queue: [],
  dueCount: 0,
  totalCount: 0,
  isLoading: false,

  fetchQueue: async () => {
    set({ isLoading: true });
    try {
      const data = await reviewApi.getFullQueue();
      const queue: ReviewQueueItem[] = data.queue ?? [];
      set({
        queue,
        dueCount: data.dueCount ?? 0,
        totalCount: data.count ?? 0,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  snoozeItem: async (missionSlug: string) => {
    try {
      await reviewApi.snooze(missionSlug);
      // Re-fetch to get updated queue
      await get().fetchQueue();
    } catch {
      // Silently fail — item stays visible until next fetch
    }
  },
}));
