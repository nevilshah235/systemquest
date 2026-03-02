/**
 * AdventureRoadmap — horizontal scrollable card strip.
 *
 * Layout: full-size cards (~192 px wide) in a single horizontal scrollable
 * row, connected by styled segment lines. Auto-scrolls to the active node
 * on mount. Snap-scrolling for smooth UX.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mission, LEARNING_PATHS } from '../../data/types';

/* ─── Types ──────────────────────────────────────────────────────────────── */

export type NodeStatus = 'completed' | 'in-progress' | 'locked';

export interface RoadmapNode {
  slug: string;
  title: string;
  icon: string;
  description: string;
  skillLabel: string;
  totalMissions: number;
  completedMissions: number;
  status: NodeStatus;
}

export interface AdventureRoadmapProps {
  missionsByPath: Record<string, Mission[]>;
  foundationsComplete: boolean;
  selectedSlug: string | null;
  onNodeSelect: (slug: string) => void;
}

/* ─── Constants ──────────────────────────────────────────────────────────── */

const PATH_SLUGS = [
  'foundations',
  'async-queues',
  'high-read',
  'real-time',
  'consistency',
  'scale-streaming',
] as const;

/* ─── Segment connector ──────────────────────────────────────────────────── */

type SegStatus = 'completed' | 'active' | 'locked';

const SegmentConnector: React.FC<{ status: SegStatus }> = ({ status }) => {
  const lineClsMap: Record<SegStatus, string> = {
    completed: 'bg-green-500',
    active:    'bg-blue-500',
    locked:    '',
  };
  const arrowClsMap: Record<SegStatus, string> = {
    completed: 'text-green-500',
    active:    'text-blue-400',
    locked:    'text-gray-700',
  };

  return (
    <div className="flex-shrink-0 self-center flex items-center" style={{ width: '40px' }}>
      {status === 'locked' ? (
        <div className="flex-1 border-t-2 border-dashed border-gray-700 opacity-40" />
      ) : (
        <div className={`flex-1 h-0.5 ${lineClsMap[status]}`} />
      )}
      <span className={`text-xl font-bold ${arrowClsMap[status]} leading-none`}>›</span>
    </div>
  );
};

/* ─── Path card ──────────────────────────────────────────────────────────── */

interface PathCardProps {
  node: RoadmapNode;
  order: number;
  isSelected: boolean;
  isHere: boolean;
  onSelect: (slug: string) => void;
}

