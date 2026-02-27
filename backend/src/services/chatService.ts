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

// ── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(ctx: ArchitectureContext): string {
  const compList = ctx.components.length
    ? ctx.components.map((c) => `  • ${c.type} (id: ${c.id})`).join('\n')
    : '  (canvas is empty)';

  const connList = ctx.connections.length
    ? ctx.connections.map((c) => `  • ${c.from} → ${c.to}`).join('\n')
    : '  (no connections yet)';

  const metricsBlock = ctx.simulationMetrics
    ? `\nSIMULATION RESULTS (last run):\n  • Score:        ${ctx.simulationMetrics.score}/100\n  • Status:       ${ctx.missionPassed ? '✅ PASSED — all requirements met' : '❌ FAILED — one or more requirements not met'}\n  • Latency:      ${ctx.simulationMetrics.latencyMs}ms   (target ≤${ctx.requirements.latencyMs}ms) ${ctx.simulationMetrics.latencyMs <= ctx.requirements.latencyMs ? '✓' : '✗'}\n  • Availability: ${ctx.simulationMetrics.availability}%  (target ≥${ctx.requirements.availability}%) ${ctx.simulationMetrics.availability >= ctx.requirements.availability ? '✓' : '✗'}\n  • Throughput:   ${ctx.simulationMetrics.throughput}     (target ≥${ctx.requirements.throughput}) ${ctx.simulationMetrics.throughput >= ctx.requirements.throughput ? '✓' : '✗'}\n  • Cost:         $${ctx.simulationMetrics.monthlyCost}/mo (target ≤$${ctx.requirements.budget}) ${ctx.simulationMetrics.monthlyCost <= ctx.requirements.budget ? '✓' : '✗'}\n`
    : '\nSIMULATION: Not yet run.';

  const objectivesBlock = ctx.objectives?.length
    ? `\nLEARNING OBJECTIVES:\n${ctx.objectives.map((o) => `  • ${o}`).join('\n')}`
    : '';

  const phaseInstruction = ctx.phase === 'results'
    ? ctx.missionPassed
      ? 'The user has PASSED this mission. Focus on explaining WHY the architecture works — connect each component to the mission scenario and the metric it satisfies. Celebrate their success while deepening understanding.'
      : 'The user has FAILED this mission. Identify the specific failing metric(s) and explain exactly which component or connection gap caused it. Be constructive and guide them toward the fix.'
    : 'The user is actively building. Guide them toward meeting the requirements step by step.';

  return `You are an expert system architecture tutor inside SystemQuest, a gamified learning platform where users design distributed systems.\n\nCURRENT MISSION: "${ctx.missionTitle}"\n${ctx.problemStatement ? `PROBLEM STATEMENT: ${ctx.problemStatement}` : ''}${objectivesBlock}\n\nREQUIREMENTS:\n  • Latency      ≤ ${ctx.requirements.latencyMs}ms\n  • Availability ≥ ${ctx.requirements.availability}%\n  • Throughput   ≥ ${ctx.requirements.throughput} concurrent users\n  • Budget       ≤ $${ctx.requirements.budget}/month\n  • Growth: ${ctx.requirements.growth}\n${metricsBlock}\nCURRENT ARCHITECTURE:\nComponents:\n${compList}\nConnections:\n${connList}\n\nCURRENT PHASE: ${phaseInstruction}\n\nYOUR ROLE:\n1. Teach WHY a component is needed — always reference the specific metric it improves.\n2. Suggest the next step when a requirement looks unmet.\n3. Execute placement commands when the user explicitly asks ("add cache", "connect server to db").\n4. When explaining a design (passed or failed), reference the mission problem statement and connect each component to the real-world scenario.\n5. Keep responses concise (2–4 sentences for quick answers, up to 6 for design explanations). Be encouraging and educational.\n\nCOMPONENT ACTIONS:\nWhen you need to add or connect components, embed this JSON block at the very end of your response (nothing after it):\n[ACTIONS]{"actions":[{"type":"add_component","componentType":"cache"}]}[/ACTIONS]\n\nFor connections: {"type":"connect","fromType":"server","toType":"cache"}\nYou may include multiple actions in one array.\n\nAvailable componentTypes: client | loadbalancer | server | database | cache | cdn | queue | storage | monitoring | apigateway\n\nIMPORTANT: Only include the [ACTIONS] block when the user explicitly asks you to add/connect something. Do NOT include it for explanation-only responses.`;
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

// ── Simulation Analysis ───────────────────────────────────────────────────────

export interface SimulationAnalysisRequest {
  missionTitle: string;
  problemStatement?: string;
  objectives?: string[];
  requirements: {
    latencyMs: number;
    availability: number;
    throughput: number;
    budget: number;
  };
  metrics: SimulationMetrics;
  passed: boolean;
  components: Array<{ id: string; type: string }>;
  connections: Array<{ from: string; to: string }>;
}

export interface SimulationAnalysisResult {
  narrative: string;
  gaps?: string[];
  type: 'pass' | 'fail';
}

