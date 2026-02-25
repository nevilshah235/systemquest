import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMissionStore } from '../stores/missionStore';
import { useAuthStore } from '../stores/authStore';
import { MissionCard } from '../components/dashboard/MissionCard';
import { XPBar } from '../components/ui/XPBar';

export const DashboardPage: React.FC = () => {
  const { missions, fetchMissions, isLoading } = useMissionStore();
  const { user } = useAuthStore();

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  // A mission is locked if the previous mission isn't completed
  const isLocked = (index: number) => {
    if (index === 0) return false;
    return !missions[index - 1]?.userProgress?.completed;
  };

  const completedCount = missions.filter((m) => m.userProgress?.completed).length;
  const xpThisLevel = (user?.xp ?? 0) - levelThreshold(user?.level ?? 1);
  const xpForLevel = levelThreshold((user?.level ?? 1) + 1) - levelThreshold(user?.level ?? 1);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Welcome header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          Welcome back, <span className="text-brand-400">{user?.username}</span> 👋
        </h1>
        <p className="text-gray-400 text-sm">
          {completedCount === 0
            ? 'Start your first mission to begin earning XP!'
            : `${completedCount} of ${missions.length} missions completed`}
        </p>
      </motion.div>

      {/* XP bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1 } }} className="card p-5 mb-8">
        <XPBar
          xp={user?.xp ?? 0}
          level={user?.level ?? 1}
          xpThisLevel={Math.max(0, xpThisLevel)}
          xpForLevel={Math.max(1, xpForLevel)}
        />
      </motion.div>

      {/* Progress overview */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: '✅', label: 'Completed', value: completedCount },
          { icon: '⭐', label: 'Total XP', value: user?.xp ?? 0 },
          { icon: '🏆', label: 'Level', value: user?.level ?? 1 },
        ].map(({ icon, label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.15 + i * 0.05 } }}
            className="card p-4 text-center"
          >
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Mission cards */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Available Missions</h2>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 animate-pulse h-36" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {missions.map((mission, i) => (
              <MissionCard key={mission.id} mission={mission} isLocked={isLocked(i)} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function levelThreshold(level: number): number {
  const t: Record<number, number> = { 1: 0, 2: 100, 3: 300, 4: 600, 5: 1000, 6: 1500 };
  return t[level] ?? level * 300;
}
