import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimulationMetrics, Mission } from '../../data/types';
import { useNavigate } from 'react-router-dom';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { diagnoseAll, MetricDiagnosis } from '../../data/diagnostics';
import { useBuilderStore } from '../../stores/builderStore';
import { SolutionViewer } from './SolutionViewer';
import { RubricCard, RubricSkeleton, RubricScore } from './RubricCard';
import { MISSION_SOLUTIONS } from '../../data/solutions';
import api from '../../data/api';

// ─── AI Analysis types ────────────────────────────────────────────────────────

interface SimulationAnalysisResult {
  narrative: string;
  gaps?: string[];
  type: 'pass' | 'fail';
}

// ─── AI Analysis Panel ────────────────────────────────────────────────────────

const AnalysisSkeleton: React.FC = () => (
  <div className="card p-4 mb-4 animate-pulse">
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

const AIAnalysisPanel: React.FC<{ analysis: SimulationAnalysisResult }> = ({ analysis }) => {
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
      className={`card p-4 mb-4 border ${isPassed ? 'border-green-700/30 bg-green-900/5' : 'border-brand-700/30 bg-brand-900/5'}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🤖</span>
        <span className={`text-xs font-semibold uppercase tracking-wider ${isPassed ? 'text-green-400' : 'text-brand-400'}`}>
          AI Analysis
        </span>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed mb-3">
        {renderBold(analysis.narrative)}
      </p>

      {!isPassed && analysis.gaps && analysis.gaps.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Priority Gaps
          </div>
          <div className="space-y-1.5">
            {analysis.gaps.map((gap, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-200/80
                bg-amber-900/10 border border-amber-700/25 rounded-lg px-3 py-2">
                <span className="text-amber-400 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                <span className="leading-relaxed">{gap}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

interface SimulationResultsProps {
  metrics: SimulationMetrics;
  mission: Mission;
  /** Actual XP added to user account this run — 0 when re-running an already-completed mission */
  xpGranted: number;
  onRetry: () => void;
}

// ─── Expandable Metric Card ──────────────────────────────────────────────────

interface MetricCardProps {
  id: string;
  icon: string;
  label: string;
  value: string;
  target: string;
  met: boolean;
  diagnosis: MetricDiagnosis | null;
  isOpen: boolean;
  onToggle: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  id, icon, label, value, target, met, diagnosis, isOpen, onToggle,
}) => {
  const [hintLevel,     setHintLevel]     = useState(0);
  const [showSolution,  setShowSolution]  = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setHintLevel(0);
      setShowSolution(false);
    }
  }, [isOpen]);

  const totalHints      = diagnosis?.hints.length ?? 0;
  const allHintsShown   = hintLevel >= totalHints;

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors duration-200
      ${met ? 'border-green-700/40 bg-green-900/10' : 'border-red-700/40 bg-red-900/10'}`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-medium">{icon} {label}</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${met ? 'text-green-400' : 'text-red-400'}`}>
              {met ? '✓ Met' : '✗ Missed'}
            </span>
            {!met && diagnosis && (
              <button
                onClick={onToggle}
                className="text-xs px-2 py-0.5 rounded-md bg-gray-700/80 hover:bg-gray-600
                  text-gray-300 hover:text-white transition-colors"
              >
                {isOpen ? 'Close' : 'Why?'}
              </button>
            )}
          </div>
        </div>
        <div className="text-xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">Target: {target}</div>
      </div>

      <AnimatePresence>
        {isOpen && diagnosis && (
          <motion.div
            key={`diag-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-red-700/30 pt-3 space-y-3">

              <div className="flex items-start gap-2">
                <span className="text-red-400 flex-shrink-0 mt-0.5">⚠</span>
                <div>
                  <div className="text-xs font-semibold text-red-300 mb-1">{diagnosis.cause}</div>
                  <p className="text-xs text-gray-400 leading-relaxed">{diagnosis.detail}</p>
                </div>
              </div>

              {diagnosis.hints.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Investigation
                  </div>

                  {diagnosis.hints.slice(0, hintLevel).map((hint, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-start gap-2 p-2.5 bg-amber-900/10
                        border border-amber-700/30 rounded-lg"
                    >
                      <span className="text-amber-400 text-xs font-bold flex-shrink-0 mt-0.5 w-12">
                        Hint {i + 1}
                      </span>
                      <span className="text-xs text-amber-200/80 leading-relaxed">{hint}</span>
                    </motion.div>
                  ))}

                  {!allHintsShown && !showSolution && (
                    <button
                      onClick={() => setHintLevel((l) => l + 1)}
                      className="w-full text-xs py-1.5 px-3 rounded-lg
                        bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white
                        transition-colors border border-gray-600/50 flex items-center justify-center gap-1.5"
                    >
                      <span>💡</span>
                      <span>
                        {hintLevel === 0
                          ? `Think about it — show Hint 1 of ${totalHints}`
                          : `Show Hint ${hintLevel + 1} of ${totalHints}`}
                      </span>
                    </button>
                  )}

                  {allHintsShown && !showSolution && (
                    <button
                      onClick={() => setShowSolution(true)}
                      className="w-full text-xs py-1.5 px-3 rounded-lg
                        bg-blue-900/20 hover:bg-blue-900/40 text-blue-300 hover:text-blue-200
                        transition-colors border border-blue-700/40 flex items-center justify-center gap-1.5"
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
                        transition={{ duration: 0.18 }}
                      >
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Solution
                        </div>
                        <div className="space-y-1.5">
                          {diagnosis.solutions.map((fix, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 p-2 bg-gray-800/60 rounded-lg"
                            >
                              <span className="text-base flex-shrink-0">{fix.icon}</span>
                              <span className="text-xs text-gray-300 min-w-0 flex-1">{fix.solution}</span>
                              <span className="text-xs font-semibold text-green-400 bg-green-900/30
                                px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ml-1">
                                {fix.impact}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const SimulationResults: React.FC<SimulationResultsProps> = ({ metrics, mission, xpGranted, onRetry }) => {
  const navigate = useNavigate();

  const [openMetric,    setOpenMetric]    = useState<string | null>(null);
  const [showHints,     setShowHints]     = useState(false);
  const [showSolution,  setShowSolution]  = useState(false);

  const [aiAnalysis,    setAiAnalysis]    = useState<SimulationAnalysisResult | null>(null);
  const [aiLoading,     setAiLoading]     = useState(true);

  const [rubricScore,   setRubricScore]   = useState<RubricScore | null>(null);
  const [rubricLoading, setRubricLoading] = useState(true);

  const hasSolution = !!MISSION_SOLUTIONS[mission.slug];

  const architecture = useBuilderStore((s) => s.architecture);

  const passed = metrics.score >= 60 && metrics.allMetricsMet;

  useEffect(() => {
    let cancelled = false;
    setAiLoading(true);
    setAiAnalysis(null);

    api.post('/chat/simulation-analysis', {
      missionTitle:      mission.title,
      problemStatement:  mission.scenario,
      objectives:        mission.objectives,
      requirements: {
        latencyMs:    mission.requirements.performance.latencyMs,
        availability: mission.requirements.performance.availability,
        throughput:   mission.requirements.traffic.concurrent,
        budget:       mission.requirements.budget,
      },
      metrics: {
        latencyMs:    metrics.latencyMs,
        availability: metrics.availability,
        throughput:   metrics.throughput,
        monthlyCost:  metrics.monthlyCost,
        score:        metrics.score,
        allMetricsMet: metrics.allMetricsMet,
      },
      passed,
      components:  architecture.components.map((c) => ({ id: c.id, type: c.type })),
      connections: architecture.connections.map((c) => ({ from: c.from, to: c.to })),
    })
      .then((r) => { if (!cancelled) setAiAnalysis(r.data); })
      .catch(() => { /* silent — static fallback renders below */ })
      .finally(() => { if (!cancelled) setAiLoading(false); });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      .catch(() => { /* silent — rubric card simply won't render */ })
      .finally(() => { if (!cancelled) setRubricLoading(false); });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const req    = mission.requirements;

  const diagnosis = diagnoseAll(metrics, req, architecture);

  const scoreData = [{
    name: 'score',
    value: metrics.score,
    fill: metrics.score >= 80 ? '#10b981' : metrics.score >= 60 ? '#f59e0b' : '#ef4444',
  }];

  const failingCount = [
    metrics.latencyMs      > req.performance.latencyMs,
    metrics.availability   < req.performance.availability,
    metrics.throughput     < req.traffic.concurrent,
    metrics.monthlyCost    > req.budget,
  ].filter(Boolean).length;

  const toggleMetric = (id: string) =>
    setOpenMetric((prev) => (prev === id ? null : id));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="max-w-2xl mx-auto py-8 px-4"
    >
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
          className="text-5xl mb-3"
        >
          {passed ? '🎉' : failingCount >= 3 ? '😤' : '🤔'}
        </motion.div>
        <h1 className="text-3xl font-bold text-white">
          {passed ? 'Mission Complete!' : failingCount >= 3 ? 'Needs Work' : 'Almost There!'}
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          {passed
            ? 'Your architecture met all performance targets.'
            : `${failingCount} of 4 targets missed — tap Why? on any failed metric to investigate.`}
        </p>
      </div>

      <div className="card p-5 mb-2 flex items-center gap-6">
        <div className="w-28 h-28 flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="62%" outerRadius="90%"
              data={scoreData} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={8} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-black text-white">{metrics.score}</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-4xl font-bold text-white mb-0.5">
            {metrics.score}<span className="text-xl text-gray-500">/100</span>
          </div>
          <div className="text-gray-400 text-sm mb-3">Architecture Score</div>
          <div className="flex items-center gap-2 flex-wrap">
            {xpGranted > 0 ? (
              <>
                <span className="text-amber-400 font-bold text-base">+{xpGranted} XP earned! 🎉</span>
                {metrics.bonusXp > 0 && (
                  <span className="badge bg-amber-900/40 text-amber-400 border border-amber-700/40 text-xs">
                    +{metrics.bonusXp} bonus
                  </span>
                )}
              </>
            ) : passed ? (
              <span className="text-gray-400 text-sm">Already completed — XP was awarded on your first run</span>
            ) : (
              <span className="text-gray-500 text-sm">
                Complete all targets to earn {metrics.xpEarned + metrics.bonusXp} XP
              </span>
            )}
          </div>
          {!passed && (
            <p className="text-xs text-red-400/70 mt-2">
              {!metrics.allMetricsMet
                ? 'All 4 performance targets must be met to complete this mission'
                : 'Score ≥ 60 to complete the mission'}
            </p>
          )}
        </div>
      </div>

      {aiLoading && <AnalysisSkeleton />}
      {!aiLoading && aiAnalysis && <AIAnalysisPanel analysis={aiAnalysis} />}

      {rubricLoading && MISSION_SOLUTIONS[mission.slug] && <RubricSkeleton />}
      {!rubricLoading && rubricScore && <RubricCard rubric={rubricScore} />}

      {hasSolution && (
        <div className="mb-4">
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
                className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-900/20
                  hover:bg-blue-900/30 rounded-xl border border-blue-700/40 transition-colors text-sm"
              >
                <span className="flex items-center gap-2 text-blue-300">
                  <span>🗺️</span>
                  <span>View Ideal Solution &amp; Gap Analysis</span>
                </span>
                <span className="text-blue-500 text-base">›</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-0.5">
        Performance Results
        {!passed && (
          <span className="ml-2 font-normal text-gray-600 normal-case">
            — tap <span className="text-red-400">Why?</span> on a failed metric to investigate
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <MetricCard
          id="latency"
          icon="⚡" label="Latency"
          value={`${metrics.latencyMs}ms`} target={`< ${req.performance.latencyMs}ms`}
          met={metrics.latencyMs <= req.performance.latencyMs}
          diagnosis={diagnosis.latency}
          isOpen={openMetric === 'latency'}
          onToggle={() => toggleMetric('latency')}
        />
        <MetricCard
          id="availability"
          icon="📈" label="Availability"
          value={`${metrics.availability}%`} target={`≥ ${req.performance.availability}%`}
          met={metrics.availability >= req.performance.availability}
          diagnosis={diagnosis.availability}
          isOpen={openMetric === 'availability'}
          onToggle={() => toggleMetric('availability')}
        />
        <MetricCard
          id="throughput"
          icon="👥" label="Throughput"
          value={metrics.throughput.toLocaleString()} target={`≥ ${req.traffic.concurrent.toLocaleString()}`}
          met={metrics.throughput >= req.traffic.concurrent}
          diagnosis={diagnosis.throughput}
          isOpen={openMetric === 'throughput'}
          onToggle={() => toggleMetric('throughput')}
        />
        <MetricCard
          id="cost"
          icon="💰" label="Monthly Cost"
          value={`$${metrics.monthlyCost}`} target={`≤ $${req.budget}`}
          met={metrics.monthlyCost <= req.budget}
          diagnosis={diagnosis.cost}
          isOpen={openMetric === 'cost'}
          onToggle={() => toggleMetric('cost')}
        />
      </div>

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

      {passed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-5 mb-5"
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

      {!aiAnalysis && <div className="mb-5">
        <button
          onClick={() => setShowHints((s) => !s)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-800/60
            hover:bg-gray-800 rounded-xl border border-gray-700/50 transition-colors text-sm"
        >
          <span className="flex items-center gap-2 text-gray-300">
            <span>💡</span>
            <span>Need suggestions?</span>
          </span>
          <span className={`text-gray-500 transition-transform duration-200 ${showHints ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>

        <AnimatePresence>
          {showHints && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 card p-4 border border-gray-700/50">
                <div className="space-y-2">
                  {metrics.feedback
                    .filter((f) => f.type !== 'success')
                    .map((item, i) => (
                      <div key={i} className={`flex items-start gap-2.5 text-sm p-2.5 rounded-lg
                        ${item.type === 'warning'
                          ? 'text-amber-300 bg-amber-900/10 border border-amber-800/30'
                          : 'text-blue-300 bg-blue-900/10 border border-blue-800/30'}`}
                      >
                        <span className="flex-shrink-0 mt-0.5">
                          {item.type === 'warning' ? '⚠' : '���'}
                        </span>
                        {item.message}
                      </div>
                    ))}
                  {metrics.feedback.filter((f) => f.type !== 'success').length === 0 && (
                    <p className="text-sm text-gray-400">Your architecture looks solid! No additional suggestions.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>}

      <div className="flex gap-3">
        <button onClick={onRetry} className="btn-secondary">↺ Retry</button>
        {passed && mission.feedbackData.nextMission ? (
          <button
            onClick={() => navigate(`/mission/${mission.feedbackData.nextMission}`)}
            className="btn-primary flex-1"
          >
            Next Mission →
          </button>
        ) : passed ? (
          <button onClick={() => navigate('/dashboard')} className="btn-primary flex-1">
            Back to Dashboard 🏠
          </button>
        ) : (
          <button onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">
            Dashboard
          </button>
        )}
      </div>
    </motion.div>
  );
};
