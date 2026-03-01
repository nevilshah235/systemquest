import { create } from 'zustand';
import { Mission, SimulationMetrics } from '../data/types';
import { missionsApi, simulationApi } from '../data/api';
import { useBuilderStore } from './builderStore';
import { useAuthStore } from './authStore';

export type MissionPhase = 'briefing' | 'requirements' | 'builder' | 'results' | 'lld';

interface MissionState {
  missions: Mission[];
  activeMission: Mission | null;
  phase: MissionPhase;
  simulationMetrics: SimulationMetrics | null;
  simulationXpGranted: number;   // actual XP added this run (0 on re-runs)
  isLoading: boolean;
  isSimulating: boolean;
  error: string | null;
  fetchMissions: () => Promise<void>;
  startMission: (slug: string) => Promise<void>;
  setPhase: (phase: MissionPhase) => void;
  runSimulation: () => Promise<void>;
  resetMission: () => void;
}

export const useMissionStore = create<MissionState>()((set, get) => ({
  missions: [],
  activeMission: null,
  phase: 'briefing',
  simulationMetrics: null,
  simulationXpGranted: 0,
  isLoading: false,
  isSimulating: false,
  error: null,

  fetchMissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const missions = await missionsApi.list();
      set({ missions, isLoading: false });
    } catch {
      set({ error: 'Failed to load missions', isLoading: false });
    }
  },

  startMission: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      const mission = await missionsApi.get(slug);
      const builder = useBuilderStore.getState();
      builder.resetArchitecture();
      // Restore saved architecture if exists
      if (mission.savedArchitecture) {
        builder.loadArchitecture(mission.savedArchitecture);
      }
      set({ activeMission: mission, phase: 'briefing', simulationMetrics: null, isLoading: false });
    } catch {
      set({ error: 'Failed to load mission', isLoading: false });
    }
  },

  setPhase: (phase) => set({ phase }),

  runSimulation: async () => {
    const { activeMission } = get();
    if (!activeMission) return;
    set({ isSimulating: true, error: null });
    try {
      const architecture = useBuilderStore.getState().architecture;
      const result = await simulationApi.run(activeMission.slug, architecture);
      set({
        simulationMetrics: result.metrics,
        simulationXpGranted: result.xpGranted ?? 0,
        phase: 'results',
        isSimulating: false,
      });
      useBuilderStore.getState().markClean();
      // Sync XP and level into authStore so navbar/dashboard reflect the latest values
      if (result.user) {
        useAuthStore.getState().updateUser({ xp: result.user.xp, level: result.user.level });
      }
    } catch {
      set({ error: 'Simulation failed', isSimulating: false });
    }
  },

  resetMission: () => {
    useBuilderStore.getState().resetArchitecture();
    set({ activeMission: null, phase: 'briefing', simulationMetrics: null, simulationXpGranted: 0 });
  },
}));
