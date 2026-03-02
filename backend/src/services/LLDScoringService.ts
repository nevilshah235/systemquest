/**
 * LLDScoringService — server-side scoring for the interactive LLD builder.
 *
 * Replaces the old pattern-matching lldScorer.ts for structured submissions.
 * Backward-compatible: lldScorer.ts is retained for legacy textarea submissions.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EntityField {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isRequired?: boolean;
  references?: string;
  hasIndex?: boolean;
  enumValues?: string[];
}

export interface EntityCard {
  id: string;
  name: string;
  fields: EntityField[];
  isSeeded: boolean;
  position: { x: number; y: number };
}

export interface EntityRelationship {
  fromEntity: string;
  toEntity: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  label?: string;
}

export interface RestEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  requestBody?: Record<string, unknown>;
  responseShape: Record<string, unknown>;
  statusCodes: number[];
  headers?: Record<string, string>;
  paginationType?: 'cursor' | 'offset' | 'none';
}

export interface GraphQLOperation {
  type: 'query' | 'mutation' | 'subscription';
  name: string;
  args?: Record<string, unknown>;
  returnType: Record<string, unknown>;
}

export interface AppliedPenalty {
  ruleId: string;
  xpDeduction: number;
  message: string;
  timestamp: number;
}

export interface PenaltyRule {
  trigger: string;
  xpDeduction: number;
  message: string;
}

export interface ScoringWeights {
  archDecisions: number;
  schema: number;
  apiContracts: number;
  /** Optional — omit to skip performance scoring for this mission */
  performance?: number;
  /** Optional — omit to skip security scoring for this mission */
  security?: number;
}

export interface PerformanceConfig {
  /** Arch decision keys where any non-'none' selection earns credit (e.g. 'caching', 'cdn') */
  beneficialPatterns?: string[];
  /** Entity names where at least one index is expected on a non-PK field */
  indexBeneficialEntities?: string[];
  /** Path substrings for endpoints that should use async pattern (HTTP 202) */
  asyncRecommendedFor?: string[];
}

export interface SecurityPatterns {
  /** True if this mission's APIs require auth headers on protected routes */
  requiresAuth: boolean;
  /** Field name substrings flagged as sensitive (default: password, secret, api_key) */
  sensitiveFieldNames?: string[];
  /** Path substrings that must carry an Authorization header */
  protectedEndpointPatterns?: string[];
}

export interface ArchDecisionCategory {
  id: string;
  label: string;
  options: Array<{ id: string; label: string; description: string; icon?: string }>;
  correctOption?: string;
}

export interface LLDMissionConfig {
  allowedDecisions: ArchDecisionCategory[];
  seedEntities: Array<{ name: string; fields: EntityField[]; locked?: boolean }>;
  forcedDbType?: 'sql' | 'nosql';
  defaultApiStyle?: 'rest' | 'graphql' | 'grpc';
  scoringWeights: ScoringWeights;
  penaltyRules: PenaltyRule[];
  penaltyCap: number;
  /** Present → performance dimension is scored */
  performanceConfig?: PerformanceConfig;
  /** Present → security dimension is scored */
  securityPatterns?: SecurityPatterns;
}

export interface LLDBuilderSubmission {
  archDecisions: Record<string, string>;
  dbType: 'sql' | 'nosql' | null;
  entities: EntityCard[];
  relationships: EntityRelationship[];
  apiStyle: 'rest' | 'graphql' | 'grpc' | null;
  restEndpoints: RestEndpoint[];
  graphqlOperations: GraphQLOperation[];
  dbTypeSwitched?: boolean;       // flag set when user switches DB type mid-design
  submittedWithWarnings?: boolean; // flag set when user ignores validation errors
}

export interface AttemptRecord {
  attempt: number;
  score: number;
  xpEarned: number;
  timestamp: number;
}

