/**
 * SolutionViewer — shows the optimal architecture for a mission,
 * highlights what the user's current design is missing, and lets
 * them apply the full solution directly to the canvas.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Architecture, ComponentType, getComponentMeta, normalizeComponentType } from '../../data/types';
import { MISSION_SOLUTIONS, computeGap, computeOptimality, computeConnectionGap } from '../../data/solutions';
import { useBuilderStore } from '../../stores/builderStore';

interface SolutionViewerProps {
  missionSlug: string;
  currentArchitecture: Architecture;
  /** Called after "Apply Solution" so the parent can navigate back to builder */
  onApply: () => void;
  onClose: () => void;
}

export const SolutionViewer: React.FC<SolutionViewerProps> = ({
  missionSlug,
  currentArchitecture,
  onApply,
  onClose,
}) => {
  const [applied, setApplied] = useState(false);
  const solution = MISSION_SOLUTIONS[missionSlug];

  if (!solution) {
    return (
      <div className="p-6 text-center text-gray-400 text-sm">
        No reference solution available for this mission yet.
      </div>
    );
  }

  const gaps           = computeGap(currentArchitecture, missionSlug);
  const connectionGaps = computeConnectionGap(currentArchitecture, missionSlug);
  const optimality     = computeOptimality(currentArchitecture, missionSlug);
  const isOptimal      = gaps.length === 0 && connectionGaps.length === 0;

  const handleApply = () => {
    useBuilderStore.getState().loadArchitecture(solution.architecture);
    setApplied(true);
    setTimeout(() => {
      onApply(); // navigate back to builder
    }, 600);
  };

  // Count optimal component types for the "Optimal design" column
  const optimalCounts: Record<string, number> = {};
  for (const c of solution.architecture.components) {
    const t = normalizeComponentType(c.type as ComponentType);
    optimalCounts[t] = (optimalCounts[t] ?? 0) + 1;
  }

  // Optimality colour
  const optColor =
    optimality >= 80 ? 'text-green-400' : optimality >= 50 ? 'text-amber-400' : 'text-red-400';
  const optBg =
    optimality >= 80 ? 'bg-green-500/10 border-green-500/20' : optimality >= 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.22 }}
      className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/80">
        <div className="flex items-center gap-3">
          <span className="text-lg">🗺️</span>
          <div>
            <h2 className="font-bold text-white text-sm">Ideal Solution</h2>
            <p className="text-xs text-gray-400 mt-0.5">Reference architecture for this mission</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none px-1"
        >
          ✕
        </button>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Optimality score ── */}
        <div className={`flex items-center gap-4 p-3 rounded-xl border ${optBg}`}>
          <div className="text-center flex-shrink-0 w-16">
            <div className={`text-2xl font-black ${optColor}`}>{optimality}%</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">optimal</div>
          </div>
          <div className="flex-1">
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${optimality}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  optimality >= 80 ? 'bg-green-500' : optimality >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {isOptimal
                ? 'Your architecture matches the ideal solution!'
                : (() => {
                    const missingComps  = gaps.reduce((s, g) => s + g.missing, 0);
                    const missingConns  = connectionGaps.reduce((s, g) => s + g.missing, 0);
                    const parts: string[] = [];
                    if (missingComps  > 0) parts.push(`${missingComps} component${missingComps  !== 1 ? 's' : ''}`);
                    if (missingConns  > 0) parts.push(`${missingConns} connection${missingConns  !== 1 ? 's' : ''}`);
                    return `${parts.join(' and ')} missing from the optimal design`;
                  })()
              }
            </p>
          </div>
        </div>

        {/* ── Two-column comparison ── */}
        <div className="grid grid-cols-2 gap-3">

          {/* Your architecture */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
              Your Design
            </div>
            <div className="space-y-1">
              {Object.entries(optimalCounts).map(([type, needed]) => {
                const have = currentArchitecture.components.filter((c) => normalizeComponentType(c.type as ComponentType) === type).length;
                const met = have >= needed;
                const meta = getComponentMeta(type as ComponentType);
                return (
                  <div
                    key={type}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs
                      ${met ? 'bg-green-900/10 border border-green-700/20' : 'bg-red-900/10 border border-red-700/20'}`}
                  >
                    <span className="text-sm flex-shrink-0">{meta.icon}</span>
                    <span className={met ? 'text-green-300' : 'text-red-300'}>
                      {meta.label}{needed > 1 ? ` ×${have}/${needed}` : ''}
                    </span>
                    <span className="ml-auto">{met ? '✓' : '✗'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optimal design */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
              Ideal Design
            </div>
            <div className="space-y-1">
              {Object.entries(optimalCounts).map(([type, count]) => {
                const meta = getComponentMeta(type as ComponentType);
                return (
                  <div
                    key={type}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs bg-blue-900/10 border border-blue-700/20"
                  >
                    <span className="text-sm flex-shrink-0">{meta.icon}</span>
                    <span className="text-blue-300">
                      {meta.label}{count > 1 ? ` ×${count}` : ''}
                    </span>
                    <span className="ml-auto text-blue-400">✓</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Gap list ── */}
        {(gaps.length > 0 || connectionGaps.length > 0) && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">
              ⚠ What's Missing
            </div>
            <div className="space-y-1.5">

              {/* Component gaps */}
              {gaps.map((gap) => {
                const meta = getComponentMeta(gap.type as ComponentType);
                return (
                  <div
                    key={`comp-${gap.type}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-red-900/10 border border-red-700/25 text-xs"
                  >
                    <span className="text-base flex-shrink-0">{meta.icon}</span>
                    <div>
                      <span className="text-red-200 font-medium">{meta.label}</span>
                      {gap.missing > 1 && (
                        <span className="text-red-400 ml-1">(add {gap.missing} more)</span>
                      )}
                    </div>
                    <span className="ml-auto text-[10px] text-red-500 uppercase tracking-wide font-bold">
                      component
                    </span>
                  </div>
                );
              })}

              {/* Connection / topology gaps */}
              {connectionGaps.map((gap) => {
                const fromMeta = getComponentMeta(gap.from as ComponentType);
                const toMeta   = getComponentMeta(gap.to as ComponentType);
                return (
                  <div
                    key={`conn-${gap.from}-${gap.to}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-orange-900/10 border border-orange-700/25 text-xs"
                  >
                    <span className="text-base flex-shrink-0">🔗</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-orange-200 font-medium">
                        {fromMeta.icon} {fromMeta.label}
                        <span className="text-orange-500 mx-1">→</span>
                        {toMeta.icon} {toMeta.label}
                      </span>
                      {gap.missing > 1 && (
                        <span className="text-orange-400 ml-1">(×{gap.missing} wires needed)</span>
                      )}
                    </div>
                    <span className="ml-auto text-[10px] text-orange-500 uppercase tracking-wide font-bold flex-shrink-0">
                      connection
                    </span>
                  </div>
                );
              })}

            </div>
          </div>
        )}

        {/* ── Step-by-step guide ── */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            Step-by-Step Build Guide
          </div>
          <ol className="space-y-2">
            {solution.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-gray-300">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-600/30 border border-brand-500/40 text-brand-300 flex items-center justify-center text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Why this works ── */}
        <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/40 text-xs text-gray-400 leading-relaxed">
          <span className="text-gray-300 font-semibold">Why this works: </span>
          {solution.explanation}
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-shrink-0">
            Keep mine
          </button>
          <button
            onClick={handleApply}
            disabled={applied}
            className={`btn-primary flex-1 transition-all ${applied ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {applied ? '✓ Applied — loading builder…' : '⚡ Apply Ideal Solution'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
