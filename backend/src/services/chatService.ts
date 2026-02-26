// Chat Service — NVIDIA NIM API (meta/llama-3.3-70b-instruct) with rule-based fallback
import axios from 'axios';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL    = 'meta/llama-3.3-70b-instruct';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SimulationMetrics {
  latencyMs: number;
  availability: number;
  throughput: number;
  monthlyCost: number;
  score: number;
  allMetricsMet: boolean;
}

export interface ArchitectureContext {
  missionTitle: string;
  problemStatement?: string;
  objectives?: string[];
  requirements: {
    latencyMs: number;
    availability: number;
    throughput: number;
    budget: number;
    growth: string;
  };
  components: Array<{ id: string; type: string }>;
  connections: Array<{ from: string; to: string }>;
  // Post-simulation fields
  simulationMetrics?: SimulationMetrics;
  missionPassed?: boolean;
  phase?: 'builder' | 'results';
}

export interface ChatAction {
  type: 'add_component' | 'connect';
  componentType?: string;
  fromType?: string;
  toType?: string;
}

export interface ChatResult {
  message: string;
  actions?: ChatAction[];
  chatId?: string;
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(ctx: ArchitectureContext): string {
  const compList = ctx.components.length
    ? ctx.components.map((c) => `  • ${c.type} (id: ${c.id})`).join('\n')
    : '  (canvas is empty)';

  const connList = ctx.connections.length
    ? ctx.connections.map((c) => `  • ${c.from} → ${c.to}`).join('\n')
    : '  (no connections yet)';

  // Simulation results block (only present post-run)
  const metricsBlock = ctx.simulationMetrics
    ? `
SIMULATION RESULTS (last run):
  • Score:        ${ctx.simulationMetrics.score}/100
  • Status:       ${ctx.missionPassed ? '✅ PASSED — all requirements met' : '❌ FAILED — one or more requirements not met'}
  • Latency:      ${ctx.simulationMetrics.latencyMs}ms   (target ≤${ctx.requirements.latencyMs}ms) ${ctx.simulationMetrics.latencyMs <= ctx.requirements.latencyMs ? '✓' : '✗'}
  • Availability: ${ctx.simulationMetrics.availability}%  (target ≥${ctx.requirements.availability}%) ${ctx.simulationMetrics.availability >= ctx.requirements.availability ? '✓' : '✗'}
  • Throughput:   ${ctx.simulationMetrics.throughput}     (target ≥${ctx.requirements.throughput}) ${ctx.simulationMetrics.throughput >= ctx.requirements.throughput ? '✓' : '✗'}
  • Cost:         $${ctx.simulationMetrics.monthlyCost}/mo (target ≤$${ctx.requirements.budget}) ${ctx.simulationMetrics.monthlyCost <= ctx.requirements.budget ? '✓' : '✗'}
`
    : '\nSIMULATION: Not yet run.';

  const objectivesBlock = ctx.objectives?.length
    ? `\nLEARNING OBJECTIVES:\n${ctx.objectives.map((o) => `  • ${o}`).join('\n')}`
    : '';

  const phaseInstruction = ctx.phase === 'results'
    ? ctx.missionPassed
      ? 'The user has PASSED this mission. Focus on explaining WHY the architecture works — connect each component to the mission scenario and the metric it satisfies. Celebrate their success while deepening understanding.'
      : 'The user has FAILED this mission. Identify the specific failing metric(s) and explain exactly which component or connection gap caused it. Be constructive and guide them toward the fix.'
    : 'The user is actively building. Guide them toward meeting the requirements step by step.';

  return `You are an expert system architecture tutor inside SystemQuest, a gamified learning platform where users design distributed systems.

CURRENT MISSION: "${ctx.missionTitle}"
${ctx.problemStatement ? `PROBLEM STATEMENT: ${ctx.problemStatement}` : ''}${objectivesBlock}

REQUIREMENTS:
  • Latency      ≤ ${ctx.requirements.latencyMs}ms
  • Availability ≥ ${ctx.requirements.availability}%
  • Throughput   ≥ ${ctx.requirements.throughput} concurrent users
  • Budget       ≤ $${ctx.requirements.budget}/month
  • Growth: ${ctx.requirements.growth}
${metricsBlock}
CURRENT ARCHITECTURE:
Components:
${compList}
Connections:
${connList}

CURRENT PHASE: ${phaseInstruction}

YOUR ROLE:
1. Teach WHY a component is needed — always reference the specific metric it improves.
2. Suggest the next step when a requirement looks unmet.
3. Execute placement commands when the user explicitly asks ("add cache", "connect server to db").
4. When explaining a design (passed or failed), reference the mission problem statement and connect each component to the real-world scenario.
5. Keep responses concise (2–4 sentences for quick answers, up to 6 for design explanations). Be encouraging and educational.

COMPONENT ACTIONS:
When you need to add or connect components, embed this JSON block at the very end of your response (nothing after it):
[ACTIONS]{"actions":[{"type":"add_component","componentType":"cache"}]}[/ACTIONS]

For connections: {"type":"connect","fromType":"server","toType":"cache"}
You may include multiple actions in one array.

Available componentTypes: client | loadbalancer | server | database | cache | cdn | queue | storage | monitoring | apigateway

IMPORTANT: Only include the [ACTIONS] block when the user explicitly asks you to add/connect something. Do NOT include it for explanation-only responses.`;
}

// ── Rule-based fallback ───────────────────────────────────────────────────────

const COMPONENT_EXPLANATIONS: Record<string, string> = {
  loadbalancer: 'A **Load Balancer** spreads traffic across multiple servers (+1.5% availability, ×2.5 throughput). Without it a single server is your bottleneck.',
  cache:        'A **Cache** stores hot data in memory, slashing latency by ~60ms and multiplying throughput by 1.8×. Wire it between your Server and Database.',
  cdn:          'A **CDN** serves static assets from edge nodes near your users — cuts latency by ~40ms and boosts throughput by 1.5×.',
  server:       'Each **App Server** handles business logic. Adding a second server behind a Load Balancer multiplies throughput and adds redundancy.',
  database:     'The **Database** persists all application data. Every system needs one; it has zero latency reduction but is mandatory.',
  queue:        'A **Message Queue** decouples services and absorbs traffic spikes — reduces latency by ~20ms and boosts throughput 1.3×.',
  monitoring:   '**Monitoring** tracks system health in real time (+0.8% availability). It\'s considered a bonus component in most missions.',
  storage:      '**Object Storage** handles large files and media, offloading blobs from your database.',
  apigateway:   'An **API Gateway** centralises routing, rate-limiting, and auth — cuts latency by 15ms and boosts throughput 1.4×.',
  client:       'The **Client** represents your end-users. Every architecture diagram starts with one!',
};

function fallback(msg: string, ctx: ArchitectureContext): ChatResult {
  const lower = msg.toLowerCase();

  const addTriggers  = ['add', 'place', 'put', 'use', 'insert', 'need', 'want'];
  const compAliases: Record<string, string> = {
    'load balancer': 'loadbalancer', 'load-balancer': 'loadbalancer',
    'api gateway':   'apigateway',   'api-gateway':   'apigateway',
    'loadbalancer': 'loadbalancer',  'apigateway': 'apigateway',
    'cache': 'cache', 'cdn': 'cdn', 'server': 'server', 'database': 'database',
    'db': 'database', 'queue': 'queue', 'storage': 'storage',
    'monitoring': 'monitoring', 'monitor': 'monitoring', 'client': 'client',
  };

  if (addTriggers.some((t) => lower.includes(t))) {
    for (const [alias, compType] of Object.entries(compAliases)) {
      if (lower.includes(alias)) {
        return {
          message: COMPONENT_EXPLANATIONS[compType] || `Adding a **${compType}** to your architecture.`,
          actions: [{ type: 'add_component', componentType: compType }],
        };
      }
    }
  }

  if (/why|what|how|explain|tell me about/.test(lower)) {
    for (const [alias, compType] of Object.entries(compAliases)) {
      if (lower.includes(alias)) {
        return { message: COMPONENT_EXPLANATIONS[compType] ?? `Ask me anything about ${compType}!` };
      }
    }
  }

  if (/throughput|concurrent|scale|traffic|users/.test(lower)) {
    return { message: `To reach **${ctx.requirements.throughput} concurrent users**: add a Load Balancer (×2.5), then a second App Server (×6 extra). A Cache (×1.8) and CDN (×1.5) compound on top.` };
  }
  if (/latency|slow|fast|speed|ms/.test(lower)) {
    return { message: `Target: ≤${ctx.requirements.latencyMs}ms. Cache saves ~60ms, CDN ~40ms, plus a +25ms synergy bonus when you have both. Load Balancer + Cache also adds −10ms.` };
  }
  if (/availab|uptime|down|reliab/.test(lower)) {
    return { message: `Target: ≥${ctx.requirements.availability}% uptime. Key boosts: Load Balancer (+1.5%), Monitoring (+0.8%), each extra Server (+0.5%), CDN (+0.4%), API Gateway (+0.4%).` };
  }
  if (/budget|cost|money|expensive/.test(lower)) {
    return { message: `Budget: ≤$${ctx.requirements.budget}/mo. Costs — Server: $50, Database: $40, CDN: $30, API Gateway: $35, Load Balancer: $20, Cache: $15, Queue: $25, Monitoring: $10, Storage: $20.` };
  }

  if (ctx.components.length === 0) {
    return { message: `Let's start! Drag a **Client** onto the canvas, then add an **App Server**. Every architecture needs a user (client) and something to handle requests (server). What would you like to add?` };
  }

  const types = ctx.components.map((c) => c.type);
  const missing: string[] = [];
  if (!types.includes('loadbalancer')) missing.push('Load Balancer');
  if (!types.includes('cache'))        missing.push('Cache');
  if (!types.includes('cdn'))          missing.push('CDN');
  if (!types.includes('monitoring'))   missing.push('Monitoring');

  if (missing.length) {
    return { message: `You have ${ctx.components.length} component${ctx.components.length !== 1 ? 's' : ''}. Consider adding: **${missing.join(', ')}** to improve your metrics. Ask me about any of them!` };
  }
  return { message: `Your architecture looks solid with ${ctx.components.length} components! Run the simulation to check your score, or ask me about any component or metric.` };
}

// ── NVIDIA NIM call ───────────────────────────────────────────────────────────

async function callNvidia(
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY not configured');

  // Build OpenAI-compatible messages array
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const res = await axios.post(
    `${NVIDIA_BASE_URL}/chat/completions`,
    {
      model: NVIDIA_MODEL,
      messages,
      temperature: 0.6,
      max_tokens: 512,
      stream: false,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    },
  );

  return res.data.choices[0].message.content as string;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function sendChatMessage(
  userMessage: string,
  history: ChatMessage[],
  context: ArchitectureContext,
  _chatId?: string,
): Promise<ChatResult> {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    console.warn('[ChatService] NVIDIA_API_KEY not set — using rule-based fallback');
    return fallback(userMessage, context);
  }

  try {
    const systemPrompt = buildSystemPrompt(context);
    const raw = await callNvidia(systemPrompt, history, userMessage);

    // Extract optional [ACTIONS] block
    const actionsMatch = raw.match(/\[ACTIONS\]([\s\S]*?)\[\/ACTIONS\]/);
    const message = raw.replace(/\[ACTIONS\][\s\S]*?\[\/ACTIONS\]/g, '').trim();
    let actions: ChatAction[] | undefined;
    if (actionsMatch) {
      try { actions = JSON.parse(actionsMatch[1].trim()).actions; } catch { /* ignore */ }
    }

    return { message, actions };
  } catch (err) {
    console.error('[ChatService] NVIDIA error — falling back:', (err as Error).message);
    return fallback(userMessage, context);
  }
}
