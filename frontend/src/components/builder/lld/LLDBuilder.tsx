/**
 * LLDBuilder — tabbed orchestrator for the interactive LLD builder.
 *
 * Tabs: Architecture | DB Schema | API Contracts | Preview | Solution
 * The Solution tab shows lldContent (design prompt, key entities, API hints)
 * as a reference guide once HLD is completed.
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

// ── Types ─────────────────────────────────────────────────────────────────────

type Section = 'arch' | 'schema' | 'api' | 'preview' | 'solution';

interface LLDContent {
  prompt: string;
  keyEntities: string[];
  apiHints: string[];
}

// ── Tab config ────────────────────────────────────────────────────────────────

const SECTION_CONFIG: Array<{
  id: Section;
  label: string;
  icon: string;
  errorKey: 'hasArchErrors' | 'hasSchemaErrors' | 'hasApiErrors' | null;
}> = [
  { id: 'arch',     label: 'Architecture', icon: '⚙️',  errorKey: 'hasArchErrors'  },
  { id: 'schema',   label: 'DB Schema',    icon: '🗄️',  errorKey: 'hasSchemaErrors' },
  { id: 'api',      label: 'API Contracts',icon: '📡',  errorKey: 'hasApiErrors'   },
  { id: 'preview',  label: 'Preview',      icon: '👁️',  errorKey: null             },
  { id: 'solution', label: 'Solution',     icon: '💡',  errorKey: null             },
];

// ── Mission Brief Banner ──────────────────────────────────────────────────────
// Always visible above the tab bar — gives users full context before designing.

const MissionBriefBanner: React.FC<{ lldContent: LLDContent | null }> = ({ lldContent }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!lldContent?.prompt) return null;

  return (
    <div className="rounded-xl border border-blue-500/25 bg-blue-900/10">
      {/* Header row — always visible */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="text-sm font-semibold text-blue-200">Mission Brief</span>
          <span className="text-xs text-gray-500">What you're building</span>
        </div>
        <span className="text-gray-500 text-xs">{collapsed ? '▼ show' : '▲ hide'}</span>
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-blue-500/15 pt-3">
              <p className="text-sm text-gray-200 leading-relaxed">{lldContent.prompt}</p>
              {lldContent.keyEntities.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500 shrink-0">Key entities:</span>
                  {lldContent.keyEntities.map(entity => (
                    <span
                      key={entity}
                      className="text-xs font-mono bg-purple-900/30 border border-purple-500/30 text-purple-200 px-2.5 py-1 rounded-lg"
                    >
                      {entity}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Solution Panel ────────────────────────────────────────────────────────────

const SolutionPanel: React.FC<{ lldContent: LLDContent | null }> = ({ lldContent }) => {
  if (!lldContent) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-800/30 p-6 text-center text-gray-500 text-sm">
        No reference solution available for this mission yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">💡</span>
        <h3 className="text-sm font-semibold text-white">Design Reference</h3>
        <span className="text-xs text-gray-500">Use this as a guide — your implementation can differ</span>
      </div>

      {/* Design prompt */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-900/10 p-4">
        <div className="text-xs font-semibold text-blue-300 mb-2 flex items-center gap-1.5">
          <span>📋</span> Mission Brief
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{lldContent.prompt}</p>
      </div>

      {/* Key entities */}
      {lldContent.keyEntities.length > 0 && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-900/10 p-4">
          <div className="text-xs font-semibold text-purple-300 mb-3 flex items-center gap-1.5">
            <span>🗂️</span> Key Entities to Model
          </div>
          <div className="flex flex-wrap gap-2">
            {lldContent.keyEntities.map(entity => (
              <span
                key={entity}
                className="text-sm font-mono bg-purple-900/30 border border-purple-500/30 text-purple-200 px-3 py-1.5 rounded-lg"
              >
                {entity}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            💡 These entities are pre-seeded in the Entity Canvas. Add fields, relationships, and indexes to complete them.
          </p>
        </div>
      )}

      {/* API hints */}
      {lldContent.apiHints.length > 0 && (
        <div className="rounded-xl border border-green-500/30 bg-green-900/10 p-4">
          <div className="text-xs font-semibold text-green-300 mb-3 flex items-center gap-1.5">
            <span>📡</span> Suggested API Endpoints
          </div>
          <div className="space-y-2">
            {lldContent.apiHints.map((hint, i) => {
              // Parse "METHOD /path — description" format
              const match = hint.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(\S+)(.*)?$/i);
              if (match) {
                const [, method, path, rest] = match;
                const methodColors: Record<string, string> = {
                  GET: 'bg-green-900/40 text-green-300', POST: 'bg-blue-900/40 text-blue-300',
                  PUT: 'bg-yellow-900/40 text-yellow-300', PATCH: 'bg-orange-900/40 text-orange-300',
                  DELETE: 'bg-red-900/40 text-red-300',
                };
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${methodColors[method.toUpperCase()] ?? 'bg-gray-800 text-gray-400'}`}>
                      {method.toUpperCase()}
                    </span>
                    <div>
                      <span className="text-sm font-mono text-gray-200">{path}</span>
                      {rest && <span className="text-xs text-gray-500 ml-1">{rest}</span>}
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className="text-sm text-gray-300 font-mono pl-1">{hint}</div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            💡 Use these as a starting point in the API Contracts tab. Add request/response schemas and status codes.
          </p>
        </div>
      )}

      {/* Scoring hint */}
      <div className="rounded-lg border border-gray-700 bg-gray-800/30 px-4 py-3">
        <p className="text-xs text-gray-500">
          ⭐ <strong className="text-gray-400">Scoring tip:</strong> You're not graded on matching this solution exactly —
          you're graded on completeness (PKs, indexes, error responses, pagination) and making the right architectural decisions for the mission constraints.
        </p>
      </div>
    </div>
  );
};

// ── Score Panel ───────────────────────────────────────────────────────────────

const ScorePanel: React.FC<{ result: LLDScoreResponse; onRetry: () => void }> = ({ result, onRetry }) => (
  <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} className="space-y-4">
    {result.completed && (
      <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',stiffness:200}}
        className="text-center py-4">
        <div className="text-5xl mb-2">🎉</div>
        <div className="text-xl font-bold text-white">LLD Complete!</div>
        <div className="text-sm text-gray-400 mt-1">Your design is production-quality.</div>
      </motion.div>
    )}

    <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-3xl font-bold text-white">{result.score}<span className="text-gray-500 text-xl">/100</span></div>
          <div className="text-sm text-gray-400 mt-0.5">
            +{result.xpEarned} XP
            {result.netPenalty > 0 && <span className="text-red-400 ml-1">(-{result.netPenalty} XP penalties)</span>}
          </div>
        </div>
        <div className={`text-2xl font-bold ${result.totalXP>=100?'text-green-400':result.totalXP>=50?'text-yellow-400':'text-red-400'}`}>
          {result.totalXP} XP
        </div>
      </div>
      <div className="space-y-2">
        {[
          { label:'Architecture', ...result.breakdown.archDecisions },
          { label:'Schema',       ...result.breakdown.schema       },
          { label:'API Contracts',...result.breakdown.apiContracts  },
        ].map(({ label, earned, max }) => {
          const p = max > 0 ? Math.round((earned/max)*100) : 0;
          return (
            <div key={label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-400">{label}</span>
                <span className="text-white font-mono">{earned}/{max} pts</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <motion.div initial={{width:0}} animate={{width:`${p}%`}} transition={{duration:0.6,ease:'easeOut'}}
                  className={`h-full rounded-full ${p>=80?'bg-green-500':p>=50?'bg-yellow-500':'bg-red-500'}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div className="space-y-2">
      {result.feedback.map((fb, i) => (
        <div key={i} className={`flex items-start gap-2 rounded-lg border p-3 text-sm
          ${fb.type==='success'?'text-green-400 border-green-500/30 bg-green-900/20':
            fb.type==='error'  ?'text-red-400 border-red-500/30 bg-red-900/20':
            'text-yellow-400 border-yellow-500/30 bg-yellow-900/20'}`}>
          <span>{fb.type==='success'?'✅':fb.type==='error'?'❌':'⚠️'}</span>
          <span>{fb.message}</span>
        </div>
      ))}
    </div>

    <div className="flex justify-end">
      <button onClick={onRetry} className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-lg transition-colors">
        Revise & Resubmit →
      </button>
    </div>
  </motion.div>
);

// ── XP bar ────────────────────────────────────────────────────────────────────

const XPBar: React.FC = () => {
  const { xpDelta, pendingPenalties } = useLLDBuilderStore();
  const pen = pendingPenalties.reduce((s,p) => s+p.xpDeduction, 0);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500">XP</span>
      {xpDelta > 0 && <span className="text-green-400 font-mono">+{xpDelta}</span>}
      {pen > 0 && <span className="text-red-400 font-mono">-{pen} pen</span>}
      {xpDelta === 0 && pen === 0 && <span className="text-gray-600">—</span>}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

interface LLDBuilderProps {
  missionSlug: string;
  config: LLDMissionConfig;
  lldContent?: LLDContent | null;
  previousState?: Partial<LLDBuilderState> | null;
  onXpEarned?: (xp: number) => void;
}

export const LLDBuilder: React.FC<LLDBuilderProps> = ({
  missionSlug, config, lldContent, previousState, onXpEarned,
}) => {
  const [activeSection,  setActiveSection]  = useState<Section>('arch');
  const [submitting,     setSubmitting]     = useState(false);
  const [result,         setResult]         = useState<LLDScoreResponse | null>(null);
  const [hasSubmitted,   setHasSubmitted]   = useState(false);

  const { initBuilder, setValidationErrors, setSubmittedWithWarnings } = useLLDBuilderStore();
  const { errors, isValid, hasArchErrors, hasSchemaErrors, hasApiErrors } = useLLDValidation();
  useXPEngine();

  useEffect(() => {
    initBuilder(config, previousState ?? undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, missionSlug]);

  useEffect(() => {
    setValidationErrors(errors);
  }, [errors, setValidationErrors]);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!isValid) setSubmittedWithWarnings(true);
    setSubmitting(true);
    try {
      const payload = selectSubmissionPayload(useLLDBuilderStore.getState());
      const res = await apiClient.post<LLDScoreResponse>(`/lld/${missionSlug}/score`, payload);
      setResult(res);
      setHasSubmitted(true);
      if (res.xpEarned > 0) onXpEarned?.(res.xpEarned);
    } catch (err) {
      console.error('[LLDBuilder] Score failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const errMap = { hasArchErrors, hasSchemaErrors, hasApiErrors };

  if (result) return (
    <div className="space-y-4">
      <ScorePanel result={result} onRetry={() => setResult(null)} />
      <div className="border-t border-gray-700/60 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">💡</span>
          <span className="text-sm font-semibold text-white">Reference Solution</span>
          <span className="text-xs text-gray-500">Compare your design against the intended approach</span>
        </div>
        <SolutionPanel lldContent={lldContent ?? null} />
      </div>
      <XPHintOverlay />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Mission brief — always visible context banner */}
      <MissionBriefBanner lldContent={lldContent ?? null} />

      {/* Tab bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-800/50 rounded-xl p-1 flex-wrap">
          {SECTION_CONFIG.map(s => {
            const hasErr = s.errorKey ? errMap[s.errorKey] : false;
            const isSolution = s.id === 'solution';
            const solutionLocked = isSolution && !hasSubmitted;
            return (
              <button key={s.id}
                onClick={() => !solutionLocked && setActiveSection(s.id)}
                disabled={solutionLocked}
                title={solutionLocked ? 'Submit first to unlock' : undefined}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${solutionLocked
                    ? 'text-gray-600 cursor-not-allowed opacity-50'
                    : activeSection === s.id
                      ? isSolution ? 'bg-yellow-900/40 text-yellow-300 shadow-sm' : 'bg-gray-700 text-white shadow-sm'
                      : isSolution ? 'text-yellow-600 hover:text-yellow-400' : 'text-gray-500 hover:text-gray-300'
                  }`}>
                <span>{s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
                {solutionLocked && <span className="ml-0.5 text-[10px]">🔒</span>}
                {hasErr && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
              </button>
            );
          })}
        </div>
        <XPBar />
      </div>

      {/* Section content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeSection} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.15}}>
          {activeSection === 'arch'     && <ArchDecisionSelector validationErrors={errors.filter(e=>e.section==='archDecisions').map(e=>e.field??'')} />}
          {activeSection === 'schema'   && (
            <div className="space-y-4">
              <DBSchemaBuilder />
              <EntityCardBuilder validationErrors={errors.filter(e=>e.section==='schema').map(e=>e.message)} />
            </div>
          )}
          {activeSection === 'api'      && <APIContractDesigner validationErrors={errors.filter(e=>e.section==='apiContracts').map(e=>e.message)} />}
          {activeSection === 'preview'  && <LiveSchemaPreview />}
          {activeSection === 'solution' && <SolutionPanel lldContent={lldContent ?? null} />}
        </motion.div>
      </AnimatePresence>

      {/* Validation bar */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-900/10 px-3 py-2">
          <div className="text-xs text-yellow-400 flex items-center gap-1.5">
            <span>⚠️</span>
            {errors.length} {errors.length===1?'issue':'issues'} to resolve
            <span className="text-gray-500">— submitting with issues applies a -5 XP penalty</span>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-gray-600">
          {isValid ? '✅ Ready to submit' : `⚠️ ${errors.length} ${errors.length===1?'issue':'issues'}`}
        </div>
        <button onClick={handleSubmit} disabled={submitting}
          className="btn-primary px-8 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? 'Scoring…' : 'Submit LLD →'}
        </button>
      </div>

      <XPHintOverlay />
    </div>
  );
};
