/**
 * lldBuilderStore.ts — Zustand store for the interactive LLD builder.
 *
 * Holds the full builder state: arch decisions, entities, schema, API contracts,
 * XP delta, penalties, and validation errors. All sub-components subscribe to
 * relevant slices. Arch decision changes cascade downstream automatically.
 */

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  LLDBuilderState,
  LLDMissionConfig,
  EntityCard,
  EntityField,
  EntityRelationship,
  RestEndpoint,
  GraphQLOperation,
  ValidationError,
  XPHint,
  AppliedPenalty,
  ApiStyle,
  SeedEntity,
} from '../data/lldTypes';

// nanoid shim — use crypto.randomUUID if available, else simple fallback
function uid(): string {
  try {
    return (crypto as unknown as { randomUUID: () => string }).randomUUID();
  } catch {
    return Math.random().toString(36).slice(2, 11);
  }
}

// ── Initial State ─────────────────────────────────────────────────────────────

const INITIAL_STATE: LLDBuilderState = {
  config: null,
  archDecisions: {},
  dbType: null,
  dbTypeSwitched: false,
  entities: [],
  relationships: [],
  apiStyle: null,
  restEndpoints: [],
  graphqlOperations: [],
  xpDelta: 0,
  pendingHints: [],
  pendingPenalties: [],
  validationErrors: [],
  submittedWithWarnings: false,
  isDirty: false,
};

// ── Store Actions Interface ───────────────────────────────────────────────────

interface LLDBuilderActions {
  /** Initialise the store with mission config and optionally restore previous state */
  initBuilder: (config: LLDMissionConfig, previousState?: Partial<LLDBuilderState>) => void;
  /** Reset the store to initial state */
  resetBuilder: () => void;

  // ── Arch Decisions ─────────────────────────────────────────────────────────
  /** Set a decision for a category; cascades to schema + API contract sections */
  setArchDecision: (categoryId: string, optionId: string) => void;

  // ── DB Type ────────────────────────────────────────────────────────────────
  /** Switch DB type; queues -3 XP penalty if entities already exist */
  switchDbType: (dbType: 'sql' | 'nosql') => string[];

  // ── Entities ───────────────────────────────────────────────────────────────
  upsertEntity: (entity: EntityCard) => void;
  removeEntity: (entityId: string) => void;
  addFieldToEntity: (entityId: string, field: EntityField) => void;
  updateField: (entityId: string, fieldName: string, updates: Partial<EntityField>) => void;
  removeField: (entityId: string, fieldName: string) => void;
  addRelationship: (rel: EntityRelationship) => void;
  removeRelationship: (fromEntity: string, toEntity: string) => void;

  // ── API Contracts ─────────────────────────────────────────────────────────
  setApiStyle: (style: ApiStyle) => void;
  upsertRestEndpoint: (endpoint: RestEndpoint) => void;
  removeRestEndpoint: (endpointId: string) => void;
  upsertGraphQLOperation: (op: GraphQLOperation) => void;
  removeGraphQLOperation: (opId: string) => void;

  // ── XP Engine ─────────────────────────────────────────────────────────────
  dispatchXPHint: (message: string, xp: number, type: 'reward' | 'penalty') => void;
  dismissHint: (hintId: string) => void;
  applyPenalty: (penalty: AppliedPenalty) => void;

