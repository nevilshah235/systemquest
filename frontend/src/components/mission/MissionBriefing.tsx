import React from 'react';
import { motion } from 'framer-motion';
import { Mission } from '../../data/types';
import { DifficultyStars } from '../ui/DifficultyStars';

interface MissionBriefingProps {
  mission: Mission;
  onContinue: () => void;
  onSkipToBuilder: () => void;
}

export const MissionBriefing: React.FC<MissionBriefingProps> = ({ mission, onContinue, onSkipToBuilder }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto py-8 px-4"
    >
      {/* Mission header */}
      <div className="card p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge bg-brand-900/50 text-brand-400 border border-brand-700/50">
                Mission {mission.order} of 3
              </span>
              <DifficultyStars difficulty={mission.difficulty} />
            </div>
            <h1 className="text-2xl font-bold text-white">{mission.title}</h1>
          </div>
          <div className="text-right">
            <div className="text-2xl mb-1">🚀</div>
            <div className="text-xs text-gray-400">{mission.estimatedTime}</div>
          </div>
        </div>

        {/* XP reward */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <span className="text-3xl">⭐</span>
          <div>
            <div className="text-amber-400 font-bold text-lg">{mission.xpReward} XP Reward</div>
            <div className="text-xs text-gray-400">Plus bonus XP for optional objectives</div>
          </div>
        </div>

        {/* The situation */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-3">The Situation</h2>
          <p className="text-gray-300 leading-relaxed">{mission.scenario}</p>
        </div>

        {/* Objectives */}
        <div>
          <h2 className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-3">Your Mission</h2>
          <ul className="space-y-2">
            {mission.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2.5 text-gray-300">
                <span className="w-5 h-5 rounded-full bg-brand-800 text-brand-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                  {i + 1}
                </span>
                {obj}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onContinue} className="btn-primary flex-1">
          Continue to Requirements →
        </button>
        <button onClick={onSkipToBuilder} className="btn-secondary">
          Skip to Builder
        </button>
      </div>
    </motion.div>
  );
};
