import React, { useEffect, useRef, useState } from 'react';
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
import { Mission, ComponentType, COMPONENT_META } from '../../data/types';
import { missionsApi } from '../../data/api';

interface DragDropBuilderProps {
  mission: Mission;
  onSimulate: () => void;
  isSimulating: boolean;
}

const GRID_SIZE = 40;
const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

export const DragDropBuilder: React.FC<DragDropBuilderProps> = ({ mission, onSimulate, isSimulating }) => {
  const { addComponent, architecture, isDirty, markClean } = useBuilderStore();
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeType, setActiveType] = useState<ComponentType | null>(null);
  const [showHint, setShowHint]     = useState(false);
  const hintIndex = useRef(Math.floor(Math.random() * mission.components.hints.length));

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

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

    // Only handle drops onto the canvas droppable zone
    if (!over || over.id !== 'canvas') return;

    const data = active.data.current;
    if (!data?.fromPalette) return;

    // Calculate drop position relative to canvas using the dropped element's translated rect
    const translated = active.rect.current.translated;
    const canvasRect = over.rect;

    if (!translated) return;

    const rawX = translated.left - canvasRect.left;
    const rawY = translated.top - canvasRect.top;

    const x = snap(Math.max(0, rawX));
    const y = snap(Math.max(0, rawY));

    addComponent(data.type as ComponentType, x, y);
  };

  const placedTypes = architecture.components.map((c) => c.type);
  const requiredMet = mission.requirements.required.every((r) => placedTypes.includes(r));

  return (
    // Single DndContext wrapping BOTH palette and canvas so they share the same drag context
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col">
        {/* Builder toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {architecture.components.length} components · {architecture.connections.length} connections
            </span>
            {isDirty && <span className="text-xs text-amber-400">● Unsaved</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost text-sm"
              onClick={() => useBuilderStore.getState().resetArchitecture()}
            >
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
              {isSimulating ? '⏳ Simulating...' : '▶ Run Simulation'}
            </button>
          </div>
        </div>

        {/* Main layout — palette + canvas share ONE DndContext */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left palette */}
          <div className="w-52 flex-shrink-0 border-r border-gray-800 overflow-y-auto">
            <ComponentPalette availableTypes={mission.components.available} />
          </div>

          {/* Canvas — single instance */}
          <div className="flex-1 overflow-hidden">
            <ArchitectureCanvas requiredComponents={mission.requirements.required} />
          </div>
        </div>

        {/* Hints footer — hidden by default */}
        <div className="border-t border-gray-800 bg-gray-900/50">
          <button
            onClick={() => setShowHint((s) => !s)}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <span className="text-amber-400">💡</span>
            <span>{showHint ? 'Hide hint' : 'Need a hint?'}</span>
            <span className={`ml-auto transition-transform duration-200 ${showHint ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {showHint && (
            <div className="px-4 pb-3 text-xs text-amber-200/80 bg-amber-500/5 border-t border-amber-500/10">
              {mission.components.hints[hintIndex.current]}
            </div>
          )}
        </div>
      </div>

      {/* Drag overlay — shows a ghost of the component being dragged */}
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
