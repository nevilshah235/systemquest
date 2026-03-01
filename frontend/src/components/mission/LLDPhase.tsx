/**
 * LLDPhase — LLD phase orchestrator.
 *
 * When the mission has an lldConfig (interactive builder):
 *   → mounts LLDBuilder with the structured interactive experience.
 *
 * When no lldConfig (legacy missions or missions not yet configured):
 *   → falls back to the original textarea-based LLD form.
 *
 * Both paths share the same HLD-unlock guard.
 *
 * Bugfix: no longer returns null when apiResponse is unavailable.
 * Returning null left the content area blank, forcing users to hit
 * browser-back, which remounted MissionPage and reset phase to 'briefing'.
 * Now renders a proper fallback screen with an explicit Back button.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '../../data/api';
import { useLLDConfig } from '../../hooks/useLLDConfig';
import { LLDBuilder } from '../builder/lld/LLDBuilder';
import type { LLDApiResponse } from '../../data/lldTypes';

// ── Legacy textarea types (retained for fallback path) ───────────────────────

interface LLDFeedbackItem {
  type: 'success' | 'warning' | 'error';
  dimension: string;
  message: string;
}

interface LLDResult {
  score: number;
  xpEarned: number;
  feedback: LLDFeedbackItem[];
  breakdown: { classDesign: number; apiContracts: number; dataSchema: number };
  referenceUnlocked: boolean;
}

const FEEDBACK_COLORS = {
  success: 'text-green-400 border-green-500/30 bg-green-900/20',
  warning: 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20',
  error: 'text-red-400 border-red-500/30 bg-red-900/20',
};
const FEEDBACK_ICONS = { success: '\u2705', warning: '\u26a0\ufe0f', error: '\u274c' };

// ── Props ─────────────────────────────────────────────────────────────────────

interface LLDPhaseProps {
  missionSlug: string;
  onXpEarned?: (xp: number) => void;
  /** Called when the user wants to go back to the Results phase */
  onBack?: () => void;
}

// ── HLD Lock Screen ───────────────────────────────────────────────────────────

const HLDLockScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => (
  <div className="max-w-2xl mx-auto px-4 py-12 text-center">
    <div className="text-4xl mb-4">🔒</div>
    <h2 className="text-xl font-bold text-white mb-2">Complete HLD First</h2>
    <p className="text-gray-400 mb-6">
      Finish the architecture (HLD) phase with a passing score to unlock Low-Level Design.
    </p>
    {onBack && (
      <button onClick={onBack} className="btn-secondary">
        ← Back to Results
      </button>
    )}
  </div>
);

// ── LLD Not Available Screen ──────────────────────────────────────────────────
// Shown when apiResponse is null (mission not configured for LLD yet).
// Previously returned null, causing a blank page that forced browser-back
// and reset the mission phase to 'briefing'.

const LLDNotAvailableScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => (
  <div className="max-w-2xl mx-auto px-4 py-12 text-center">
    <div className="text-4xl mb-4">🛠️</div>
    <h2 className="text-xl font-bold text-white mb-2">LLD Coming Soon</h2>
    <p className="text-gray-400 mb-6">
      Low-Level Design for this mission is being prepared. Check back soon,
      or go back and explore the results.
    </p>
    {onBack && (
      <button onClick={onBack} className="btn-secondary">
        ← Back to Results
      </button>
    )}
  </div>
);

// ── Legacy Textarea Form ──────────────────────────────────────────────────────

