import React from 'react';
import { motion } from 'framer-motion';

interface XPBarProps {
  xp: number;
  level: number;
  xpThisLevel: number;
  xpForLevel: number;
}

export const XPBar: React.FC<XPBarProps> = ({ xp, level, xpThisLevel, xpForLevel }) => {
  const percent = Math.min(100, (xpThisLevel / xpForLevel) * 100);

  return (
    <div className="flex items-center gap-3">
      {/* Level badge */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-amber-500/30">
        {level}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400 font-medium">Level {level}</span>
          <span className="text-xs text-amber-400 font-semibold">{xp} XP</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">{xpThisLevel} / {xpForLevel} to Level {level + 1}</div>
      </div>
    </div>
  );
};
