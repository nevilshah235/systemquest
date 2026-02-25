import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ComponentPalette } from './ComponentPalette';
import { ArchitectureCanvas } from './ArchitectureCanvas';
import { useBuilderStore } from '../../stores/builderStore';
import { Mission, ComponentType, COMPONENT_META, Architecture } from '../../data/types';
import { missionsApi } from '../../data/api';

interface DragDropBuilderProps {
  mission: Mission;
  onSimulate: () => void;
  isSimulating: boolean;
}

const GRID_SIZE = 40;
const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

// ── Hint types ────────────────────────────────────────────────────────────────
type HintType = 'gap' | 'tip' | 'good';

interface Hint {
  type: HintType;
  text: string;
  /** If set, the palette item for this component will be highlighted */
  componentType?: ComponentType;
}

/** Extract a ComponentType from free-form hint text via keyword matching */
function extractComponentType(text: string): ComponentType | undefined {
  const t = text.toLowerCase();
  if (t.includes('load balanc')) return 'loadbalancer';
  if (t.includes('api gateway')) return 'apigateway';
  if (t.includes('monitoring') || t.includes('monitor'))  return 'monitoring';
  if (t.includes('database') || t.includes(' db '))       return 'database';
  if (t.includes('cache') || t.includes('cach'))          return 'cache';
  if (t.includes('cdn') || t.includes('content delivery')) return 'cdn';
  if (t.includes('queue'))   return 'queue';
  if (t.includes('storage')) return 'storage';
  if (t.includes('server'))  return 'server';
  if (t.includes('client'))  return 'client';
  return undefined;
}

