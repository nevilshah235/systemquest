/**
 * SimulationResults — Revamped Results Dashboard (PROJ-SQ-001)
 *
 * Phase 1: Tabbed layout (Results / AI Analysis / Scorecard) with sticky HeroStrip
 *          and persistent BottomCTABar instead of linear scroll dump.
 * Phase 3: 2×2 metric grid, portal-based Why? popover, collapsible Gap Analysis.
 *
 * Fix: root div uses flex-1 min-h-0 (not h-full) so HeroStrip/TabSwitcher
 *      are always visible inside the flex-col MissionPage wrapper.
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SimulationMetrics, Mission } from '../../data/types';
import { useNavigate } from 'react-router-dom';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import { diagnoseAll, MetricDiagnosis } from '../../data/diagnostics';
import { useBuilderStore } from '../../stores/builderStore';
import { SolutionViewer } from './SolutionViewer';
import { RubricCard, RubricSkeleton, RubricScore } from './RubricCard';
import { MISSION_SOLUTIONS } from '../../data/solutions';
import api from '../../data/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimulationAnalysisResult {
  narrative: string;
  gaps?: string[];
  type: 'pass' | 'fail';
}

type ResultTab = 'results' | 'ai' | 'rubric';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SimulationResultsProps {
  metrics: SimulationMetrics;
  mission: Mission;
  /** Actual XP added to user account this run — 0 when re-running an already-completed mission */
  xpGranted: number;
  onRetry: () => void;
  /** Navigate to LLD phase — passed by MissionPage */
  onGoDeeper?: () => void;
  /** Whether LLD tab has been unlocked (score >= 60) */
  lldUnlocked?: boolean;
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

const AnalysisSkeleton: React.FC = () => (
  <div className="card p-4 animate-pulse">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-4 h-4 bg-gray-700 rounded-full" />
      <div className="h-3 w-32 bg-gray-700 rounded" />
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-700 rounded w-full" />
      <div className="h-3 bg-gray-700 rounded w-5/6" />
      <div className="h-3 bg-gray-700 rounded w-4/6" />
    </div>
  </div>
);

// ─── Hero Strip ───────────────────────────────────────────────────────────────
// Always-visible top strip: mini score ring + XP + 4 metric pass/fail chips.

