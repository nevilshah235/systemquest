import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar: React.FC<{ onCTA: () => void }> = ({ onCTA }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <span className="text-white font-bold text-lg tracking-tight">SystemQuest</span>
    </div>
    <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
      <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
      <a href="#learning-paths" className="hover:text-white transition-colors">Learning Paths</a>
      <a href="#features" className="hover:text-white transition-colors">Features</a>
      <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
    </div>
    <button
      onClick={onCTA}
      className="px-4 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all"
    >
      Start Free
    </button>
  </nav>
);

// ─── Hero architecture diagram preview ───────────────────────────────────────
const ArchPreview: React.FC = () => {
  // Generate unique IDs per instance to avoid duplicate SVG marker IDs
  // when this component is rendered more than once on the same page.
  const uid = React.useId().replace(/:/g, '');
  const markViolet  = `arrow-violet-${uid}`;
  const markAmber   = `arrow-amber-${uid}`;
  const markEmerald = `arrow-emerald-${uid}`;

  return (
    <div className="relative w-full h-64 md:h-80">
      <div className="absolute inset-0 rounded-2xl bg-violet-500/10 blur-2xl" />
      <div className="relative rounded-2xl border border-violet-500/20 bg-gray-900/60 backdrop-blur h-full p-4 overflow-hidden">
        {[
          { label: 'Client',        x: '8%',  y: '40%', color: 'from-blue-500 to-cyan-400' },
          { label: 'Load Balancer', x: '32%', y: '20%', color: 'from-violet-500 to-purple-400' },
          { label: 'API Server',    x: '56%', y: '40%', color: 'from-violet-600 to-blue-500' },
          { label: 'Cache',         x: '76%', y: '20%', color: 'from-amber-500 to-yellow-400' },
          { label: 'Database',      x: '76%', y: '60%', color: 'from-emerald-500 to-teal-400' },
        ].map((n) => (
          <div
            key={n.label}
            className="absolute flex flex-col items-center gap-1"
            style={{ left: n.x, top: n.y, transform: 'translate(-50%,-50%)' }}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${n.color} flex items-center justify-center shadow-lg`}>
              <div className="w-4 h-4 bg-white/30 rounded" />
            </div>
            <span className="text-[10px] text-gray-400 whitespace-nowrap">{n.label}</span>
          </div>
        ))}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          <defs>
            {/* Unique per-instance markers — prevents ID collision when rendered twice */}
            <marker id={markViolet}  markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#7c3aed" opacity="0.8" />
            </marker>
            <marker id={markAmber}   markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" opacity="0.8" />
            </marker>
            <marker id={markEmerald} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#10b981" opacity="0.8" />
            </marker>
          </defs>
          {/* Client → Load Balancer */}
          <line x1="10%" y1="40%" x2="30%" y2="22%" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.6" markerEnd={`url(#${markViolet})`}  strokeDasharray="4 2" />
          {/* Load Balancer → API Server */}
          <line x1="34%" y1="22%" x2="54%" y2="38%" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.6" markerEnd={`url(#${markViolet})`}  strokeDasharray="4 2" />
          {/* API Server → Cache */}
          <line x1="58%" y1="37%" x2="74%" y2="22%" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" markerEnd={`url(#${markAmber})`}   strokeDasharray="4 2" />
          {/* API Server → Database */}
          <line x1="58%" y1="43%" x2="74%" y2="58%" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.6" markerEnd={`url(#${markEmerald})`} strokeDasharray="4 2" />
        </svg>
        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-violet-600/20 border border-violet-500/30 rounded-lg px-3 py-1.5">
          <span className="text-violet-300 text-xs font-semibold">Score</span>
          <span className="text-white font-bold">94/100</span>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const LandingPage: React.FC = () => {
  const navigate  = useNavigate();
  const missions  = useCounter(50);
  const xp        = useCounter(19550);
  const concepts  = useCounter(40);
  const companies = useCounter(23);

  const handleCTA = () => navigate('/auth');

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <Navbar onCTA={handleCTA} />

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 px-6 md:px-12 lg:px-24 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
              <span className="text-violet-300 text-xs font-medium">Gamified System Design Learning</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Master System Design.<br />
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                One Mission At A Time.
              </span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Build real architectures, earn XP, simulate performance, and ace FAANG interviews.
              AI-guided missions across 6 learning paths — from MVP to distributed systems at scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleCTA} className="px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/25 active:scale-95">
                Start Free — No Credit Card
              </button>
              <a href="#how-it-works" className="px-8 py-3.5 border border-white/10 hover:border-violet-500/50 text-gray-300 hover:text-white font-semibold rounded-xl transition-all text-center">
                See How It Works
              </a>
            </div>
            <p className="mt-4 text-xs text-gray-600">No credit card required · Free tier always available</p>
          </div>
          <ArchPreview />
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="py-10 px-6 md:px-12 lg:px-24 border-y border-white/5 bg-gray-900/40">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: missions,  suffix: '',     label: 'Missions',          color: 'text-violet-400' },
            { value: xp,        suffix: '',     label: 'Total XP Available', color: 'text-amber-400' },
            { value: concepts,  suffix: '',     label: 'System Design Concepts', color: 'text-blue-400' },
            { value: companies, suffix: '',     label: 'Real-World Systems', color: 'text-emerald-400' },
          ].map((s) => (
            <div key={s.label}>
              <div className={`text-3xl md:text-4xl font-extrabold ${s.color}`}>
                {s.value.toLocaleString()}{s.suffix}
              </div>
              <div className="text-gray-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 px-6 md:px-12 lg:px-24 bg-gray-900/30">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-bold mb-8 text-white">HOW IT WORKS</h2>
            <div className="flex flex-col gap-6">
              {[
                { step: '01', title: 'Pick a Mission', desc: 'Choose from 50 real-world scenarios: URL shortener, WhatsApp, Stripe, Netflix and more. Each mission is a structured engineering challenge.', icon: '🎯' },
                { step: '02', title: 'Build Your Architecture', desc: 'Drag and drop components onto the canvas. Connect services, add databases, caches, and queues. Get AI-assisted hints as you design.', icon: '🏗️' },
                { step: '03', title: 'Simulate & Score', desc: 'Run the simulation engine — get scored on latency, throughput, availability, and cost. Unlock LLD deep dives when you pass.', icon: '⚡' },
                { step: '04', title: 'Go Deeper with LLD', desc: 'Once you score ≥ 60, unlock the Low-Level Design phase — schema design, API contracts, data flows, and class diagrams.', icon: '🔬' },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-4 rounded-xl bg-gray-900/60 border border-white/5 hover:border-violet-500/30 transition-all">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-lg">{item.icon}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-violet-400 text-xs font-mono font-bold">{item.step}</span>
                      <span className="text-white font-semibold text-sm">{item.title}</span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-8 text-white">LIVE PREVIEW</h2>
            <div className="rounded-2xl border border-white/10 bg-gray-900/60 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-gray-900">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-3 text-gray-600 text-xs font-mono">mission: url-shortener</span>
              </div>
              <div className="p-4">
                <ArchPreview />
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    { label: 'Latency',    value: '42ms',    color: 'text-emerald-400' },
                    { label: 'Throughput', value: '12k/s',   color: 'text-blue-400' },
                    { label: 'Uptime',     value: '99.9%',   color: 'text-violet-400' },
                    { label: 'Cost',       value: '$240/mo', color: 'text-amber-400' },
                  ].map((m) => (
                    <div key={m.label} className="rounded-lg bg-gray-800/60 p-2 text-center">
                      <div className={`text-sm font-bold ${m.color}`}>{m.value}</div>
                      <div className="text-gray-600 text-[10px]">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Learning Paths ── */}
      <section id="learning-paths" className="py-20 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-2 text-white">6 LEARNING PATHS</h2>
            <p className="text-gray-500">A structured progression from first principles to distributed systems at FAANG scale.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🧱', title: 'Foundations',
                level: 'Beginner', missions: 10, xp: '2,025 XP',
                desc: 'APIs, load balancing, auth, caching, and scalability. Build your first real systems.',
                cases: ['URL Shortener', 'Startup MVP', 'Auth System', 'ChatGPT Backend'],
                tag: 'Free', tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                gradient: 'from-violet-600/20 to-purple-600/10', border: 'border-violet-500/30',
              },
              {
                icon: '⚙️', title: 'Async & Queues',
                level: 'Beginner–Intermediate', missions: 8, xp: '2,725 XP',
                desc: 'Message queues, async processing, event sourcing, and Kafka-style streaming.',
                cases: ['Kafka', 'Spotify', 'Stripe Webhooks', 'Video Pipeline'],
                tag: 'Pro', tagColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                gradient: 'from-blue-600/20 to-cyan-600/10', border: 'border-blue-500/30',
              },
              {
                icon: '📖', title: 'High-Read Systems',
                level: 'Intermediate', missions: 8, xp: '3,275 XP',
                desc: 'Caching strategies, sharding, bloom filters, CDN, and read replica patterns.',
                cases: ['Google Search', 'Amazon S3', 'YouTube', 'News Feed'],
                tag: 'Pro', tagColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                gradient: 'from-sky-600/20 to-blue-600/10', border: 'border-sky-500/30',
              },
              {
                icon: '⚡', title: 'Real-Time & Messaging',
                level: 'Intermediate', missions: 8, xp: '3,350 XP',
                desc: 'WebSockets, rate limiting, presence systems, and live message delivery at scale.',
                cases: ['WhatsApp', 'Slack', 'Bluesky', 'Multiplayer Games'],
                tag: 'Pro', tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                gradient: 'from-amber-600/20 to-yellow-600/10', border: 'border-amber-500/30',
              },
              {
                icon: '🔒', title: 'Consistency & Transactions',
                level: 'Advanced', missions: 8, xp: '3,950 XP',
                desc: 'ACID, CAP theorem, distributed locks, consensus algorithms, and the Saga pattern.',
                cases: ['Stripe Payments', 'Banking System', 'Uber ETA', 'NYSE Stock Exchange'],
                tag: 'Pro', tagColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
                gradient: 'from-rose-600/20 to-pink-600/10', border: 'border-rose-500/30',
              },
              {
                icon: '🚀', title: 'Scale & Streaming',
                level: 'Advanced', missions: 8, xp: '4,225 XP',
                desc: 'Service mesh, circuit breakers, CQRS, event sourcing, and global-scale observability.',
                cases: ['Twitter Timeline', 'Netflix Microservices', 'Datadog', 'Global DB Sharding'],
                tag: 'Pro', tagColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
                gradient: 'from-fuchsia-600/20 to-violet-600/10', border: 'border-fuchsia-500/30',
              },
            ].map((path) => (
              <div key={path.title} className={`relative rounded-2xl bg-gradient-to-br ${path.gradient} border ${path.border} p-6 hover:scale-[1.02] transition-transform cursor-pointer`}>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{path.icon}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${path.tagColor}`}>{path.tag}</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-0.5">{path.title}</h3>
                <p className="text-gray-500 text-[11px] mb-3 font-medium">{path.level}</p>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{path.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {path.cases.map((c) => (
                    <span key={c} className="text-[10px] bg-white/5 border border-white/10 rounded px-2 py-0.5 text-gray-400">{c}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{path.missions} missions</span>
                  <span className="text-violet-400 font-semibold">{path.xp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Highlights ── */}
      <section id="features" className="py-20 px-6 md:px-12 lg:px-24 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-2 text-white">BUILT FOR SERIOUS ENGINEERS</h2>
            <p className="text-gray-500">Every feature designed to mirror what top companies actually test for.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">

            {/* AI Design Assistant */}
            <div className="rounded-2xl bg-gray-900/60 border border-white/5 hover:border-violet-500/20 transition-all p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-xl">🤖</div>
                <div>
                  <h3 className="text-white font-bold">AI Design Assistant</h3>
                  <p className="text-gray-500 text-xs">Context-aware, mission-specific</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Ask for hints, explain trade-offs, or challenge your assumptions — your AI assistant understands the mission requirements and your current architecture.
              </p>
              <ul className="flex flex-col gap-2">
                {['Mission-aware context injection', 'Explain Design mode on results', 'Disabled during interview simulations', 'Hint suggestions per component'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* LLD Deep Dives */}
            <div className="rounded-2xl bg-gray-900/60 border border-white/5 hover:border-blue-500/20 transition-all p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xl">🔬</div>
                <div>
                  <h3 className="text-white font-bold">LLD Deep Dives</h3>
                  <p className="text-gray-500 text-xs">Low-Level Design phase</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Score ≥ 60 on any HLD mission and unlock the LLD phase — schema design, class diagrams, API contracts, and internal data flows.
              </p>
              <ul className="flex flex-col gap-2">
                {['Unlocks at 60+ HLD score', 'Schema & database design', 'API contract definitions', 'Bonus XP (+20 to +55 XP)'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Interview Simulation */}
            <div className="rounded-2xl bg-gray-900/60 border border-white/5 hover:border-amber-500/20 transition-all p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-xl">⏱️</div>
                <div>
                  <h3 className="text-white font-bold">45-Minute Interview Mode</h3>
                  <p className="text-gray-500 text-xs">Real FAANG interview simulation</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                A timed 45-minute session with a live countdown, mid-interview follow-up questions, and no AI assistance — exactly how it works in real interviews.
              </p>
              <ul className="flex flex-col gap-2">
                {['Live countdown timer', 'Midpoint follow-up question injection', 'No AI hints (intentional)', 'Over-time tracking with visual indicator'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* 5-Dimension Scorecard */}
            <div className="rounded-2xl bg-gray-900/60 border border-white/5 hover:border-emerald-500/20 transition-all p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-xl">📊</div>
                <div>
                  <h3 className="text-white font-bold">5-Dimension Scorecard</h3>
                  <p className="text-gray-500 text-xs">Rubric-based post-interview feedback</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">
                Every interview submission is scored across 5 dimensions — the same framework used by real FAANG interviewers.
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { dim: 'Correctness',     pts: 25, color: 'bg-violet-500' },
                  { dim: 'Depth',           pts: 20, color: 'bg-blue-500' },
                  { dim: 'Trade-offs',      pts: 20, color: 'bg-amber-500' },
                  { dim: 'API Design',      pts: 20, color: 'bg-emerald-500' },
                  { dim: 'Time Management', pts: 15, color: 'bg-rose-500' },
                ].map((d) => (
                  <div key={d.dim} className="flex items-center gap-2">
                    <span className="text-gray-500 text-[11px] w-28 flex-shrink-0">{d.dim}</span>
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.pts}%` }} />
                    </div>
                    <span className="text-gray-600 text-[10px] w-8 text-right">{d.pts}pts</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAANG Case Studies ── */}
      <section className="py-20 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-2 text-white">23 REAL-WORLD SYSTEMS</h2>
            <p className="text-gray-500">Every mission is modelled on a real company's actual architecture challenge.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { name: 'WhatsApp',       icon: '💬', color: 'border-emerald-500/30 text-emerald-400' },
              { name: 'Stripe',         icon: '💳', color: 'border-violet-500/30 text-violet-400' },
              { name: 'Uber ETA',       icon: '🚗', color: 'border-amber-500/30 text-amber-400' },
              { name: 'Twitter Feed',   icon: '🐦', color: 'border-blue-500/30 text-blue-400' },
              { name: 'Netflix',        icon: '🎬', color: 'border-red-500/30 text-red-400' },
              { name: 'Google Search',  icon: '🔍', color: 'border-sky-500/30 text-sky-400' },
              { name: 'YouTube',        icon: '▶️',  color: 'border-red-500/30 text-red-400' },
              { name: 'Slack',          icon: '💼', color: 'border-purple-500/30 text-purple-400' },
              { name: 'Amazon S3',      icon: '☁️',  color: 'border-orange-500/30 text-orange-400' },
              { name: 'Spotify',        icon: '🎵', color: 'border-green-500/30 text-green-400' },
              { name: 'Kafka',          icon: '⚙️', color: 'border-gray-500/30 text-gray-400' },
              { name: 'Reddit',         icon: '🤖', color: 'border-orange-500/30 text-orange-400' },
              { name: 'Instagram',      icon: '📸', color: 'border-pink-500/30 text-pink-400' },
              { name: 'NYSE',           icon: '📈', color: 'border-emerald-500/30 text-emerald-400' },
              { name: 'Bluesky',        icon: '🦋', color: 'border-sky-500/30 text-sky-400' },
              { name: 'Datadog',        icon: '🐕', color: 'border-violet-500/30 text-violet-400' },
              { name: 'URL Shortener',  icon: '🔗', color: 'border-blue-500/30 text-blue-400' },
              { name: 'ChatGPT',        icon: '🧠', color: 'border-teal-500/30 text-teal-400' },
              { name: 'Uber Maps',      icon: '🗺️',  color: 'border-amber-500/30 text-amber-400' },
              { name: 'Banking System', icon: '🏦', color: 'border-emerald-500/30 text-emerald-400' },
              { name: 'Airbnb',         icon: '🏠', color: 'border-rose-500/30 text-rose-400' },
              { name: 'CricBuzz',       icon: '🏏', color: 'border-blue-500/30 text-blue-400' },
              { name: 'Codeforces',     icon: '💻', color: 'border-gray-500/30 text-gray-400' },
            ].map((c) => (
              <div key={c.name} className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-gray-900/60 ${c.color} text-sm font-medium`}>
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-6 md:px-12 lg:px-24 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Start Free. Level Up Anytime.</h2>
            <p className="text-gray-500">No credit card required to begin your journey.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                tier: 'Free', price: '$0', desc: 'Perfect for getting started',
                features: [
                  'Foundations path (10 missions)',
                  'AI Design Assistant',
                  'HLD simulation engine',
                  'Public leaderboard access',
                  'Community Discord access',
                ],
                cta: 'Get Started Free', primary: false,
              },
              {
                tier: 'Pro', price: '$12', desc: 'Per month, billed annually',
                features: [
                  'All 6 learning paths (50 missions)',
                  '19,550 XP to earn',
                  'LLD Deep Dives (all missions)',
                  '45-min Interview Simulation mode',
                  '5-Dimension Scorecard & rubric',
                  'AI assistant + Explain Design mode',
                  'Compare vs. reference solutions',
                  'Priority support',
                ],
                cta: 'Start Pro Free Trial', primary: true,
              },
            ].map((plan) => (
              <div key={plan.tier} className={`rounded-2xl p-8 border ${plan.primary ? 'bg-gradient-to-br from-violet-600/20 to-blue-600/10 border-violet-500/40' : 'bg-gray-900/60 border-white/10'}`}>
                {plan.primary && <span className="inline-block text-xs font-semibold bg-violet-500 text-white px-3 py-1 rounded-full mb-4">Most Popular</span>}
                <div className="mb-6">
                  <div className="text-gray-400 text-sm mb-1">{plan.tier}</div>
                  <div className="text-4xl font-extrabold text-white">{plan.price}<span className="text-lg text-gray-500">/mo</span></div>
                  <div className="text-gray-500 text-sm mt-1">{plan.desc}</div>
                </div>
                <ul className="flex flex-col gap-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                      <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleCTA}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${plan.primary ? 'bg-violet-600 hover:bg-violet-500 text-white hover:shadow-lg hover:shadow-violet-500/25' : 'border border-white/10 hover:border-violet-500/50 text-gray-300 hover:text-white'}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12 px-6 md:px-12 lg:px-24 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 gap-4">
            <p className="text-gray-700 text-xs">© 2026 SystemQuest. All rights reserved.</p>
            <div className="flex gap-6">
              {['Privacy', 'Terms', 'Cookie Policy', 'Legal'].map((l) => (
                <a key={l} href="#" className="text-gray-700 hover:text-gray-400 text-xs transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
