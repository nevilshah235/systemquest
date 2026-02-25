import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMissionStore } from '../stores/missionStore';
import { MissionBriefing } from '../components/mission/MissionBriefing';
import { RequirementsPhase } from '../components/mission/RequirementsPhase';
import { DragDropBuilder } from '../components/builder/DragDropBuilder';
import { SimulationResults } from '../components/mission/SimulationResults';

const PHASE_LABELS = ['Briefing', 'Requirements', 'Builder', 'Results'];
const PHASE_ORDER = ['briefing', 'requirements', 'builder', 'results'] as const;

export const MissionPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { activeMission, phase, setPhase, startMission, runSimulation, simulationMetrics, isLoading, isSimulating, resetMission } = useMissionStore();

  useEffect(() => {
    if (slug) startMission(slug);
    return () => { resetMission(); };
  }, [slug]);

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

  const phaseIdx = PHASE_ORDER.indexOf(phase as typeof PHASE_ORDER[number]);

  return (
    <div className={`flex flex-col ${phase === 'builder' ? 'h-[calc(100vh-56px)]' : 'min-h-[calc(100vh-56px)]'}`}>
      {/* Phase progress bar */}
      <div className="bg-gray-900/80 border-b border-gray-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="btn-ghost text-xs">← Dashboard</button>
          <div className="flex items-center gap-1">
            {PHASE_LABELS.map((label, i) => (
              <React.Fragment key={label}>
                <button
                  disabled={i > phaseIdx + 1}
                  onClick={() => i <= phaseIdx && setPhase(PHASE_ORDER[i])}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                    i === phaseIdx
                      ? 'bg-brand-600 text-white'
                      : i < phaseIdx
                      ? 'text-green-400 hover:bg-gray-800'
                      : 'text-gray-600'
                  }`}
                >
                  {i < phaseIdx ? '✓ ' : ''}{label}
                </button>
                {i < PHASE_LABELS.length - 1 && <span className="text-gray-700">›</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="text-xs text-gray-500">{activeMission.title}</div>
        </div>
      </div>

      {/* Phase content */}
      <div className={`flex-1 ${phase === 'builder' ? 'overflow-hidden' : 'overflow-auto'}`}>
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
          <DragDropBuilder
            mission={activeMission}
            onSimulate={runSimulation}
            isSimulating={isSimulating}
          />
        )}
        {phase === 'results' && simulationMetrics && (
          <SimulationResults
            metrics={simulationMetrics}
            mission={activeMission}
            onRetry={() => setPhase('builder')}
          />
        )}
      </div>
    </div>
  );
};