const HeroStrip: React.FC<{
  metrics: SimulationMetrics;
  mission: Mission;
  xpGranted: number;
  passed: boolean;
}> = ({ metrics, mission, xpGranted, passed }) => {
  const req = mission.requirements;
  const scoreColor =
    metrics.score >= 80 ? '#10b981' :
    metrics.score >= 60 ? '#f59e0b' : '#ef4444';
  const scoreData = [{ name: 'score', value: metrics.score, fill: scoreColor }];

  const chips = [
    { id: 'latency',      icon: '⚡', label: 'Latency',    met: metrics.latencyMs    <= req.performance.latencyMs },
    { id: 'availability', icon: '📈', label: 'Avail.',     met: metrics.availability >= req.performance.availability },
    { id: 'throughput',   icon: '👥', label: 'Throughput', met: metrics.throughput   >= req.traffic.concurrent },
    { id: 'cost',         icon: '💰', label: 'Cost',       met: metrics.monthlyCost  <= req.budget },
  ];

  return (
    <div className="flex-shrink-0 bg-gray-850 border-b-2 border-gray-700 px-4 py-3">
      <div className="flex items-center gap-3 max-w-2xl mx-auto">
        {/* Mini score ring */}
        <div className="w-11 h-11 flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="62%" outerRadius="90%"
              data={scoreData} startAngle={90} endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={4} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-black text-white leading-none">{metrics.score}</span>
          </div>
        </div>

        {/* Score label + XP */}
        <div className="flex-shrink-0">
          <div className="text-sm font-bold text-white leading-none">
            {metrics.score}<span className="text-xs text-gray-400">/100</span>
          </div>
          {xpGranted > 0
            ? <div className="text-xs text-amber-400 mt-0.5">+{xpGranted} XP 🎉</div>
            : passed
            ? <div className="text-xs text-green-500 mt-0.5">✓ Completed</div>
            : <div className="text-xs text-gray-400 mt-0.5">Keep going!</div>
          }
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-600 flex-shrink-0" />

        {/* Metric chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {chips.map(chip => (
            <span
              key={chip.id}
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                chip.met
                  ? 'bg-green-900/40 text-green-300 border-green-600/40'
                  : 'bg-red-900/40 text-red-300 border-red-600/40'
              }`}
            >
              {chip.icon} {chip.label} {chip.met ? '✓' : '✗'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Tab Switcher ─────────────────────────────────────────────────────────────

const TabSwitcher: React.FC<{
  activeTab: ResultTab;
  onTabChange: (tab: ResultTab) => void;
  hasRubric: boolean;
  aiLoading: boolean;
}> = ({ activeTab, onTabChange, hasRubric, aiLoading }) => {
  const tabs: { id: ResultTab; label: string; icon: string }[] = [
    { id: 'results', label: 'Results',     icon: '📊' },
    { id: 'ai',      label: 'AI Analysis', icon: '🤖' },
    // "Scorecard" is intentionally friendlier than "Rubric" for new users
    ...(hasRubric ? [{ id: 'rubric' as ResultTab, label: 'Scorecard', icon: '🏆' }] : []),
  ];

  return (
    <div className="flex-shrink-0 flex gap-0 border-b-2 border-gray-700 bg-gray-900 px-4">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative flex items-center gap-1.5 text-xs px-4 py-3 font-medium transition-all ${
            activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
          {/* Pulsing dot while AI loads */}
          {tab.id === 'ai' && aiLoading && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          )}
          {/* Active underline */}
          {activeTab === tab.id && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full"
            />
          )}
        </button>
      ))}
    </div>
  );
};

// ─── Why? Popover (portal-based) ─────────────────────────────────────────────
// Rendered in document.body to escape overflow-hidden ancestors.

interface WhyPopoverProps {
  diagnosis: MetricDiagnosis;
  anchorRect: DOMRect;
  onClose: () => void;
}

