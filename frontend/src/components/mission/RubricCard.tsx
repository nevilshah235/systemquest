/**
 * RubricCard — Living Rubrics Transparency Card (Phase 4)
 *
 * Shows the AI-generated topology quality rubric for the current mission:
 *   • Overall topology quality score (0-100, weighted)
 *   • Per-item pass/fail with AI-generated reasoning
 *   • Rubric version hash for auditability
 *   • Category badges: structural | requirement
 *
 * The rubric score is a *separate* signal from the engine score — it evaluates
 * topology quality, not raw metric values (per ADR-005).
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types (mirrors rubricService.ts) ────────────────────────────────────────

export interface RubricItem {
  id: string;
  category: 'structural' | 'requirement';
  check: string;
  description: string;
  weight: number;
}

export interface RubricEvaluationResult {
  itemId: string;
  passed: boolean;
  reason: string;
}

export interface RubricScore {
  missionSlug:   string;
  rubricVersion: string;
  items:         RubricItem[];
  evaluations:   RubricEvaluationResult[];
  score:         number;
  passedCount:   number;
  totalCount:    number;
}

// ── Skeleton loader ────────────────────────────────────────────────────────

export const RubricSkeleton: React.FC = () => (
  <div className="card p-4 mb-4 animate-pulse">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-4 h-4 bg-gray-700 rounded-full" />
      <div className="h-3 w-40 bg-gray-700 rounded" />
      <div className="h-3 w-16 bg-gray-700 rounded ml-auto" />
    </div>
    <div className="h-2 bg-gray-700 rounded-full w-full mb-3" />
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-700 rounded-full flex-shrink-0" />
          <div className="h-3 bg-gray-700 rounded flex-1" />
          <div className="h-3 w-12 bg-gray-700 rounded flex-shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────

export const RubricCard: React.FC<{ rubric: RubricScore }> = ({ rubric }) => {
  const [expanded,    setExpanded]    = useState(false);
  const [openItemId,  setOpenItemId]  = useState<string | null>(null);

  const scoreColor =
    rubric.score >= 80 ? 'text-green-400' :
    rubric.score >= 50 ? 'text-amber-400' : 'text-red-400';

  const barColor =
    rubric.score >= 80 ? 'bg-green-500' :
    rubric.score >= 50 ? 'bg-amber-500' : 'bg-red-500';

  const borderColor =
    rubric.score >= 80 ? 'border-green-700/30' :
    rubric.score >= 50 ? 'border-amber-700/30' : 'border-red-700/30';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={`card p-4 mb-4 border ${borderColor}`}
    >
      {/* ── Header row ── */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">📋</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
          Topology Quality Rubric
        </span>
        <span
          className="ml-auto text-[10px] font-mono text-gray-600 cursor-help"
          title={`Rubric version: ${rubric.rubricVersion}`}
        >
          v·{rubric.rubricVersion.slice(0, 6)}
        </span>
      </div>

      {/* ── Score bar ── */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`text-2xl font-black flex-shrink-0 ${scoreColor}`}>
          {rubric.score}
          <span className="text-sm font-normal text-gray-500">/100</span>
        </div>
        <div className="flex-1">
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${rubric.score}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className={`h-full rounded-full ${barColor}`}
            />
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {rubric.passedCount} of {rubric.totalCount} topology checks passed
          </div>
        </div>
      </div>

      {/* ── Expand/collapse toggle ── */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between text-xs text-gray-400
          hover:text-gray-200 transition-colors py-1"
      >
        <span>{expanded ? 'Hide details' : 'Show rubric breakdown'}</span>
        <span className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {/* ── Per-item list ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-1.5">
              {rubric.items.map((item) => {
                const evalResult = rubric.evaluations.find((e) => e.itemId === item.id);
                const passed     = evalResult?.passed ?? false;
                const isOpen     = openItemId === item.id;

                return (
                  <div key={item.id}>
                    <button
                      onClick={() => setOpenItemId(isOpen ? null : item.id)}
                      className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-xs text-left
                        transition-colors ${passed
                          ? 'bg-green-900/10 border border-green-700/20 hover:bg-green-900/20'
                          : 'bg-red-900/10 border border-red-700/20 hover:bg-red-900/20'
                        }`}
                    >
                      {/* Pass/fail icon */}
                      <span className={`flex-shrink-0 mt-0.5 font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>
                        {passed ? '✓' : '✗'}
                      </span>

                      {/* Check label */}
                      <span className={`flex-1 leading-relaxed ${passed ? 'text-green-200' : 'text-red-200'}`}>
                        {item.check}
                      </span>

                      {/* Category badge */}
                      <span className={`flex-shrink-0 text-[9px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded
                        ${item.category === 'structural'
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-purple-900/30 text-purple-400'
                        }`}>
                        {item.category}
                      </span>

                      {/* Weight */}
                      <span className="flex-shrink-0 text-[10px] text-gray-500 ml-1">
                        {item.weight}pt
                      </span>
                    </button>

                    {/* Expandable: description + AI reason */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="mx-3 mb-1.5 px-3 py-2 rounded-b-lg bg-gray-800/60 border-x border-b border-gray-700/40 space-y-1.5">
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                              <span className="text-gray-500 font-medium">Why this matters: </span>
                              {item.description}
                            </p>
                            {evalResult?.reason && (
                              <p className={`text-[11px] leading-relaxed ${passed ? 'text-green-300/80' : 'text-red-300/80'}`}>
                                <span className="font-medium">{passed ? '✓ ' : '✗ '}</span>
                                {evalResult.reason}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Rubric version footer */}
            <p className="text-[10px] text-gray-700 mt-3 text-right font-mono">
              rubric {rubric.rubricVersion} · {rubric.items.length} items · AI-generated
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
