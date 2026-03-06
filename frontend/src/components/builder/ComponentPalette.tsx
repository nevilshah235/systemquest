import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  BuildingBlockType,
  ComponentCategory,
  ComponentType,
  COMPONENT_CATEGORIES,
  COMPONENT_CONTEXT,
  CORE_BLOCKS,
  getComponentCost,
  getComponentMeta,
  normalizeComponentType,
} from '../../data/types';

interface ComponentPaletteProps {
  availableTypes: ComponentType[];
  /** When set, the matching palette item will be highlighted with a ring + bounce */
  highlightedType?: ComponentType | null;
  /** Current total cost on canvas — used to show per-item cost delta */
  currentCost: number;
  budget: number;
  /** Optional per-block "why" override text, keyed by ComponentType (legacy or new) */
  missionContext?: Partial<Record<ComponentType, string>>;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  availableTypes,
  highlightedType,
  currentCost,
  budget,
  missionContext,
}) => {
  const tileRefs = useRef(new Map<ComponentCategory, HTMLButtonElement>());
  const anchorElRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const [openCategory, setOpenCategory] = useState<ComponentCategory | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const highlighted = highlightedType ? normalizeComponentType(highlightedType) : null;

  const availableSet = useMemo(() => {
    const norm = availableTypes.map((t) => normalizeComponentType(t));
    return new Set<BuildingBlockType>(norm);
  }, [availableTypes]);

  const missionContextNorm = useMemo(() => {
    const ctx: Partial<Record<BuildingBlockType, string>> = {};
    if (!missionContext) return ctx;
    for (const [k, v] of Object.entries(missionContext)) {
      if (!v) continue;
      ctx[normalizeComponentType(k as ComponentType)] = v;
    }
    return ctx;
  }, [missionContext]);

  const openForCategory = useCallback((cat: ComponentCategory, anchorEl: HTMLButtonElement | null) => {
    if (!anchorEl) return;
    anchorElRef.current = anchorEl;
    setOpenCategory(cat);
    setAnchorRect(anchorEl.getBoundingClientRect());
  }, []);

  // Auto-open the highlighted block's category to make "hints" feel direct.
  useEffect(() => {
    if (!highlighted) return;
    const cat = getComponentMeta(highlighted).category;
    const el = tileRefs.current.get(cat) ?? null;
    if (el) openForCategory(cat, el);
  }, [highlighted, openForCategory]);

  // Close on Escape / outside click.
  useEffect(() => {
    if (!openCategory) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenCategory(null);
        setAnchorRect(null);
      }
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      const pop = popoverRef.current;
      const anchor = anchorElRef.current;
      if (pop && pop.contains(t)) return;
      if (anchor && anchor.contains(t)) return;
      setOpenCategory(null);
      setAnchorRect(null);
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, [openCategory]);

  // Keep the popover anchored on scroll/resize.
  useEffect(() => {
    if (!openCategory) return;
    const update = () => {
      if (!anchorElRef.current) return;
      setAnchorRect(anchorElRef.current.getBoundingClientRect());
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [openCategory]);

  const popoverStyle = useMemo(() => {
    if (!anchorRect) return undefined;
    const width = 340;
    const height = 320;
    const left = Math.min(anchorRect.right + 12, window.innerWidth - width - 12);
    const top = Math.min(anchorRect.top, window.innerHeight - height - 12);
    return { position: 'fixed' as const, left, top, width };
  }, [anchorRect]);

  const categories = useMemo(() => {
    return (Object.keys(COMPONENT_CATEGORIES) as ComponentCategory[]).map((category) => {
      const meta = COMPONENT_CATEGORIES[category];
      const availableInCat = meta.types.filter((t) => availableSet.has(t));
      const hasMissionSpecific = availableInCat.some((t) => !CORE_BLOCKS.includes(t));
      const hasHighlighted = !!highlighted && meta.types.includes(highlighted);
      return { category, meta, hasMissionSpecific, hasHighlighted };
    });
  }, [availableSet, highlighted]);

  const openMeta = openCategory ? COMPONENT_CATEGORIES[openCategory] : null;

  return (
    <div className="h-full flex flex-col relative">
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="font-semibold text-gray-200 text-sm">Building Blocks</h3>
        <p className="text-xs text-gray-500 mt-0.5">Click a category, then drag a block onto the canvas</p>
      </div>

      {/* Category grid (no scrolling) */}
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          {categories.map(({ category, meta, hasMissionSpecific, hasHighlighted }) => {
            const isOpen = openCategory === category;
            return (
              <button
                key={category}
                ref={(el) => {
                  if (el) tileRefs.current.set(category, el);
                  else tileRefs.current.delete(category);
                }}
                type="button"
                onClick={(e) => {
                  const el = e.currentTarget;
                  if (isOpen) {
                    setOpenCategory(null);
                    setAnchorRect(null);
                    return;
                  }
                  openForCategory(category, el);
                }}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-colors
                  ${isOpen
                    ? 'border-brand-500 bg-brand-900/20'
                    : hasHighlighted
                      ? 'border-brand-400 bg-brand-900/15 ring-2 ring-brand-400/30'
                      : 'border-gray-700 bg-gray-800/40 hover:border-brand-500/40 hover:bg-gray-800'
                  }`}
              >
                <span className="text-lg">{meta.icon}</span>
                <span className="text-xs font-semibold text-gray-200">{meta.label}</span>
                {hasMissionSpecific && (
                  <span
                    className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400"
                    title="Contains mission-specific blocks"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Popover (anchored to category tile, overlays the canvas) */}
      {openMeta && popoverStyle && (
        <div
          ref={popoverRef}
          style={popoverStyle}
          className="z-50 rounded-2xl border border-gray-700 bg-gray-950 shadow-2xl shadow-black/60 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/60">
            <div className="flex items-center gap-2">
              <span className="text-base">{openMeta.icon}</span>
              <div>
                <div className="text-sm font-semibold text-gray-100">{openMeta.label}</div>
                <div className="text-[11px] text-gray-500">Drag a block onto the canvas</div>
              </div>
            </div>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-200 transition-colors"
              onClick={() => { setOpenCategory(null); setAnchorRect(null); }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-2 gap-2">
              {openMeta.types.map((type) => (
                <BlockCard
                  key={type}
                  type={type}
                  isAvailable={availableSet.has(type) || CORE_BLOCKS.includes(type)}
                  isHighlighted={highlighted === type}
                  isMissionSpecific={availableSet.has(type) && !CORE_BLOCKS.includes(type)}
                  context={missionContextNorm[type] ?? COMPONENT_CONTEXT[type]}
                  currentCost={currentCost}
                  budget={budget}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface BlockCardProps {
  type: BuildingBlockType;
  isAvailable: boolean;
  isMissionSpecific: boolean;
  isHighlighted: boolean;
  context?: string;
  currentCost: number;
  budget: number;
}

const BlockCard: React.FC<BlockCardProps> = ({
  type,
  isAvailable,
  isMissionSpecific,
  isHighlighted,
  context,
  currentCost,
  budget,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, fromPalette: true },
    disabled: !isAvailable,
  });

  const [hovered, setHovered] = useState(false);
  const meta = getComponentMeta(type);
  const cost = getComponentCost(type);
  const wouldExceed = currentCost + cost > budget;
  const badge =
    CORE_BLOCKS.includes(type) ? 'core' : isMissionSpecific ? 'for this mission' : undefined;

  return (
    <div
      ref={setNodeRef}
      {...(isAvailable ? listeners : {})}
      {...(isAvailable ? attributes : {})}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative rounded-xl border p-3 transition-all select-none
        ${!isAvailable
          ? 'opacity-40 border-gray-800 bg-gray-900/40 cursor-not-allowed'
          : 'border-gray-700 bg-gray-900/40 cursor-grab active:cursor-grabbing hover:border-brand-500/40'
        }
        ${isDragging ? 'opacity-40 border-brand-500 bg-brand-900/20' : ''}
        ${isHighlighted ? 'ring-2 ring-brand-400/40 border-brand-400 shadow-lg shadow-brand-500/20' : ''}
      `}
    >
      {badge && (
        <span className={`absolute -top-2 -right-2 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border
          ${badge === 'core'
            ? 'bg-blue-900/60 text-blue-200 border-blue-700/50'
            : 'bg-amber-900/60 text-amber-200 border-amber-700/50'
          }`}
        >
          {badge}
        </span>
      )}

      <div className="flex items-start gap-2">
        <span className={`text-xl mt-0.5 ${isHighlighted ? 'animate-bounce' : ''}`}>{meta.icon}</span>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-100 leading-tight">{meta.label}</div>
          <div className="text-[11px] text-gray-500 leading-snug mt-0.5">
            {context ?? meta.description}
          </div>
        </div>
      </div>

      {hovered && isAvailable && (
        <div className="mt-2">
          {cost === 0 ? (
            <span className="text-[10px] text-green-400 font-medium">Free</span>
          ) : (
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                wouldExceed ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'
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
