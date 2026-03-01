import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMissionStore } from '../stores/missionStore';
import { useAuthStore } from '../stores/authStore';
import { MissionCard } from '../components/dashboard/MissionCard';
import { DueForReviewWidget } from '../components/dashboard/DueForReviewWidget';
import { XPBar } from '../components/ui/XPBar';
import { Mission, LEARNING_PATHS, LearningPathMeta } from '../data/types';
import { AdventureRoadmap } from '../components/progress/AdventureRoadmap';

// ── Skill level display config ──────────────────────────────────────────────
const SKILL_DISPLAY: Record<string, { label: string; icon: string; cls: string }> = {
  beginner:     { label: 'Beginner',     icon: '🌱', cls: 'bg-green-900/40 text-green-300 border-green-700/50' },
  intermediate: { label: 'Intermediate', icon: '📈', cls: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50' },
  advanced:     { label: 'Advanced',     icon: '🔥', cls: 'bg-red-900/40 text-red-300 border-red-700/50' },
};

/**
 * Resolves the single skill level to show in the UI.
 * Uses the higher of derivedSkillLevel (performance-based) and skillLevel (stored/override).
 * Falls back to 'beginner' when neither is set.
 */
function resolveDisplaySkill(skillLevel?: string, derivedSkillLevel?: string): string {
  const order   = ['beginner', 'intermediate', 'advanced'];
  const stored  = order.indexOf(skillLevel        ?? 'beginner');
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

// ── Path Detail Section (shown below roadmap for selected path) ──────────────
interface PathDetailProps {
  meta: LearningPathMeta;
  missions: Mission[];
}

const PathDetail: React.FC<PathDetailProps> = ({ meta, missions }) => {
  const isPathLocked    = missions.length > 0 && missions.every((m) => m.isLocked);
  const completedInPath = missions.filter((m) => m.userProgress?.completed).length;
  const pct             = missions.length > 0 ? (completedInPath / missions.length) * 100 : 0;

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${meta.colorClass} ${isPathLocked ? 'opacity-60' : ''}`}>
      {/* Path header */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-white">{meta.title}</h3>
              <span className="text-xs text-gray-500 font-normal">{meta.skillLabel}</span>
              {isPathLocked && (
                <span className="text-xs text-gray-500">🔒 Complete Foundations to unlock</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{meta.description}</p>
          </div>
        </div>

        {/* Progress pill */}
        <div className="text-right flex-shrink-0 ml-4">
          <div className="text-sm font-semibold text-gray-300">
            {completedInPath}<span className="text-gray-600">/{missions.length}</span>
          </div>
          <div className="text-xs text-gray-500">completed</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-gray-800">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Mission cards */}
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
    </div>
  );
};

// ── Dashboard Page ──────────────────────────────────────────────────────────
export const DashboardPage: React.FC = () => {
  const { missions, fetchMissions, isLoading } = useMissionStore();
  const { user } = useAuthStore();

  // Which roadmap node is selected (null = auto-resolve to recommended path)
  const [selectedPathSlug, setSelectedPathSlug] = useState<string | null>(null);

  // Ref for smooth-scrolling to the detail panel when a node is clicked
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  const completedCount = missions.filter((m) => m.userProgress?.completed).length;
  const totalXP        = user?.xp ?? 0;
  const userLevel      = user?.level ?? 1;
  const xpThisLevel    = totalXP - levelThreshold(userLevel);
  const xpForLevel     = levelThreshold(userLevel + 1) - levelThreshold(userLevel);

  const displaySkill = resolveDisplaySkill(user?.skillLevel, user?.derivedSkillLevel);
  const skillDisplay = SKILL_DISPLAY[displaySkill];

  const missionsByPath      = groupByPath(missions);
  const foundationMissions  = missionsByPath['foundations'] ?? [];
  const foundationsComplete = foundationMissions.length > 0 &&
    foundationMissions.every((m) => m.userProgress?.completed);

  // Determine which path's detail panel to show
  const defaultPath        = getRecommendedPath(displaySkill, missionsByPath);
  const activePathSlug     = selectedPathSlug ?? defaultPath;
  const activePathMeta     = LEARNING_PATHS[activePathSlug];
  const activePathMissions = missionsByPath[activePathSlug] ?? [];

  const handleNodeSelect = (slug: string) => {
    setSelectedPathSlug(slug);
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

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
          { icon: '⭐', label: 'Total XP',  value: totalXP        },
          { icon: '🏆', label: 'Level',     value: userLevel       },
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

      {/* ── Adventure Roadmap ───────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border-2 border-gray-800 p-6 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
          className="card p-6 mb-8"
        >
          <AdventureRoadmap
            missionsByPath={missionsByPath}
            foundationsComplete={foundationsComplete}
            selectedSlug={activePathSlug}
            onNodeSelect={handleNodeSelect}
          />
        </motion.div>
      )}

      {/* ── Path Detail Panel (missions for selected path) ───────────────── */}
      {!isLoading && activePathMeta && (
        <div ref={detailRef}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.35 } }}
            className="mb-3 flex items-center gap-2"
          >
            <span className="text-gray-400 text-sm font-medium">Selected path</span>
            <span className="text-xl">{activePathMeta.icon}</span>
            <span className="text-white font-semibold text-sm">{activePathMeta.title}</span>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activePathSlug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <PathDetail
                meta={activePathMeta}
                missions={activePathMissions}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────

function levelThreshold(level: number): number {
  const t: Record<number, number> = { 1: 0, 2: 100, 3: 300, 4: 600, 5: 1000, 6: 1500 };
  return t[level] ?? level * 300;
}

/**
 * Returns the slug of the recommended path to show in the detail panel by default.
 * Prefers foundations if incomplete, then matches user's skill level.
 */
function getRecommendedPath(
  displaySkill: string,
  missionsByPath: Record<string, Mission[]>,
): string {
  const pathOrder = Object.entries(LEARNING_PATHS)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([slug]) => slug);

  // Show foundations first if it has incomplete missions
  if ((missionsByPath['foundations'] ?? []).some((m) => !m.userProgress?.completed)) {
    return 'foundations';
  }

  // Then prefer paths matching the user's skill level with incomplete missions
  for (const slug of pathOrder.filter((s) => s !== 'foundations')) {
    const pathMissions = missionsByPath[slug] ?? [];
    const hasMatchingSkill = pathMissions.some((m) => m.skillLevel === displaySkill);
    const hasIncomplete    = pathMissions.some((m) => !m.userProgress?.completed);
    if (hasMatchingSkill && hasIncomplete) return slug;
  }

  // Fallback: first path with incomplete missions
  return (
    pathOrder.find((slug) =>
      (missionsByPath[slug] ?? []).some((m) => !m.userProgress?.completed),
    ) ?? 'foundations'
  );
}
