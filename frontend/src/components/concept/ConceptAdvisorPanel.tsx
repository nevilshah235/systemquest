import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { conceptsApi } from '../../data/api';

interface Concept {
  slug: string;
  title: string;
  summary: string;
  deepDive: string;
  emoji: string;
  difficulty: string;
  relatedMissions: string[];
  relatedPaths: string[];
}

interface AdvisorData {
  concepts: Concept[];
  source: 'gap-analysis' | 'starter';
}

const DIFF_COLORS: Record<string, string> = {
  beginner: 'text-green-400 bg-green-900/30 border-green-700/40',
  intermediate: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/40',
  advanced: 'text-red-400 bg-red-900/30 border-red-700/40',
};

interface ConceptAdvisorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** When true (during interview simulation), panel is suppressed */
  simulationMode?: boolean;
}

export const ConceptAdvisorPanel: React.FC<ConceptAdvisorPanelProps> = ({
  isOpen, onClose, simulationMode = false,
}) => {
  const [data, setData] = useState<AdvisorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || simulationMode || data) return;
    setLoading(true);
    conceptsApi.getRecommendations()
      .then(setData)
      .catch(() => {/* silent fail */})
      .finally(() => setLoading(false));
  }, [isOpen, simulationMode]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  if (simulationMode) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-gray-900 border-l border-gray-700 overflow-y-auto z-50 shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-white flex items-center gap-2">
                    <span>🧠</span> What should I learn?
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {data?.source === 'gap-analysis'
                      ? 'Personalised concepts based on your performance gaps'
                      : 'Starter concepts to build your foundation'}
                  </p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {loading && (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              )}

              {!loading && data?.concepts.map((concept) => (
                <motion.div
                  key={concept.slug}
                  layout
                  className="rounded-xl border border-gray-700 bg-gray-800/50 overflow-hidden"
                >
                  <button
                    className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
                    onClick={() => setExpanded(expanded === concept.slug ? null : concept.slug)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="text-xl flex-shrink-0 mt-0.5">{concept.emoji}</span>
                        <div className="min-w-0">
                          <div className="font-medium text-white text-sm">{concept.title}</div>
                          <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{concept.summary}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFF_COLORS[concept.difficulty] ?? ''}`}>
                          {concept.difficulty}
                        </span>
                        <svg
                          className={`w-4 h-4 text-gray-500 transition-transform ${expanded === concept.slug ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {expanded === concept.slug && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 border-t border-gray-700 pt-3">
                          <p className="text-sm text-gray-300 leading-relaxed">{concept.deepDive}</p>
                          {concept.relatedMissions.length > 0 && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1.5">Practice in missions:</div>
                              <div className="flex flex-wrap gap-1.5">
                                {concept.relatedMissions.map(slug => (
                                  <a
                                    key={slug}
                                    href={`/mission/${slug}`}
                                    className="text-xs bg-brand-900/30 text-brand-400 border border-brand-700/40 px-2 py-0.5 rounded-full hover:bg-brand-800/40 transition-colors"
                                    onClick={onClose}
                                  >
                                    → {slug.replace(/-/g, ' ')}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
