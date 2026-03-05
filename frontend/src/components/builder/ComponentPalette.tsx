import React, { useRef, useEffect, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  ComponentType,
  ComponentCategory,
  COMPONENT_META,
  COMPONENT_COSTS,
  COMPONENT_CONTEXT,
  COMPONENT_CATEGORIES,
} from '../../data/types';

interface CategoryTileProps {
  category: ComponentCategory;
  hasMissionRelevant: boolean;
  isActive: boolean;
  onClick: () => void;
}

const CategoryTile: React.FC<CategoryTileProps> = ({
  category,
  hasMissionRelevant,
  isActive,
  onClick,
}) => {
  const meta = COMPONENT_CATEGORIES[category];

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border transition-all duration-150 ${
        isActive
          ? 'border-brand-400 bg-brand-900/30 shadow-lg'
          : 'border-gray-700 bg-gray-800/40 hover:border-brand-500/50 hover:bg-gray-800'
      }`}
    >
      {/* Mission relevance badge */}
      {hasMissionRelevant && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-500 rounded-full border-2 border-gray-900 animate-pulse" />
      )}

      <span className="text-3xl">{meta.icon}</span>
      <span className="text-xs font-medium text-gray-300">{meta.label}</span>
    </button>
  );
};

interface BlockCardProps {
  type: ComponentType;
  isAvailable: boolean;
  isMissionRelevant: boolean;
  missionContext?: string;
  currentCost: number;
  budget: number;
}

const BlockCard: React.FC<BlockCardProps> = ({
  type,
  isAvailable,
  isMissionRelevant,
  missionContext,
  currentCost,
  budget,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, fromPalette: true },
    disabled: !isAvailable,
  });

  const [hovered, setHovered] = useState(false);
  const meta = COMPONENT_META[type];
  const cost = COMPONENT_COSTS[type];
  const wouldExceed = currentCost + cost > budget;

  const contextText = missionContext || COMPONENT_CONTEXT[type];

  return (
    <div
      ref={isAvailable ? setNodeRef : undefined}
      {...(isAvailable ? listeners : {})}
      {...(isAvailable ? attributes : {})}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex flex-col gap-2 p-3 rounded-lg border transition-all duration-150 ${
        !isAvailable
          ? 'opacity-40 cursor-not-allowed border-gray-700 bg-gray-800/20'
          : isDragging
          ? 'opacity-40 border-brand-500 bg-brand-900/20'
          : isMissionRelevant
          ? 'border-brand-400 bg-brand-900/20 cursor-grab active:cursor-grabbing'
          : 'border-gray-700 bg-gray-800/40 hover:border-gray-600 hover:bg-gray-800 cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Icon + Label */}
      <div className="flex items-center gap-2">
        <span className="text-2xl flex-shrink-0">{meta.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white truncate">{meta.label}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">{meta.category}</div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {meta.tier === 'core' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
            Core
          </span>
        )}
        {isMissionRelevant && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-medium animate-pulse">
            For this mission
          </span>
        )}
      </div>

      {/* Context description (mission-specific or default) */}
      {isMissionRelevant && (
        <div className="text-xs text-gray-300 leading-relaxed">{contextText}</div>
      )}

      {/* Cost (on hover) */}
      {hovered && isAvailable && (
        <div className="pt-1 border-t border-gray-700">
          {cost === 0 ? (
            <span className="text-[11px] text-green-400 font-medium">Free</span>
          ) : (
            <span
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                wouldExceed
                  ? 'bg-red-500/15 text-red-300'
                  : 'bg-emerald-500/15 text-emerald-300'
              }`}
            >
              {wouldExceed ? '⚠ ' : ''}+${cost}/mo
            </span>
          )}
        </div>
      )}
    </div>
  );
};

interface CategoryPopoverProps {
  category: ComponentCategory;
  availableTypes: ComponentType[];
  missionContext?: Record<ComponentType, string>;
  currentCost: number;
  budget: number;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}

