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
  /** Optional — if absent this dimension is skipped for this mission */
  performance?: number;
  /** Optional — if absent this dimension is skipped for this mission */
  security?: number;
}

export interface PerformanceConfig {
  /** Arch decision keys where any non-'none' selection earns performance credit */
  beneficialPatterns?: string[];
  /** Entity names where at least one non-PK index is expected */
  indexBeneficialEntities?: string[];
  /** Path substrings for endpoints that should use async pattern (HTTP 202) */
  asyncRecommendedFor?: string[];
}

export interface SecurityPatterns {
  requiresAuth: boolean;
  /** Field name substrings treated as sensitive (default: password, secret, api_key, token) */
  sensitiveFieldNames?: string[];
  /** Path substrings that must carry an Authorization header */
  protectedEndpointPatterns?: string[];
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
  /** Present → performance dimension scored */
  performanceConfig?: PerformanceConfig;
  /** Present → security dimension scored */
  securityPatterns?: SecurityPatterns;
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

export interface AttemptRecord {
  attempt: number;
  score: number;
  xpEarned: number;
  timestamp: number;
}

export interface LLDScoreBreakdown {
  archDecisions: { earned: number; max: number };
  schema: { earned: number; max: number };
  apiContracts: { earned: number; max: number };
  performance?: { earned: number; max: number };
  security?: { earned: number; max: number };
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
  /** Attempt tracking */
  previousScore?: number;
  scoreDelta?: number;
  attemptNumber?: number;
  attemptHistory?: AttemptRecord[];
  /** Actual XP credited to the user (delta above previous best) — use to sync authStore */
  incrementalXpAwarded?: number;
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
