/**
 * rubricService.ts — Living Rubrics (Phase 4)
 *
 * Two-phase AI evaluation:
 *   Phase A (one-time per mission version): AI generates structured rubric items
 *           from the ideal solution topology + mission requirements.
 *           Rubric is stored in DB as a versioned, content-addressed artifact.
 *
 *   Phase B (per submission): AI evaluates user topology against the frozen rubric
 *           at temperature 0.1 (near-deterministic classification).
 *           Returns per-item pass/fail + reasoning — never modifies rubric weights.
 *
 * ADR-003 / ADR-005 guardrail: deterministic engine owns metric values,
 * rubric service owns topology quality classification only.
 */

import axios from 'axios';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL    = 'meta/llama-3.3-70b-instruct';

// ── Public types ──────────────────────────────────────────────────

export interface RubricItem {
  id: string;
  category: 'structural' | 'requirement';
  /** Short check label ≤10 words, e.g. "LB connected to ≥2 servers" */
  check: string;
  /** One-line explanation of why this matters ≤20 words */
  description: string;
  /** Weight in points; all items sum to 100 */
  weight: number;
}

export interface RubricEvaluationResult {
  itemId: string;
  passed: boolean;
  /** One-sentence reason referencing the actual topology */
  reason: string;
}

export interface RubricScore {
  missionSlug:    string;
  rubricVersion:  string;
  items:          RubricItem[];
  evaluations:    RubricEvaluationResult[];
  /** 0-100 weighted sum of passed items */
  score:          number;
  passedCount:    number;
  totalCount:     number;
}

export interface MissionRequirements {
  latencyMs:    number;
  availability: number;
  throughput:   number;
  budget:       number;
}

/** Type-normalised topology (IDs already resolved to component types) */
export interface SolutionTopology {
  componentTypes: string[];
  connections:    Array<{ from: string; to: string }>;
}

export interface UserArchitecture {
  components:  Array<{ id: string; type: string }>;
  connections: Array<{ from: string; to: string }>;
}

// ── NVIDIA helpers ────────────────────────────────────────────────

async function callNvidiaJSON<T>(
  prompt: string,
  temperature: number,
): Promise<T> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY not configured');

  const res = await axios.post(
    `${NVIDIA_BASE_URL}/chat/completions`,
    {
      model: NVIDIA_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 1024,
      stream: false,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 45000,
    },
  );

  const raw: string = res.data.choices[0].message.content;

  // Extract first JSON array from the response (strips any prose wrapping)
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`No JSON array found in AI response: ${raw.slice(0, 200)}`);
  return JSON.parse(match[0]) as T;
}

// ── Rubric generation (Phase A) ────────────────────────────────────────

function buildGenerationPrompt(
  missionSlug:  string,
  missionTitle: string,
  requirements: MissionRequirements,
  topology:     SolutionTopology,
): string {
  const connLines = topology.connections
    .map((c) => `  ${c.from} → ${c.to}`)
    .join('\n');

  return `You are a system architecture curriculum designer for SystemQuest, a gamified learning platform.

Generate a rubric to evaluate student architectures for the mission "${missionTitle}" (slug: ${missionSlug}).

MISSION REQUIREMENTS:
  • Latency:      ≤ ${requirements.latencyMs}ms
  • Availability: ≥ ${requirements.availability}%
  • Throughput:   ≥ ${requirements.throughput} concurrent users
  • Budget:       ≤ $${requirements.budget}/month

IDEAL SOLUTION TOPOLOGY:
  Component types present: ${topology.componentTypes.join(', ')}
  Canonical connections:
${connLines}

INSTRUCTIONS:
Generate 6-8 rubric items as a JSON array. Rules:
1. Each item must be BINARY — evaluatable as true/false from topology alone; no partial credit.
2. category "structural" = checks connection wiring patterns (e.g. "LB wired to ≥2 servers").
3. category "requirement" = checks whether topology structure can plausibly achieve a mission metric.
4. All weights must be positive integers that SUM TO EXACTLY 100.
5. "check" field: ≤10 words, imperative tense (e.g. "Load balancer wired to multiple servers").
6. "description" field: ≤20 words explaining the architectural principle.
7. IDs must be "r1", "r2", ... in order.
8. Do NOT include items that are trivially always true (e.g. "client exists") or trivially always false.
9. Cover a mix of structural checks AND requirement checks.

Return ONLY a valid JSON array — no prose, no markdown, no code fences:
[{"id":"r1","category":"structural","check":"...","description":"...","weight":15},...]`;
}

// ── Rubric evaluation (Phase B) ────────────────────────────────────────

function buildEvaluationPrompt(
  items:        RubricItem[],
  architecture: UserArchitecture,
): string {
  const itemLines = items
    .map((i) => `  ${i.id} [${i.category}] "${i.check}" — ${i.description}`)
    .join('\n');

  // Type-normalise the user's topology for the prompt
  const typeOf = (id: string) =>
    architecture.components.find((c) => c.id === id)?.type ?? id;

  const compTypes = [...new Set(architecture.components.map((c) => c.type))];
  const connLines = architecture.connections
    .map((c) => `  ${typeOf(c.from)} → ${typeOf(c.to)}`)
    .join('\n') || '  (no connections)';

  const serverCount = architecture.components.filter((c) => c.type === 'server').length;

  return `You are evaluating a student's distributed system architecture against a rubric.

RUBRIC ITEMS:
${itemLines}

STUDENT ARCHITECTURE:
  Component types: ${compTypes.join(', ')} (${architecture.components.length} total, ${serverCount} server${serverCount !== 1 ? 's' : ''})
  Connections (type-normalised):
${connLines}

TASK:
For each rubric item, determine passed: true or false based ONLY on what is observable in the student architecture above.
Do NOT infer intent or give benefit of the doubt — if a connection or component is missing, the item fails.
Write a one-sentence "reason" that cites a specific component or connection from the topology.

Return ONLY a valid JSON array — no prose, no markdown, no code fences:
[{"itemId":"r1","passed":true,"reason":"..."},{"itemId":"r2","passed":false,"reason":"..."},...]`;
}

