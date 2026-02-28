import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComparisonResult } from '../../data/types';
import { apiClient } from '../../data/api';

const COMPONENT_ICONS: Record<string, string> = {
  client: '👤', loadbalancer: '⚖️', server: '🖥️', database: '🗄️',
  cache: '⚡', cdn: '🌐', queue: '📋', storage: '💾',
  monitoring: '📊', apigateway: '🔀',
};

interface ComparePanelProps {
  missionSlug: string;
  onClose: () => void;
}

export const ComparePanel: React.FC<ComparePanelProps> = ({ missionSlug, onClose }) => {
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<ComparisonResult>(`/comparison/${missionSlug}`)
      .then((data) => setResult(data))
      .catch((err) => setError(err?.response?.data?.error ?? 'Failed to load comparison'))
      .finally(() => setLoading(false));
  }, [missionSlug]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed inset-y-0 right-0 w-full max-w-lg bg-gray-900 border-l border-gray-700 overflow-y-auto z-50 shadow-2xl"
    >
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-white text-lg">Compare with Reference</h2>
          <p className="text-xs text-gray-400 mt-0.5">How does your design compare to an ideal solution?</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-5 space-y-6">
        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-red-300 text-sm">{error}</div>
        )}

        {result && (
          <>
            {/* Score */}
            <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4 text-center">
              <div className="text-3xl font-bold text-white">{result.attemptScore}<span className="text-gray-500 text-xl">/100</span></div>
              <div className="text-xs text-gray-400 mt-1">Your best score</div>
            </div>

            {/* Components diff */}
            <section>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <span>🧩</span> Component Analysis
              </h3>
              <div className="space-y-2">
                {result.components.matched.length > 0 && (
                  <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
                    <div className="text-xs font-medium text-green-400 mb-2">✅ Matched ({result.components.matched.length})</div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.components.matched.map(t => (
                        <span key={t} className="text-xs bg-green-900/30 text-green-300 px-2 py-0.5 rounded-full">
                          {COMPONENT_ICONS[t] ?? '📦'} {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.components.missing.length > 0 && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                    <div className="text-xs font-medium text-red-400 mb-2">❌ Missing from your design ({result.components.missing.length})</div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.components.missing.map(t => (
                        <span key={t} className="text-xs bg-red-900/30 text-red-300 px-2 py-0.5 rounded-full">
                          {COMPONENT_ICONS[t] ?? '📦'} {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.components.extra.length > 0 && (
                  <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
                    <div className="text-xs font-medium text-yellow-400 mb-2">⚠️ Extra components (may be over-engineered) ({result.components.extra.length})</div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.components.extra.map(t => (
                        <span key={t} className="text-xs bg-yellow-900/30 text-yellow-300 px-2 py-0.5 rounded-full">
                          {COMPONENT_ICONS[t] ?? '📦'} {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Key insights */}
            {result.keyInsights.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <span>💡</span> Key Design Insights
                </h3>
                <ul className="space-y-2">
                  {result.keyInsights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-brand-400 mt-0.5 flex-shrink-0">→</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Trade-offs */}
            {result.tradeoffs.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <span>⚖️</span> Key Trade-offs
                </h3>
                <div className="space-y-2">
                  {result.tradeoffs.map((t, i) => (
                    <div key={i} className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                      <div className="text-sm font-medium text-white">{t.decision}</div>
                      <div className="text-xs text-gray-400 mt-1">{t.reason}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Anti-patterns */}
            {result.antiPatterns.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <span>🚫</span> Common Anti-Patterns to Avoid
                </h3>
                <ul className="space-y-2">
                  {result.antiPatterns.map((ap, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                      <span className="text-red-500 mt-0.5 flex-shrink-0">✗</span>
                      {ap}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
