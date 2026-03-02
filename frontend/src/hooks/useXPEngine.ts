/**
 * useXPEngine — watches LLD builder state and dispatches XP reward hints.
 *
 * Fires inline XP hints for positive design decisions (indexing, cursor pagination, etc.)
 * Penalty application is handled in the store (switchDbType, submit flow).
 * Enforces penalty cap defined in LLDMissionConfig.penaltyCap.
 */

import { useEffect, useRef } from 'react';
import { useLLDBuilderStore } from '../stores/lldBuilderStore';

/**
 * Tracks which reward events have already fired so we don't re-trigger them.
 * Uses a Set of event keys (e.g. "index:User.id").
 */
export function useXPEngine() {
  const store = useLLDBuilderStore();
  const firedRef = useRef(new Set<string>());

  const dispatchReward = (key: string, message: string, xp: number) => {
    if (!firedRef.current.has(key)) {
      firedRef.current.add(key);
      store.dispatchXPHint(message, xp, 'reward');
    }
  };

  // ── Watch: Entity indexing ─────────────────────────────────────────────────
  useEffect(() => {
    store.entities.forEach(entity => {
      entity.fields.forEach(field => {
        if (field.hasIndex) {
          dispatchReward(
            `index:${entity.name}.${field.name}`,
            `🎯 Smart indexing on ${entity.name}.${field.name}! +5 XP — indexes speed up read queries`,
            5,
          );
        }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.entities]);

  // ── Watch: Relationships defined ──────────────────────────────────────────
  useEffect(() => {
    if (store.relationships.length > 0) {
      dispatchReward(
        'first_relationship',
        '🎯 Entity relationships defined! +5 XP — good relational modelling.',
        5,
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.relationships.length]);

  // ── Watch: Cursor pagination ──────────────────────────────────────────────
  useEffect(() => {
    const hasCursor = store.restEndpoints.some(ep => ep.paginationType === 'cursor');
    if (hasCursor) {
      dispatchReward(
        'cursor_pagination',
        '🎯 Cursor pagination — scales better than offset! +10 XP',
        10,
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.restEndpoints]);

  // ── Watch: Error responses on APIs ───────────────────────────────────────
  useEffect(() => {
    const hasErrorCodes = store.restEndpoints.some(ep =>
      ep.statusCodes.some(c => c >= 400),
    );
    if (hasErrorCodes) {
      dispatchReward(
        'error_responses',
        '✅ Error responses defined! +5 XP — production APIs always handle failures.',
        5,
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.restEndpoints]);

  // ── Watch: Arch decisions completed ──────────────────────────────────────
  useEffect(() => {
    const config = store.config;
    if (!config || config.allowedDecisions.length === 0) return;

    const allDecided = config.allowedDecisions.every(
      cat => store.archDecisions[cat.id],
    );
    if (allDecided) {
      dispatchReward(
        'all_arch_decisions',
        '🎯 All architectural decisions made! +10 XP',
        10,
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.archDecisions]);

  // ── Watch: FK relationships in schema ─────────────────────────────────────
  useEffect(() => {
    const hasFk = store.entities.some(e => e.fields.some(f => f.type === 'fk' && f.references));
    if (hasFk) {
      dispatchReward(
        'first_fk',
        '✅ Foreign key relationships added! +5 XP — referential integrity is key.',
        5,
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.entities]);

  return {
    currentXPDelta: store.xpDelta,
    totalPenalty: store.pendingPenalties.reduce((s, p) => s + p.xpDeduction, 0),
  };
}
