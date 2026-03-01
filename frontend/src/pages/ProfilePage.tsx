/**
 * Profile Page — F-003 Mistake Patterns
 * Shows the user's personal anti-pattern report, gated behind 3 mission completions.
 * Patterns are grouped by dimension with concept card links for remediation.
 */
import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePatternStore } from '../stores/patternStore';
import { useAuthStore } from '../stores/authStore';
import { MistakePatternCard } from '../components/profile/MistakePatternCard';
import { MistakePattern } from '../data/types';

const DIMENSION_ORDER = [
  'scalability',
  'reliability',
  'api-design',
  'consistency',
  'data-modelling',
];

const DIMENSION_LABELS: Record<string, string> = {
  scalability:      '📈 Scalability',
  reliability:      '🛡️ Reliability',
  'api-design':     '🔌 API Design',
  consistency:      '🔐 Consistency',
  'data-modelling': '🗃️ Data Modelling',
};

export const ProfilePage: React.FC = () => {
  const { patterns, hasEnoughData, completedCount, requiredCount, isLoading, fetchPatterns } =
    usePatternStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  const activePatterns = useMemo(() => patterns.filter((p) => !p.isResolved), [patterns]);
  const resolvedPatterns = useMemo(() => patterns.filter((p) => p.isResolved), [patterns]);

  /** Active patterns grouped by dimension */
  const patternsByDimension = useMemo(() => {
    const groups: Record<string, MistakePattern[]> = {};
    for (const p of activePatterns) {
      if (!groups[p.dimension]) groups[p.dimension] = [];
      groups[p.dimension].push(p);
    }
    return groups;
  }, [activePatterns]);

  /**
   * Dispatch a custom event to open the Concept Advisor modal with a pre-selected concept.
   * The floating ConceptAdvisorButton listens for this event.
   */
  function handleLearnConcept(slug: string) {
    window.dispatchEvent(
      new CustomEvent('open-concept-advisor', { detail: { conceptSlug: slug } }),
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* ── Page header ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white mb-1">
          {user?.username ? (
            <>
              {user.username}’s{' '}
              <span className="text-brand-400">Profile</span>
            </>
          ) : (
            'My Profile'
          )}
        </h1>
        <p className="text-gray-400 text-sm">
          Personal anti-pattern report —{' '}
          {completedCount} mission{completedCount !== 1 ? 's' : ''} completed
        </p>
      </motion.div>

      {/* ── Mistake Patterns section ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.1 } }}
      >
        {/* Section header */}
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-bold text-white">🧠 Mistake Patterns</h2>
          {hasEnoughData && activePatterns.length > 0 && (
            <span className="bg-red-500/20 text-red-300 text-xs px-2 py-0.5 rounded-full border border-red-500/30 font-medium">
              {activePatterns.length} active
            </span>
          )}
          {hasEnoughData && resolvedPatterns.length > 0 && (
            <span className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full border border-green-500/30 font-medium">
              {resolvedPatterns.length} resolved ✅
            </span>
          )}
        </div>

        {/* ── Loading state */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-700 p-5 animate-pulse h-24 bg-gray-900/40"
              />
            ))}
          </div>
        ) : !hasEnoughData ? (
          /* ── Gate: not enough mission completions */
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-8 text-center">
            <div className="text-5xl mb-4">🔬</div>
            <h3 className="text-white font-semibold text-lg mb-2">Not enough data yet</h3>
            <p className="text-gray-400 text-sm mb-1">
              Complete at least{' '}
              <span className="text-white font-semibold">{requiredCount} missions</span>{' '}
              to unlock your Mistake Patterns report.
            </p>
            <p className="text-gray-500 text-xs mb-5">
              {completedCount} / {requiredCount} missions completed{' '}
              · {requiredCount - completedCount} more to go
            </p>
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden max-w-xs mx-auto">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (completedCount / requiredCount) * 100)}%` }}
              />
            </div>
          </div>
        ) : activePatterns.length === 0 && resolvedPatterns.length === 0 ? (
          /* ── All clear — no patterns detected */
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-white font-semibold text-lg mb-2">No patterns detected!</h3>
            <p className="text-gray-400 text-sm">
              Your architectures are covering all key components. Keep it up!
            </p>
          </div>
        ) : (
          /* ── Pattern report */
          <div className="space-y-8">
            {/* Active patterns by dimension */}
            {DIMENSION_ORDER.filter((d) => (patternsByDimension[d]?.length ?? 0) > 0).map(
              (dimension) => (
                <div key={dimension}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {DIMENSION_LABELS[dimension] ?? dimension}
                  </h3>
                  <div className="space-y-3">
                    {patternsByDimension[dimension].map((pattern, i) => (
                      <motion.div
                        key={pattern.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                      >
                        <MistakePatternCard
                          pattern={pattern}
                          onLearnConcept={handleLearnConcept}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ),
            )}

            {/* Resolved patterns (collapsed) */}
            {resolvedPatterns.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-300 transition-colors select-none list-none flex items-center gap-2">
                  <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
                  <span>
                    {resolvedPatterns.length} resolved pattern
                    {resolvedPatterns.length !== 1 ? 's' : ''}
                  </span>
                </summary>
                <div className="mt-3 space-y-3">
                  {resolvedPatterns.map((pattern) => (
                    <MistakePatternCard key={pattern.id} pattern={pattern} />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
