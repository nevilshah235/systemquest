import React from 'react';
import { motion } from 'framer-motion';
import { Mission, LEARNING_PATHS } from '../../data/types';
import { DifficultyStars } from '../ui/DifficultyStars';
import { useNavigate } from 'react-router-dom';

interface MissionCardProps {
  mission: Mission;
  isLocked: boolean;
  index: number;
}

const SKILL_BADGE: Record<string, { label: string; cls: string }> = {
  beginner:     { label: 'Beginner',     cls: 'bg-green-900/40 text-green-400 border-green-700/50' },
  intermediate: { label: 'Intermediate', cls: 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50' },
  advanced:     { label: 'Advanced',     cls: 'bg-red-900/40 text-red-400 border-red-700/50' },
};

export const MissionCard: React.FC<MissionCardProps> = ({ mission, isLocked, index }) => {
  const navigate = useNavigate();
  const progress = mission.userProgress;
  const pathMeta = LEARNING_PATHS[mission.learningPath];
  const skillBadge = SKILL_BADGE[mission.skillLevel] ?? SKILL_BADGE['beginner'];

  const statusColor = progress?.completed
    ? 'border-green-700/50 bg-green-900/10'
    : !isLocked
    ? 'border-brand-700/50 hover:border-brand-500/70 cursor-pointer'
    : 'border-gray-800 opacity-60';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`card p-6 border-2 transition-all duration-200 ${statusColor}`}
      onClick={() => !isLocked && navigate(`/mission/${mission.slug}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {progress?.completed
              ? <span className="badge bg-green-900/50 text-green-400 border border-green-700/50">✓ Completed</span>
              : isLocked
              ? <span className="badge bg-gray-800 text-gray-500 border border-gray-700">🔒 Locked</span>
              : <span className="badge bg-brand-900/50 text-brand-400 border border-brand-700/50">Available</span>
            }
            {/* Skill level badge */}
            <span className={`badge border ${skillBadge.cls} text-xs`}>{skillBadge.label}</span>
          </div>
          <h3 className="text-lg font-bold text-white truncate">{mission.title}</h3>
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{mission.description}</p>
        </div>
        {/* Path icon */}
        <div className="text-3xl ml-4 flex-shrink-0">
          {pathMeta?.icon ?? '🖥️'}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <DifficultyStars difficulty={mission.difficulty} />
          <span className="text-xs text-gray-400">⏱ {mission.estimatedTime}</span>
        </div>
        <div className="flex items-center gap-2">
          {progress?.completed && progress.bestScore != null && (
            <span className="text-xs text-gray-400">{progress.bestScore}/100</span>
          )}
          <span className="badge bg-amber-900/30 text-amber-400 border border-amber-800/50">
            ⭐ {mission.xpReward} XP
          </span>
        </div>
      </div>

      {/* Score bar if completed */}
      {progress?.completed && progress.bestScore != null && (
        <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
            style={{ width: `${progress.bestScore}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};
