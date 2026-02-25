import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Progress } from '../data/types';
import { progressApi } from '../data/api';
import { useAuthStore } from '../stores/authStore';
import { XPBar } from '../components/ui/XPBar';

export const ProgressPage: React.FC = () => {
  const { user } = useAuthStore();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressApi.get().then(setProgress).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-400 animate-pulse">Loading...</div>;
  if (!progress) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold text-white mb-6">
        Your Progress
      </motion.h1>

      {/* XP overview */}
      <div className="card p-6 mb-6">
        <XPBar
          xp={progress.xp}
          level={progress.level}
          xpThisLevel={progress.xpThisLevel}
          xpForLevel={progress.xpForLevel}
        />
      </div>

      {/* Completed missions */}
      <div className="card p-6 mb-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Completed Missions</h2>
        {progress.completedMissions.length === 0 ? (
          <p className="text-gray-500 text-sm">No missions completed yet. Start your first mission!</p>
        ) : (
          <div className="space-y-3">
            {progress.completedMissions.map((m) => (
              <div key={m.missionSlug} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                <div>
                  <div className="font-semibold text-white text-sm">{m.missionTitle}</div>
                  <div className="text-xs text-gray-400">{new Date(m.completedAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-bold text-sm">+{m.xpEarned} XP</div>
                  <div className="text-xs text-gray-400">{m.score}/100</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements */}
      <div className="card p-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Achievements</h2>
        {progress.achievements.length === 0 ? (
          <p className="text-gray-500 text-sm">Complete missions to earn achievements!</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {progress.achievements.map((a) => (
              <div key={a.slug} className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <div className="font-semibold text-white text-sm">{a.title}</div>
                  <div className="text-xs text-gray-400">{a.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
