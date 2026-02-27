import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '../../data/api';

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

interface LLDData {
  missionSlug: string;
  missionTitle: string;
  hldCompleted: boolean;
  lldContent: { prompt: string; keyEntities: string[]; apiHints: string[] } | null;
  previousAttempt: {
    classDesign: string; apiContracts: string; dataSchema: string;
    score: number; feedback: LLDFeedbackItem[];
  } | null;
}

interface LLDPhaseProps {
  missionSlug: string;
  onXpEarned?: (xp: number) => void;
}

const FEEDBACK_COLORS = {
  success: 'text-green-400 border-green-500/30 bg-green-900/20',
  warning: 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20',
  error: 'text-red-400 border-red-500/30 bg-red-900/20',
};

const FEEDBACK_ICONS = { success: '✅', warning: '⚠️', error: '❌' };

export const LLDPhase: React.FC<LLDPhaseProps> = ({ missionSlug, onXpEarned }) => {
  const [lldData, setLldData]       = useState<LLDData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState<LLDResult | null>(null);
  const [classDesign, setClassDesign]   = useState('');
  const [apiContracts, setApiContracts] = useState('');
  const [dataSchema, setDataSchema]     = useState('');

  useEffect(() => {
    apiClient.get<LLDData>(`/lld/${missionSlug}`)
      .then((data) => {
        setLldData(data);
        if (data.previousAttempt) {
          setClassDesign(data.previousAttempt.classDesign);
          setApiContracts(data.previousAttempt.apiContracts);
          setDataSchema(data.previousAttempt.dataSchema);
        }
      })
      .catch(() => {/* LLD not available */})
      .finally(() => setLoading(false));
  }, [missionSlug]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await apiClient.post<LLDResult>(`/lld/${missionSlug}/submit`, {
        classDesign, apiContracts, dataSchema,
      });
      setResult(res);
      if (res.xpEarned > 0) onXpEarned?.(res.xpEarned);
    } catch {/* handled silently */}
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="text-gray-400 animate-pulse">Loading LLD phase...</div>
    </div>
  );

  if (!lldData) return null; // LLD not available for this mission

  if (!lldData.hldCompleted) return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-center">
      <div className="text-4xl mb-4">🔒</div>
      <h2 className="text-xl font-bold text-white mb-2">Complete HLD First</h2>
      <p className="text-gray-400">
        Finish the architecture (HLD) phase with a passing score to unlock Low-Level Design.
      </p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 py-6 space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🔧</span> Low-Level Design
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Now go deeper — define the classes, API contracts, and data schema for <strong className="text-white">{lldData.missionTitle}</strong>.
        </p>
      </div>

      {/* Hints from reference content */}
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

      {/* Form */}
      <div className="space-y-4">
        {/* Class Design */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🏗️ Class / Entity Design <span className="text-gray-500 font-normal">(40 pts)</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Define your core classes/entities, their key attributes, and relationships. Example: User has id, email, profilePicture. Message has id, senderId, chatId, content, createdAt.
          </p>
          <textarea
            value={classDesign}
            onChange={(e) => setClassDesign(e.target.value)}
            rows={5}
            placeholder="User: id (UUID), email (string), username (string), createdAt (timestamp)&#10;Message: id (UUID), senderId (FK → User), chatId (FK → Chat), content (text), type (enum: text|media), sentAt (timestamp)&#10;Chat: id (UUID), participants (User[]), lastMessageId (FK → Message), createdAt..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500 resize-none font-mono"
          />
        </div>

        {/* API Contracts */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            📡 API Contracts <span className="text-gray-500 font-normal">(35 pts)</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Define your key API endpoints with HTTP method, path, request body, and response shape.
          </p>
          <textarea
            value={apiContracts}
            onChange={(e) => setApiContracts(e.target.value)}
            rows={5}
            placeholder="POST /api/messages&#10;  Request: { chatId: string, content: string, type: 'text' | 'media' }&#10;  Response: { messageId: string, sentAt: string }&#10;&#10;GET /api/chats/:chatId/messages?limit=50&before=<cursor>&#10;  Response: { messages: Message[], nextCursor: string | null }"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500 resize-none font-mono"
          />
        </div>

        {/* Data Schema */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🗄️ Data Schema <span className="text-gray-500 font-normal">(25 pts)</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Define your database tables/collections with columns, types, and indexes.
          </p>
          <textarea
            value={dataSchema}
            onChange={(e) => setDataSchema(e.target.value)}
            rows={5}
            placeholder="messages table:&#10;  id UUID PRIMARY KEY&#10;  chat_id UUID NOT NULL REFERENCES chats(id)&#10;  sender_id UUID NOT NULL REFERENCES users(id)&#10;  content TEXT NOT NULL&#10;  created_at TIMESTAMP DEFAULT NOW()&#10;  INDEX ON (chat_id, created_at DESC)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500 resize-none font-mono"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting || (!classDesign && !apiContracts && !dataSchema)}
          className="btn-primary px-8 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Scoring…' : 'Submit LLD →'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Score */}
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

          {/* Feedback */}
          <div className="space-y-2">
            {result.feedback.map((fb, i) => (
              <div key={i} className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${FEEDBACK_COLORS[fb.type]}`}>
                <span>{FEEDBACK_ICONS[fb.type]}</span>
                <span>{fb.message}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
