/**
 * Mistake Pattern Card — F-003
 * Displays a single anti-pattern with dimension badge, frequency, affected missions,
 * and a linked concept card for remediation.
 */
import React from 'react';
import { MistakePattern } from '../../data/types';

const DIMENSION_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  scalability:      { label: 'Scalability',    icon: '📈', color: 'border-blue-500/40 bg-blue-500/10 text-blue-300' },
  consistency:      { label: 'Consistency',    icon: '🔐', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
  reliability:      { label: 'Reliability',    icon: '🛡️', color: 'border-red-500/40 bg-red-500/10 text-red-300' },
  'api-design':     { label: 'API Design',     icon: '🔌', color: 'border-green-500/40 bg-green-500/10 text-green-300' },
  'data-modelling': { label: 'Data Modelling', icon: '🗃️', color: 'border-orange-500/40 bg-orange-500/10 text-orange-300' },
};

/** Human-readable titles for concept slugs shown in remediation links. */
const CONCEPT_TITLES: Record<string, string> = {
  'load-balancing':           'Load Balancing',
  'caching-strategies':       'Caching Strategies',
  'cdn-basics':               'Content Delivery Networks',
  'monitoring-observability': 'Monitoring & Observability',
  'api-gateway-pattern':      'API Gateway Pattern',
  'message-queues':           'Message Queues & Pub/Sub',
  'object-storage':           'Object Storage & Blob Design',
  'distributed-locking':      'Distributed Locking',
  'idempotency':              'Idempotency & Exactly-Once',
  'spof-availability':        'SPOF & High Availability',
};

interface Props {
  pattern: MistakePattern;
  /** Called when user clicks the concept card link — passes the concept slug. */
  onLearnConcept?: (slug: string) => void;
}

export const MistakePatternCard: React.FC<Props> = ({ pattern, onLearnConcept }) => {
  const dim = DIMENSION_CONFIG[pattern.dimension] ?? {
    label: pattern.dimension,
    icon: '⚠️',
    color: 'border-gray-700 bg-gray-800/50 text-gray-300',
  };
  const conceptTitle = pattern.conceptSlug ? (CONCEPT_TITLES[pattern.conceptSlug] ?? pattern.conceptSlug) : null;

  return (
    <div
      className={`rounded-xl border p-4 transition-opacity ${
        pattern.isResolved
          ? 'border-gray-700/40 bg-gray-900/20 opacity-50'
          : 'border-gray-700 bg-gray-900/60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: name + dimension */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1.5">
            {/* Dimension badge */}
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${
                dim.color
              }`}
            >
              <span>{dim.icon}</span>
              <span>{dim.label}</span>
            </span>
            {/* Resolved badge */}
            {pattern.isResolved && (
              <span className="text-xs font-medium text-green-400">✅ Resolved</span>
            )}
          </div>
          <h3 className="font-semibold text-white text-sm leading-snug">{pattern.patternName}</h3>
        </div>

        {/* Right: frequency */}
        <div className="flex-shrink-0 text-center min-w-[40px]">
          <div className="text-2xl font-black text-white leading-none">{pattern.frequency}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {pattern.frequency === 1 ? 'time' : 'times'}
          </div>
        </div>
      </div>

      {/* Affected missions */}
      {pattern.affectedMissions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-500 self-center">Seen in:</span>
          {pattern.affectedMissions.slice(0, 4).map((slug) => (
            <span
              key={slug}
              className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700/50"
            >
              {slug}
            </span>
          ))}
          {pattern.affectedMissions.length > 4 && (
            <span className="text-xs text-gray-600">+{pattern.affectedMissions.length - 4} more</span>
          )}
        </div>
      )}

      {/* Concept card link */}
      {conceptTitle && !pattern.isResolved && onLearnConcept && pattern.conceptSlug && (
        <button
          onClick={() => onLearnConcept(pattern.conceptSlug!)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium"
        >
          <span>📚</span>
          <span>Learn: {conceptTitle}</span>
          <span>→</span>
        </button>
      )}
    </div>
  );
};
