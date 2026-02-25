import { create } from 'zustand';
import { Mission, SimulationMetrics } from '../data/types';
import { missionsApi, simulationApi } from '../data/api';
import { useBuilderStore } from './builderStore';

type MissionPhase = 'briefing' | 'requirements' | 'builder' | 'results';

interface MissionState {
  missions: Mission[];
  activeMission: Mission | null;
  phase: MissionPhase;
  simulationMetrics: SimulationMetrics | null;
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
      set({ simulationMetrics: result.metrics, phase: 'results', isSimulating: false });
      useBuilderStore.getState().markClean();
    } catch {
      set({ error: 'Simulation failed', isSimulating: false });
    }
  },

  resetMission: () => {
    useBuilderStore.getState().resetArchitecture();
    set({ activeMission: null, phase: 'briefing', simulationMetrics: null });
  },
}));
