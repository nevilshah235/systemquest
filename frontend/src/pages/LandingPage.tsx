import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Animated counter hook ───────────────────────────────────────────────────
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
      <a href="#storylines" className="hover:text-white transition-colors">Storylines</a>
      <a href="#leaderboard" className="hover:text-white transition-colors">Leaderboard</a>
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
  const markViolet = `arrow-violet-${uid}`;
  const markAmber  = `arrow-amber-${uid}`;
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

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const users    = useCounter(150000);
  const missions = useCounter(500);
  const missionCount = useCounter(150);

  const handleCTA = () => navigate('/auth');

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <Navbar onCTA={handleCTA} />

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
              Learn by doing, not watching. Real interview scenarios, instant simulation
              feedback, and a progression system that keeps you hooked.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleCTA} className="px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/25 active:scale-95">Start Free — No Credit Card</button>
              <a href="#how-it-works" className="px-8 py-3.5 border border-white/10 hover:border-violet-500/50 text-gray-300 hover:text-white font-semibold rounded-xl transition-all text-center">See How It Works</a>
            </div>
            <p className="mt-4 text-xs text-gray-600">No credit card required · Free tier always available</p>
          </div>
          <ArchPreview />
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-6 md:px-12 lg:px-24 bg-gray-900/30">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-bold mb-8 text-white">HOW IT WORKS</h2>
            <div className="flex flex-col gap-6">
              {[
                { step: '01', title: 'Pick a Mission', desc: 'Choose from real-world scenarios: URL shortener, Netflix clone, payment systems and more.', icon: '🎯' },
                { step: '02', title: 'Build Your Architecture', desc: 'Drag and drop components onto the canvas. Connect services, add databases, caches, queues.', icon: '🏗️' },
                { step: '03', title: 'Get Instant Feedback', desc: 'Our simulation engine scores your design — latency, throughput, availability, cost.', icon: '⚡' },
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
                    { label: 'Latency', value: '42ms', color: 'text-emerald-400' },
                    { label: 'Throughput', value: '12k/s', color: 'text-blue-400' },
                    { label: 'Uptime', value: '99.9%', color: 'text-violet-400' },
                    { label: 'Cost', value: '$240/mo', color: 'text-amber-400' },
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

      <section id="storylines" className="py-20 px-6 md:px-12 lg:px-24 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-white">STORYLINES PREVIEW</h2>
          <p className="text-gray-500 mb-10">Choose your engineering path. Each storyline has unique missions aligned to your goals.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🚀', title: 'Startup Founder', subtitle: 'Design MVP architectures', desc: 'Build lean, scalable systems. From single-server MVPs to multi-region deployments.', missions: 12, tag: 'Free', tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', gradient: 'from-violet-600/20 to-purple-600/10', border: 'border-violet-500/30' },
              { icon: '📈', title: 'Scale-Up Engineer', subtitle: 'Build distributed systems', desc: 'Tackle high-traffic challenges. Design systems that handle millions of users.', missions: 18, tag: 'Pro', tagColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30', gradient: 'from-blue-600/20 to-cyan-600/10', border: 'border-blue-500/30' },
              { icon: '🎯', title: 'Interview Prep', subtitle: 'Ace FAANG interviews', desc: 'Real interview questions from top tech companies. URL shorteners, news feeds, payment systems.', missions: 24, tag: 'Pro', tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30', gradient: 'from-amber-600/20 to-yellow-600/10', border: 'border-amber-500/30' },
            ].map((s) => (
              <div key={s.title} className={`relative rounded-2xl bg-gradient-to-br ${s.gradient} border ${s.border} p-6 hover:scale-[1.02] transition-transform cursor-pointer`}>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{s.icon}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${s.tagColor}`}>{s.tag}</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-1">{s.title}</h3>
                <p className="text-gray-400 text-xs mb-3 font-medium">{s.subtitle}</p>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{s.desc}</p>
                <div className="flex items-center gap-2 text-xs text-gray-600"><span className="w-1.5 h-1.5 rounded-full bg-gray-600" />{s.missions} missions</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-6 md:px-12 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Start Free. Level Up Anytime.</h2>
            <p className="text-gray-500">No credit card required to begin your journey.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { tier: 'Free', price: '$0', desc: 'Perfect for getting started', features: ['1 Storyline (Startup Founder)', 'First 3 missions unlocked', 'Basic simulation engine', 'Public leaderboard access', 'Community Discord access'], cta: 'Get Started Free', primary: false },
              { tier: 'Pro', price: '$12', desc: 'Per month, billed annually', features: ['All 3 storylines unlocked', '50+ missions & counting', 'Advanced simulation metrics', 'AI-powered feedback', 'Interview mode with timer', 'Priority support'], cta: 'Start Pro Free Trial', primary: true },
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
                      <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={handleCTA} className={`w-full py-3 rounded-xl font-semibold transition-all ${plan.primary ? 'bg-violet-600 hover:bg-violet-500 text-white hover:shadow-lg hover:shadow-violet-500/25' : 'border border-white/10 hover:border-violet-500/50 text-gray-300 hover:text-white'}`}>{plan.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

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
