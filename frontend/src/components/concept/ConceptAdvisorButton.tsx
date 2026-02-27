import React, { useState } from 'react';
import { ConceptAdvisorPanel } from './ConceptAdvisorPanel';

interface ConceptAdvisorButtonProps {
  simulationMode?: boolean;
}

export const ConceptAdvisorButton: React.FC<ConceptAdvisorButtonProps> = ({
  simulationMode = false,
}) => {
  const [open, setOpen] = useState(false);

  if (simulationMode) return null;

  return (
    <>
      {/* Floating persistent button — bottom-right of the screen */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-full shadow-lg shadow-brand-900/40 font-medium text-sm transition-all hover:scale-105 active:scale-95"
        title="What should I learn next?"
      >
        <span className="text-base">🧠</span>
        <span>What should I learn?</span>
      </button>

      <ConceptAdvisorPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        simulationMode={simulationMode}
      />
    </>
  );
};