export interface LLDScoreResponse {
  totalXP: number;
  breakdown: {
    archDecisions: { earned: number; max: number };
    schema: { earned: number; max: number };
    apiContracts: { earned: number; max: number };
    performance?: { earned: number; max: number };
    security?: { earned: number; max: number };
  };
  penaltiesApplied: AppliedPenalty[];
  netPenalty: number;
  hints: string[];
  completed: boolean;
  score: number; // 0–100 for backward compat
  xpEarned: number;
  feedback: Array<{ type: 'success' | 'warning' | 'error'; dimension: string; message: string }>;
  /** Attempt tracking — undefined on first submission */
  previousScore?: number;
  scoreDelta?: number;
  attemptNumber?: number;
  attemptHistory?: AttemptRecord[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MAX_LLD_XP = 150;

function pct(earned: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((earned / max) * 100);
}

// ── Arch Decisions Scorer ─────────────────────────────────────────────────────

function scoreArchDecisions(
  decisions: Record<string, string>,
  config: LLDMissionConfig,
): { earned: number; max: number; hints: string[] } {
  const { allowedDecisions, scoringWeights } = config;
  const max = scoringWeights.archDecisions;
  const hints: string[] = [];

  if (allowedDecisions.length === 0) return { earned: max, max, hints };

  // Per-category weight (spread evenly)
  const perCategory = max / allowedDecisions.length;
  let earned = 0;

  for (const category of allowedDecisions) {
    const selected = decisions[category.id];
    if (!selected) {
      hints.push(`💡 No decision made for "${category.label}" — this is required for this mission.`);
      continue;
    }

    if (category.correctOption) {
      if (selected === category.correctOption) {
        earned += perCategory;
        hints.push(`✅ Great choice for ${category.label}!`);
      } else {
        // Partial credit (50%) for making any decision
        earned += perCategory * 0.5;
        hints.push(`⚠️ Reconsidering "${category.label}" — check if your choice fits this mission's constraints.`);
      }
    } else {
      // No required answer — full credit for any selection
      earned += perCategory;
    }
  }

  return { earned: Math.round(earned), max, hints };
}

// ── Schema Scorer ─────────────────────────────────────────────────────────────

function scoreSchema(
  entities: EntityCard[],
  relationships: EntityRelationship[],
  config: LLDMissionConfig,
): { earned: number; max: number; hints: string[] } {
  const max = config.scoringWeights.schema;
  const hints: string[] = [];

  if (entities.length === 0) {
    hints.push('❌ No entities defined — add at least one entity to your schema.');
    return { earned: 0, max, hints };
  }

  let earned = 0;
  const quarterMax = max / 4;

  // 1/4: Has entities
  earned += quarterMax;

  // 1/4: All entities have a primary key
  const missingPK = entities.filter(e => !e.fields.some(f => f.isPrimaryKey));
  if (missingPK.length === 0) {
    earned += quarterMax;
    hints.push('✅ All entities have primary keys defined.');
  } else {
    hints.push(`⚠️ ${missingPK.map(e => e.name).join(', ')} ${missingPK.length === 1 ? 'is' : 'are'} missing a primary key.`);
  }

  // 1/4: Has relationships
  if (relationships.length > 0) {
    earned += quarterMax;
    hints.push('✅ Entity relationships defined.');
  } else if (entities.length > 1) {
    hints.push('💡 Consider defining relationships between entities (e.g. User → Post one-to-many).');
  }

  // 1/4: Has at least one index
  const hasIndex = entities.some(e => e.fields.some(f => f.hasIndex));
  if (hasIndex) {
    earned += quarterMax;
    hints.push('🎯 Smart indexing! Indexes speed up read queries.');
  } else {
    hints.push('💡 Add indexes on frequently queried fields to improve read performance.');
  }

  return { earned: Math.round(earned), max, hints };
}

// ── API Contracts Scorer ──────────────────────────────────────────────────────

function scoreApiContracts(
  endpoints: RestEndpoint[],
  operations: GraphQLOperation[],
  apiStyle: string | null,
  archDecisions: Record<string, string>,
  config: LLDMissionConfig,
): { earned: number; max: number; hints: string[] } {
  const max = config.scoringWeights.apiContracts;
  const hints: string[] = [];
  const items = apiStyle === 'graphql' ? operations : endpoints;

  if (items.length === 0) {
    hints.push('❌ No API contracts defined — add at least one endpoint or operation.');
    return { earned: 0, max, hints };
  }

  let earned = 0;
  const quarterMax = max / 4;

  // 1/4: Has endpoints
  earned += quarterMax;

  // 1/4: Has error responses (REST: 4xx/5xx status codes; GraphQL: error type)
  if (apiStyle === 'rest') {
    const hasErrorCodes = (endpoints as RestEndpoint[]).some(ep =>
      ep.statusCodes.some(code => code >= 400),
    );
    if (hasErrorCodes) {
      earned += quarterMax;
      hints.push('✅ Error responses (4xx/5xx) defined — important for production APIs.');
    } else {
      hints.push('⚠️ Define at least one error response (4xx/5xx) for your endpoints.');
    }
  } else {
    // GraphQL — give benefit of the doubt
    earned += quarterMax;
  }

  // 1/4: Auth headers (if auth decision is JWT/OAuth)
  const authDecision = archDecisions['auth'];
  if (authDecision && authDecision !== 'none') {
    const hasAuthHeader = (endpoints as RestEndpoint[]).some(ep =>
      ep.headers && Object.keys(ep.headers).some(h => h.toLowerCase().includes('authorization')),
    );
    if (hasAuthHeader || apiStyle === 'graphql') {
      earned += quarterMax;
      hints.push('✅ Authorization headers included — matches your auth architecture decision.');
    } else {
      hints.push('💡 Add Authorization headers to protected endpoints (you selected ' + authDecision + ' auth).');
    }
  } else {
    earned += quarterMax; // no auth required
  }

  // 1/4: Pagination for GET endpoints
  if (apiStyle === 'rest') {
    const getEndpoints = (endpoints as RestEndpoint[]).filter(ep => ep.method === 'GET');
    if (getEndpoints.length > 0) {
      const hasCursorPagination = getEndpoints.some(ep => ep.paginationType === 'cursor');
      const hasPagination = getEndpoints.some(ep => ep.paginationType && ep.paginationType !== 'none');
      if (hasCursorPagination) {
        earned += quarterMax;
        hints.push('🎯 Cursor pagination — scales better than offset! +' + Math.round(quarterMax) + ' XP');
      } else if (hasPagination) {
        earned += quarterMax * 0.7;
        hints.push('✅ Pagination defined. Consider cursor-based for better scalability.');
      } else {
        hints.push('💡 Add pagination to your GET endpoints — essential for large datasets.');
      }
    } else {
      earned += quarterMax;
    }
  } else {
    earned += quarterMax;
  }

  return { earned: Math.round(earned), max, hints };
}

// ── Performance Scorer ────────────────────────────────────────────────────────

function scorePerformance(
  submission: LLDBuilderSubmission,
  config: LLDMissionConfig,
): { earned: number; max: number; hints: string[] } | null {
  const { performanceConfig, scoringWeights } = config;
  const max = scoringWeights.performance;
  if (!performanceConfig || !max) return null;

  const hints: string[] = [];
  let earned = 0;
  const thirdMax = max / 3;

  // 1/3: Beneficial arch patterns selected (caching, CDN, read replica, etc.)
  const beneficial = performanceConfig.beneficialPatterns ?? [];
  const selectedBeneficial = beneficial.filter(
    p => submission.archDecisions[p] && submission.archDecisions[p] !== 'none',
  );
  if (selectedBeneficial.length > 0) {
    earned += thirdMax;
    hints.push(`✅ Performance patterns applied: ${selectedBeneficial.join(', ')} — good for throughput.`);
  } else if (beneficial.length > 0) {
    hints.push(`⚠️ Consider adding performance patterns (${beneficial.join(', ')}) to meet this mission's load constraints.`);
  } else {
    earned += thirdMax;
  }

  // 1/3: Indexes on high-traffic entities
  const indexEntities = performanceConfig.indexBeneficialEntities ?? [];
  if (indexEntities.length > 0) {
    const indexed = indexEntities.filter(name => {
      const entity = submission.entities.find(e => e.name.toLowerCase() === name.toLowerCase());
      return entity && entity.fields.some(f => f.hasIndex && !f.isPrimaryKey);
    });
    if (indexed.length >= Math.ceil(indexEntities.length / 2)) {
      earned += thirdMax;
      hints.push(`✅ Indexes on high-traffic entities (${indexed.join(', ')}) — reads will be fast.`);
    } else {
      hints.push(`💡 Add indexes on high-read entities: ${indexEntities.join(', ')} to improve query performance.`);
    }
  } else {
    earned += thirdMax;
  }

  // 1/3: Async pattern for long-running operations (HTTP 202 Accepted)
  const asyncOps = performanceConfig.asyncRecommendedFor ?? [];
  if (asyncOps.length > 0 && submission.apiStyle === 'rest') {
    const hasAsync = submission.restEndpoints.some(ep =>
      asyncOps.some(op => ep.path.toLowerCase().includes(op.toLowerCase())) &&
      ep.statusCodes.includes(202),
    );
    if (hasAsync) {
      earned += thirdMax;
      hints.push(`✅ Async pattern (202 Accepted) used for long-running operations — frees threads and improves throughput.`);
    } else {
      hints.push(`⚠️ Consider async (HTTP 202) for long-running operations: ${asyncOps.join(', ')}. Synchronous long calls block threads and increase latency.`);
    }
  } else {
    earned += thirdMax;
  }

  return { earned: Math.round(earned), max, hints };
}

// ── Security Scorer ───────────────────────────────────────────────────────────

function scoreSecurity(
  submission: LLDBuilderSubmission,
  config: LLDMissionConfig,
): { earned: number; max: number; hints: string[] } | null {
  const { securityPatterns, scoringWeights } = config;
  const max = scoringWeights.security;
  if (!securityPatterns || !max) return null;

  const hints: string[] = [];
  let earned = 0;
  const halfMax = max / 2;

  // 1/2: No plaintext sensitive fields (password, secret, api_key, etc.)
  const sensitiveNames = securityPatterns.sensitiveFieldNames ?? ['password', 'secret', 'api_key', 'token'];
  const plaintextFields: string[] = [];
  for (const entity of submission.entities) {
    for (const field of entity.fields) {
      const nameLower = field.name.toLowerCase();
      if (sensitiveNames.some(s => nameLower.includes(s)) && field.type === 'string') {
        plaintextFields.push(`${entity.name}.${field.name}`);
      }
    }
  }
  if (plaintextFields.length === 0) {
    earned += halfMax;
    hints.push(`✅ No plaintext sensitive fields — good security hygiene.`);
  } else {
    hints.push(
      `⚠️ Sensitive fields typed as plain string: ${plaintextFields.join(', ')}. ` +
      `Use a hashed type or omit from response schemas. ` +
      `(Educational: storing passwords as plaintext is a critical vulnerability — always hash with bcrypt/argon2.)`,
    );
  }

  // 1/2: Auth headers on protected endpoints
  if (securityPatterns.requiresAuth && submission.apiStyle === 'rest') {
    const protectedPatterns = securityPatterns.protectedEndpointPatterns ?? [];
    if (protectedPatterns.length > 0) {
      const unprotected = submission.restEndpoints.filter(ep =>
        protectedPatterns.some(p => ep.path.includes(p)) &&
        !(ep.headers && Object.keys(ep.headers).some(h => h.toLowerCase().includes('authorization'))),
      );
      if (unprotected.length === 0) {
        earned += halfMax;
        hints.push(`✅ Authorization headers present on all protected endpoints.`);
      } else {
        hints.push(
          `⚠️ Missing auth headers on: ${unprotected.map(e => e.path).join(', ')}. ` +
          `(Educational: protected endpoints must validate JWT/OAuth tokens — never trust client identity without a verified token.)`,
        );
      }
    } else {
      const hasAnyAuth = submission.restEndpoints.some(ep =>
        ep.headers && Object.keys(ep.headers).some(h => h.toLowerCase().includes('authorization')),
      );
      if (hasAnyAuth) {
        earned += halfMax;
        hints.push(`✅ Authorization headers included on API endpoints.`);
      } else {
        hints.push(
          `⚠️ This mission requires authentication — add Authorization headers to protected endpoints. ` +
          `(Educational: every protected route must validate the caller's identity via a token.)`,
        );
      }
    }
  } else {
    earned += halfMax; // no auth required or not REST
  }

  return { earned: Math.round(earned), max, hints };
}

// ── Penalty Evaluator ─────────────────────────────────────────────────────────

export function evaluatePenalties(
  submission: LLDBuilderSubmission,
  rules: PenaltyRule[],
  cap: number,
): { penalties: AppliedPenalty[]; netPenalty: number } {
  const applied: AppliedPenalty[] = [];
  let total = 0;
  const now = Date.now();

  for (const rule of rules) {
    if (total >= cap) break; // already at cap — no more penalties

    let triggered = false;

    switch (rule.trigger) {
      case 'no_caching_selected': {
        // Triggered if caching is an allowed decision but learner didn't select any caching option
        const hasCachingDecision = submission.archDecisions['caching'];
        if (!hasCachingDecision) triggered = true;
        break;
      }
      case 'over_engineered_queue': {
        // Triggered if Kafka/RabbitMQ selected but no explicit scale justification
        const queueDecision = submission.archDecisions['message_queue'];
        if (queueDecision && queueDecision !== 'none') {
          // Heuristic: if fewer than 3 entities, it's likely over-engineered
          if (submission.entities.length < 3) triggered = true;
        }
        break;
      }
      case 'db_type_switched_mid_design': {
        if (submission.dbTypeSwitched === true) triggered = true;
        break;
      }
      case 'submitted_with_unresolved_warnings': {
        if (submission.submittedWithWarnings === true) triggered = true;
        break;
      }
      case 'nosql_for_acid_mission': {
        if (submission.dbType === 'nosql') triggered = true;
        break;
      }
      default:
        break;
    }

    if (triggered) {
      const deduction = Math.min(rule.xpDeduction, cap - total);
      applied.push({ ruleId: rule.trigger, xpDeduction: deduction, message: rule.message, timestamp: now });
      total += deduction;
    }
  }

  return { penalties: applied, netPenalty: Math.min(total, cap) };
}

// ── Main Scorer ───────────────────────────────────────────────────────────────

export async function scoreLLDSubmission(
  submission: LLDBuilderSubmission,
  config: LLDMissionConfig,
): Promise<LLDScoreResponse> {
  const archResult    = scoreArchDecisions(submission.archDecisions, config);
  const schemaResult  = scoreSchema(submission.entities, submission.relationships, config);
  const apiResult     = scoreApiContracts(
    submission.restEndpoints,
    submission.graphqlOperations,
    submission.apiStyle,
    submission.archDecisions,
    config,
  );
  const perfResult = scorePerformance(submission, config);   // null if not configured
  const secResult  = scoreSecurity(submission, config);       // null if not configured

  // Weighted score — base weights always 100, new dimensions adjust proportionally
  const totalWeights =
    config.scoringWeights.archDecisions +
    config.scoringWeights.schema +
    config.scoringWeights.apiContracts +
    (perfResult ? (config.scoringWeights.performance ?? 0) : 0) +
    (secResult  ? (config.scoringWeights.security    ?? 0) : 0);

  const weightedSum =
    pct(archResult.earned,   archResult.max)   * config.scoringWeights.archDecisions +
    pct(schemaResult.earned, schemaResult.max) * config.scoringWeights.schema +
    pct(apiResult.earned,    apiResult.max)    * config.scoringWeights.apiContracts +
    (perfResult ? pct(perfResult.earned, perfResult.max) * (config.scoringWeights.performance ?? 0) : 0) +
    (secResult  ? pct(secResult.earned,  secResult.max)  * (config.scoringWeights.security    ?? 0) : 0);

  const rawScore = Math.round(weightedSum / (totalWeights || 100));

  // Evaluate penalties
  const { penalties, netPenalty } = evaluatePenalties(submission, config.penaltyRules, config.penaltyCap);

  const finalScore = Math.max(0, rawScore);
  const baseXP     = Math.round((finalScore / 100) * MAX_LLD_XP);
  const totalXP    = Math.max(0, baseXP - netPenalty);
  const xpEarned   = totalXP;

  const allHints = [
    ...archResult.hints,
    ...schemaResult.hints,
    ...apiResult.hints,
    ...(perfResult?.hints ?? []),
    ...(secResult?.hints  ?? []),
  ];
  const completed = finalScore >= 60;

  const feedback: LLDScoreResponse['feedback'] = allHints.map(h => ({
    type: h.startsWith('✅') ? 'success' : h.startsWith('❌') ? 'error' : 'warning',
    dimension: 'overall',
    message: h,
  }));

  if (penalties.length > 0) {
    penalties.forEach(p =>
      feedback.push({ type: 'error', dimension: 'penalty', message: p.message }),
    );
  }
  if (completed) {
    feedback.push({ type: 'success', dimension: 'overall', message: '🎉 LLD complete! Your design is production-quality.' });
  }

  return {
    totalXP,
    breakdown: {
      archDecisions: { earned: archResult.earned,   max: archResult.max   },
      schema:         { earned: schemaResult.earned, max: schemaResult.max },
      apiContracts:   { earned: apiResult.earned,    max: apiResult.max    },
      ...(perfResult ? { performance: { earned: perfResult.earned, max: perfResult.max } } : {}),
      ...(secResult  ? { security:    { earned: secResult.earned,  max: secResult.max  } } : {}),
    },
    penaltiesApplied: penalties,
    netPenalty,
    hints: allHints,
    completed,
    score: finalScore,
    xpEarned,
    feedback,
  };
}