function buildSimulationAnalysisPrompt(req: SimulationAnalysisRequest): string {
  const compTypes = req.components.map((c) => c.type);
  const uniqueTypes = [...new Set(compTypes)];
  const serverCount = compTypes.filter((t) => t === 'server').length;
  const connList = req.connections.map((c) => `${c.from}→${c.to}`).join(', ') || 'none';

  const metricsBlock = `
Simulation results:
  • Score:        ${req.metrics.score}/100
  • Latency:      ${req.metrics.latencyMs}ms   (target ≤${req.requirements.latencyMs}ms) ${req.metrics.latencyMs <= req.requirements.latencyMs ? '✓' : '✗ FAILED'}
  • Availability: ${req.metrics.availability}%  (target ≥${req.requirements.availability}%) ${req.metrics.availability >= req.requirements.availability ? '✓' : '✗ FAILED'}
  • Throughput:   ${req.metrics.throughput.toLocaleString()} users (target ≥${req.requirements.throughput.toLocaleString()}) ${req.metrics.throughput >= req.requirements.throughput ? '✓' : '✗ FAILED'}
  • Cost:         $${req.metrics.monthlyCost}/mo (budget ≤$${req.requirements.budget}) ${req.metrics.monthlyCost <= req.requirements.budget ? '✓' : '✗ FAILED'}`;

  const archBlock = `
Architecture:
  Components: ${uniqueTypes.join(', ')} (${req.components.length} total, ${serverCount} server${serverCount !== 1 ? 's' : ''})
  Connections: ${connList}`;

  if (req.passed) {
    return `You are an expert system architecture tutor. A learner just PASSED the mission "${req.missionTitle}".

Mission scenario: ${req.problemStatement ?? 'Design a scalable distributed system.'}

${metricsBlock}
${archBlock}

Write a 3-5 sentence celebration + explanation of WHY this architecture succeeds. Be specific:
- Connect each key component type to the exact metric it improved (e.g., "The load balancer distributes traffic across ${serverCount} servers, enabling ${req.metrics.throughput.toLocaleString()} concurrent users")
- Reference the mission scenario to make it real
- Mention one interesting architectural insight the learner may not have noticed
- Be encouraging and make the learner feel like a real architect

Respond in plain prose only. No bullet points, no markdown headers, no code.`;
  } else {
    const failedMetrics: string[] = [];
    if (req.metrics.latencyMs      > req.requirements.latencyMs)      failedMetrics.push(`latency (${req.metrics.latencyMs}ms vs ≤${req.requirements.latencyMs}ms)`);
    if (req.metrics.availability   < req.requirements.availability)   failedMetrics.push(`availability (${req.metrics.availability}% vs ≥${req.requirements.availability}%)`);
    if (req.metrics.throughput     < req.requirements.throughput)     failedMetrics.push(`throughput (${req.metrics.throughput.toLocaleString()} vs ≥${req.requirements.throughput.toLocaleString()} users)`);
    if (req.metrics.monthlyCost    > req.requirements.budget)         failedMetrics.push(`cost ($${req.metrics.monthlyCost} vs ≤$${req.requirements.budget})`);

    return `You are an expert system architecture tutor. A learner just FAILED the mission "${req.missionTitle}".

Mission scenario: ${req.problemStatement ?? 'Design a scalable distributed system.'}

${metricsBlock}
${archBlock}

Failed metrics: ${failedMetrics.join(', ')}

Write a response in TWO parts:

PART 1 — NARRATIVE (3-4 sentences):
Explain specifically why each failing metric failed, referencing the actual component topology. Mention what's missing or mis-connected. Be direct but encouraging — frame it as a diagnosis, not a failure. Reference the mission scenario.

PART 2 — GAPS (a JSON array of 2-4 short gap strings, most impactful first):
Format exactly as: [GAPS]["gap description 1","gap description 2"][/GAPS]
Each gap should be one sentence, actionable, and reference a specific component and metric.
Example: "Add 2 more App Servers behind the Load Balancer to reach 100,000 throughput"

Do NOT include markdown headers or bullet points in Part 1.`;
  }
}

export async function generateSimulationAnalysis(
  request: SimulationAnalysisRequest,
): Promise<SimulationAnalysisResult | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.warn('[ChatService] NVIDIA_API_KEY not set — skipping simulation analysis');
    return null;
  }

  try {
    const prompt = buildSimulationAnalysisPrompt(request);
    const raw = await callNvidia(
      prompt,
      [],
      'Please provide your analysis now.',
    );

    if (request.passed) {
      return { narrative: raw.trim(), type: 'pass' };
    }

    // Extract [GAPS] block from fail path
    const gapsMatch = raw.match(/\[GAPS\]([\s\S]*?)\[\/GAPS\]/);
    const narrative = raw.replace(/\[GAPS\][\s\S]*?\[\/GAPS\]/g, '').trim();
    let gaps: string[] | undefined;
    if (gapsMatch) {
      try { gaps = JSON.parse(gapsMatch[1].trim()); } catch { /* ignore */ }
    }

    return { narrative, gaps, type: 'fail' };
  } catch (err) {
    console.error('[ChatService] Simulation analysis error:', (err as Error).message);
    return null;
  }
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

    // BUG-001 fix: handle both [ACTIONS]...[/ACTIONS] (well-formed) and
    // [ACTIONS]... (no closing tag — LLM sometimes omits [/ACTIONS]).
    // The greedy strip to end-of-string ensures raw JSON never leaks into
    // data.message regardless of whether the closing tag is present.
    const actionsMatch = raw.match(/\[ACTIONS\]([\s\S]*?)(?:\[\/ACTIONS\]|$)/);
    const message = raw.replace(/\[ACTIONS\][\s\S]*$/, '').trim();
    let actions: ChatAction[] | undefined;
    if (actionsMatch) {
      try {
        // Strip any residual closing tag from the captured group before parsing
        const jsonStr = actionsMatch[1].replace(/\[\/ACTIONS\][\s\S]*$/, '').trim();
        actions = JSON.parse(jsonStr).actions;
      } catch (e) {
        console.error('[ChatService] Failed to parse ACTIONS payload:', e);
      }
    }

    return { message, actions };
  } catch (err) {
    console.error('[ChatService] NVIDIA error — falling back:', (err as Error).message);
    return fallback(userMessage, context);
  }
}
