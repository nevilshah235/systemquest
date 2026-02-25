import React, { useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ComponentType, COMPONENT_META } from '../../data/types';

interface PaletteItemProps {
  type: ComponentType;
  isHighlighted: boolean;
}

const PaletteItem: React.FC<PaletteItemProps> = ({ type, isHighlighted }) => {
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
      data-palette-type={type}
      className={`flex items-start gap-3 p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all duration-150
        ${isDragging
          ? 'opacity-40 border-brand-500 bg-brand-900/20'
          : isHighlighted
            ? 'border-brand-400 bg-brand-900/20 ring-2 ring-brand-400/40 shadow-lg shadow-brand-500/20'
            : 'border-gray-700 bg-gray-800/40 hover:border-brand-500/50 hover:bg-gray-800'
        }`}
    >
      {/* Icon — bounces when highlighted */}
      <span className={`text-2xl flex-shrink-0 mt-0.5 ${isHighlighted ? 'animate-bounce' : ''}`}>
        {meta.icon}
      </span>
      <div className="min-w-0">
        <div className={`text-sm font-semibold ${isHighlighted ? 'text-brand-300' : 'text-white'}`}>
          {meta.label}
          {isHighlighted && (
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-brand-400 animate-pulse">
              ← add this
            </span>
          )}
        </div>
        <div className="text-xs text-gray-300 leading-relaxed mt-0.5">{meta.description}</div>
      </div>
    </div>
  );
};

interface ComponentPaletteProps {
  availableTypes: ComponentType[];
  /** When set, the matching palette item will be highlighted with a ring + bounce */
  highlightedType?: ComponentType | null;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ availableTypes, highlightedType }) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the highlighted item whenever it changes
  useEffect(() => {
    if (!highlightedType || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-palette-type="${highlightedType}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [highlightedType]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="font-semibold text-gray-200 text-sm">Components</h3>
        <p className="text-xs text-gray-500 mt-0.5">Drag onto canvas</p>
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {availableTypes.map((type) => (
          <PaletteItem
            key={type}
            type={type}
            isHighlighted={highlightedType === type}
          />
        ))}
      </div>
    </div>
  );
};
