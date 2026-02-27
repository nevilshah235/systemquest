// 5-dimension rubric scorer for Interview Simulation Mode

import { Architecture } from './simulationEngine';

export interface RubricScores {
  correctness: number;    // 0-25: Core components present and connected
  depth: number;          // 0-20: Connection topology and architectural depth
  tradeoffs: number;      // 0-20: Evidence of trade-off reasoning in design
  apiDesign: number;      // 0-20: API Gateway and interface design quality
  timeManagement: number; // 0-15: Submitted with time to spare
}

export interface InterviewScoreResult {
  rubricScores: RubricScores;
  totalScore: number;
  xpEarned: number;
  grade: 'Exceptional' | 'Strong Hire' | 'Hire' | 'No Hire' | 'Strong No Hire';
  feedback: string[];
}

const COMPONENT_WEIGHTS: Record<string, number> = {
  client: 1, loadbalancer: 2, server: 3, database: 3,
  cache: 2, cdn: 2, queue: 2, storage: 2, monitoring: 2, apigateway: 2,
};

export function scoreInterviewSession(
  architecture: Architecture,
  missionSlug: string,
  durationMinutes: number,
  elapsedSeconds: number,
  requiredComponents: string[],
): InterviewScoreResult {
  const components = architecture.components ?? [];
  const connections = architecture.connections ?? [];
  const feedback: string[] = [];

  // ── Correctness (0-25) ────────────────────────────────────────────────────
  const componentTypes = new Set(components.map((c) => c.type));
  const foundRequired = requiredComponents.filter((r) => componentTypes.has(r));
  const correctness = Math.round((foundRequired.length / Math.max(requiredComponents.length, 1)) * 25);

  if (correctness >= 20) {
    feedback.push('✅ All required components are present — solid foundation.');
  } else {
    const missing = requiredComponents.filter((r) => !componentTypes.has(r));
    feedback.push(`⚠️ Missing components: ${missing.join(', ')}. These were critical for this problem.`);
  }

  // ── Depth (0-20) ──────────────────────────────────────────────────────────
  const connectionCount = connections.length;
  const componentCount  = components.length;
  let depth = 0;
  if (componentCount >= 4) depth += 8;
  else if (componentCount >= 2) depth += 4;
  if (connectionCount >= componentCount - 1) depth += 8; // reasonably connected graph
  if (connectionCount >= componentCount + 2) depth += 4; // extra for redundant paths
  depth = Math.min(20, depth);

  if (depth >= 16) {
    feedback.push('✅ Architecture has good depth — components are well-connected with clear data flows.');
  } else {
    feedback.push('⚠️ Add more connections to show how data flows between components.');
  }

  // ── Trade-offs (0-20) ─────────────────────────────────────────────────────
  // Infer trade-off awareness from component combinations
  let tradeoffs = 0;
  const hasCache      = componentTypes.has('cache');
  const hasQueue      = componentTypes.has('queue');
  const hasLB         = componentTypes.has('loadbalancer');
  const hasCDN        = componentTypes.has('cdn');
  const hasMonitor    = componentTypes.has('monitoring');
  const hasGateway    = componentTypes.has('apigateway');

  if (hasCache && hasQueue) { tradeoffs += 6; feedback.push('✅ Cache + Queue combination shows understanding of async + read-optimisation trade-offs.'); }
  else if (hasCache || hasQueue) { tradeoffs += 3; }
  if (hasLB) { tradeoffs += 4; }
  if (hasCDN) { tradeoffs += 4; }
  if (hasMonitor) { tradeoffs += 3; feedback.push('✅ Including monitoring shows operational maturity.'); }
  if (hasGateway) { tradeoffs += 3; }
  tradeoffs = Math.min(20, tradeoffs);

  // ── API Design (0-20) ─────────────────────────────────────────────────────
  let apiDesign = 0;
  if (hasGateway) { apiDesign += 10; feedback.push('✅ API Gateway present — good for centralising auth and rate limiting.'); }
  if (hasLB && hasGateway) { apiDesign += 5; }
  if (componentCount >= 5 && connectionCount >= 5) { apiDesign += 5; }
  apiDesign = Math.min(20, apiDesign);

  // ── Time Management (0-15) ────────────────────────────────────────────────
  const allowedSeconds = durationMinutes * 60;
  const remainingFraction = Math.max(0, (allowedSeconds - elapsedSeconds) / allowedSeconds);
  let timeManagement = 0;
  if (elapsedSeconds <= allowedSeconds) {
    // Finished within time — bonus for finishing early
    if (remainingFraction >= 0.2) {
      timeManagement = 15;
      feedback.push('✅ Finished with time to spare — efficient delivery under pressure.');
    } else {
      timeManagement = 10;
      feedback.push('✅ Completed within the time limit.');
    }
  } else {
    // Went over time — deduct proportionally
    const overBy = elapsedSeconds - allowedSeconds;
    if (overBy <= 120) { timeManagement = 5; feedback.push('⚠️ Slightly over time — work on pacing your design narrative.'); }
    else { timeManagement = 0; feedback.push('❌ Significantly over time — in a real interview this would be a strong signal against hiring.'); }
  }

  const total = correctness + depth + tradeoffs + apiDesign + timeManagement;
  const totalScore = Math.min(100, total);

  const grade: InterviewScoreResult['grade'] =
    totalScore >= 90 ? 'Exceptional' :
    totalScore >= 75 ? 'Strong Hire' :
    totalScore >= 60 ? 'Hire' :
    totalScore >= 40 ? 'No Hire' : 'Strong No Hire';

  const xpEarned = Math.round((totalScore / 100) * 500); // up to 500 XP for interview

  return {
    rubricScores: { correctness, depth, tradeoffs, apiDesign, timeManagement },
    totalScore,
    xpEarned,
    grade,
    feedback,
  };
}
