/**
 * AdventureRoadmap — visual winding-path roadmap for the Dashboard.
 *
 * Desktop (≥768px): SVG winding bezier path with absolutely-positioned node cards.
 * Mobile  (<768px): Simple vertical stack with a connector line.
 *
 * Interactions:
 *  - Hover unlocked node  → tooltip with description + CTA
 *  - Click  unlocked node → calls onNodeSelect(slug) — parent handles detail panel
 *  - Click  locked node   → shows inline toast
 *  - In-progress node     → continuous gentle pulse (framer-motion)
 *  - Completed node       → gold/green glow ring
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mission, LEARNING_PATHS } from '../../data/types';

/* ─── Public types ────────────────────────────────────────────────────────── */

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

/* ─── SVG Layout Constants ────────────────────────────────────────────────── */

// SVG coordinate space dimensions
const VW = 700;
const VH = 1000;

// Card dimensions in SVG coordinate space
const CARD_W = 238;
const CARD_H = 124;

// Ordered slugs — foundations (start/top) → scale-streaming (goal/bottom)
const PATH_SLUGS = [
  'foundations',
  'async-queues',
  'high-read',
  'real-time',
  'consistency',
  'scale-streaming',
] as const;

// Node center positions in SVG coordinates (x=horizontal center, y=vertical center)
// Layout: center → left → right → left → right → center (S-winding)
const NODE_CENTERS: Record<string, { cx: number; cy: number }> = {
  'foundations':     { cx: 350, cy: 80  },
  'async-queues':    { cx: 175, cy: 250 },
  'high-read':       { cx: 525, cy: 420 },
  'real-time':       { cx: 175, cy: 590 },
  'consistency':     { cx: 525, cy: 760 },
  'scale-streaming': { cx: 350, cy: 930 },
};

// Build smooth cubic bezier segments connecting consecutive nodes.
// Control points: same x as from/to, meeting at the vertical midpoint → clean S-curves.
const PATH_SEGMENTS = PATH_SLUGS.slice(1).map((slug, i) => {
  const prevSlug = PATH_SLUGS[i];
  const from = NODE_CENTERS[prevSlug];
  const to   = NODE_CENTERS[slug];
  const midY = (from.cy + to.cy) / 2;
  return {
    prevSlug,
    slug,
    d: `M ${from.cx} ${from.cy} C ${from.cx} ${midY}, ${to.cx} ${midY}, ${to.cx} ${to.cy}`,
  };
});

// Deterministic decorative stars (no Math.random — stable across renders)
const STARS = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  x: ((i * 139.7 + 23) % VW),
  y: ((i * 97.3  + 11) % VH),
  r: i % 9 === 0 ? 1.8 : i % 4 === 0 ? 1.2 : 0.7,
  opacity: 0.04 + (i % 5) * 0.025,
}));

/* ─── NodeCard (desktop) ─────────────────────────────────────────────────── */

interface NodeCardProps {
  node: RoadmapNode;
  isSelected: boolean;
  onSelect: (slug: string) => void;
  style: React.CSSProperties;
  /** Flip tooltip above the card (for bottom nodes) */
  tooltipAbove?: boolean;
}