const CategoryPopover: React.FC<CategoryPopoverProps> = ({
  category,
  availableTypes,
  missionContext,
  currentCost,
  budget,
  onClose,
  anchorRef,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const categoryMeta = COMPONENT_CATEGORIES[category];
  const categoryTypes = categoryMeta.types;

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, anchorRef]);

  // Position popover relative to anchor
  const [position, setPosition] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (anchorRef.current && popoverRef.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();

      let top = anchorRect.bottom + 8;
      let left = anchorRect.left;

      // Adjust if popover goes off-screen
      if (left + popoverRect.width > window.innerWidth) {
        left = window.innerWidth - popoverRect.width - 16;
      }
      if (top + popoverRect.height > window.innerHeight) {
        top = anchorRect.top - popoverRect.height - 8;
      }

      setPosition({ top, left });
    }
  }, [anchorRef]);

  // Determine mission-relevant blocks
  const missionRelevantTypes = categoryTypes.filter(
    (type) => availableTypes.includes(type) && COMPONENT_META[type].tier !== 'core'
  );

  return (
    <div
      ref={popoverRef}
      style={{ position: 'fixed', top: position.top, left: position.left }}
      className="z-50 w-[480px] max-h-[520px] overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl"
    >
      {/* Header */}
      <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{categoryMeta.icon}</span>
          <h3 className="font-semibold text-white">{categoryMeta.label}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Block grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {categoryTypes.map((type) => {
          const isAvailable = availableTypes.includes(type);
          const isMissionRelevant = missionRelevantTypes.includes(type);
          return (
            <BlockCard
              key={type}
              type={type}
              isAvailable={isAvailable}
              isMissionRelevant={isMissionRelevant}
              missionContext={missionContext?.[type]}
              currentCost={currentCost}
              budget={budget}
            />
          );
        })}
      </div>
    </div>
  );
};

interface ComponentPaletteProps {
  availableTypes: ComponentType[];
  missionContext?: Record<ComponentType, string>;
  currentCost: number;
  budget: number;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  availableTypes,
  missionContext,
  currentCost,
  budget,
}) => {
  const [activeCategory, setActiveCategory] = useState<ComponentCategory | null>(null);
  const categoryRefs = useRef<Record<ComponentCategory, React.RefObject<HTMLButtonElement>>>({
    clients: React.createRef(),
    networking: React.createRef(),
    compute: React.createRef(),
    'data-stores': React.createRef(),
    caching: React.createRef(),
    messaging: React.createRef(),
    storage: React.createRef(),
    'real-time': React.createRef(),
    security: React.createRef(),
    specialized: React.createRef(),
  });

  // Determine which categories have mission-relevant blocks
  const categoryRelevance: Record<ComponentCategory, boolean> = {
    clients: false,
    networking: false,
    compute: false,
    'data-stores': false,
    caching: false,
    messaging: false,
    storage: false,
    'real-time': false,
    security: false,
    specialized: false,
  };

  Object.entries(COMPONENT_CATEGORIES).forEach(([cat, meta]) => {
    const category = cat as ComponentCategory;
    const hasMissionRelevant = meta.types.some(
      (type) => availableTypes.includes(type) && COMPONENT_META[type].tier !== 'core'
    );
    categoryRelevance[category] = hasMissionRelevant;
  });

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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="font-semibold text-gray-200 text-sm">Building Blocks</h3>
        <p className="text-xs text-gray-500 mt-0.5">Click category to explore</p>
      </div>

      {/* Category Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => (
            <CategoryTile
              key={category}
              category={category}
              hasMissionRelevant={categoryRelevance[category]}
              isActive={activeCategory === category}
              onClick={() => setActiveCategory(activeCategory === category ? null : category)}
            />
          ))}
        </div>
      </div>

      {/* Popover */}
      {activeCategory && (
        <CategoryPopover
          category={activeCategory}
          availableTypes={availableTypes}
          missionContext={missionContext}
          currentCost={currentCost}
          budget={budget}
          onClose={() => setActiveCategory(null)}
          anchorRef={categoryRefs.current[activeCategory]}
        />
      )}
    </div>
  );
};
