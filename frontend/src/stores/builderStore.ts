import { create } from 'zustand';
import { Architecture, ArchitectureComponent, Connection, ComponentType, COMPONENT_META } from '../data/types';

const MAX_HISTORY = 50;

interface BuilderState {
  architecture: Architecture;
  selectedComponentId: string | null;
  isDirty: boolean;

  // Undo / redo stacks
  past: Architecture[];
  future: Architecture[];
  lastActionLabel: string;

  // Drag batching — snapshot taken before a drag begins
  moveSnapshot: Architecture | null;

  // Structural actions
  addComponent: (type: ComponentType, x: number, y: number) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  removeComponent: (id: string) => void;
  addConnection: (from: string, to: string, label?: string) => void;
  updateConnectionLabel: (id: string, label: string) => void;
  removeConnection: (id: string) => void;

  // Drag batching
  startDrag: () => void;
  commitMove: (id: string) => void;

  // Undo / redo
  undo: () => void;
  redo: () => void;

  // Selection / lifecycle
  setSelectedComponent: (id: string | null) => void;
  loadArchitecture: (arch: Architecture) => void;
  resetArchitecture: () => void;
  markClean: () => void;
}

const emptyArchitecture: Architecture = { components: [], connections: [] };

/** Push current state onto the past stack, clear future, cap at MAX_HISTORY */
function withHistory(
  past: Architecture[],
  current: Architecture,
  label: string,
  nextArch: Architecture
): Partial<BuilderState> {
  const newPast = [...past, current].slice(-MAX_HISTORY);
  return { past: newPast, future: [], lastActionLabel: label, architecture: nextArch, isDirty: true };
}

export const useBuilderStore = create<BuilderState>()((set, get) => ({
  architecture: emptyArchitecture,
  selectedComponentId: null,
  isDirty: false,
  past: [],
  future: [],
  lastActionLabel: '',
  moveSnapshot: null,

  // ── Structural actions ──────────────────────────────────────────────────────

  addComponent: (type, x, y) =>
    set((s) => {
      const id = `${type}-${Date.now()}`;
      const newComp: ArchitectureComponent = { id, type, x, y };
      const nextArch: Architecture = {
        ...s.architecture,
        components: [...s.architecture.components, newComp],
      };
      const label = `Added ${COMPONENT_META[type].label}`;
      return withHistory(s.past, s.architecture, label, nextArch);
    }),

  /** Called on every mousemove — only updates position, does NOT touch history.
   *  History is managed by startDrag / commitMove. */
  moveComponent: (id, x, y) =>
    set((s) => ({
      architecture: {
        ...s.architecture,
        components: s.architecture.components.map((c) => (c.id === id ? { ...c, x, y } : c)),
      },
      isDirty: true,
    })),

  removeComponent: (id) =>
    set((s) => {
      const comp = s.architecture.components.find((c) => c.id === id);
      const label = comp ? `Removed ${COMPONENT_META[comp.type].label}` : 'Removed component';
      const nextArch: Architecture = {
        components: s.architecture.components.filter((c) => c.id !== id),
        connections: s.architecture.connections.filter((cn) => cn.from !== id && cn.to !== id),
      };
      return {
        ...withHistory(s.past, s.architecture, label, nextArch),
        selectedComponentId: s.selectedComponentId === id ? null : s.selectedComponentId,
      };
    }),

  addConnection: (from, to, label) =>
    set((s) => {
      const exists = s.architecture.connections.some((c) => c.from === from && c.to === to);
      if (exists) return s;
      const conn: Connection = { id: `conn-${Date.now()}`, from, to, label };
      const nextArch: Architecture = {
        ...s.architecture,
        connections: [...s.architecture.connections, conn],
      };
      return withHistory(s.past, s.architecture, 'Connected components', nextArch);
    }),

  updateConnectionLabel: (id, label) =>
    set((s) => {
      const nextArch: Architecture = {
        ...s.architecture,
        connections: s.architecture.connections.map((c) => (c.id === id ? { ...c, label } : c)),
      };
      return withHistory(s.past, s.architecture, 'Updated label', nextArch);
    }),

  removeConnection: (id) =>
    set((s) => {
      const nextArch: Architecture = {
        ...s.architecture,
        connections: s.architecture.connections.filter((c) => c.id !== id),
      };
      return withHistory(s.past, s.architecture, 'Removed connection', nextArch);
    }),

  // ── Drag batching ───────────────────────────────────────────────────────────

  /** Call at the start of a component drag — snapshots current state */
  startDrag: () =>
    set((s) => ({ moveSnapshot: s.architecture })),

  /** Call at the end of a drag — pushes pre-drag snapshot to history */
  commitMove: (id) =>
    set((s) => {
      if (!s.moveSnapshot) return { moveSnapshot: null };
      const comp = s.architecture.components.find((c) => c.id === id);
      const label = comp ? `Moved ${COMPONENT_META[comp.type].label}` : 'Moved component';
      const newPast = [...s.past, s.moveSnapshot].slice(-MAX_HISTORY);
      return { past: newPast, future: [], lastActionLabel: label, moveSnapshot: null, isDirty: true };
    }),

  // ── Undo / redo ─────────────────────────────────────────────────────────────

  undo: () =>
    set((s) => {
      if (s.past.length === 0) return { lastActionLabel: '' };
      const prev = s.past[s.past.length - 1];
      const newPast = s.past.slice(0, -1);
      const newFuture = [s.architecture, ...s.future].slice(0, MAX_HISTORY);
      return {
        architecture: prev,
        past: newPast,
        future: newFuture,
        lastActionLabel: `Undo: ${s.lastActionLabel || 'last action'}`,
        isDirty: true,
      };
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0) return { lastActionLabel: '' };
      const next = s.future[0];
      const newFuture = s.future.slice(1);
      const newPast = [...s.past, s.architecture].slice(-MAX_HISTORY);
      return {
        architecture: next,
        past: newPast,
        future: newFuture,
        lastActionLabel: `Redo`,
        isDirty: true,
      };
    }),

  // ── Selection / lifecycle ───────────────────────────────────────────────────

  setSelectedComponent: (id) => set({ selectedComponentId: id }),

  loadArchitecture: (arch) =>
    set({ architecture: arch, isDirty: false, past: [], future: [], lastActionLabel: '' }),

  resetArchitecture: () =>
    set((s) => ({
      ...withHistory(s.past, s.architecture, 'Reset architecture', emptyArchitecture),
      selectedComponentId: null,
    })),

  markClean: () => set({ isDirty: false }),
}));
