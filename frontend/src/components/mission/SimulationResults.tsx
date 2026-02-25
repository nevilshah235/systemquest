import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimulationMetrics, Mission } from '../../data/types';
import { useNavigate } from 'react-router-dom';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { diagnoseAll, MetricDiagnosis } from '../../data/diagnostics';
import { useBuilderStore } from '../../stores/builderStore';

interface SimulationResultsProps {
  metrics: SimulationMetrics;
  mission: Mission;
  onRetry: () => void;
}

// ─── Expandable Metric Card ──────────────────────────────────────────────────

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  target: string;
  met: boolean;
  diagnosis: MetricDiagnosis | null;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, target, met, diagnosis }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors duration-200
      ${met ? 'border-green-700/40 bg-green-900/10' : 'border-red-700/40 bg-red-900/10'}`}
    >
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-medium">{icon} {label}</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${met ? 'text-green-400' : 'text-red-400'}`}>
              {met ? '✓ Met' : '✗ Missed'}
            </span>
            {/* "Why?" button — only show when metric is failing */}
            {!met && diagnosis && (
              <button
                onClick={() => setOpen((o) => !o)}
                className="text-xs px-2 py-0.5 rounded-md bg-gray-700/80 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
              >
                {open ? 'Close' : 'Why?'}
              </button>
            )}
          </div>
        </div>
        <div className="text-xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">Target: {target}</div>
      </div>

      {/* Expandable diagnosis panel */}
      <AnimatePresence>
        {open && diagnosis && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-red-700/30 pt-3">
              {/* Root cause */}
              <div className="flex items-start gap-2 mb-3">
                <span className="text-red-400 flex-shrink-0 mt-0.5">⚠</span>
                <div>
                  <div className="text-xs font-semibold text-red-300 mb-1">{diagnosis.cause}</div>
                  <p className="text-xs text-gray-400 leading-relaxed">{diagnosis.detail}</p>
                </div>
              </div>

              {/* Fix suggestions with before/after */}
              {diagnosis.fixes.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Suggested Fixes
                  </div>
                  <div className="space-y-1.5">
                    {diagnosis.fixes.map((fix, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-800/60 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{fix.icon}</span>
                          <span className="text-xs text-gray-300">{fix.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                          {fix.impact}
                        </span>
                      </div>
                    ))}
                  </div>
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

export const SimulationResults: React.FC<SimulationResultsProps> = ({ metrics, mission, onRetry }) => {
  const navigate = useNavigate();
  const [showHints, setShowHints] = useState(false);
  const architecture = useBuilderStore((s) => s.architecture);

  const passed = metrics.score >= 60;
  const req    = mission.requirements;

  // Run diagnostic engine
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="max-w-2xl mx-auto py-8 px-4"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
            : `${failingCount} of 4 targets missed — expand each card to see why.`}
        </p>
      </div>

      {/* ── Score dial + XP ─────────────────────────────────────────────────── */}
      <div className="card p-5 mb-4 flex items-center gap-6">
        <div className="w-28 h-28 flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="62%" outerRadius="90%"
              data={scoreData} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={8} />
            </RadialBarChart>
          </ResponsiveContainer>
          {/* Score in centre of dial */}
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
            <span className="text-amber-400 font-bold text-base">
              +{metrics.xpEarned + metrics.bonusXp} XP earned
            </span>
            {metrics.bonusXp > 0 && (
              <span className="badge bg-amber-900/40 text-amber-400 border border-amber-700/40 text-xs">
                +{metrics.bonusXp} bonus
              </span>
            )}
          </div>
          {!passed && (
            <p className="text-xs text-gray-500 mt-2">
              Score ≥ 60 to complete the mission
            </p>
          )}
        </div>
      </div>

      {/* ── Metric cards with expandable "Why?" ─────────────────────────────── */}
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-0.5">
        Performance Results
        {!passed && (
          <span className="ml-2 font-normal text-gray-600 normal-case">
            — tap <span className="text-red-400">Why?</span> on any failed metric for root-cause analysis
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <MetricCard
          icon="⚡" label="Latency"
          value={`${metrics.latencyMs}ms`} target={`< ${req.performance.latencyMs}ms`}
          met={metrics.latencyMs <= req.performance.latencyMs}
          diagnosis={diagnosis.latency}
        />
        <MetricCard
          icon="📈" label="Availability"
          value={`${metrics.availability}%`} target={`≥ ${req.performance.availability}%`}
          met={metrics.availability >= req.performance.availability}
          diagnosis={diagnosis.availability}
        />
        <MetricCard
          icon="👥" label="Throughput"
          value={metrics.throughput.toLocaleString()} target={`≥ ${req.traffic.concurrent.toLocaleString()}`}
          met={metrics.throughput >= req.traffic.concurrent}
          diagnosis={diagnosis.throughput}
        />
        <MetricCard
          icon="💰" label="Monthly Cost"
          value={`$${metrics.monthlyCost}`} target={`≤ $${req.budget}`}
          met={metrics.monthlyCost <= req.budget}
          diagnosis={diagnosis.cost}
        />
      </div>

      {/* ── Passing checks (successes only) ─────────────────────────────────── */}
      {metrics.feedback.filter((f) => f.type === 'success').length > 0 && (
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

      {/* ── What you learned (passed missions only) ─────────────────────────── */}
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

      {/* ── Hidden hints — collapsed by default ─────────────────────────────── */}
      <div className="mb-5">
        <button
          onClick={() => setShowHints((s) => !s)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-800/60 hover:bg-gray-800 rounded-xl border border-gray-700/50 transition-colors text-sm"
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
                          {item.type === 'warning' ? '⚠' : 'ℹ'}
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
      </div>

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
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