const WhyPopover: React.FC<WhyPopoverProps> = ({ diagnosis, anchorRect, onClose }) => {
  const [hintLevel, setHintLevel]       = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const totalHints    = diagnosis.hints.length;
  const allHintsShown = hintLevel >= totalHints;

  // Calculate position — prefer below button, clamp to viewport edges
  const vpW     = window.innerWidth;
  const rawLeft = anchorRect.left + anchorRect.width / 2;
  const left    = Math.min(Math.max(rawLeft, 144), vpW - 144);
  const style: React.CSSProperties = {
    position: 'fixed',
    top: anchorRect.bottom + 8,
    left,
    transform: 'translateX(-50%)',
    width: 288,
    zIndex: 9999,
  };

  // Dismiss on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 80);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        style={style}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1,    y:  0 }}
        exit={{    opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.15 }}
        className="bg-gray-800 border border-gray-600/80 rounded-xl shadow-2xl shadow-black/50 p-3.5"
      >
        {/* Arrow pointer */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3
          bg-gray-800 border-l border-t border-gray-600/80 rotate-45" />

        {/* Cause + detail */}
        <div className="flex items-start gap-2 mb-2.5">
          <span className="text-red-400 flex-shrink-0 text-sm mt-0.5">⚠</span>
          <div>
            <div className="text-xs font-semibold text-red-300 mb-1">{diagnosis.cause}</div>
            <p className="text-xs text-gray-400 leading-relaxed">{diagnosis.detail}</p>
          </div>
        </div>

        {/* Progressive hints + solution */}
        {totalHints > 0 && (
          <div className="border-t border-gray-700/50 pt-2.5 space-y-2">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Investigation
            </div>

            {diagnosis.hints.slice(0, hintLevel).map((hint, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-start gap-2 p-2 bg-amber-900/10 border border-amber-700/30 rounded-lg"
              >
                <span className="text-amber-400 text-xs font-bold flex-shrink-0 mt-0.5 w-12">
                  Hint {i + 1}
                </span>
                <span className="text-xs text-amber-200/80 leading-relaxed">{hint}</span>
              </motion.div>
            ))}

            {!allHintsShown && !showSolution && (
              <button
                onClick={() => setHintLevel(l => l + 1)}
                className="w-full text-xs py-1.5 px-3 rounded-lg bg-gray-700/50 hover:bg-gray-700
                  text-gray-300 hover:text-white transition-colors border border-gray-600/50
                  flex items-center justify-center gap-1.5"
              >
                <span>💡</span>
                <span>
                  {hintLevel === 0
                    ? `Think about it — Hint 1 of ${totalHints}`
                    : `Hint ${hintLevel + 1} of ${totalHints}`}
                </span>
              </button>
            )}

            {allHintsShown && !showSolution && diagnosis.solutions.length > 0 && (
              <button
                onClick={() => setShowSolution(true)}
                className="w-full text-xs py-1.5 px-3 rounded-lg bg-blue-900/20 hover:bg-blue-900/40
                  text-blue-300 hover:text-blue-200 transition-colors border border-blue-700/40
                  flex items-center justify-center gap-1.5"
              >
                <span>🔍</span>
                <span>Reveal Solution</span>
              </button>
            )}

            <AnimatePresence>
              {showSolution && diagnosis.solutions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-1.5"
                >
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Solution
                  </div>
                  {diagnosis.solutions.map((fix, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-800/60 rounded-lg">
                      <span className="text-base flex-shrink-0">{fix.icon}</span>
                      <span className="text-xs text-gray-300 min-w-0 flex-1">{fix.solution}</span>
                      <span className="text-xs font-semibold text-green-400 bg-green-900/30
                        px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                        {fix.impact}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

// ─── Metric Card (2×2 grid, portal-powered Why? popover) ─────────────────────

interface MetricCardProps {
  id: string;
  icon: string;
  label: string;
  value: string;
  target: string;
  met: boolean;
  diagnosis: MetricDiagnosis | null;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon, label, value, target, met, diagnosis,
}) => {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const handleWhyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setAnchorRect(prev => (prev ? null : rect));
  };

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        met ? 'border-green-700/40 bg-green-900/10' : 'border-red-700/40 bg-red-900/10'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-400 font-medium">{icon} {label}</span>
        <span className={`text-xs font-bold ${met ? 'text-green-400' : 'text-red-400'}`}>
          {met ? '✓' : '✗'}
        </span>
      </div>

      {/* Value */}
      <div className="text-2xl font-bold text-white leading-none mb-1">{value}</div>
      <div className="text-xs text-gray-500">Target: {target}</div>

      {/* Why? button — only on failing metrics */}
      {!met && diagnosis && (
        <button
          onClick={handleWhyClick}
          className={`mt-2.5 text-xs px-2.5 py-1 rounded-lg transition-colors border ${
            anchorRect
              ? 'bg-gray-600 border-gray-500 text-white'
              : 'bg-gray-700/80 hover:bg-gray-600 border-gray-600/50 text-gray-300 hover:text-white'
          }`}
        >
          Why? →
        </button>
      )}

      {/* Portal popover */}
      {anchorRect && diagnosis && (
        <WhyPopover
          diagnosis={diagnosis}
          anchorRect={anchorRect}
          onClose={() => setAnchorRect(null)}
        />
      )}
    </div>
  );
};

// ─── AI Analysis Panel (with collapsible Gap Analysis) ───────────────────────

const AIAnalysisPanel: React.FC<{ analysis: SimulationAnalysisResult }> = ({ analysis }) => {
  const [gapsExpanded, setGapsExpanded] = useState(false);

  const renderBold = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/).map((chunk, i) =>
      chunk.startsWith('**') && chunk.endsWith('**')
        ? <strong key={i} className="text-white font-semibold">{chunk.slice(2, -2)}</strong>
        : chunk,
    );

  const isPassed = analysis.type === 'pass';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`card p-4 border ${
        isPassed ? 'border-green-700/30 bg-green-900/5' : 'border-brand-700/30 bg-brand-900/5'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🤖</span>
        <span className={`text-xs font-semibold uppercase tracking-wider ${
          isPassed ? 'text-green-400' : 'text-brand-400'
        }`}>
          AI Analysis
        </span>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed mb-3">
        {renderBold(analysis.narrative)}
      </p>

      {!isPassed && analysis.gaps && analysis.gaps.length > 0 && (
        <div>
          {/* Collapsible gap analysis */}
          <button
            onClick={() => setGapsExpanded(p => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500
              uppercase tracking-wider hover:text-gray-300 transition-colors mb-2"
          >
            <span>Priority Gaps ({analysis.gaps.length})</span>
            <span className={`transition-transform duration-200 ${gapsExpanded ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>

          <AnimatePresence>
            {gapsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{   height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-1.5">
                  {analysis.gaps.map((gap, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-amber-200/80
                        bg-amber-900/10 border border-amber-700/25 rounded-lg px-3 py-2"
                    >
                      <span className="text-amber-400 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                      <span className="leading-relaxed">{gap}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

// ─── Bottom CTA Bar ───────────────────────────────────────────────────────────
// Always-visible persistent bar: Retry | (Go Deeper → LLD) | Next/Dashboard

const BottomCTABar: React.FC<{
  passed: boolean;
  lldUnlocked: boolean;
  nextMission?: string | null;
  onRetry: () => void;
  onGoDeeper?: () => void;
  onNext?: () => void;
  onDashboard: () => void;
}> = ({ passed, lldUnlocked, nextMission, onRetry, onGoDeeper, onNext, onDashboard }) => (
  <div className="flex-shrink-0 bg-gray-900 border-t-2 border-gray-700 px-4 py-3">
    <div className="max-w-2xl mx-auto flex items-center gap-2">
      <button onClick={onRetry} className="btn-secondary flex-shrink-0">
        ↺ Retry
      </button>

      <div className="flex-1" />

      {/* Go Deeper — always rendered if unlocked, accessible from any tab */}
      {lldUnlocked && onGoDeeper && (
        <button
          onClick={onGoDeeper}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium
            border bg-yellow-800/20 border-yellow-600/50 text-yellow-400
            hover:text-yellow-200 hover:bg-yellow-800/30 transition-all"
        >
          🔧 Go Deeper → LLD
        </button>
      )}

      {passed && nextMission && onNext ? (
        <button onClick={onNext} className="btn-primary">
          Next Mission →
        </button>
      ) : passed ? (
        <button onClick={onDashboard} className="btn-primary">
          Dashboard 🏠
        </button>
      ) : (
        <button onClick={onDashboard} className="btn-secondary">
          Dashboard
        </button>
      )}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const SimulationResults: React.FC<SimulationResultsProps> = ({
  metrics,
  mission,
  xpGranted,
  onRetry,
  onGoDeeper,
  lldUnlocked = false,
}) => {
  const navigate = useNavigate();

  const [activeTab,     setActiveTab]     = useState<ResultTab>('results');
  const [showSolution,  setShowSolution]  = useState(false);

  const [aiAnalysis,    setAiAnalysis]    = useState<SimulationAnalysisResult | null>(null);
  const [aiLoading,     setAiLoading]     = useState(true);

  const [rubricScore,   setRubricScore]   = useState<RubricScore | null>(null);
  const [rubricLoading, setRubricLoading] = useState(true);

  const hasSolution = !!MISSION_SOLUTIONS[mission.slug];
  const hasRubric   = !!MISSION_SOLUTIONS[mission.slug];

  const architecture = useBuilderStore((s) => s.architecture);
  const passed       = metrics.score >= 60 && metrics.allMetricsMet;
  const req          = mission.requirements;
  const diagnosis    = diagnoseAll(metrics, req, architecture);

  const failingCount = [
    metrics.latencyMs    > req.performance.latencyMs,
    metrics.availability < req.performance.availability,
    metrics.throughput   < req.traffic.concurrent,
    metrics.monthlyCost  > req.budget,
  ].filter(Boolean).length;

  // ── AI Analysis fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setAiLoading(true);
    setAiAnalysis(null);

    api.post('/chat/simulation-analysis', {
      missionTitle:     mission.title,
      problemStatement: mission.scenario,
      objectives:       mission.objectives,
      requirements: {
        latencyMs:    mission.requirements.performance.latencyMs,
        availability: mission.requirements.performance.availability,
        throughput:   mission.requirements.traffic.concurrent,
        budget:       mission.requirements.budget,
      },
      metrics: {
        latencyMs:     metrics.latencyMs,
        availability:  metrics.availability,
        throughput:    metrics.throughput,
        monthlyCost:   metrics.monthlyCost,
        score:         metrics.score,
        allMetricsMet: metrics.allMetricsMet,
      },
      passed,
      components:  architecture.components.map((c) => ({ id: c.id, type: c.type })),
      connections: architecture.connections.map((c) => ({ from: c.from, to: c.to })),
    })
      .then((r) => { if (!cancelled) setAiAnalysis(r.data); })
      .catch(() => { /* silent — static fallback renders in AI tab */ })
      .finally(() => { if (!cancelled) setAiLoading(false); });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rubric evaluation fetch ────────────────────────────────────────────────
  useEffect(() => {
    const solution = MISSION_SOLUTIONS[mission.slug];
    if (!solution) { setRubricLoading(false); return; }

    let cancelled = false;
    setRubricLoading(true);
    setRubricScore(null);

    const typeOf = (id: string) =>
      solution.architecture.components.find((c) => c.id === id)?.type ?? id;

    const solutionTopology = {
      componentTypes: [...new Set(solution.architecture.components.map((c) => c.type))],
      connections: solution.architecture.connections.map((c) => ({
        from: typeOf(c.from),
        to:   typeOf(c.to),
      })),
    };

    api.post('/rubric/evaluate', {
      missionSlug:  mission.slug,
      missionTitle: mission.title,
      requirements: {
        latencyMs:    mission.requirements.performance.latencyMs,
        availability: mission.requirements.performance.availability,
        throughput:   mission.requirements.traffic.concurrent,
        budget:       mission.requirements.budget,
      },
      topology:     solutionTopology,
      architecture: {
        components:  architecture.components.map((c) => ({ id: c.id, type: c.type })),
        connections: architecture.connections.map((c) => ({ from: c.from, to: c.to })),
      },
    })
      .then((r) => { if (!cancelled && r.status === 200) setRubricScore(r.data); })
      .catch(() => { /* silent */ })
      .finally(() => { if (!cancelled) setRubricLoading(false); });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────
  //
  // IMPORTANT: root div uses `flex-1 min-h-0` (NOT `h-full`) so this component
  // grows correctly inside MissionPage's flex-col wrapper and the HeroStrip /
  // TabSwitcher are always visible at the top.
  //
  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* ── Always-visible hero strip ── */}
      <HeroStrip metrics={metrics} mission={mission} xpGranted={xpGranted} passed={passed} />

      {/* ── Tab switcher ── */}
      <TabSwitcher
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasRubric={hasRubric}
        aiLoading={aiLoading}
      />

      {/* ── Tab content (scrollable middle area) ── */}
      <div className="flex-1 overflow-auto min-h-0">
        <AnimatePresence mode="wait">

          {/* ─── RESULTS TAB ──────────────────────────────────────────────── */}
          {activeTab === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x:   0 }}
              exit={{   opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
              className="max-w-2xl mx-auto px-4 py-5"
            >
              {/* Mission state heading */}
              <div className="text-center mb-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="text-4xl mb-2"
                >
                  {passed ? '🎉' : failingCount >= 3 ? '😤' : '🤔'}
                </motion.div>
                <h1 className="text-2xl font-bold text-white">
                  {passed ? 'Mission Complete!' : failingCount >= 3 ? 'Needs Work' : 'Almost There!'}
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                  {passed
                    ? 'Your architecture met all performance targets.'
                    : `${failingCount} of 4 targets missed — tap Why? on any failed metric to investigate.`}
                </p>
                {!passed && !metrics.allMetricsMet && (
                  <p className="text-xs text-red-400/70 mt-1.5">
                    All 4 performance targets must be met to complete this mission
                  </p>
                )}
              </div>

              {/* 2×2 Metric grid */}
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-0.5">
                Performance Results
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <MetricCard
                  id="latency" icon="⚡" label="Latency"
                  value={`${metrics.latencyMs}ms`}
                  target={`< ${req.performance.latencyMs}ms`}
                  met={metrics.latencyMs <= req.performance.latencyMs}
                  diagnosis={diagnosis.latency}
                />
                <MetricCard
                  id="availability" icon="📈" label="Availability"
                  value={`${metrics.availability}%`}
                  target={`≥ ${req.performance.availability}%`}
                  met={metrics.availability >= req.performance.availability}
                  diagnosis={diagnosis.availability}
                />
                <MetricCard
                  id="throughput" icon="👥" label="Throughput"
                  value={metrics.throughput.toLocaleString()}
                  target={`≥ ${req.traffic.concurrent.toLocaleString()}`}
                  met={metrics.throughput >= req.traffic.concurrent}
                  diagnosis={diagnosis.throughput}
                />
                <MetricCard
                  id="cost" icon="💰" label="Monthly Cost"
                  value={`$${metrics.monthlyCost}`}
                  target={`≤ $${req.budget}`}
                  met={metrics.monthlyCost <= req.budget}
                  diagnosis={diagnosis.cost}
                />
              </div>

              {/* What's Working — static fallback when AI hasn't loaded */}
              {!aiAnalysis && metrics.feedback.filter((f) => f.type === 'success').length > 0 && (
                <div className="card p-4 mb-4">
                  <h2 className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-2">
                    ✓ What's Working
                  </h2>
                  <div className="space-y-1.5">
                    {metrics.feedback.filter((f) => f.type === 'success').map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-green-300">
                        <span className="text-green-500 text-xs">✓</span>
                        {item.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* What You Learned — only on pass */}
              {passed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y:  0 }}
                  transition={{ delay: 0.2 }}
                  className="card p-5"
                >
                  <h2 className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-3">
                    🎓 What You Learned
                  </h2>
                  <ul className="space-y-2">
                    {mission.feedbackData.learned.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-green-400 flex-shrink-0 mt-0.5 text-xs">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  {mission.feedbackData.nextPreview && (
                    <div className="mt-4 p-3 bg-brand-900/30 rounded-lg border border-brand-700/30 text-sm text-brand-300">
                      <strong>Next up:</strong> {mission.feedbackData.nextPreview}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ─── AI ANALYSIS TAB ──────────────────────────────────────────── */}
          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x:  0 }}
              exit={{   opacity: 0, x: 10 }}
              transition={{ duration: 0.18 }}
              className="max-w-2xl mx-auto px-4 py-5 space-y-4"
            >
              {aiLoading && <AnalysisSkeleton />}
              {!aiLoading && aiAnalysis && <AIAnalysisPanel analysis={aiAnalysis} />}
              {!aiLoading && !aiAnalysis && (
                <div className="card p-4 text-sm text-gray-400">
                  AI analysis unavailable — use the hints on the Results tab to investigate.
                </div>
              )}

              {/* Solution / Gap Analysis viewer */}
              {hasSolution && (
                <AnimatePresence mode="wait">
                  {showSolution ? (
                    <SolutionViewer
                      key="solution-viewer"
                      missionSlug={mission.slug}
                      currentArchitecture={architecture}
                      onApply={() => { setShowSolution(false); onRetry(); }}
                      onClose={() => setShowSolution(false)}
                    />
                  ) : (
                    <motion.button
                      key="solution-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setShowSolution(true)}
                      className="w-full flex items-center justify-between px-4 py-2.5
                        bg-blue-900/20 hover:bg-blue-900/30 rounded-xl border border-blue-700/40
                        transition-colors text-sm"
                    >
                      <span className="flex items-center gap-2 text-blue-300">
                        <span>🗺️</span>
                        <span>View Ideal Solution &amp; Gap Analysis</span>
                      </span>
                      <span className="text-blue-500 text-base">›</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              )}

              {/* Static suggestions fallback when no AI response */}
              {!aiLoading && !aiAnalysis && (
                <div className="card p-4 border border-gray-700/50">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Suggestions
                  </div>
                  <div className="space-y-2">
                    {metrics.feedback.filter((f) => f.type !== 'success').map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2.5 text-sm p-2.5 rounded-lg ${
                          item.type === 'warning'
                            ? 'text-amber-300 bg-amber-900/10 border border-amber-800/30'
                            : 'text-blue-300  bg-blue-900/10  border border-blue-800/30'
                        }`}
                      >
                        <span className="flex-shrink-0 mt-0.5">
                          {item.type === 'warning' ? '⚠' : '💡'}
                        </span>
                        {item.message}
                      </div>
                    ))}
                    {metrics.feedback.filter((f) => f.type !== 'success').length === 0 && (
                      <p className="text-sm text-gray-400">Your architecture looks solid!</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── SCORECARD TAB ────────────────────────────────────────────── */}
          {activeTab === 'rubric' && (
            <motion.div
              key="rubric"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x:  0 }}
              exit={{   opacity: 0, x: 10 }}
              transition={{ duration: 0.18 }}
              className="max-w-2xl mx-auto px-4 py-5"
            >
              {/* Context blurb — helps new users immediately understand this tab */}
              <div className="mb-4 p-3 rounded-xl bg-gray-800/50 border border-gray-700/40
                flex items-start gap-2.5">
                <span className="text-lg flex-shrink-0 mt-0.5">🏆</span>
                <div>
                  <div className="text-xs font-semibold text-gray-200 mb-0.5">
                    How your design was graded
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Each criterion below shows how well your architecture handles a key
                    dimension — scalability, reliability, cost, and more. Use this to
                    understand exactly where points were earned or lost.
                  </p>
                </div>
              </div>

              {rubricLoading && <RubricSkeleton />}
              {!rubricLoading && rubricScore && <RubricCard rubric={rubricScore} />}
              {!rubricLoading && !rubricScore && (
                <div className="card p-4 text-sm text-gray-400">
                  Scorecard evaluation unavailable for this mission.
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Persistent bottom CTA bar ── */}
      <BottomCTABar
        passed={passed}
        lldUnlocked={lldUnlocked}
        nextMission={mission.feedbackData.nextMission}
        onRetry={onRetry}
        onGoDeeper={onGoDeeper}
        onNext={
          mission.feedbackData.nextMission
            ? () => navigate(`/mission/${mission.feedbackData.nextMission}`)
            : undefined
        }
        onDashboard={() => navigate('/dashboard')}
      />
    </div>
  );
};
