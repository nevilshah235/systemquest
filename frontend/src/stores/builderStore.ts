import { create } from 'zustand';
import { Architecture, ArchitectureComponent, Connection, ComponentType } from '../data/types';

interface BuilderState {
  architecture: Architecture;
  selectedComponentId: string | null;
  isDirty: boolean;
  addComponent: (type: ComponentType, x: number, y: number) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  removeComponent: (id: string) => void;
  addConnection: (from: string, to: string) => void;
  removeConnection: (id: string) => void;
  setSelectedComponent: (id: string | null) => void;
  loadArchitecture: (arch: Architecture) => void;
  resetArchitecture: () => void;
  markClean: () => void;
}

const emptyArchitecture: Architecture = { components: [], connections: [] };

export const useBuilderStore = create<BuilderState>()((set) => ({
  architecture: emptyArchitecture,
  selectedComponentId: null,
  isDirty: false,

  addComponent: (type, x, y) =>
    set((s) => {
      const id = `${type}-${Date.now()}`;
      const newComp: ArchitectureComponent = { id, type, x, y };
      return {
        architecture: { ...s.architecture, components: [...s.architecture.components, newComp] },
        isDirty: true,
      };
    }),

  moveComponent: (id, x, y) =>
    set((s) => ({
      architecture: {
        ...s.architecture,
        components: s.architecture.components.map((c) => (c.id === id ? { ...c, x, y } : c)),
      },
      isDirty: true,
    })),

  removeComponent: (id) =>
    set((s) => ({
      architecture: {
        components: s.architecture.components.filter((c) => c.id !== id),
        connections: s.architecture.connections.filter((cn) => cn.from !== id && cn.to !== id),
      },
      selectedComponentId: s.selectedComponentId === id ? null : s.selectedComponentId,
      isDirty: true,
    })),

  addConnection: (from, to) =>
    set((s) => {
      // Prevent duplicate connections
      const exists = s.architecture.connections.some((c) => c.from === from && c.to === to);
      if (exists) return s;
      const conn: Connection = { id: `conn-${Date.now()}`, from, to };
      return {
        architecture: { ...s.architecture, connections: [...s.architecture.connections, conn] },
        isDirty: true,
      };
    }),

  removeConnection: (id) =>
    set((s) => ({
      architecture: {
        ...s.architecture,
        connections: s.architecture.connections.filter((c) => c.id !== id),
      },
      isDirty: true,
    })),

  setSelectedComponent: (id) => set({ selectedComponentId: id }),

  loadArchitecture: (arch) => set({ architecture: arch, isDirty: false }),

  resetArchitecture: () => set({ architecture: emptyArchitecture, selectedComponentId: null, isDirty: false }),

  markClean: () => set({ isDirty: false }),
}));