const NodeCard: React.FC<NodeCardProps> = ({
  node,
  isSelected,
  onSelect,
  style,
  tooltipAbove = false,
}) => {
  const [hovered, setHovered] = useState(false);
  const pct = node.totalMissions > 0 ? (node.completedMissions / node.totalMissions) * 100 : 0;

  // Border & background per status
  const statusCls = {
    completed:    'border-green-500/60 bg-green-950/60',
    'in-progress': 'border-blue-500/60 bg-blue-950/60',
    locked:       'border-gray-700/40 bg-gray-900/80',
  }[node.status];

  // Progress bar colour
  const barCls = node.status === 'completed' ? 'bg-green-500' : 'bg-blue-500';

  // Glow style (box-shadow can't be in Tailwind without arbitrary values, use inline)
  const glowStyle: React.CSSProperties = {};
  if (node.status === 'completed')   glowStyle.boxShadow = isSelected ? '0 0 24px rgba(34,197,94,0.45)' : '0 0 10px rgba(34,197,94,0.2)';
  if (node.status === 'in-progress') glowStyle.boxShadow = isSelected ? '0 0 24px rgba(59,130,246,0.5)'  : '0 0 14px rgba(59,130,246,0.25)';

  const difficultyBadge = () => {
    if (node.skillLabel.toLowerCase().includes('advanced'))
      return { cls: 'bg-red-900/60 text-red-300', label: 'Advanced' };
    if (node.skillLabel.toLowerCase().includes('intermediate'))
      return { cls: 'bg-yellow-900/60 text-yellow-300', label: 'Intermediate' };
    return { cls: 'bg-green-900/60 text-green-300', label: 'Beginner' };
  };
  const badge = difficultyBadge();

  return (
    <motion.div
      style={{ ...style, ...glowStyle }}
      className={`
        absolute rounded-2xl border-2 p-3 backdrop-blur-sm cursor-pointer select-none
        ${statusCls}
        ${node.status === 'locked' ? 'opacity-50 saturate-0' : ''}
        ${isSelected ? 'ring-2 ring-white/20 ring-offset-0' : ''}
        transition-shadow duration-300
      `}
      animate={node.status === 'in-progress' ? { scale: [1, 1.025, 1] } : { scale: 1 }}
      transition={node.status === 'in-progress'
        ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
        : { duration: 0.15 }}
      whileHover={node.status !== 'locked' ? { scale: 1.06 } : {}}
      whileTap={{ scale: 0.97 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onSelect(node.slug)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-lg flex-shrink-0">{node.icon}</span>
          <span className="font-bold text-white text-xs leading-tight truncate">{node.title}</span>
        </div>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-1.5 bg-gray-800/80 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${barCls}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
        <span className="text-xs text-gray-400 font-mono tabular-nums flex-shrink-0">
          {node.completedMissions}/{node.totalMissions}
        </span>
      </div>

      {/* Status chip */}
      <div className="text-xs font-medium">
        {node.status === 'completed'    && <span className="text-green-400">✅ Completed</span>}
        {node.status === 'in-progress'  && <span className="text-blue-400">⚡ In Progress</span>}
        {node.status === 'locked'       && <span className="text-gray-500">🔒 Locked</span>}
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: tooltipAbove ? 8 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: tooltipAbove ? 8 : -8 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute left-1/2 -translate-x-1/2 z-50
              w-52 bg-gray-800 border rounded-xl p-3 shadow-2xl pointer-events-none
              ${tooltipAbove ? 'bottom-full mb-2' : 'top-full mt-2'}
              ${node.status === 'locked' ? 'border-red-800/40' : 'border-gray-700'}
            `}
          >
            {node.status === 'locked' ? (
              <p className="text-xs text-gray-400">
                🔒 Complete <span className="text-white font-medium">Foundations</span> to unlock this path
              </p>
            ) : (
              <>
                <p className="text-xs text-gray-300 mb-2 leading-relaxed">{node.description}</p>
                <span className="text-xs text-blue-400 font-medium">Click to view missions →</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── MobileNodeCard ─────────────────────────────────────────────────────── */

interface MobileNodeCardProps {
  node: RoadmapNode;
  isSelected: boolean;
  onSelect: (slug: string) => void;
}

const MobileNodeCard: React.FC<MobileNodeCardProps> = ({ node, isSelected, onSelect }) => {
  const pct = node.totalMissions > 0 ? (node.completedMissions / node.totalMissions) * 100 : 0;

  const statusCls = {
    completed:    'border-green-500/50 bg-green-950/40',
    'in-progress': 'border-blue-500/50 bg-blue-950/40',
    locked:       'border-gray-700/50 bg-gray-900/80',
  }[node.status];

  return (
    <motion.div
      className={`
        relative z-10 rounded-2xl border-2 p-4 cursor-pointer
        ${statusCls}
        ${node.status === 'locked' ? 'opacity-50 saturate-0' : ''}
        ${isSelected ? 'ring-2 ring-white/20' : ''}
        transition-all duration-200
      `}
      animate={node.status === 'in-progress' ? { scale: [1, 1.015, 1] } : {}}
      transition={node.status === 'in-progress' ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : {}}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(node.slug)}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">{node.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-white text-sm truncate">{node.title}</span>
            <span className="text-xs text-gray-400 font-mono ml-2 flex-shrink-0">
              {node.completedMissions}/{node.totalMissions}
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${node.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
        <div className="flex-shrink-0 text-lg">
          {node.status === 'completed'   && '✅'}
          {node.status === 'in-progress' && '⚡'}
          {node.status === 'locked'      && '🔒'}
        </div>
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
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // ── Derive node data from missions ────────────────────────────────────────
  const nodes: RoadmapNode[] = PATH_SLUGS.map((slug) => {
    const meta         = LEARNING_PATHS[slug];
    const pathMissions = missionsByPath[slug] ?? [];
    const total        = pathMissions.length;
    const completed    = pathMissions.filter((m) => m.userProgress?.completed).length;
    const allLocked    = total > 0 && pathMissions.every((m) => m.isLocked);

    let status: NodeStatus;
    if (allLocked) {
      status = 'locked';
    } else if (total > 0 && completed === total) {
      status = 'completed';
    } else {
      status = 'in-progress';
    }

    return {
      slug,
      title:            meta.title,
      icon:             meta.icon,
      description:      meta.description,
      skillLabel:       meta.skillLabel,
      totalMissions:    total,
      completedMissions: completed,
      status,
    };
  });

  // ── Segment stroke colours ─────────────────────────────────────────────────
  const segmentStatuses = PATH_SEGMENTS.map((seg) => {
    const fromNode = nodes.find((n) => n.slug === seg.prevSlug)!;
    const toNode   = nodes.find((n) => n.slug === seg.slug)!;
    if (fromNode.status === 'completed' && toNode.status === 'completed')   return 'completed';
    if (fromNode.status === 'completed' && toNode.status === 'in-progress') return 'active';
    return 'locked';
  });

  const segmentColor: Record<string, string> = {
    completed: '#22c55e',
    active:    '#3b82f6',
    locked:    '#1e293b',
  };

  // ── Click handler ──────────────────────────────────────────────────────────
  const handleNodeClick = (slug: string) => {
    const node = nodes.find((n) => n.slug === slug)!;
    if (node.status === 'locked') {
      showToast(`🔒 Complete Foundations first to unlock "${node.title}"`);
      return;
    }
    onNodeSelect(slug);
  };

  // The last two nodes (bottom) need tooltips flipped above to avoid going off-screen
  const tooltipAboveSlugs = new Set(['consistency', 'scale-streaming']);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full">

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h2 className="text-xl font-bold text-white mb-1">🗺️ Your Learning Adventure</h2>
        <p className="text-sm text-gray-400">
          {foundationsComplete
            ? 'Foundations complete — all paths unlocked!'
            : 'Start with Foundations to unlock all advanced paths.'}
        </p>
      </motion.div>

      {/* ── Desktop SVG Roadmap (md+) ──────────────────────────────────────── */}
      <div
        className="hidden md:block relative w-full"
        style={{ aspectRatio: `${VW} / ${VH}` }}
      >
        {/* Background + path SVG */}
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {/* Subtle star-field */}
          {STARS.map((s) => (
            <circle key={s.id} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.opacity} />
          ))}

          {/* START label above foundations */}
          <g>
            <rect x={305} y={8} width={90} height={26} rx={13} fill="#0f172a" stroke="#1e293b" strokeWidth={1.5} />
            <text x={350} y={26} textAnchor="middle" fill="#475569" fontSize={11} fontWeight={700} fontFamily="system-ui, sans-serif">
              ▶ START
            </text>
          </g>

          {/* GOAL label below scale-streaming */}
          <g>
            <rect x={305} y={966} width={90} height={26} rx={13} fill="#0f172a" stroke="#1e293b" strokeWidth={1.5} />
            <text x={350} y={984} textAnchor="middle" fill="#475569" fontSize={11} fontWeight={700} fontFamily="system-ui, sans-serif">
              🌟 GOAL
            </text>
          </g>

          {/* Path segments */}
          {PATH_SEGMENTS.map((seg, i) => {
            const status = segmentStatuses[i];
            const color  = segmentColor[status];
            return (
              <g key={seg.slug}>
                {/* Glow layer */}
                {status !== 'locked' && (
                  <path d={seg.d} fill="none" stroke={color} strokeWidth={12} opacity={0.1} />
                )}
                {/* Main stroke */}
                <path
                  d={seg.d}
                  fill="none"
                  stroke={color}
                  strokeWidth={status === 'locked' ? 2 : 3}
                  strokeDasharray={status === 'locked' ? '8 5' : undefined}
                  opacity={status === 'locked' ? 0.35 : 0.9}
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {/* Node connector dots (rendered over path, behind HTML cards) */}
          {nodes.map((node) => {
            const { cx, cy } = NODE_CENTERS[node.slug];
            const dotColor =
              node.status === 'completed'   ? '#22c55e' :
              node.status === 'in-progress' ? '#3b82f6' : '#1e293b';
            return (
              <circle
                key={node.slug}
                cx={cx} cy={cy} r={7}
                fill={dotColor}
                stroke={dotColor === '#1e293b' ? '#334155' : dotColor}
                strokeWidth={2}
                opacity={node.status === 'locked' ? 0.3 : 1}
              />
            );
          })}
        </svg>

        {/* Absolutely-positioned HTML node cards */}
        {nodes.map((node) => {
          const { cx, cy } = NODE_CENTERS[node.slug];
          return (
            <NodeCard
              key={node.slug}
              node={node}
              isSelected={selectedSlug === node.slug}
              onSelect={handleNodeClick}
              tooltipAbove={tooltipAboveSlugs.has(node.slug)}
              style={{
                left:   `${((cx - CARD_W / 2) / VW) * 100}%`,
                top:    `${((cy - CARD_H / 2) / VH) * 100}%`,
                width:  `${(CARD_W / VW) * 100}%`,
                height: `${(CARD_H / VH) * 100}%`,
              }}
            />
          );
        })}
      </div>

      {/* ── Mobile Vertical Stack (< md) ──────────────────────────────────── */}
      <div className="block md:hidden relative pl-9">
        {/* Vertical line */}
        <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-gray-800 rounded-full" />

        <div className="space-y-3">
          {nodes.map((node) => {
            const dotColor =
              node.status === 'completed'   ? 'bg-green-500 border-green-400' :
              node.status === 'in-progress' ? 'bg-blue-500 border-blue-400'   :
              'bg-gray-700 border-gray-600';
            return (
              <div key={node.slug} className="relative">
                {/* Connector dot */}
                <div
                  className={`absolute -left-[1.55rem] top-[1.35rem] w-3 h-3 rounded-full border-2 ${dotColor}`}
                />
                <MobileNodeCard
                  node={node}
                  isSelected={selectedSlug === node.slug}
                  onSelect={handleNodeClick}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -18, x: '-50%' }}
            animate={{ opacity: 1, y: 0,   x: '-50%' }}
            exit={{   opacity: 0, y: -18, x: '-50%' }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-1/2 z-[100] bg-gray-800 border border-gray-700 text-sm text-white px-5 py-3 rounded-xl shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
