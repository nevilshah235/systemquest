import React, { useEffect, useRef } from 'react';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { ComponentPalette } from './ComponentPalette';
import { ArchitectureCanvas } from './ArchitectureCanvas';
import { useBuilderStore } from '../../stores/builderStore';
import { Mission } from '../../data/types';
import { missionsApi } from '../../data/api';

interface DragDropBuilderProps {
  mission: Mission;
  onSimulate: () => void;
  isSimulating: boolean;
}

export const DragDropBuilder: React.FC<DragDropBuilderProps> = ({ mission, onSimulate, isSimulating }) => {
  const { addComponent, architecture, isDirty, markClean } = useBuilderStore();
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || over.id !== 'canvas') return;

    const data = active.data.current;
    if (data?.fromPalette) {
      // Drop from palette onto canvas — place at center + offset
      const canvasEl = document.querySelector('[data-droppable="canvas"]') as HTMLElement;
      const rect = canvasEl?.getBoundingClientRect();
      const x = rect ? Math.round((event.delta.x + 100) / 40) * 40 : 80;
      const y = rect ? Math.round((event.delta.y + 60) / 40) * 40 : 80;
      addComponent(data.type, Math.max(0, x), Math.max(0, y));
    }
  };

  const placedTypes = architecture.components.map((c) => c.type);
  const requiredMet = mission.requirements.required.every((r) => placedTypes.includes(r));

  return (
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
            title={!requiredMet ? `Add required: ${mission.requirements.required.filter(r => !placedTypes.includes(r)).join(', ')}` : 'Run simulation'}
          >
            {isSimulating ? '⏳ Simulating...' : '▶ Run Simulation'}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left palette */}
        <div className="w-52 flex-shrink-0 border-r border-gray-800 overflow-y-auto">
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <ComponentPalette availableTypes={mission.components.available} />
            <div className="flex-1 overflow-hidden">
              <ArchitectureCanvas requiredComponents={mission.requirements.required} />
            </div>
          </DndContext>
        </div>

        {/* Canvas */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-hidden">
            <ArchitectureCanvas requiredComponents={mission.requirements.required} />
          </div>
        </DndContext>
      </div>

      {/* Hints footer */}
      <div className="px-4 py-2 border-t border-gray-800 bg-gray-900/50">
        <div className="flex items-start gap-2">
          <span className="text-amber-400 text-sm flex-shrink-0">💡</span>
          <p className="text-xs text-gray-400">
            {mission.components.hints[Math.floor(Math.random() * mission.components.hints.length)]}
          </p>
        </div>
      </div>
    </div>
  );
};
