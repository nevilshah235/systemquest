import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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

const PHASE_LABELS = ['Briefing', 'Requirements', 'Builder', 'Results', 'LLD'];
const PHASE_ORDER = ['briefing', 'requirements', 'builder', 'results', 'lld'] as const;

/** Register enriched mission context globally so chatStore can read it without prop-drilling */
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
            latencyMs:    simulationMetrics.latencyMs,
            availability: simulationMetrics.availability,
            throughput:   simulationMetrics.throughput,
            monthlyCost:  simulationMetrics.monthlyCost,
            score:        simulationMetrics.score,
            allMetricsMet: simulationMetrics.allMetricsMet,
          }
        : undefined,
      missionPassed: simulationMetrics ? passed : undefined,
    };
    return () => { delete (window as any).__missionContext; };
  }, [mission, phase, simulationMetrics]);
}

export const MissionPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate  = useNavigate();
  const {
    activeMission, phase, setPhase, startMission, runSimulation,
    simulationMetrics, simulationXpGranted, isLoading, isSimulating, resetMission,
  } = useMissionStore();
  const { isOpen: chatOpen, toggleOpen: toggleChat, clearChat } = useChatStore();
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    if (slug) startMission(slug);
    return () => { resetMission(); clearChat(); };
  }, [slug]);

  // Register enriched mission context (including simulation results) for the chat store
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

  const phaseIdx      = PHASE_ORDER.indexOf(phase as typeof PHASE_ORDER[number]);
  const isBuilderPhase  = phase === 'builder';
  const isResultsPhase  = phase === 'results';
  const isLLDPhase      = phase === 'lld';
  const showChat        = isBuilderPhase || isResultsPhase;
  const hldPassed       = simulationMetrics ? simulationMetrics.score >= 60 : false;
  // LLD tab only unlocks if HLD passed
  const lldUnlocked     = hldPassed;
  const hasReference    = !!activeMission.referenceSolution;

  return (
    <div className={`flex flex-col ${isBuilderPhase || isResultsPhase ? 'h-[calc(100vh-56px)]' : 'min-h-[calc(100vh-56px)]'}`}>
      {/* Phase progress bar */}
      <div className="bg-gray-900/80 border-b border-gray-800 px-4 py-3 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="btn-ghost text-xs">← Dashboard</button>
          <div className="flex items-center gap-1">
            {PHASE_LABELS.map((label, i) => {
              const isLLDTab = i === 4;
              const disabled = i > phaseIdx + 1 || (isLLDTab && !lldUnlocked);
              return (
                <React.Fragment key={label}>
                  <button
                    disabled={disabled}
                    onClick={() => !disabled && i <= phaseIdx + 1 && setPhase(PHASE_ORDER[i])}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                      i === phaseIdx
                        ? 'bg-brand-600 text-white'
                        : i < phaseIdx
                        ? 'text-green-400 hover:bg-gray-800'
                        : disabled
                        ? 'text-gray-700 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-800'
                    }`}
                  >
                    {i < phaseIdx ? '✓ ' : ''}{label}{isLLDTab && !lldUnlocked ? ' 🔒' : ''}
                  </button>
                  {i < PHASE_LABELS.length - 1 && <span className="text-gray-700">›</span>}
                </React.Fragment>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            {/* Compare button — only in results phase when reference is available */}
            {isResultsPhase && hasReference && (
              <button
                onClick={() => setShowCompare(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border bg-purple-800/20 border-purple-600/50 text-purple-400 hover:text-purple-200 transition-all"
              >
                ⚖️ Compare
              </button>
            )}
            {showChat && (
              <button
                onClick={toggleChat}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                  chatOpen
                    ? 'bg-brand-600/20 border-brand-600/50 text-brand-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                }`}
                title={chatOpen ? 'Hide chat assistant' : 'Open chat assistant'}
              >
                🤖 {chatOpen ? 'Hide Chat' : isResultsPhase ? 'Explain Design' : 'Ask AI'}
              </button>
            )}
            {isResultsPhase && lldUnlocked && (
              <button
                onClick={() => setPhase('lld')}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border bg-yellow-800/20 border-yellow-600/50 text-yellow-400 hover:text-yellow-200 transition-all"
              >
                🔧 Go Deeper → LLD
              </button>
            )}
            <div className="text-xs text-gray-500">{activeMission.title}</div>
          </div>
        </div>
      </div>

      {/* Phase content */}
      <div className={`flex-1 min-h-0 ${isBuilderPhase || isResultsPhase ? 'flex overflow-hidden' : 'overflow-auto'}`}>
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
            {/* Builder takes remaining width */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <DragDropBuilder
                mission={activeMission}
                onSimulate={runSimulation}
                isSimulating={isSimulating}
              />
            </div>

            {/* Chat panel — slides in from right */}
            {chatOpen && (
              <div className="w-80 flex-shrink-0 border-l border-gray-800 overflow-hidden">
                <ChatAssistant missionSlug={activeMission.slug} />
              </div>
            )}
          </>
        )}
        {phase === 'results' && simulationMetrics && (
          <>
            {/* Results takes remaining width */}
            <div className="flex-1 min-w-0 overflow-auto">
              <SimulationResults
                metrics={simulationMetrics}
                mission={activeMission}
                xpGranted={simulationXpGranted}
                onRetry={() => setPhase('builder')}
              />
            </div>

            {/* Chat panel — slides in from right */}
            {chatOpen && (
              <div className="w-80 flex-shrink-0 border-l border-gray-800 overflow-hidden">
                <ChatAssistant missionSlug={activeMission.slug} />
              </div>
            )}
          </>
        )}
        {phase === 'lld' && (
          <div className="flex-1 overflow-auto">
            <LLDPhase missionSlug={activeMission.slug} />
          </div>
        )}
      </div>

      {/* Compare panel overlay */}
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
