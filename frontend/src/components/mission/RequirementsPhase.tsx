import React from 'react';
import { motion } from 'framer-motion';
import { Mission, COMPONENT_META } from '../../data/types';

interface RequirementsPhaseProps {
  mission: Mission;
  onContinue: () => void;
  onBack: () => void;
}

export const RequirementsPhase: React.FC<RequirementsPhaseProps> = ({ mission, onContinue, onBack }) => {
  const req = mission.requirements;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto py-8 px-4"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Technical Requirements</h1>
        <p className="text-gray-400 text-sm">Understand what your architecture needs to achieve</p>
      </div>

      {/* Performance targets */}
      <div className="card p-6 mb-4">
        <h2 className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-4">Performance Targets</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: '⚡', label: 'Max Latency', value: `< ${req.performance.latencyMs}ms`, sub: 'response time' },
            { icon: '📈', label: 'Availability', value: `${req.performance.availability}%`, sub: 'uptime' },
            { icon: '👥', label: 'Concurrent Users', value: req.traffic.concurrent.toLocaleString(), sub: 'simultaneous' },
            { icon: '💰', label: 'Monthly Budget', value: `$${req.budget.toLocaleString()}`, sub: 'maximum spend' },
          ].map((item) => (
            <div key={item.label} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <span>{item.icon}</span>
                <span className="text-xs text-gray-400">{item.label}</span>
              </div>
              <div className="text-xl font-bold text-white">{item.value}</div>
              <div className="text-xs text-gray-500">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Required components checklist */}
      <div className="card p-6 mb-4">
        <h2 className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-4">Required Components</h2>
        <div className="space-y-2">
          {req.required.map((type) => {
            const meta = COMPONENT_META[type];
            return (
              <div key={type} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="w-5 h-5 rounded border-2 border-brand-500 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-sm bg-brand-500" />
                </div>
                <span className="text-lg">{meta.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{meta.label}</div>
                  <div className="text-xs text-gray-400">{meta.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bonus objectives */}
      {req.bonus.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-4">⭐ Bonus Objectives</h2>
          <div className="space-y-2">
            {req.bonus.map((bonus) => {
              const meta = COMPONENT_META[bonus.component];
              return (
                <div key={bonus.component} className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <span>{meta?.icon}</span>
                    <span className="text-sm text-gray-300">{bonus.label}</span>
                  </div>
                  <span className="badge bg-amber-900/50 text-amber-400 border border-amber-700/50">+{bonus.xp} XP</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary">← Back</button>
        <button onClick={onContinue} className="btn-primary flex-1">Start Building →</button>
      </div>
    </motion.div>
  );
};
