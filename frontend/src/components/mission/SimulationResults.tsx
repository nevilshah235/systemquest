import React from 'react';
import { motion } from 'framer-motion';
import { SimulationMetrics, Mission } from '../../data/types';
import { useNavigate } from 'react-router-dom';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface SimulationResultsProps {
  metrics: SimulationMetrics;
  mission: Mission;
  onRetry: () => void;
}

const MetricCard: React.FC<{ icon: string; label: string; value: string; target: string; met: boolean }> = ({
  icon, label, value, target, met,
}) => (
  <div className={`p-4 rounded-xl border ${met ? 'border-green-700/50 bg-green-900/10' : 'border-red-700/50 bg-red-900/10'}`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-gray-400">{icon} {label}</span>
      <span className={`text-xs font-bold ${met ? 'text-green-400' : 'text-red-400'}`}>{met ? '✓ Met' : '✗ Miss'}</span>
    </div>
    <div className="text-xl font-bold text-white">{value}</div>
    <div className="text-xs text-gray-500">Target: {target}</div>
  </div>
);

export const SimulationResults: React.FC<SimulationResultsProps> = ({ metrics, mission, onRetry }) => {
  const navigate = useNavigate();
  const passed = metrics.score >= 60;
  const req = mission.requirements;

  const scoreData = [{ name: 'score', value: metrics.score, fill: metrics.score >= 80 ? '#10b981' : metrics.score >= 60 ? '#f59e0b' : '#ef4444' }];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto py-8 px-4"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-5xl mb-3"
        >
          {passed ? '🎉' : '😤'}
        </motion.div>
        <h1 className="text-3xl font-bold text-white">{passed ? 'Mission Complete!' : 'Keep Trying!'}</h1>
        <p className="text-gray-400 mt-1">{passed ? 'Your architecture passed the simulation.' : 'Your architecture needs improvement.'}</p>
      </div>

      {/* Score dial */}
      <div className="card p-6 mb-4 flex items-center gap-6">
        <div className="w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={scoreData} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={8} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1">
          <div className="text-5xl font-bold text-white mb-1">{metrics.score}<span className="text-2xl text-gray-500">/100</span></div>
          <div className="text-gray-400 text-sm mb-3">Architecture Score</div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-lg">+{metrics.xpEarned + metrics.bonusXp} XP</span>
            {metrics.bonusXp > 0 && <span className="badge bg-amber-900/50 text-amber-400 border border-amber-700/50">+{metrics.bonusXp} bonus</span>}
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <MetricCard icon="⚡" label="Latency" value={`${metrics.latencyMs}ms`} target={`<${req.performance.latencyMs}ms`} met={metrics.latencyMs <= req.performance.latencyMs} />
        <MetricCard icon="📈" label="Availability" value={`${metrics.availability}%`} target={`≥${req.performance.availability}%`} met={metrics.availability >= req.performance.availability} />
        <MetricCard icon="👥" label="Throughput" value={metrics.throughput.toLocaleString()} target={`≥${req.traffic.concurrent.toLocaleString()}`} met={metrics.throughput >= req.traffic.concurrent} />
        <MetricCard icon="💰" label="Monthly Cost" value={`$${metrics.monthlyCost}`} target={`≤$${req.budget}`} met={metrics.monthlyCost <= req.budget} />
      </div>

      {/* Feedback */}
      <div className="card p-6 mb-4">
        <h2 className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-3">Simulation Feedback</h2>
        <div className="space-y-2">
          {metrics.feedback.map((item, i) => (
            <div key={i} className={`flex items-start gap-2.5 text-sm p-2.5 rounded-lg
              ${item.type === 'success' ? 'text-green-400 bg-green-900/10' : item.type === 'warning' ? 'text-red-400 bg-red-900/10' : 'text-blue-400 bg-blue-900/10'}`}
            >
              <span className="flex-shrink-0">{item.type === 'success' ? '✓' : item.type === 'warning' ? '⚠' : 'ℹ'}</span>
              {item.message}
            </div>
          ))}
        </div>
      </div>

      {/* What you learned */}
      {passed && (
        <div className="card p-6 mb-6">
          <h2 className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-3">🎓 What You Learned</h2>
          <ul className="space-y-2">
            {mission.feedbackData.learned.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-green-400 flex-shrink-0 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
          {mission.feedbackData.nextPreview && (
            <div className="mt-4 p-3 bg-brand-900/30 rounded-lg border border-brand-700/30 text-sm text-brand-300">
              <strong>Next up:</strong> {mission.feedbackData.nextPreview}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onRetry} className="btn-secondary">↺ Retry</button>
        {passed && mission.feedbackData.nextMission ? (
          <button onClick={() => navigate(`/mission/${mission.feedbackData.nextMission}`)} className="btn-primary flex-1">
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