const PathCard: React.FC<PathCardProps> = ({ node, order, isSelected, isHere, onSelect }) => {
  const pct = node.totalMissions > 0
    ? (node.completedMissions / node.totalMissions) * 100
    : 0;

  const borderCls =
    node.status === 'completed'   ? 'border-green-500/60' :
    node.status === 'in-progress' ? 'border-blue-500/60'  : 'border-gray-700/40';

  const bgCls =
    node.status === 'completed'   ? 'bg-green-950/50' :
    node.status === 'in-progress' ? 'bg-blue-950/50'  : 'bg-gray-900';

  const barCls = node.status === 'completed' ? 'bg-green-500' : 'bg-blue-500';

  const glowStyle: React.CSSProperties = {};
  if (node.status === 'completed')
    glowStyle.boxShadow = isSelected
      ? '0 0 24px rgba(34,197,94,0.5)'  : '0 0 8px rgba(34,197,94,0.18)';
  if (node.status === 'in-progress')
    glowStyle.boxShadow = isSelected
      ? '0 0 28px rgba(59,130,246,0.6)' : '0 0 14px rgba(59,130,246,0.28)';

  const diff =
    node.skillLabel.toLowerCase().includes('advanced')
      ? { cls: 'bg-red-900/60 text-red-300',       label: 'Advanced'     } :
    node.skillLabel.toLowerCase().includes('intermediate')
      ? { cls: 'bg-yellow-900/60 text-yellow-300', label: 'Intermediate' } :
      { cls: 'bg-green-900/60 text-green-300',     label: 'Beginner'     };

  return (
    <motion.div
      data-slug={node.slug}
      style={{
        ...glowStyle,
        width: '192px',
        minHeight: '216px',
        flexShrink: 0,
        scrollSnapAlign: 'start',
      }}
      className={`
        rounded-2xl border-2 p-4 cursor-pointer flex flex-col justify-between
        ${borderCls} ${bgCls}
        ${node.status === 'locked' ? 'opacity-55 saturate-0' : ''}
        ${isSelected ? 'ring-2 ring-white/20' : ''}
        transition-shadow duration-300
      `}
      animate={isHere ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={isHere
        ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
        : { duration: 0.15 }}
      whileHover={node.status !== 'locked' ? { y: -4, scale: 1.02 } : {}}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(node.slug)}
    >
      {/* Top row: icon + order + "here" badge */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl leading-none">{node.icon}</span>
        <div className="flex flex-col items-end gap-1">
          {isHere && (
            <motion.span
              className="text-xs text-blue-400 font-bold leading-none"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ● here
            </motion.span>
          )}
          <span className="text-xs text-gray-600 font-mono">#{order}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-white text-sm leading-snug mb-2">{node.title}</h3>

      {/* Difficulty badge */}
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block mb-3 ${diff.cls}`}>
        {diff.label}
      </span>

      {/* Progress bar + count */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Progress</span>
          <span className="font-mono tabular-nums">
            {node.completedMissions}/{node.totalMissions}
          </span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${barCls}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
          />
        </div>
      </div>

      {/* Status chip */}
      <div className="text-xs font-semibold">
        {node.status === 'completed'   && <span className="text-green-400">✅ Complete</span>}
        {node.status === 'in-progress' && <span className="text-blue-400">⚡ In Progress</span>}
        {node.status === 'locked'      && <span className="text-gray-500">🔒 Locked</span>}
      </div>
    </motion.div>
  );
};

/* ─── AdventureRoadmap ───────────────────────────────────────────────────── */

export const AdventureRoadmap: React.FC<AdventureRoadmapProps> = ({
  missionsByPath,
  foundationsComplete,
  selectedSlug,
  onNodeSelect,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [toast, setToast]   = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // ── Derive node data ───────────────────────────────────────────────────────
  const nodes: RoadmapNode[] = PATH_SLUGS.map((slug) => {
    const meta         = LEARNING_PATHS[slug];
    const pathMissions = missionsByPath[slug] ?? [];
    const total        = pathMissions.length;
    const completed    = pathMissions.filter((m) => m.userProgress?.completed).length;
    const allLocked    = total > 0 && pathMissions.every((m) => m.isLocked);

    let status: NodeStatus;
    if (allLocked)                             status = 'locked';
    else if (total > 0 && completed === total) status = 'completed';
    else                                       status = 'in-progress';

    return {
      slug, title: meta.title, icon: meta.icon,
      description: meta.description, skillLabel: meta.skillLabel,
      totalMissions: total, completedMissions: completed, status,
    };
  });

  const hereSlug = nodes.find((n) => n.status === 'in-progress')?.slug ?? null;

  // Auto-scroll to the active card on mount
  useEffect(() => {
    if (!scrollRef.current || !hereSlug) return;
    const el = scrollRef.current.querySelector<HTMLElement>(`[data-slug="${hereSlug}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [hereSlug]);

  // ── Segment statuses ───────────────────────────────────────────────────────
  const segStatuses: SegStatus[] = PATH_SLUGS.slice(1).map((slug, i) => {
    const from = nodes[i];
    const to   = nodes[i + 1];
    if (from.status === 'completed' && to.status === 'completed')   return 'completed';
    if (from.status === 'completed' && to.status === 'in-progress') return 'active';
    return 'locked';
  });

  // ── Click handler ──────────────────────────────────────────────────────────
  const handleNodeClick = (slug: string) => {
    const node = nodes.find((n) => n.slug === slug)!;
    if (node.status === 'locked') {
      showToast(`🔒 Complete Foundations first to unlock "${node.title}"`);
      return;
    }
    onNodeSelect(slug);
  };

  return (
    <div className="relative w-full">

      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white">🗺️ Your Learning Adventure</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {foundationsComplete
              ? 'All paths unlocked — choose your next challenge'
              : 'Complete Foundations to unlock all paths'}
          </p>
        </div>
        <span className="text-xs text-gray-600 hidden sm:block">scroll →</span>
      </div>

      {/* Horizontal scroll strip */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-0 overflow-x-auto pb-3"
        style={{
          scrollSnapType:            'x mandatory',
          WebkitOverflowScrolling:   'touch',
          scrollbarWidth:            'thin',
          scrollbarColor:            '#374151 transparent',
        }}
      >
        {nodes.map((node, i) => (
          <React.Fragment key={node.slug}>
            <PathCard
              node={node}
              order={i + 1}
              isSelected={selectedSlug === node.slug}
              isHere={hereSlug === node.slug}
              onSelect={handleNodeClick}
            />
            {i < nodes.length - 1 && (
              <SegmentConnector status={segStatuses[i]} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -18, x: '-50%' }}
            animate={{ opacity: 1, y: 0,   x: '-50%' }}
            exit={{   opacity: 0, y: -18, x: '-50%' }}
            transition={{ duration: 0.18 }}
            className="fixed top-20 left-1/2 z-[100] bg-gray-800 border border-gray-700 text-sm text-white px-5 py-3 rounded-xl shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
