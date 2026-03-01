/**
 * LLDBuilder — orchestrator for the interactive LLD builder.
 *
 * Composes all sub-builders: ArchDecisionSelector, DBSchemaBuilder,
 * EntityCardBuilder, APIContractDesigner, LiveSchemaPreview, XPHintOverlay.
 *
 * Driven by mission LLD config. Falls back gracefully if no config present.
 * Initialises lldBuilderStore on mount and restores previous state if available.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../../data/api';
import { useLLDBuilderStore, selectSubmissionPayload } from '../../../stores/lldBuilderStore';
import { useXPEngine } from '../../../hooks/useXPEngine';
import { useLLDValidation } from '../../../hooks/useLLDValidation';
import { ArchDecisionSelector } from './ArchDecisionSelector';
import { DBSchemaBuilder } from './DBSchemaBuilder';
import { EntityCardBuilder } from './EntityCardBuilder';
import { APIContractDesigner } from './APIContractDesigner';
import { LiveSchemaPreview } from './LiveSchemaPreview';
import { XPHintOverlay } from './XPHintOverlay';
import type { LLDMissionConfig, LLDScoreResponse, LLDBuilderState } from '../../../data/lldTypes';

// ── Section Tab ───────────────────────────────────────────────────────────────

type Section = 'arch' | 'schema' | 'api' | 'preview';

const SECTION_CONFIG: Array<{
  id: Section;
  label: string;
  icon: string;
  errorKey: 'hasArchErrors' | 'hasSchemaErrors' | 'hasApiErrors' | null;
}> = [
  { id: 'arch', label: 'Architecture', icon: '⚙️', errorKey: 'hasArchErrors' },
  { id: 'schema', label: 'DB Schema', icon: '🗄️', errorKey: 'hasSchemaErrors' },
  { id: 'api', label: 'API Contracts', icon: '📡', errorKey: 'hasApiErrors' },
  { id: 'preview', label: 'Preview', icon: '👁️', errorKey: null },
];

// ── Score Results Panel ───────────────────────────────────────────────────────

const ScorePanel: React.FC<{ result: LLDScoreResponse; onRetry: () => void }> = ({ result, onRetry }) => {
  const isComplete = result.completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Completion celebration */}
      {isComplete && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-center py-4"
        >
          <div className="text-5xl mb-2">🎉</div>
          <div className="text-xl font-bold text-white">LLD Complete!</div>
          <div className="text-sm text-gray-400 mt-1">Your design is production-quality.</div>
        </motion.div>
      )}

      {/* Score breakdown */}
      <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-3xl font-bold text-white">
              {result.score}<span className="text-gray-500 text-xl">/100</span>
            </div>
            <div className="text-sm text-gray-400 mt-0.5">
              +{result.xpEarned} XP earned
              {result.netPenalty > 0 && (
                <span className="text-red-400 ml-1">(-{result.netPenalty} XP penalties)</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${result.totalXP >= 100 ? 'text-green-400' : result.totalXP >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {result.totalXP} XP
            </div>
            <div className="text-xs text-gray-500 mt-0.5">total</div>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="space-y-2">
          {[
            { label: 'Architecture', ...result.breakdown.archDecisions },
            { label: 'Schema', ...result.breakdown.schema },
            { label: 'API Contracts', ...result.breakdown.apiContracts },
          ].map(({ label, earned, max }) => {
            const pct = max > 0 ? Math.round((earned / max) * 100) : 0;
            return (
              <div key={label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white font-mono">{earned}/{max} pts</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      <div className="space-y-2">
        {result.feedback.map((fb, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
              fb.type === 'success'
                ? 'text-green-400 border-green-500/30 bg-green-900/20'
                : fb.type === 'error'
                ? 'text-red-400 border-red-500/30 bg-red-900/20'
                : 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20'
            }`}
          >
            <span>{fb.type === 'success' ? '✅' : fb.type === 'error' ? '❌' : '⚠️'}</span>
            <span>{fb.message}</span>
          </div>
        ))}
      </div>

      {/* Retry */}
      <div className="flex justify-end">
        <button
          onClick={onRetry}
          className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-lg transition-colors"
        >
          Revise & Resubmit →
        </button>
      </div>
    </motion.div>
  );
};

// ── XP Progress Bar ───────────────────────────────────────────────────────────

const XPProgressBar: React.FC = () => {
  const { xpDelta, pendingPenalties } = useLLDBuilderStore();
  const totalPenalty = pendingPenalties.reduce((s, p) => s + p.xpDeduction, 0);
  const net = xpDelta;

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-gray-500">Session XP</span>
      <div className="flex items-center gap-1">
        {net > 0 && <span className="text-green-400 font-mono">+{net} XP</span>}
        {totalPenalty > 0 && <span className="text-red-400 font-mono">-{totalPenalty} XP penalties</span>}
        {net === 0 && totalPenalty === 0 && <span className="text-gray-600">—</span>}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

interface LLDBuilderProps {
  missionSlug: string;
  config: LLDMissionConfig;
  previousState?: Partial<LLDBuilderState> | null;
  onXpEarned?: (xp: number) => void;
}

export const LLDBuilder: React.FC<LLDBuilderProps> = ({
  missionSlug,
  config,
  previousState,
  onXpEarned,
}) => {
  const [activeSection, setActiveSection] = useState<Section>('arch');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LLDScoreResponse | null>(null);

  const { initBuilder, setValidationErrors, setSubmittedWithWarnings } = useLLDBuilderStore();
  const { errors, isValid, hasArchErrors, hasSchemaErrors, hasApiErrors } = useLLDValidation();

  // Activate XP engine (watches store, fires hints)
  useXPEngine();

  // Initialise store on mount
  useEffect(() => {
    initBuilder(config, previousState ?? undefined);
  }, [config, missionSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep validation errors in store (for penalty detection on submit)
  useEffect(() => {
    setValidationErrors(errors);
  }, [errors, setValidationErrors]);

  const handleSubmit = async () => {
    if (submitting) return;

    // If there are errors, mark as submitted-with-warnings (triggers penalty)
    if (!isValid) {
      setSubmittedWithWarnings(true);
    }

    setSubmitting(true);
    try {
      const payload = selectSubmissionPayload(useLLDBuilderStore.getState());
      const res = await apiClient.post<LLDScoreResponse>(`/lld/${missionSlug}/score`, payload);
      setResult(res);
      if (res.xpEarned > 0) onXpEarned?.(res.xpEarned);
    } catch (err) {
      // Silently handle — score API failure shows optimistic message
      console.error('[LLDBuilder] Score submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const errorMap = { hasArchErrors, hasSchemaErrors, hasApiErrors };

  // Show results view
  if (result) {
    return (
      <div className="space-y-4">
        <ScorePanel result={result} onRetry={() => setResult(null)} />
        <XPHintOverlay />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-800/50 rounded-xl p-1">
          {SECTION_CONFIG.map(section => {
            const hasError = section.errorKey ? errorMap[section.errorKey] : false;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${activeSection === section.id
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                <span>{section.icon}</span>
                <span className="hidden sm:inline">{section.label}</span>
                {hasError && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
        <XPProgressBar />
      </div>

      {/* Section content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {activeSection === 'arch' && (
            <ArchDecisionSelector
              validationErrors={errors.filter(e => e.section === 'archDecisions').map(e => e.field ?? '')}
            />
          )}
          {activeSection === 'schema' && (
            <div className="space-y-4">
              <DBSchemaBuilder />
              <EntityCardBuilder
                validationErrors={errors.filter(e => e.section === 'schema').map(e => e.message)}
              />
            </div>
          )}
          {activeSection === 'api' && (
            <APIContractDesigner
              validationErrors={errors.filter(e => e.section === 'apiContracts').map(e => e.message)}
            />
          )}
          {activeSection === 'preview' && <LiveSchemaPreview />}
        </motion.div>
      </AnimatePresence>

      {/* Validation summary */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-900/10 px-3 py-2">
          <div className="text-xs text-yellow-400 flex items-center gap-1.5">
            <span>⚠️</span>
            {errors.length} {errors.length === 1 ? 'issue' : 'issues'} to resolve
            <span className="text-gray-500">— submitting now will apply a -5 XP penalty</span>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-gray-600">
          {isValid ? '✅ Ready to submit' : `⚠️ ${errors.length} validation ${errors.length === 1 ? 'issue' : 'issues'}`}
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary px-8 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Scoring…' : 'Submit LLD →'}
        </button>
      </div>

      {/* XP hint overlay (global, fixed position) */}
      <XPHintOverlay />
    </div>
  );
};
