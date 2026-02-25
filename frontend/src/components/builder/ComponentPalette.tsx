import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ComponentType, COMPONENT_META } from '../../data/types';

interface PaletteItemProps {
  type: ComponentType;
}

const PaletteItem: React.FC<PaletteItemProps> = ({ type }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, fromPalette: true },
  });

  const meta = COMPONENT_META[type];

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-start gap-3 p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all duration-150
        ${isDragging
          ? 'opacity-40 border-brand-500 bg-brand-900/20'
          : 'border-gray-700 bg-gray-800/40 hover:border-brand-500/50 hover:bg-gray-800'
        }`}
    >
      <span className="text-2xl flex-shrink-0 mt-0.5">{meta.icon}</span>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white">{meta.label}</div>
        <div className="text-xs text-gray-300 leading-relaxed mt-0.5">{meta.description}</div>
      </div>
    </div>
  );
};

interface ComponentPaletteProps {
  availableTypes: ComponentType[];
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ availableTypes }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="font-semibold text-gray-200 text-sm">Components</h3>
        <p className="text-xs text-gray-500 mt-0.5">Drag onto canvas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {availableTypes.map((type) => (
          <PaletteItem key={type} type={type} />
        ))}
      </div>
    </div>
  );
};