const HINT_META: Record<HintType, { icon: string; label: string; classes: string }> = {
  gap:  { icon: '⚠️', label: 'Gap',        classes: 'text-orange-300 bg-orange-500/10 border-orange-500/20' },
  tip:  { icon: '💡', label: 'Tip',        classes: 'text-amber-200  bg-amber-500/10  border-amber-500/20'  },
  good: { icon: '✅', label: 'Looking good', classes: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
};

/** Generates context-aware hints based on current canvas state */
function getContextHints(architecture: Architecture, mission: Mission): Hint[] {
  const placedTypes = new Set(architecture.components.map((c) => c.type));
  const hints: Hint[] = [];

  // 1. Gaps — missing required components (with componentType for palette highlight)
  for (const req of mission.requirements.required) {
    if (!placedTypes.has(req)) {
      const meta = COMPONENT_META[req];
      hints.push({
        type: 'gap',
        text: `Add ${meta.label} ${meta.icon} — ${meta.description}`,
        componentType: req as ComponentType,
      });
    }
  }

  // 2. No connections yet (but ≥2 components placed)
  if (architecture.components.length >= 2 && architecture.connections.length === 0) {
    hints.push({
      type: 'tip',
      text: 'Connect your components — hover a card and drag from the edge handles to show how data flows between them.',
    });
  }

  // 3. Mission-specific hints with auto-extracted component type for palette highlight
  for (const h of mission.components.hints) {
    hints.push({ type: 'tip', text: h, componentType: extractComponentType(h) });
  }

  // 4. All-clear message
  if (hints.length === 0) {
    hints.push({ type: 'good', text: 'Architecture looks solid! Hit ▶ Run Simulation to test it.' });
  }

  return hints;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
const UndoToast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => (
  <div
    className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl
      bg-gray-800 border border-gray-700 text-xs text-gray-200 shadow-xl
      transition-all duration-300 pointer-events-none
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
  >
    {message}
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────
export const DragDropBuilder: React.FC<DragDropBuilderProps> = ({ mission, onSimulate, isSimulating }) => {
  const { addComponent, architecture, isDirty, markClean, past, future, undo, redo, lastActionLabel } = useBuilderStore();
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeType, setActiveType] = useState<ComponentType | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintIdx, setHintIdx] = useState(0);

  // Toast state
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (!msg) return;
    setToast(msg);
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2000);
  }, []);

  // Show toast whenever lastActionLabel changes (undo/redo)
  const prevLabelRef = useRef('');
  useEffect(() => {
    if (lastActionLabel && lastActionLabel !== prevLabelRef.current) {
      showToast(lastActionLabel);
      prevLabelRef.current = lastActionLabel;
    }
  }, [lastActionLabel, showToast]);

  // Keyboard shortcuts: Ctrl+Z = undo, Ctrl+Y / Ctrl+Shift+Z = redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useBuilderStore.getState().undo();
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        useBuilderStore.getState().redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  // Recompute hints whenever architecture changes; reset index to 0 on change
  const hints = useMemo(() => getContextHints(architecture, mission), [architecture, mission]);
  const prevHintsRef = useRef(hints);
  useEffect(() => {
    if (prevHintsRef.current !== hints) {
      setHintIdx(0);
      prevHintsRef.current = hints;
    }
  }, [hints]);

  // Auto-save every 30 seconds when dirty
  useEffect(() => {
    if (!isDirty) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      try {
        await missionsApi.save(mission.slug, architecture);
        markClean();
      } catch {
        // Silent auto-save failure
      }
    }, 30000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [isDirty, architecture, mission.slug, markClean]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveType((event.active.data.current?.type as ComponentType) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveType(null);
    const { active, over } = event;
    if (!over || over.id !== 'canvas') return;
    const data = active.data.current;
    if (!data?.fromPalette) return;

    const translated = active.rect.current.translated;
    const canvasRect = over.rect;
    if (!translated) return;

    const x = snap(Math.max(0, translated.left - canvasRect.left));
    const y = snap(Math.max(0, translated.top  - canvasRect.top));
    addComponent(data.type as ComponentType, x, y);
  };

  const placedTypes = architecture.components.map((c) => c.type);
  const requiredMet = mission.requirements.required.every((r) => placedTypes.includes(r));

  const currentHint = hints[hintIdx] ?? hints[0];
  const hintMeta    = HINT_META[currentHint.type];
  const totalHints  = hints.length;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col">

        {/* ── Builder toolbar ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {architecture.components.length} components · {architecture.connections.length} connections
            </span>
            {isDirty && <span className="text-xs text-amber-400">● Unsaved</span>}
          </div>
          <div className="flex items-center gap-2">
            {/* Undo / Redo */}
            <button
              className="btn-ghost text-sm px-2 disabled:opacity-30"
              onClick={() => useBuilderStore.getState().undo()}
              disabled={past.length === 0}
              title="Undo (Ctrl+Z)"
            >
              ↩
            </button>
            <button
              className="btn-ghost text-sm px-2 disabled:opacity-30"
              onClick={() => useBuilderStore.getState().redo()}
              disabled={future.length === 0}
              title="Redo (Ctrl+Y)"
            >
              ↪
            </button>
            <div className="w-px h-4 bg-gray-700" />
            <button className="btn-ghost text-sm" onClick={() => useBuilderStore.getState().resetArchitecture()}>
              Reset
            </button>
            <button
              disabled={!requiredMet || isSimulating}
              onClick={onSimulate}
              className="btn-primary text-sm"
              title={
                !requiredMet
                  ? `Add required: ${mission.requirements.required.filter(r => !placedTypes.includes(r)).join(', ')}`
                  : 'Run simulation'
              }
            >
              {isSimulating ? '⏳ Simulating…' : '▶ Run Simulation'}
            </button>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div className="flex-1 flex overflow-hidden">
          <div className="w-52 flex-shrink-0 border-r border-gray-800 overflow-y-auto">
            {/* Pass highlighted type from current hint — auto-scrolls and glows matching palette item */}
            <ComponentPalette
              availableTypes={mission.components.available}
              highlightedType={showHint ? (currentHint.componentType ?? null) : null}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <ArchitectureCanvas requiredComponents={mission.requirements.required} />
          </div>
        </div>

        {/* ── Smart hint footer ── */}
        <div className="border-t border-gray-800 bg-gray-900/60">
          {/* Toggle bar */}
          <button
            onClick={() => setShowHint((s) => !s)}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            <span>{hintMeta.icon}</span>
            <span className="font-medium">
              {showHint ? 'Hide hints' : 'Need a hint?'}
            </span>
            {/* Live gap badge when collapsed */}
            {!showHint && currentHint.type === 'gap' && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-semibold">
                {hints.filter(h => h.type === 'gap').length} gap{hints.filter(h => h.type === 'gap').length !== 1 ? 's' : ''}
              </span>
            )}
            <span className={`ml-auto transition-transform duration-200 ${showHint ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {/* Expanded panel */}
          {showHint && (
            <div className={`mx-3 mb-3 rounded-xl border px-4 py-3 ${hintMeta.classes}`}>
              {/* Header row */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {hintMeta.label}
                </span>
                {totalHints > 1 && (
                  <span className="text-[10px] opacity-60 font-mono">
                    {hintIdx + 1} / {totalHints}
                  </span>
                )}
              </div>

              {/* Hint text */}
              <p className="text-xs leading-relaxed">
                {currentHint.text}
              </p>

              {/* Navigation */}
              {totalHints > 1 && (
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    onClick={() => setHintIdx((i) => (i - 1 + totalHints) % totalHints)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-black/20 hover:bg-black/40 transition-colors disabled:opacity-30"
                    disabled={hintIdx === 0}
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setHintIdx((i) => (i + 1) % totalHints)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-black/20 hover:bg-black/40 transition-colors disabled:opacity-30"
                    disabled={hintIdx === totalHints - 1}
                  >
                    Next →
                  </button>
                  {/* Dot indicators */}
                  <div className="flex items-center gap-1 ml-auto">
                    {hints.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setHintIdx(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === hintIdx ? 'bg-current opacity-100 scale-125' : 'bg-current opacity-30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Undo/redo toast ── */}
      <UndoToast message={toast} visible={toastVisible} />

      {/* ── Drag overlay ── */}
      <DragOverlay dropAnimation={null}>
        {activeType ? (
          <div className="flex flex-col items-center justify-center w-24 h-20 rounded-xl border-2 border-brand-500 bg-brand-900/80 shadow-2xl shadow-brand-500/30 opacity-90 pointer-events-none">
            <span className="text-2xl mb-1">{COMPONENT_META[activeType].icon}</span>
            <span className="text-xs font-semibold text-white">{COMPONENT_META[activeType].label}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