const LLDLegacyForm: React.FC<{
  missionSlug: string;
  lldData: LLDApiResponse;
  onXpEarned?: (xp: number) => void;
}> = ({ missionSlug, lldData, onXpEarned }) => {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LLDResult | null>(null);
  const [classDesign, setClassDesign] = useState(lldData.previousAttempt?.classDesign ?? '');
  const [apiContracts, setApiContracts] = useState(lldData.previousAttempt?.apiContracts ?? '');
  const [dataSchema, setDataSchema] = useState(lldData.previousAttempt?.dataSchema ?? '');

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await apiClient.post<LLDResult>(`/lld/${missionSlug}/submit`, {
        classDesign, apiContracts, dataSchema,
      });
      setResult(res);
      if (res.xpEarned > 0) onXpEarned?.(res.xpEarned);
    } catch { /* handled silently */ }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">
      {lldData.lldContent && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-2">
          <div className="text-sm font-medium text-blue-300">💡 Design Prompt</div>
          <p className="text-sm text-gray-300">{lldData.lldContent.prompt}</p>
          {lldData.lldContent.keyEntities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-xs text-gray-500">Key entities:</span>
              {lldData.lldContent.keyEntities.map(e => (
                <span key={e} className="text-xs bg-blue-900/30 text-blue-300 border border-blue-700/40 px-2 py-0.5 rounded-full">{e}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          🏗️ Class / Entity Design <span className="text-gray-500 font-normal">(40 pts)</span>
        </label>
        <textarea
          value={classDesign}
          onChange={e => setClassDesign(e.target.value)}
          rows={5}
          placeholder="User: id (UUID), email (string), username (string)&#10;Message: id (UUID), senderId (FK → User), content (text)..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm
            text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500
            resize-none font-mono"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          📡 API Contracts <span className="text-gray-500 font-normal">(35 pts)</span>
        </label>
        <textarea
          value={apiContracts}
          onChange={e => setApiContracts(e.target.value)}
          rows={5}
          placeholder="POST /api/messages&#10;  Request: { chatId: string, content: string }&#10;  Response: { messageId: string, sentAt: string }"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm
            text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500
            resize-none font-mono"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          🗄️ Data Schema <span className="text-gray-500 font-normal">(25 pts)</span>
        </label>
        <textarea
          value={dataSchema}
          onChange={e => setDataSchema(e.target.value)}
          rows={5}
          placeholder="messages table:&#10;  id UUID PRIMARY KEY&#10;  chat_id UUID NOT NULL REFERENCES chats(id)&#10;  INDEX ON (chat_id, created_at DESC)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm
            text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500
            resize-none font-mono"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting || (!classDesign && !apiContracts && !dataSchema)}
          className="btn-primary px-8 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Scoring…' : 'Submit LLD →'}
        </button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-5 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-white">
                {result.score}<span className="text-gray-500 text-xl">/100</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">+{result.xpEarned} XP earned</div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-white">{result.breakdown.classDesign}<span className="text-gray-600 text-sm">/40</span></div>
                <div className="text-xs text-gray-500">Classes</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{result.breakdown.apiContracts}<span className="text-gray-600 text-sm">/35</span></div>
                <div className="text-xs text-gray-500">APIs</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{result.breakdown.dataSchema}<span className="text-gray-600 text-sm">/25</span></div>
                <div className="text-xs text-gray-500">Schema</div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {result.feedback.map((fb, i) => (
              <div key={i} className={`flex items-start gap-2 rounded-lg border p-3 text-sm
                ${FEEDBACK_COLORS[fb.type as keyof typeof FEEDBACK_COLORS]}`}>
                <span>{FEEDBACK_ICONS[fb.type as keyof typeof FEEDBACK_ICONS]}</span>
                <span>{fb.message}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

export const LLDPhase: React.FC<LLDPhaseProps> = ({ missionSlug, onXpEarned, onBack }) => {
  const { config, apiResponse, isLoading } = useLLDConfig(missionSlug);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400 animate-pulse">Loading LLD phase…</div>
      </div>
    );
  }

  // LLD not configured for this mission — show a fallback instead of null.
  // Returning null previously left a blank screen, forcing browser-back
  // which remounted MissionPage and reset phase to 'briefing'.
  if (!apiResponse) return <LLDNotAvailableScreen onBack={onBack} />;

  // HLD not completed — show lock screen with back button
  if (!apiResponse.hldCompleted) return <HLDLockScreen onBack={onBack} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 py-6 space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🔧</span> Low-Level Design
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Go deeper — define the architecture details, entities, API contracts, and data schema for{' '}
          <strong className="text-white">{apiResponse.missionTitle}</strong>.
        </p>
      </div>

      {config ? (
        <LLDBuilder
          missionSlug={missionSlug}
          config={config}
          previousState={apiResponse.previousAttempt?.lldState}
          onXpEarned={onXpEarned}
        />
      ) : (
        <LLDLegacyForm
          missionSlug={missionSlug}
          lldData={apiResponse}
          onXpEarned={onXpEarned}
        />
      )}
    </motion.div>
  );
};
