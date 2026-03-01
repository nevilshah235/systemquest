/**
 * XPHintOverlay — floating animated XP hint toasts.
 *
 * Renders in a fixed overlay above all content.
 * Each hint auto-dismisses after 4 seconds.
 * Rewards animate in green; penalties in red.
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLLDBuilderStore } from '../../../stores/lldBuilderStore';
import type { XPHint } from '../../../data/lldTypes';

const AUTO_DISMISS_MS = 4000;

interface HintToastProps {
  hint: XPHint;
  onDismiss: (id: string) => void;
}

const HintToast: React.FC<HintToastProps> = ({ hint, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(hint.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [hint.id, onDismiss]);

  const isReward = hint.type === 'reward';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium max-w-xs
        ${isReward
          ? 'bg-green-900/90 border-green-500/40 text-green-200'
          : 'bg-red-900/90 border-red-500/40 text-red-200'
        }
      `}
    >
      <span className="text-lg shrink-0">{isReward ? '🎯' : '⚠️'}</span>
      <div className="flex-1 min-w-0">
        <p className="leading-snug">{hint.message}</p>
      </div>
      <button
        onClick={() => onDismiss(hint.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity text-xs"
      >
        ✕
      </button>
    </motion.div>
  );
};

export const XPHintOverlay: React.FC = () => {
  const { pendingHints, dismissHint } = useLLDBuilderStore();

  if (pendingHints.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {pendingHints.map(hint => (
          <div key={hint.id} className="pointer-events-auto">
            <HintToast hint={hint} onDismiss={dismissHint} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