  // ── Validation ────────────────────────────────────────────────────────────
  setValidationErrors: (errors: ValidationError[]) => void;
  setSubmittedWithWarnings: (val: boolean) => void;
  markClean: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useLLDBuilderStore = create<LLDBuilderState & LLDBuilderActions>((set, get) => ({
  ...INITIAL_STATE,

  // ── Init / Reset ───────────────────────────────────────────────────────────

  initBuilder: (config, previousState) => {
    // Build seed entities from config
    const seededEntities: EntityCard[] = (config.seedEntities ?? []).map(
      (seed: SeedEntity, idx: number): EntityCard => ({
        id: uid(),
        name: seed.name,
        fields: seed.fields ?? [],
        isSeeded: true,
        position: { x: 50 + idx * 240, y: 80 },
      }),
    );

    // Restore previous state if available, otherwise use seeds
    const entities = previousState?.entities?.length
      ? previousState.entities
      : seededEntities;

    set({
      ...INITIAL_STATE,
      config,
      entities,
      archDecisions: previousState?.archDecisions ?? {},
      dbType: previousState?.dbType ?? config.forcedDbType ?? null,
      apiStyle: previousState?.apiStyle ?? config.defaultApiStyle ?? null,
      restEndpoints: previousState?.restEndpoints ?? [],
      graphqlOperations: previousState?.graphqlOperations ?? [],
      relationships: previousState?.relationships ?? [],
      isDirty: false,
    });
  },

  resetBuilder: () => set({ ...INITIAL_STATE }),

  // ── Arch Decisions ─────────────────────────────────────────────────────────

  setArchDecision: (categoryId, optionId) => {
    set(state => {
      const next = { ...state.archDecisions, [categoryId]: optionId };

      // Cascade: if the 'api_style' category changed, update apiStyle
      let apiStyle = state.apiStyle;
      if (categoryId === 'api_style') {
        apiStyle = optionId as ApiStyle;
      }

      // Cascade: DB type decision
      let dbType = state.dbType;
      if (categoryId === 'db_type') {
        dbType = optionId as 'sql' | 'nosql';
      }

      return {
        archDecisions: next,
        apiStyle,
        dbType,
        isDirty: true,
      };
    });
  },

  // ── DB Type ────────────────────────────────────────────────────────────────

  switchDbType: (dbType) => {
    const state = get();
    const diff: string[] = [];

    if (state.dbType !== null && state.dbType !== dbType && state.entities.length > 0) {
      // Existing entities: show migration diff hints
      state.entities.forEach(e => {
        if (dbType === 'nosql') {
          diff.push(`${e.name} → document collection`);
        } else {
          diff.push(`${e.name} → relational table`);
        }
      });

      // Queue the mid-design switch penalty (-3 XP)
      const penalty: AppliedPenalty = {
        ruleId: 'db_type_switched_mid_design',
        xpDeduction: 3,
        message: 'Changing your mind has a cost in real systems too 💡 -3 XP',
        timestamp: Date.now(),
      };
      get().applyPenalty(penalty);
      get().dispatchXPHint(penalty.message, 3, 'penalty');
    }

    set({ dbType, dbTypeSwitched: state.dbType !== null && state.dbType !== dbType, isDirty: true });
    return diff;
  },

  // ── Entities ───────────────────────────────────────────────────────────────

  upsertEntity: (entity) => {
    set(state => {
      const existing = state.entities.findIndex(e => e.id === entity.id);
      const entities =
        existing >= 0
          ? state.entities.map(e => (e.id === entity.id ? entity : e))
          : [...state.entities, entity];
      return { entities, isDirty: true };
    });
  },

  removeEntity: (entityId) => {
    set(state => {
      const entity = state.entities.find(e => e.id === entityId);
      // Prevent removing locked seed entities
      if (entity?.isSeeded) {
        const config = state.config;
        const seed = config?.seedEntities.find(s => s.name === entity.name);
        if (seed?.locked) return {};
      }
      return {
        entities: state.entities.filter(e => e.id !== entityId),
        relationships: state.relationships.filter(
          r => r.fromEntity !== entity?.name && r.toEntity !== entity?.name,
        ),
        isDirty: true,
      };
    });
  },

  addFieldToEntity: (entityId, field) => {
    set(state => ({
      entities: state.entities.map(e =>
        e.id === entityId ? { ...e, fields: [...e.fields, field] } : e,
      ),
      isDirty: true,
    }));
  },

  updateField: (entityId, fieldName, updates) => {
    set(state => ({
      entities: state.entities.map(e =>
        e.id === entityId
          ? {
              ...e,
              fields: e.fields.map(f => (f.name === fieldName ? { ...f, ...updates } : f)),
            }
          : e,
      ),
      isDirty: true,
    }));
  },

  removeField: (entityId, fieldName) => {
    set(state => ({
      entities: state.entities.map(e =>
        e.id === entityId
          ? { ...e, fields: e.fields.filter(f => f.name !== fieldName) }
          : e,
      ),
      isDirty: true,
    }));
  },

  addRelationship: (rel) => {
    set(state => {
      const duplicate = state.relationships.find(
        r => r.fromEntity === rel.fromEntity && r.toEntity === rel.toEntity,
      );
      if (duplicate) return {};
      return { relationships: [...state.relationships, rel], isDirty: true };
    });
  },

  removeRelationship: (fromEntity, toEntity) => {
    set(state => ({
      relationships: state.relationships.filter(
        r => !(r.fromEntity === fromEntity && r.toEntity === toEntity),
      ),
      isDirty: true,
    }));
  },

  // ── API Contracts ─────────────────────────────────────────────────────────

  setApiStyle: (style) => set({ apiStyle: style, isDirty: true }),

  upsertRestEndpoint: (endpoint) => {
    set(state => {
      const idx = state.restEndpoints.findIndex(e => e.id === endpoint.id);
      const restEndpoints =
        idx >= 0
          ? state.restEndpoints.map(e => (e.id === endpoint.id ? endpoint : e))
          : [...state.restEndpoints, endpoint];
      return { restEndpoints, isDirty: true };
    });
  },

  removeRestEndpoint: (endpointId) => {
    set(state => ({
      restEndpoints: state.restEndpoints.filter(e => e.id !== endpointId),
      isDirty: true,
    }));
  },

  upsertGraphQLOperation: (op) => {
    set(state => {
      const idx = state.graphqlOperations.findIndex(o => o.id === op.id);
      const graphqlOperations =
        idx >= 0
          ? state.graphqlOperations.map(o => (o.id === op.id ? op : o))
          : [...state.graphqlOperations, op];
      return { graphqlOperations, isDirty: true };
    });
  },

  removeGraphQLOperation: (opId) => {
    set(state => ({
      graphqlOperations: state.graphqlOperations.filter(o => o.id !== opId),
      isDirty: true,
    }));
  },

  // ── XP Engine ─────────────────────────────────────────────────────────────

  dispatchXPHint: (message, xp, type) => {
    const hint: XPHint = { id: uid(), message, xp, type, timestamp: Date.now() };
    set(state => ({
      pendingHints: [...state.pendingHints, hint],
      xpDelta: type === 'reward' ? state.xpDelta + xp : state.xpDelta - xp,
    }));
  },

  dismissHint: (hintId) => {
    set(state => ({ pendingHints: state.pendingHints.filter(h => h.id !== hintId) }));
  },

  applyPenalty: (penalty) => {
    set(state => {
      const cap = state.config?.penaltyCap ?? 20;
      const currentTotal = state.pendingPenalties.reduce((s, p) => s + p.xpDeduction, 0);
      if (currentTotal >= cap) return {}; // already at cap
      const effectiveDeduction = Math.min(penalty.xpDeduction, cap - currentTotal);
      return {
        pendingPenalties: [...state.pendingPenalties, { ...penalty, xpDeduction: effectiveDeduction }],
      };
    });
  },

  // ── Validation ────────────────────────────────────────────────────────────

  setValidationErrors: (errors) => set({ validationErrors: errors }),
  setSubmittedWithWarnings: (val) => set({ submittedWithWarnings: val }),
  markClean: () => set({ isDirty: false }),
}));

// ── Derived Selectors ─────────────────────────────────────────────────────────

/** Returns a submission payload ready for POST /api/lld/:slug/score */
export function selectSubmissionPayload(state: LLDBuilderState) {
  return {
    archDecisions: state.archDecisions,
    dbType: state.dbType,
    dbTypeSwitched: state.dbTypeSwitched,
    entities: state.entities,
    relationships: state.relationships,
    apiStyle: state.apiStyle,
    restEndpoints: state.restEndpoints,
    graphqlOperations: state.graphqlOperations,
    submittedWithWarnings: state.submittedWithWarnings,
  };
}
