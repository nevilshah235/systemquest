import React, { useRef, useEffect, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  ComponentType,
  ComponentCategory,
  COMPONENT_CATEGORIES,
  COMPONENT_META,
  COMPONENT_CONTEXT,
  getComponentMeta,
  getComponentCost,
} from '../../data/types';

interface PopoverBlockProps {
  type: ComponentType;
  isAvailable: boolean;
  isMissionSpecific: boolean;
  missionContext?: string;
  isHighlighted: boolean;
  currentCost: number;
  budget: number;
}

const PopoverBlock: React.FC<PopoverBlockProps> = ({
  type,
  isAvailable,
  isMissionSpecific,
  missionContext,
  isHighlighted,
  currentCost,
  budget,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, fromPalette: true },
  });

  const meta = getComponentMeta(type);
  const cost = getComponentCost(type);
  const wouldExceed = currentCost + cost > budget;
  const context = missionContext ?? COMPONENT_CONTEXT[type];

  return (
    <div
      ref={setNodeRef}
      {...(isAvailable ? { ...listeners, ...attributes } : {})}
      data-palette-type={type}
      className={`flex flex-col p-2.5 rounded-lg border transition-all duration-150
        ${!isAvailable ? 'opacity-50 cursor-not-allowed border-gray-700/50 bg-gray-800/30' : ''}
        ${isAvailable && isDragging ? 'opacity-40 border-brand-500 bg-brand-900/20' : ''}
        ${isAvailable && !isDragging ? 'cursor-grab active:cursor-grabbing border-gray-600 bg-gray-800/60 hover:border-brand-500/50 hover:bg-gray-800' : ''}
        ${isHighlighted ? 'ring-2 ring-brand-400/60 border-brand-400' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{meta.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-gray-200 truncate">{meta.label}</div>
          {(isMissionSpecific && context) && (
            <div className="text-[10px] text-brand-300 mt-0.5 line-clamp-2">{context}</div>
          )}
        </div>
        {meta.tier === 'core' && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-600/50 text-gray-400">core</span>
        )}
        {isMissionSpecific && meta.tier !== 'core' && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300">mission</span>
        )}
      </div>
      {cost > 0 && (
        <div className="mt-1.5 text-[10px]">
          {cost === 0 ? (
            <span className="text-green-400">Free</span>
          ) : (
            <span className={wouldExceed ? 'text-red-300' : 'text-gray-400'}>
              +${cost}/mo
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
  missionContext?: Partial<Record<ComponentType, string>>;
  highlightedType?: ComponentType | null;
  currentCost: number;
  budget: number;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

const CategoryPopover: React.FC<CategoryPopoverProps> = ({
  category,
  availableTypes,
  missionContext,
  highlightedType,
  currentCost,
  budget,
  anchorRef,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const catMeta = COMPONENT_CATEGORIES[category];
  const availableSet = new Set(availableTypes);
  const typesInCategory = catMeta.types.filter((t) => availableSet.has(t));

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
  }, [anchorRef, onClose]);

  if (typesInCategory.length === 0) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute left-0 top-full mt-1 z-50 w-64 max-h-80 overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 shadow-xl shadow-black/40"
    >
      <div className="sticky top-0 flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-gray-900/95">
        <span className="text-xs font-semibold text-gray-200">{catMeta.label}</span>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 p-1 rounded transition-colors"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="p-2 grid grid-cols-2 gap-2">
        {catMeta.types.map((type) => {
          const isAvailable = availableSet.has(type);
          const meta = COMPONENT_META[type];
          const isMissionSpecific = meta.tier !== 'core' && isAvailable;
          return (
            <PopoverBlock
              key={type}
              type={type}
              isAvailable={isAvailable}
              isMissionSpecific={isMissionSpecific}
              missionContext={missionContext?.[type]}
              isHighlighted={highlightedType === type}
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
  highlightedType?: ComponentType | null;
  currentCost: number;
  budget: number;
  missionContext?: Partial<Record<ComponentType, string>>;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  availableTypes,
  highlightedType,
  currentCost,
  budget,
  missionContext,
}) => {
  const [openCategory, setOpenCategory] = useState<ComponentCategory | null>(null);
  const anchorRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const availableSet = new Set(availableTypes);
  const categoriesWithBlocks = (Object.keys(COMPONENT_CATEGORIES) as ComponentCategory[]).filter(
    (cat) => COMPONENT_CATEGORIES[cat].types.some((t) => availableSet.has(t))
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2.5 border-b border-gray-800">
        <h3 className="font-semibold text-gray-200 text-sm">Building Blocks</h3>
        <p className="text-[10px] text-gray-500 mt-0.5">Click a category, then drag onto canvas</p>
      </div>
      <div className="flex-1 p-2 overflow-hidden">
        <div className="grid grid-cols-2 gap-2">
          {categoriesWithBlocks.map((cat) => {
            const catMeta = COMPONENT_CATEGORIES[cat];
            const typesInCat = catMeta.types.filter((t) => availableSet.has(t));
            const hasMissionSpecific = typesInCat.some(
              (t) => COMPONENT_META[t].tier !== 'core'
            );
            return (
              <div key={cat} className="relative">
                <button
                  ref={(el) => { anchorRefs.current[cat] = el; }}
                  type="button"
                  onClick={() => setOpenCategory(openCategory === cat ? null : cat)}
                  className={`w-full flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all
                    ${openCategory === cat
                      ? 'border-brand-500 bg-brand-900/20 ring-1 ring-brand-500/30'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800/70'
                    }`}
                >
                  <span className="text-xl mb-0.5">{catMeta.icon}</span>
                  <span className="text-[10px] font-medium text-gray-300 text-center leading-tight">
                    {catMeta.label}
                  </span>
                  {hasMissionSpecific && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-400" />
                  )}
                </button>
                {openCategory === cat && (
                  <CategoryPopover
                    category={cat}
                    availableTypes={availableTypes}
                    missionContext={missionContext}
                    highlightedType={highlightedType}
                    currentCost={currentCost}
                    budget={budget}
                    anchorRef={{ current: anchorRefs.current[cat] }}
                    onClose={() => setOpenCategory(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
