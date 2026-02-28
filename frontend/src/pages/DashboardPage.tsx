import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMissionStore } from '../stores/missionStore';
import { useAuthStore } from '../stores/authStore';
import { MissionCard } from '../components/dashboard/MissionCard';
import { DueForReviewWidget } from '../components/dashboard/DueForReviewWidget';
import { XPBar } from '../components/ui/XPBar';
import { Mission, LEARNING_PATHS, LearningPathMeta } from '../data/types';

// ── Skill level display config ──────────────────────────────────────────────────
const SKILL_DISPLAY: Record<string, { label: string; icon: string; cls: string }> = {
  beginner:     { label: 'Beginner',     icon: '🌱', cls: 'bg-green-900/40 text-green-300 border-green-700/50' },
  intermediate: { label: 'Intermediate', icon: '📈', cls: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50' },
  advanced:     { label: 'Advanced',     icon: '🔥', cls: 'bg-red-900/40 text-red-300 border-red-700/50' },
};

function resolveDisplaySkill(skillLevel?: string, derivedSkillLevel?: string): string {
  const order = ['beginner', 'intermediate', 'advanced'];
  const stored  = order.indexOf(skillLevel ?? 'beginner');
  const derived = order.indexOf(derivedSkillLevel ?? 'beginner');
  return order[Math.max(stored, derived)] ?? 'beginner';
}

function groupByPath(missions: Mission[]): Record<string, Mission[]> {
  const groups: Record<string, Mission[]> = {};
  for (const m of missions) {
    const path = m.learningPath ?? 'foundations';
    if (!groups[path]) groups[path] = [];
    groups[path].push(m);
  }
  for (const path of Object.keys(groups)) {
    groups[path].sort((a, b) => a.order - b.order);
  }
  return groups;
}

// ── Learning Path Section ──────────────────────────────────────────────────
interface PathSectionProps {
  meta: LearningPathMeta;
  missions: Mission[];
  defaultOpen?: boolean;
}

const PathSection: React.FC<PathSectionProps> = ({ meta, missions, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  const isPathLocked = missions.length > 0 && missions.every((m) => m.isLocked);
  const completedInPath = missions.filter((m) => m.userProgress?.completed).length;
  const pct = missions.length > 0 ? (completedInPath / missions.length) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 rounded-xl border-2 overflow-hidden ${meta.colorClass} ${isPathLocked ? 'opacity-60' : ''}`}
    >
      <button
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white">{meta.title}</h2>
              <span className="text-xs text-gray-500 font-normal">{meta.skillLabel}</span>
              {isPathLocked && (
                <span className="text-xs text-gray-500">🔒 Complete Foundations to unlock</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{meta.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-300">
              {completedInPath}<span className="text-gray-600">/{missions.length}</span>
            </div>
            <div className="text-xs text-gray-500">completed</div>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <div className="h-0.5 bg-gray-800">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="missions"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-3 space-y-3">
              {missions.map((mission, i) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  isLocked={mission.isLocked ?? false}
                  index={i}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Dashboard Page ───────────────────────────────────────────────────────────────
export const DashboardPage: React.FC = () => {
  const { missions, fetchMissions, isLoading } = useMissionStore();
  const { user } = useAuthStore();

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  const completedCount  = missions.filter((m) => m.userProgress?.completed).length;
  const totalXP         = user?.xp ?? 0;
  const userLevel       = user?.level ?? 1;
  const xpThisLevel     = totalXP - levelThreshold(userLevel);
  const xpForLevel      = levelThreshold(userLevel + 1) - levelThreshold(userLevel);

  const displaySkill    = resolveDisplaySkill(user?.skillLevel, user?.derivedSkillLevel);
  const skillDisplay    = SKILL_DISPLAY[displaySkill];

  const missionsByPath  = groupByPath(missions);
  const foundationMissions = missionsByPath['foundations'] ?? [];
  const foundationsComplete = foundationMissions.length > 0 &&
    foundationMissions.every((m) => m.userProgress?.completed);

  const orderedPaths = Object.entries(LEARNING_PATHS)
    .sort(([, a], [, b]) => a.order - b.order)
    .filter(([slug]) => (missionsByPath[slug]?.length ?? 0) > 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Welcome header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Welcome back, <span className="text-brand-400">{user?.username}</span> 👋
            </h1>
            <p className="text-gray-400 text-sm">
              {completedCount === 0
                ? 'Start your first mission to begin earning XP!'
                : `${completedCount} of ${missions.length} missions completed`}
            </p>
          </div>
          {skillDisplay && (
            <span className={`badge border px-3 py-1 text-sm font-medium ${skillDisplay.cls}`}>
              {skillDisplay.icon} {skillDisplay.label}
            </span>
          )}
        </div>
      </motion.div>

      {/* XP bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1 } }} className="card p-5 mb-6">
        <XPBar
          xp={totalXP}
          level={userLevel}
          xpThisLevel={Math.max(0, xpThisLevel)}
          xpForLevel={Math.max(1, xpForLevel)}
        />
      </motion.div>

      {/* Stats overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {([
          { icon: '✅', label: 'Completed', value: completedCount },
          { icon: '⭐', label: 'Total XP',  value: totalXP },
          { icon: '🏆', label: 'Level',     value: userLevel },
        ] as const).map(({ icon, label, value }, i) => (
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

      {/* ── F-005: Due for Review widget ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.2 } }}
      >
        <DueForReviewWidget />
      </motion.div>

      {/* Foundations progress notice */}
      {!foundationsComplete && foundationMissions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.25 } }}
          className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/5 px-5 py-3 flex items-center gap-3"
        >
          <span className="text-xl">🔓</span>
          <p className="text-sm text-blue-300">
            Complete <span className="font-semibold text-white">Foundations</span> to unlock all other learning paths.
          </p>
        </motion.div>
      )}

      {/* Learning path sections */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border-2 border-gray-800 p-6 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div>
          {orderedPaths.map(([slug, meta]) => (
            <PathSection
              key={slug}
              meta={meta}
              missions={missionsByPath[slug] ?? []}
              defaultOpen={
                slug === 'foundations' ||
                (foundationsComplete && slug === getRecommendedPath(displaySkill, missionsByPath))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function levelThreshold(level: number): number {
  const t: Record<number, number> = { 1: 0, 2: 100, 3: 300, 4: 600, 5: 1000, 6: 1500 };
  return t[level] ?? level * 300;
}

function getRecommendedPath(
  displaySkill: string,
  missionsByPath: Record<string, Mission[]>,
): string {
  const pathOrder = Object.entries(LEARNING_PATHS)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([slug]) => slug)
    .filter((s) => s !== 'foundations');

  for (const slug of pathOrder) {
    const pathMissions = missionsByPath[slug] ?? [];
    const hasMatchingSkill = pathMissions.some((m) => m.skillLevel === displaySkill);
    const hasIncomplete = pathMissions.some((m) => !m.userProgress?.completed);
    if (hasMatchingSkill && hasIncomplete) return slug;
  }

  return (
    pathOrder.find((slug) =>
      (missionsByPath[slug] ?? []).some((m) => !m.userProgress?.completed),
    ) ?? 'async-queues'
  );
}
