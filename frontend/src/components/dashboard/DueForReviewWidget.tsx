/**
 * Due for Review Widget — F-005 Spaced Repetition
 * Displayed on the Dashboard when a user has missions due for re-attempt.
 * Shows up to 3 due items with snooze + review actions.
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReviewStore } from '../../stores/reviewStore';

const PATH_EMOJIS: Record<string, string> = {
  foundations:     '🏗️',
  'async-queues':  '⚡',
  'high-read':     '🚀',
  'real-time':     '📡',
  consistency:     '🔒',
  'scale-streaming': '🌍',
};

function formatDue(dueAt: string): string {
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff <= 0) return 'Due now';
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days}d`;
}

export const DueForReviewWidget: React.FC = () => {
  const { queue, dueCount, isLoading, fetchQueue, snoozeItem } = useReviewStore();
  const navigate = useNavigate();

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  // Only show the widget when there are items actually due
  const dueItems = queue.filter((i) => i.isDue).slice(0, 3);

  if (isLoading || dueCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <span className="text-base">🔁</span>
          <span className="font-semibold text-amber-300 text-sm">Due for Review</span>
          <span className="bg-amber-500/25 text-amber-200 text-xs px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
            {dueCount}
          </span>
        </div>
        <p className="text-xs text-gray-500 hidden sm:block">
          Re-attempt to strengthen your memory — SM-2 scheduled
        </p>
      </div>

      {/* Due items list */}
      <div className="divide-y divide-gray-800/50">
        <AnimatePresence>
          {dueItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              className="px-5 py-3 flex items-center justify-between gap-3"
            >
              {/* Mission info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-lg flex-shrink-0">
                  {PATH_EMOJIS[item.missionPath] ?? '🎯'}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.missionTitle}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">Last: </span>
                    <span
                      className={`text-xs font-semibold ${
                        item.lastScore >= 70 ? 'text-yellow-400' : 'text-red-400'
                      }`}
                    >
                      {item.lastScore}%
                    </span>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs text-amber-500/80">{formatDue(item.dueAt)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => snoozeItem(item.missionSlug)}
                  title="Snooze 3 days"
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-gray-800"
                >
                  💤 3d
                </button>
                <button
                  onClick={() => navigate(`/mission/${item.missionSlug}`)}
                  className="text-xs bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 px-3 py-1.5 rounded-lg font-medium transition-colors border border-amber-600/20"
                >
                  Review →
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Overflow indicator */}
        {dueCount > 3 && (
          <div className="px-5 py-2 text-xs text-center text-gray-500">
            +{dueCount - 3} more missions due for review
          </div>
        )}
      </div>
    </motion.div>
  );
};
