import React, { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  ComponentType,
  ComponentCategory,
  COMPONENT_CATEGORIES,
  COMPONENT_META,
  COMPONENT_COSTS,
  isComponentAvailable,
  isCoreComponent,
  getMissionSpecificComponents,
} from '../../data/types';

// =============================================================================
// Popover Block Card - Individual block within a category popover
// =============================================================================

interface PopoverBlockCardProps {
  type: ComponentType;
  isAvailable: boolean;
  currentCost: number;
  budget: number;
  missionContext?: string;
  onDragStart?: () => void;
}

const PopoverBlockCard: React.FC<PopoverBlockCardProps> = ({
  type,
  isAvailable,
  currentCost,
  budget,
  missionContext,
  onDragStart,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, fromPalette: true },
    disabled: !isAvailable,
  });

  const meta = COMPONENT_META[type];
  const cost = COMPONENT_COSTS[type];
  const wouldExceed = currentCost + cost > budget;
  const isCore = isCoreComponent(type);

  return (
    <div
      ref={setNodeRef}
      {...(isAvailable ? listeners : {})}
      {...(isAvailable ? attributes : {})}
      onMouseDown={isAvailable ? onDragStart : undefined}
      className={`relative p-3 rounded-xl border transition-all duration-150
        ${!isAvailable
          ? 'opacity-40 border-gray-800 bg-gray-900/30 cursor-not-allowed'
          : isDragging
            ? 'opacity-40 border-brand-500 bg-brand-900/20'
            : wouldExceed
              ? 'border-red-500/30 bg-red-900/10 hover:border-red-500/50 cursor-grab active:cursor-grabbing'
              : 'border-gray-700 bg-gray-800/60 hover:border-brand-500/50 hover:bg-gray-800 cursor-grab active:cursor-grabbing'
        }`}
    >
      {/* Tier Badge */}
      <div className="absolute top-2 right-2 flex gap-1">
        {isCore && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
            Core
          </span>
        )}
        {isAvailable && !isCore && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
            Mission
          </span>
        )}
      </div>

      {/* Icon */}
      <div className="text-2xl mb-2">{meta.icon}</div>

      {/* Label */}
      <div className="text-sm font-semibold text-white leading-tight mb-0.5">
        {meta.label}
      </div>

      {/* Category sub-label */}
      <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">
        {meta.description.split(' ')[0]}
      </div>

      {/* Mission Context (why this block for this mission) */}
      {isAvailable && missionContext && (
        <div className="text-[11px] text-amber-300/80 leading-snug bg-amber-500/10 rounded px-2 py-1.5 -mx-1">
          {missionContext}
        </div>
      )}

      {/* Cost indicator */}
      {isAvailable && (
        <div className="mt-2">
          {cost === 0 ? (
            <span className="text-[10px] text-green-400 font-medium">Free</span>
          ) : (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              wouldExceed
                ? 'bg-red-500/20 text-red-300'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {wouldExceed ? '⚠ ' : ''}${cost}/mo
            </span>
          )}
        </div>
      )}

      {/* Not available hint */}
      {!isAvailable && (
        <div className="mt-2 text-[10px] text-gray-500 italic">
          Not needed for this mission
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Category Popover - Shows all blocks in a category
// =============================================================================

interface CategoryPopoverProps {
  category: ComponentCategory;
  availableTypes: ComponentType[];
  currentCost: number;
  budget: number;
  missionContext?: Record<ComponentType, string>;
  onClose: () => void;
}

const CategoryPopover: React.FC<CategoryPopoverProps> = ({
  category,
  availableTypes,
  currentCost,
  budget,
  missionContext,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const categoryMeta = COMPONENT_CATEGORIES[category];
  const typesInCategory = categoryMeta.types;

  // Close on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Sort: available mission-specific first, then available core, then unavailable
  const sortedTypes = [...typesInCategory].sort((a, b) => {
    const aAvailable = isComponentAvailable(a, availableTypes);
    const bAvailable = isComponentAvailable(b, availableTypes);
    const aCore = isCoreComponent(a);
    const bCore = isCoreComponent(b);

    if (aAvailable && !bAvailable) return -1;
    if (!aAvailable && bAvailable) return 1;
    if (aAvailable && bAvailable) {
      if (!aCore && bCore) return -1; // Mission-specific before core
      if (aCore && !bCore) return 1;
    }
    return 0;
  });

  const hasMissionSpecific = sortedTypes.some(
    t => isComponentAvailable(t, availableTypes) && !isCoreComponent(t)
  );

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style={{ top: '100%', left: '0', marginTop: '8px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-800/50">
        <div className="flex items-center gap-2">
          <span className="text-xl">{categoryMeta.icon}</span>
          <div>
            <h4 className="font-semibold text-white text-sm">{categoryMeta.label}</h4>
            <p className="text-[10px] text-gray-400">{categoryMeta.description}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800/50 bg-gray-900/50">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500/60"></span>
          <span className="text-[10px] text-gray-400">Core</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500/60"></span>
          <span className="text-[10px] text-gray-400">Mission</span>
        </div>
        {hasMissionSpecific && (
          <div className="ml-auto text-[10px] text-amber-400/70">
            ⭐ Recommended for this mission
          </div>
        )}
      </div>

      {/* Block Grid */}
      <div className="p-3 grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
        {sortedTypes.map(type => (
          <PopoverBlockCard
            key={type}
            type={type}
            isAvailable={isComponentAvailable(type, availableTypes)}
            currentCost={currentCost}
            budget={budget}
            missionContext={missionContext?.[type]}
            onDragStart={onClose}
          />
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-gray-800 bg-gray-800/30">
        <p className="text-[10px] text-gray-500 text-center">
          Drag blocks onto the canvas • Mission blocks are highlighted
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// Category Tile - Main grid item that opens the popover
// =============================================================================

interface CategoryTileProps {
  category: ComponentCategory;
  availableTypes: ComponentType[];
  isHighlighted: boolean;
  isOpen: boolean;
  onClick: () => void;
}

const CategoryTile: React.FC<CategoryTileProps> = ({
  category,
  availableTypes,
  isHighlighted,
  isOpen,
  onClick,
}) => {
  const meta = COMPONENT_CATEGORIES[category];
  const typesInCategory = meta.types;

  // Check if this category has mission-specific blocks
  const missionSpecificInCategory = typesInCategory.filter(
    t => isComponentAvailable(t, availableTypes) && !isCoreComponent(t)
  );
  const hasMissionSpecific = missionSpecificInCategory.length > 0;
  const missionCount = missionSpecificInCategory.length;

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`w-full aspect-square flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-150
          ${isOpen
            ? 'border-brand-400 bg-brand-900/30 ring-2 ring-brand-400/40'
            : isHighlighted
              ? 'border-brand-400 bg-brand-900/20 ring-2 ring-brand-400/40 shadow-lg shadow-brand-500/20 animate-pulse'
              : 'border-gray-700 bg-gray-800/40 hover:border-brand-500/50 hover:bg-gray-800'
          }`}
      >
        {/* Icon */}
        <span className={`text-2xl ${isHighlighted ? 'animate-bounce' : ''}`}>
          {meta.icon}
        </span>

        {/* Label */}
        <span className="text-[11px] font-medium text-gray-200 text-center leading-tight">
          {meta.label}
        </span>

        {/* Mission badge - shows when this category has mission-specific blocks */}
        {hasMissionSpecific && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
            {missionCount}
          </span>
        )}

        {/* Highlight indicator */}
        {isHighlighted && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wide text-brand-400 bg-brand-900/80 px-2 py-0.5 rounded-full">
            Check this!
          </span>
        )}
      </button>
    </div>
  );
};

// =============================================================================
// Main Component Palette
// =============================================================================

interface ComponentPaletteProps {
  availableTypes: ComponentType[];
  /** When set, categories containing this type will be highlighted */
  highlightedType?: ComponentType | null;
  /** Current total cost on canvas */
  currentCost: number;
  budget: number;
  /** Per-block "why" descriptions for this mission */
  missionContext?: Record<ComponentType, string>;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  availableTypes,
  highlightedType,
  currentCost,
  budget,
  missionContext,
}) => {
  const [openCategory, setOpenCategory] = useState<ComponentCategory | null>(null);

  // Find which category contains the highlighted type
  const highlightedCategory = highlightedType
    ? (Object.entries(COMPONENT_CATEGORIES).find(([_, meta]) =>
        meta.types.includes(highlightedType)
      )?.[0] as ComponentCategory | undefined)
    : null;

  // Auto-open the highlighted category
  useEffect(() => {
    if (highlightedCategory) {
      setOpenCategory(highlightedCategory);
    }
  }, [highlightedCategory]);

  const categories: ComponentCategory[] = [
    'clients',
    'networking',
    'compute',
    'data-stores',
    'caching',
    'messaging',
    'storage',
    'real-time',
    'security',
    'specialized',
  ];

  // Count mission-specific blocks to show in header
  const missionSpecificCount = getMissionSpecificComponents(availableTypes).length;

  return (
    <div className="h-full flex flex-col bg-gray-900/50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-200 text-sm">Building Blocks</h3>
            <p className="text-xs text-gray-500 mt-0.5">Click a category to see options</p>
          </div>
          {missionSpecificCount > 0 && (
            <div className="text-right">
              <span className="text-[10px] text-amber-400 font-medium">
                {missionSpecificCount} mission blocks
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Category Grid - 2 columns */}
      <div className="flex-1 p-3">
        <div className="grid grid-cols-2 gap-2">
          {categories.map(category => (
            <div key={category} className="relative">
              <CategoryTile
                category={category}
                availableTypes={availableTypes}
                isHighlighted={highlightedCategory === category}
                isOpen={openCategory === category}
                onClick={() => setOpenCategory(openCategory === category ? null : category)}
              />

              {/* Popover */}
              {openCategory === category && (
                <CategoryPopover
                  category={category}
                  availableTypes={availableTypes}
                  currentCost={currentCost}
                  budget={budget}
                  missionContext={missionContext}
                  onClose={() => setOpenCategory(null)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-gray-800 bg-gray-800/30">
        <p className="text-[10px] text-gray-500 text-center">
          <span className="text-amber-400">★</span> = recommended for this mission
        </p>
      </div>
    </div>
  );
};