// ── Rubric versioning ────────────────────────────────────────────────

function computeVersion(missionSlug: string, items: RubricItem[]): string {
  const payload = missionSlug + JSON.stringify(items);
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

// ── DB: get or create approved rubric ────────────────────────────────────

async function getOrCreateRubric(
  missionSlug:  string,
  missionTitle: string,
  requirements: MissionRequirements,
  topology:     SolutionTopology,
): Promise<{ rubricId: string; version: string; items: RubricItem[] }> {
  // Try to find an existing approved rubric for this mission
  const existing = await prisma.missionRubric.findFirst({
    where: { missionSlug, status: 'approved' },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    const items = JSON.parse(existing.items) as RubricItem[];
    return { rubricId: existing.id, version: existing.version, items };
  }

  // Generate a new rubric via AI
  logger.info(`[RubricService] Generating rubric for mission "${missionSlug}"...`);
  const prompt = buildGenerationPrompt(missionSlug, missionTitle, requirements, topology);
  const rawItems = await callNvidiaJSON<RubricItem[]>(prompt, 0.4);

  // Validate and clamp weights to sum = 100
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error('[RubricService] AI returned empty or invalid rubric items');
  }

  const totalWeight = rawItems.reduce((s, i) => s + (i.weight ?? 0), 0);
  const items: RubricItem[] = rawItems.map((item, idx) => ({
    id:          item.id ?? `r${idx + 1}`,
    category:    item.category === 'requirement' ? 'requirement' : 'structural',
    check:       String(item.check ?? ''),
    description: String(item.description ?? ''),
    // Normalise weights proportionally so they sum to 100
    weight:      Math.round((item.weight / totalWeight) * 100),
  }));

  // Fix any rounding difference on the last item
  const weightSum = items.reduce((s, i) => s + i.weight, 0);
  if (weightSum !== 100 && items.length > 0) {
    items[items.length - 1].weight += 100 - weightSum;
  }

  const version = computeVersion(missionSlug, items);

  // Upsert into DB (content-addressed: same version = same record)
  const record = await prisma.missionRubric.upsert({
    where: { missionSlug_version: { missionSlug, version } },
    create: {
      missionSlug,
      version,
      items:  JSON.stringify(items),
      status: 'approved',
    },
    update: {}, // no-op if already exists
  });

  logger.info(`[RubricService] Rubric stored: slug=${missionSlug} version=${version} items=${items.length}`);
  return { rubricId: record.id, version, items };
}

// ── Main public function ──────────────────────────────────────────────

/**
 * Evaluate a user architecture against the living rubric for a mission.
 * Auto-generates the rubric if one does not yet exist.
 * Returns null if NVIDIA_API_KEY is not configured.
 */
export async function evaluateArchitecture(
  missionSlug:   string,
  missionTitle:  string,
  requirements:  MissionRequirements,
  topology:      SolutionTopology,   // ideal solution (type-normalised)
  architecture:  UserArchitecture,   // user's submission
): Promise<RubricScore | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    logger.warn('[RubricService] NVIDIA_API_KEY not set — skipping rubric evaluation');
    return null;
  }

  try {
    // Phase A: get or generate rubric
    const { version, items } = await getOrCreateRubric(
      missionSlug, missionTitle, requirements, topology,
    );

    // Phase B: evaluate user topology against frozen rubric
    logger.info(`[RubricService] Evaluating submission for "${missionSlug}" against rubric v${version}`);
    const evalPrompt = buildEvaluationPrompt(items, architecture);
    const rawEvals   = await callNvidiaJSON<RubricEvaluationResult[]>(evalPrompt, 0.1);

    // Validate evaluations — ensure every rubric item has a result
    const evalMap: Record<string, RubricEvaluationResult> = {};
    for (const e of rawEvals) {
      evalMap[e.itemId] = { itemId: e.itemId, passed: Boolean(e.passed), reason: String(e.reason ?? '') };
    }

    const evaluations: RubricEvaluationResult[] = items.map((item) =>
      evalMap[item.id] ?? { itemId: item.id, passed: false, reason: 'Not evaluated — item missing from AI response' },
    );

    // Compute weighted score (0-100)
    const score = evaluations.reduce((sum, e) => {
      const item = items.find((i) => i.id === e.itemId);
      return sum + (e.passed && item ? item.weight : 0);
    }, 0);

    const passedCount = evaluations.filter((e) => e.passed).length;

    return {
      missionSlug,
      rubricVersion: version,
      items,
      evaluations,
      score,
      passedCount,
      totalCount: items.length,
    };
  } catch (err) {
    logger.error('[RubricService] Evaluation error:', { error: (err as Error).message });
    return null;
  }
}

/**
 * Fetch the active approved rubric for a mission (read-only — no generation).
 * Returns null if no rubric exists yet.
 */
export async function getRubric(missionSlug: string): Promise<{ version: string; items: RubricItem[] } | null> {
  const record = await prisma.missionRubric.findFirst({
    where: { missionSlug, status: 'approved' },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) return null;
  return { version: record.version, items: JSON.parse(record.items) as RubricItem[] };
}
