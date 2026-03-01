/**
 * MissionPage — Mission flow orchestrator
 *
 * Phase 2 of the Results revamp (PROJ-SQ-001):
 *   - Replaces tiny progress-pin buttons with FloatingPillNav.
 *   - "Go Deeper → LLD" button moved to SimulationResults bottom CTA bar.
 *   - Results phase wrapper updated to flex-col/overflow-hidden so
 *     SimulationResults can own its internal scroll + sticky strips.
 *
 * Phase init fix (BUG-LLD-002):
 *   - startMission now resolves the initial phase atomically (requestedPhase
 *     from ?phase= URL param, or 'results' for completed missions, or 'briefing').
 *   - Removed the previous initialPhaseApplied ref + second useEffect that
 *     tried to override phase after startMission set it to 'briefing'. That
 *     approach had a React StrictMode race where the second startMission call
 *     (from the double-invocation of Effect 1) resolved after setPhase('lld')
 *     fired, resetting the phase back to 'briefing'.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useMissionStore } from '../stores/missionStore';
import { useChatStore } from '../stores/chatStore';
import { MissionBriefing } from '../components/mission/MissionBriefing';
import { RequirementsPhase } from '../components/mission/RequirementsPhase';
import { DragDropBuilder } from '../components/builder/DragDropBuilder';
import { SimulationResults } from '../components/mission/SimulationResults';
import { ChatAssistant } from '../components/mission/ChatAssistant';
import { LLDPhase } from '../components/mission/LLDPhase';
import { ComparePanel } from '../components/mission/ComparePanel';
import { Mission } from '../data/types';

const PHASE_LABELS = ['Briefing', 'Requirements', 'Builder', 'Results', 'LLD'] as const;
const PHASE_ORDER  = ['briefing', 'requirements', 'builder', 'results', 'lld'] as const;
type Phase = typeof PHASE_ORDER[number];

// ─── Mission context registration ──────────────────────────────────────────────

function useMissionContext(
  mission: Mission | null,
  phase: string,
  simulationMetrics: import('../data/types').SimulationMetrics | null,
) {
  useEffect(() => {
    if (!mission) return;
    const passed = simulationMetrics?.allMetricsMet ?? false;
    (window as any).__missionContext = {
      missionTitle:      mission.title,
      problemStatement:  mission.scenario,
      objectives:        mission.objectives,
      phase:             phase === 'results' ? 'results' : 'builder',
      requirements: {
        latencyMs:    mission.requirements.performance.latencyMs,
        availability: mission.requirements.performance.availability,
        throughput:   mission.requirements.traffic.concurrent,
        budget:       mission.requirements.budget,
        growth:       mission.requirements.growth,
      },
      simulationMetrics: simulationMetrics
        ? {
            latencyMs:     simulationMetrics.latencyMs,
            availability:  simulationMetrics.availability,
            throughput:    simulationMetrics.throughput,
            monthlyCost:   simulationMetrics.monthlyCost,
            score:         simulationMetrics.score,
            allMetricsMet: simulationMetrics.allMetricsMet,
          }
        : undefined,
      missionPassed: simulationMetrics ? passed : undefined,
    };
    return () => { delete (window as any).__missionContext; };
  }, [mission, phase, simulationMetrics]);
}

// ─── Floating Pill Navigation ──────────────────────────────────────────────────

interface FloatingPillNavProps {
  phases:       readonly Phase[];
  labels:       readonly string[];
  currentIdx:   number;
  lldUnlocked:  boolean;
  isCompleted:  boolean;
  onNavigate:   (idx: number) => void;
}

const FloatingPillNav: React.FC<FloatingPillNavProps> = ({
  phases, labels, currentIdx, lldUnlocked, isCompleted, onNavigate,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };
    if (drawerOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [drawerOpen]);

  const canNavigateTo = (i: number): boolean => {
    if (i === phases.length - 1 && !lldUnlocked) return false;
    if (isCompleted) return true;
    return i <= currentIdx + 1;
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2 bg-gray-800/80 border border-gray-700/60
        rounded-full px-4 py-2.5 backdrop-blur-sm">

        <button
          disabled={currentIdx === 0}
          onClick={() => currentIdx > 0 && onNavigate(currentIdx - 1)}
          className="w-5 h-5 flex items-center justify-center text-sm text-gray-400
            hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous step"
        >
          ‹
        </button>

        <button
          onClick={() => setDrawerOpen(p => !p)}
          className="flex items-center gap-1.5 px-1 py-0.5 rounded-full
            hover:bg-gray-700/50 transition-colors"
          aria-label="Toggle step drawer"
        >
          {phases.map((_, i) => {
            const isLLD     = i === phases.length - 1;
            const locked    = isLLD && !lldUnlocked;
            const completed = i < currentIdx;
            const current   = i === currentIdx;
            return (
              <span
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  current
                    ? 'w-2.5 h-2.5 bg-white shadow-[0_0_6px_2px_rgba(255,255,255,0.45)]'
                    : completed
                    ? 'w-2 h-2 bg-green-400 shadow-[0_0_5px_1px_rgba(74,222,128,0.55)]'
                    : locked
                    ? 'w-2 h-2 bg-gray-700'
                    : 'w-2 h-2 bg-gray-600'
                }`}
              />
            );
          })}
          <span className="text-sm font-semibold text-gray-200 ml-1.5 select-none">
            {labels[currentIdx]}
          </span>
        </button>

        <button
          disabled={!canNavigateTo(currentIdx + 1)}
          onClick={() => canNavigateTo(currentIdx + 1) && onNavigate(currentIdx + 1)}
          className="w-5 h-5 flex items-center justify-center text-sm text-gray-400
            hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          aria-label="Next step"
        >
          ›
        </button>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8,  scale: 0.97 }}
            animate={{ opacity: 1, y:  0,  scale: 1    }}
            exit={{   opacity: 0, y: -8,  scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-52
              bg-gray-800 border border-gray-700/60 rounded-xl
              shadow-2xl shadow-black/50 p-2 z-50"
          >
            {phases.map((phase, i) => {
              const isLLD     = i === phases.length - 1;
              const locked    = isLLD && !lldUnlocked;
              const completed = i < currentIdx;
              const current   = i === currentIdx;
              const clickable = canNavigateTo(i);
              return (
                <button
                  key={phase}
                  disabled={!clickable}
                  onClick={() => { if (clickable) { onNavigate(i); setDrawerOpen(false); } }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                    transition-colors ${
                      current   ? 'bg-brand-600/20 text-white' :
                      completed ? 'text-green-400 hover:bg-gray-700/50' :
                      locked    ? 'text-gray-600 cursor-not-allowed' :
                      clickable ? 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200' :
                                  'text-gray-700 cursor-not-allowed'
                    }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center
                    text-xs flex-shrink-0 ${
                      current   ? 'bg-white text-gray-900 font-bold' :
                      completed ? 'bg-green-400/20 text-green-400'   :
                                  'bg-gray-700 text-gray-500'
                    }`}
                  >
                    {completed ? '\u2713' : locked ? '\ud83d\udd12' : i + 1}
                  </span>
                  <span className="font-medium flex-1 text-left">{labels[i]}</span>
                  {current && <span className="text-[10px] text-brand-400 font-medium">Now</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── MissionPage ────────────────────────────────────────────────────────────────

export const MissionPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    activeMission, phase, setPhase, startMission, runSimulation,
    simulationMetrics, simulationXpGranted, isLoading, isSimulating, resetMission,
  } = useMissionStore();
  const { isOpen: chatOpen, toggleOpen: toggleChat, clearChat } = useChatStore();
  const [showCompare, setShowCompare] = useState(false);

  // ─ Load mission on slug change ──────────────────────────────────────────────────
  //
  // Phase initialisation is handled entirely inside startMission:
  //   ?phase=<x>  →  use that phase directly (e.g. ?phase=lld from MissionCard)
  //   completed   →  default to 'results' (skip Briefing for returning users)
  //   otherwise   →  'briefing'
  //
  // This avoids the previous two-step approach (startMission always set
  // 'briefing', then a second useEffect tried to override it) which had a
  // React StrictMode race: the double-invoked Effect 1 fired two concurrent
  // startMission calls; the second resolved after setPhase('lld') fired and
  // forcibly reset phase back to 'briefing', while the guard prevented
  // Effect 2 from correcting it.
  useEffect(() => {
    if (slug) {
      // Read the requested phase from the URL param once, at mount time.
      // searchParams is intentionally NOT in the dep array — we only want
      // to apply the phase param on fresh navigation (slug change), not on
      // every query-string mutation while the user is mid-mission.
      const rawPhase = searchParams.get('phase');
      const requestedPhase = rawPhase && (PHASE_ORDER as readonly string[]).includes(rawPhase)
        ? rawPhase as Phase
        : undefined;
      startMission(slug, requestedPhase);
    }
    return () => { resetMission(); clearChat(); };
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  useMissionContext(activeMission, phase, simulationMetrics);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 animate-pulse">Loading mission...</div>
      </div>
    );
  }

  if (!activeMission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-400">Mission not found.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">← Dashboard</button>
      </div>
    );
  }

  const phaseIdx       = PHASE_ORDER.indexOf(phase as Phase);
  const isBuilderPhase = phase === 'builder';
  const isResultsPhase = phase === 'results';
  const showChat       = isBuilderPhase || isResultsPhase;
  const isCompleted    = !!activeMission.userProgress?.completed;
  const bestScore      = activeMission.userProgress?.bestScore ?? 0;
  const hldPassed      = simulationMetrics ? simulationMetrics.score >= 60 : false;
  // LLD unlocks from current sim OR from a previously-passed attempt
  const lldUnlocked    = hldPassed || bestScore >= 60;
  const hasReference   = !!activeMission.referenceSolution;

  return (
    <div
      className={`flex flex-col ${
        isBuilderPhase || isResultsPhase
          ? 'h-[calc(100vh-56px)]'
          : 'min-h-[calc(100vh-56px)]'
      }`}
    >
      {/* ── Top bar ── */}
      <div className="bg-gray-900/80 border-b border-gray-800 px-6 py-5 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="btn-ghost text-sm font-medium">
            ← Dashboard
          </button>

          <FloatingPillNav
            phases={PHASE_ORDER}
            labels={PHASE_LABELS}
            currentIdx={phaseIdx}
            lldUnlocked={lldUnlocked}
            isCompleted={isCompleted}
            onNavigate={(i) => setPhase(PHASE_ORDER[i])}
          />

          <div className="flex items-center gap-2">
            {isResultsPhase && hasReference && (
              <button
                onClick={() => setShowCompare(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                  font-medium border bg-purple-800/20 border-purple-600/50
                  text-purple-400 hover:text-purple-200 transition-all"
              >
                ⚖️ Compare
              </button>
            )}
            {showChat && (
              <button
                onClick={toggleChat}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                  font-medium border transition-all ${
                    chatOpen
                      ? 'bg-brand-600/20 border-brand-600/50 text-brand-400'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
              >
                🤖 {chatOpen ? 'Hide Chat' : isResultsPhase ? 'Explain Design' : 'Ask AI'}
              </button>
            )}
            <div className="text-sm text-gray-400 font-medium">{activeMission.title}</div>
          </div>
        </div>
      </div>

      {/* ── Phase content ── */}
      <div
        className={`flex-1 min-h-0 ${
          isBuilderPhase || isResultsPhase ? 'flex overflow-hidden' : 'overflow-auto'
        }`}
      >
        {phase === 'briefing' && (
          <MissionBriefing
            mission={activeMission}
            onContinue={() => setPhase('requirements')}
            onSkipToBuilder={() => setPhase('builder')}
          />
        )}

        {phase === 'requirements' && (
          <RequirementsPhase
            mission={activeMission}
            onContinue={() => setPhase('builder')}
            onBack={() => setPhase('briefing')}
          />
        )}

        {phase === 'builder' && (
          <>
            <div className="flex-1 min-w-0 overflow-hidden">
              <DragDropBuilder
                mission={activeMission}
                onSimulate={runSimulation}
                isSimulating={isSimulating}
              />
            </div>
            {chatOpen && (
              <div className="w-80 flex-shrink-0 border-l border-gray-800 overflow-hidden">
                <ChatAssistant missionSlug={activeMission.slug} />
              </div>
            )}
          </>
        )}

        {phase === 'results' && (
          <>
            <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
              {simulationMetrics ? (
                // ── Fresh simulation results ──
                // onGoDeeper + lldUnlocked are wired so the bottom CTA bar
                // correctly shows the "Go Deeper → LLD" button when unlocked.
                <SimulationResults
                  metrics={simulationMetrics}
                  mission={activeMission}
                  xpGranted={simulationXpGranted}
                  onRetry={() => setPhase('builder')}
                  onGoDeeper={lldUnlocked ? () => setPhase('lld') : undefined}
                  lldUnlocked={lldUnlocked}
                />
              ) : (
                // ── Completed mission returning to Results (no fresh metrics) ──
                <div className="flex-1 overflow-auto flex items-center justify-center py-12">
                  <div className="max-w-md text-center space-y-6 px-6">
                    <div className="text-5xl">🏆</div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Mission Complete!</h2>
                      <p className="text-gray-400 text-sm">
                        Your best score:{' '}
                        <span className={`font-bold text-lg ${
                          bestScore >= 80 ? 'text-green-400' :
                          bestScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {bestScore}/100
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button onClick={() => setPhase('builder')} className="btn-primary px-6 py-2.5">
                        🔄 Re-run Simulation
                      </button>
                      {lldUnlocked && (
                        <button
                          onClick={() => setPhase('lld')}
                          className="flex items-center gap-2 text-sm px-6 py-2.5 rounded-lg font-medium
                            border bg-yellow-800/20 border-yellow-600/50 text-yellow-400
                            hover:text-yellow-200 transition-all"
                        >
                          🔧 Go Deeper → LLD
                        </button>
                      )}
                      {hasReference && (
                        <button
                          onClick={() => setShowCompare(true)}
                          className="flex items-center gap-2 text-sm px-6 py-2.5 rounded-lg font-medium
                            border bg-purple-800/20 border-purple-600/50 text-purple-400
                            hover:text-purple-200 transition-all"
                        >
                          ⚖️ Compare Solution
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {chatOpen && (
              <div className="w-80 flex-shrink-0 border-l border-gray-800 overflow-hidden">
                <ChatAssistant missionSlug={activeMission.slug} />
              </div>
            )}
          </>
        )}

        {phase === 'lld' && (
          <div className="flex-1 overflow-auto">
            <LLDPhase
              missionSlug={activeMission.slug}
              onBack={() => setPhase('results')}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCompare && activeMission && (
          <ComparePanel
            missionSlug={activeMission.slug}
            onClose={() => setShowCompare(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
