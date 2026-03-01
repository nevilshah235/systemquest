/**
 * lldTypes.ts — Shared TypeScript interfaces for the interactive LLD builder.
 *
 * These mirror the server-side types in LLDScoringService.ts.
 * The JSONB config stored in missions.lldConfig drives all builder behaviour.
 */

// ── Field & Entity Types ───────────────────────────────────────────────────────

export type FieldType =
  | 'uuid' | 'string' | 'integer' | 'bigint' | 'float'
  | 'boolean' | 'timestamp' | 'text' | 'jsonb' | 'enum' | 'fk';

export interface EntityField {
  name: string;
  type: FieldType;
  isPrimaryKey?: boolean;
  isRequired?: boolean;
  /** enum values when type === 'enum' */
  enumValues?: string[];
  /** target entity name when type === 'fk' */
  references?: string;
  hasIndex?: boolean;
}

export interface EntityCard {
  id: string;
  name: string;
  fields: EntityField[];
  /** Canvas position for @xyflow/react node */
  position: { x: number; y: number };
  /** True if pre-seeded from mission config */
  isSeeded: boolean;
}

export interface EntityRelationship {
  fromEntity: string;
  toEntity: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  label?: string;
}

// ── Architectural Decision Types ──────────────────────────────────────────────

export interface ArchDecisionOption {
  id: string;
  label: string;
  description: string;
  icon?: string;
}

export interface ArchDecisionCategory {
  id: string;
  label: string;
  options: ArchDecisionOption[];
  /** If set, only this option scores full marks */
  correctOption?: string;
}

// ── API Contract Types ─────────────────────────────────────────────────────────

export type ApiStyle = 'rest' | 'graphql' | 'grpc';

export type SchemaShape = Record<string, 'string' | 'number' | 'boolean' | 'string[]' | SchemaShape>;

export interface RestEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  requestBody?: SchemaShape;
  responseShape: SchemaShape;
  statusCodes: number[];
  headers?: Record<string, string>;
  paginationType?: 'cursor' | 'offset' | 'none';
}

export interface GraphQLOperation {
  id: string;
  type: 'query' | 'mutation' | 'subscription';
  name: string;
  args?: SchemaShape;
  returnType: SchemaShape;
}

// ── Mission Config Types ───────────────────────────────────────────────────────

export interface ScoringWeights {
  archDecisions: number;  // e.g. 40
  schema: number;         // e.g. 25
  apiContracts: number;   // e.g. 35
}

export interface PenaltyRule {
  trigger: string;
  xpDeduction: number;
  message: string;
}

export interface SeedEntity {
  name: string;
  fields: EntityField[];
  locked?: boolean;
}

export interface LLDMissionConfig {
  allowedDecisions: ArchDecisionCategory[];
  seedEntities: SeedEntity[];
  forcedDbType?: 'sql' | 'nosql';
  defaultApiStyle?: ApiStyle;
  scoringWeights: ScoringWeights;
  penaltyRules: PenaltyRule[];
  /** Maximum total XP penalty per submission (default: 20) */
  penaltyCap: number;
}

// ── Builder State Types ────────────────────────────────────────────────────────

export interface AppliedPenalty {
  ruleId: string;
  xpDeduction: number;
  message: string;
  timestamp: number;
}

export interface ValidationError {
  section: 'archDecisions' | 'schema' | 'apiContracts';
  entityOrEndpoint?: string;
  field?: string;
  message: string;
}

export interface XPHint {
  id: string;
  message: string;
  xp: number;
  type: 'reward' | 'penalty';
  timestamp: number;
}

export interface LLDBuilderState {
  config: LLDMissionConfig | null;
  archDecisions: Record<string, string>;         // categoryId → selectedOptionId
  dbType: 'sql' | 'nosql' | null;
  dbTypeSwitched: boolean;                       // true if user switched type mid-design
  entities: EntityCard[];
  relationships: EntityRelationship[];
  apiStyle: ApiStyle | null;
  restEndpoints: RestEndpoint[];
  graphqlOperations: GraphQLOperation[];
  xpDelta: number;                               // running XP delta (rewards - penalties, capped)
  pendingHints: XPHint[];                        // hints awaiting display
  pendingPenalties: AppliedPenalty[];
  validationErrors: ValidationError[];
  submittedWithWarnings: boolean;
  isDirty: boolean;
}

// ── API Response Types ────────────────────────────────────────────────────────

export interface LLDScoreBreakdown {
  archDecisions: { earned: number; max: number };
  schema: { earned: number; max: number };
  apiContracts: { earned: number; max: number };
}

export interface LLDScoreResponse {
  totalXP: number;
  breakdown: LLDScoreBreakdown;
  penaltiesApplied: AppliedPenalty[];
  netPenalty: number;
  hints: string[];
  completed: boolean;
  score: number;
  xpEarned: number;
  feedback: Array<{ type: 'success' | 'warning' | 'error'; dimension: string; message: string }>;
}

export interface LLDApiResponse {
  missionSlug: string;
  missionTitle: string;
  hldCompleted: boolean;
  lldContent: { prompt: string; keyEntities: string[]; apiHints: string[] } | null;
  lldConfig: LLDMissionConfig | null;
  previousAttempt: {
    classDesign: string;
    apiContracts: string;
    dataSchema: string;
    lldState: Partial<LLDBuilderState> | null;
    score: number;
    feedback: Array<{ type: string; dimension: string; message: string }>;
  } | null;
}
