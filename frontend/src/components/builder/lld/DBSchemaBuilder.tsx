/**
 * DBSchemaBuilder — SQL vs NoSQL database schema builder.
 *
 * SQL mode: table designer with types, PKs, FKs, indexes.
 * NoSQL mode: document/collection designer with partition keys.
 * Switching mid-design queues a -3 XP penalty (handled in store).
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLLDBuilderStore } from '../../../stores/lldBuilderStore';

export const DBSchemaBuilder: React.FC = () => {
  const { config, dbType, switchDbType } = useLLDBuilderStore();
  const [showSwitchWarning, setShowSwitchWarning] = useState(false);
  const [pendingSwitchTarget, setPendingSwitchTarget] = useState<'sql' | 'nosql' | null>(null);

  if (!config) return null;

  // If mission forces DB type, show it but don't allow switching
  const forced = !!config.forcedDbType;

  const handleDbTypeClick = (type: 'sql' | 'nosql') => {
    if (type === dbType) return;
    if (forced) return;

    // If entities exist, warn about migration cost
    const { entities } = useLLDBuilderStore.getState();
    if (entities.length > 0 && dbType !== null) {
      setPendingSwitchTarget(type);
      setShowSwitchWarning(true);
    } else {
      switchDbType(type);
    }
  };

  const confirmSwitch = () => {
    if (pendingSwitchTarget) {
      switchDbType(pendingSwitchTarget);
    }
    setShowSwitchWarning(false);
    setPendingSwitchTarget(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>🗄️</span> Database Type
          {forced && (
            <span className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-500/30 px-2 py-0.5 rounded-full">
              Mission-locked
            </span>
          )}
        </h3>
      </div>

      {/* SQL / NoSQL toggle */}
      <div className="grid grid-cols-2 gap-3">
        {/* SQL Card */}
        <motion.button
          whileHover={!forced ? { scale: 1.02 } : {}}
          whileTap={!forced ? { scale: 0.98 } : {}}
          onClick={() => handleDbTypeClick('sql')}
          disabled={forced && dbType !== 'sql'}
          className={`
            rounded-xl border p-4 text-left transition-all space-y-2
            ${dbType === 'sql'
              ? 'border-brand-500/60 bg-brand-900/20 ring-1 ring-brand-500/40'
              : 'border-gray-700/60 bg-gray-800/40 hover:border-gray-600'
            }
            ${forced && dbType !== 'sql' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">📊</span>
            {dbType === 'sql' && <span className="text-brand-400 text-sm">✓ Selected</span>}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">SQL</div>
            <div className="text-xs text-gray-400 mt-0.5">Relational · ACID · Joins · Indexes</div>
          </div>
          <div className="flex flex-wrap gap-1">
            {['PostgreSQL', 'MySQL', 'SQLite'].map(db => (
              <span key={db} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{db}</span>
            ))}
          </div>
        </motion.button>

        {/* NoSQL Card */}
        <motion.button
          whileHover={!forced ? { scale: 1.02 } : {}}
          whileTap={!forced ? { scale: 0.98 } : {}}
          onClick={() => handleDbTypeClick('nosql')}
          disabled={forced && dbType !== 'nosql'}
          className={`
            rounded-xl border p-4 text-left transition-all space-y-2
            ${dbType === 'nosql'
              ? 'border-brand-500/60 bg-brand-900/20 ring-1 ring-brand-500/40'
              : 'border-gray-700/60 bg-gray-800/40 hover:border-gray-600'
            }
            ${forced && dbType !== 'nosql' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">📄</span>
            {dbType === 'nosql' && <span className="text-brand-400 text-sm">✓ Selected</span>}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">NoSQL</div>
            <div className="text-xs text-gray-400 mt-0.5">Document · Flexible schema · Horizontal scale</div>
          </div>
          <div className="flex flex-wrap gap-1">
            {['MongoDB', 'DynamoDB', 'Firestore'].map(db => (
              <span key={db} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{db}</span>
            ))}
          </div>
        </motion.button>
      </div>

      {/* Contextual tips */}
      {dbType === 'sql' && (
        <p className="text-xs text-gray-500">
          💡 Use the entity builder above to define tables — SQL mode will render CREATE TABLE DDL in the live preview.
        </p>
      )}
      {dbType === 'nosql' && (
        <p className="text-xs text-gray-500">
          💡 Each entity becomes a collection. Mark one field as a partition key for horizontal scaling.
        </p>
      )}
      {!dbType && (
        <p className="text-xs text-gray-500 text-center py-2">Select a database type to continue.</p>
      )}

      {/* Mid-design switch warning dialog */}
      <AnimatePresence>
        {showSwitchWarning && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-yellow-500/40 bg-yellow-900/20 p-4 space-y-3"
          >
            <div className="flex items-start gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="text-sm font-medium text-yellow-300">Switch database type?</div>
                <div className="text-xs text-gray-400 mt-1">
                  Changing your DB type mid-design will apply a <strong className="text-yellow-400">-3 XP</strong> penalty —
                  changing your mind has a cost in real systems too.
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={confirmSwitch}
                className="flex-1 bg-yellow-600/30 hover:bg-yellow-600/50 border border-yellow-500/40 text-yellow-200 text-sm py-1.5 rounded-lg transition-colors"
              >
                Switch anyway (-3 XP)
              </button>
              <button
                onClick={() => setShowSwitchWarning(false)}
                className="flex-1 bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-sm py-1.5 rounded-lg transition-colors"
              >
                Keep current
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
