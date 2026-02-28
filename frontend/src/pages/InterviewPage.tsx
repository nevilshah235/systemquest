import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMissionStore } from '../stores/missionStore';
import { DragDropBuilder } from '../components/builder/DragDropBuilder';
import { useBuilderStore } from '../stores/builderStore';
import { apiClient } from '../data/api';

interface FollowupQuestion {
  id: string;
  question: string;
  dimension: string;
}

interface SessionStart {
  sessionId: string;
  missionTitle: string;
  durationMinutes: number;
  startedAt: string;
  followupScheduledAt: number;
}

interface InterviewResult {
  totalScore: number;
  grade: string;
  rubricScores: {
    correctness: number;
    depth: number;
    tradeoffs: number;
    apiDesign: number;
    timeManagement: number;
  };
  feedback: string[];
  xpEarned: number;
}

const GRADE_COLORS: Record<string, string> = {
  'Exceptional':     'text-brand-400 border-brand-500/50 bg-brand-900/20',
  'Strong Hire':     'text-green-400 border-green-500/50 bg-green-900/20',
  'Hire':            'text-blue-400 border-blue-500/50 bg-blue-900/20',
  'No Hire':         'text-yellow-400 border-yellow-500/50 bg-yellow-900/20',
  'Strong No Hire':  'text-red-400 border-red-500/50 bg-red-900/20',
};

const RUBRIC_DIMS = [
  { key: 'correctness',    label: 'Correctness',     max: 25, icon: '🎯' },
  { key: 'depth',          label: 'Depth',           max: 20, icon: '🔍' },
  { key: 'tradeoffs',      label: 'Trade-offs',      max: 20, icon: '⚖️' },
  { key: 'apiDesign',      label: 'API Design',      max: 20, icon: '📡' },
  { key: 'timeManagement', label: 'Time Management', max: 15, icon: '⏱️' },
] as const;

export const InterviewPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate  = useNavigate();
  const { startMission, activeMission, resetMission, isLoading } = useMissionStore();
  const { components, connections } = useBuilderStore();

  const [phase, setPhase] = useState<'briefing' | 'active' | 'followup' | 'result'>('briefing');
  const [session, setSession]           = useState<SessionStart | null>(null);
  const [elapsed, setElapsed]           = useState(0);
  const [followup, setFollowup]         = useState<FollowupQuestion | null>(null);
  const [answer, setAnswer]             = useState('');
  const [result, setResult]             = useState<InterviewResult | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [followupAsked, setFollowupAsked] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (slug) startMission(slug);
    return () => { resetMission(); if (timerRef.current) clearInterval(timerRef.current); };
  }, [slug]);

  const startSession = async () => {
    if (!slug) return;
    try {
      const data = await apiClient.post<SessionStart>('/interview/start', {
        missionSlug: slug, durationMinutes: 45,
      });
      setSession(data);
      setPhase('active');
      timerRef.current = setInterval(() => {
        setElapsed((s) => s + 1);
      }, 1000);
    } catch { /* silent */ }
  };

  // Inject follow-up at 50% elapsed
  useEffect(() => {
    if (!session || phase !== 'active' || followupAsked) return;
    if (elapsed >= session.followupScheduledAt) {
      setFollowupAsked(true);
      apiClient.post<{ question: FollowupQuestion | null }>(`/interview/${session.sessionId}/followup`)
        .then((res) => {
          if (res.question) {
            setFollowup(res.question);
            setPhase('followup');
            if (timerRef.current) clearInterval(timerRef.current);
          }
        });
    }
  }, [elapsed, session, phase, followupAsked]);

  const resumeAfterFollowup = async () => {
    if (!session || !followup) return;
    // Save answer
    await apiClient.post(`/interview/${session.sessionId}/answer`, {
      questionId: followup.id, answer,
    });
    setPhase('active');
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  };

  const submitInterview = useCallback(async () => {
    if (!session) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const architecture = { components, connections };
      const res = await apiClient.post<InterviewResult>(`/interview/${session.sessionId}/submit`, {
        architecture, elapsedSeconds: elapsed,
      });
      setResult(res);
      setPhase('result');
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  }, [session, components, connections, elapsed]);

  const formatTime = (secs: number) => {
    const allowedSecs = (session?.durationMinutes ?? 45) * 60;
    const remaining = Math.max(0, allowedSecs - secs);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isOverTime = session ? elapsed > session.durationMinutes * 60 : false;

  if (isLoading || !activeMission) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="bg-gray-900/80 border-b border-gray-800 px-4 py-3 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="btn-ghost text-xs">← Exit</button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white">{activeMission.title}</span>
            <span className="text-xs text-gray-500">Interview Mode</span>
          </div>
          <div className="flex items-center gap-3">
            {phase === 'active' && session && (
              <div className={`font-mono text-sm font-bold px-3 py-1 rounded-full border ${
                isOverTime ? 'text-red-400 border-red-500/50 bg-red-900/20 animate-pulse' :
                elapsed > session.durationMinutes * 60 * 0.8 ? 'text-yellow-400 border-yellow-500/50 bg-yellow-900/20' :
                'text-green-400 border-green-500/50 bg-green-900/20'
              }`}>
                {isOverTime ? '+' : ''}{formatTime(elapsed)}
              </div>
            )}
            {phase === 'active' && (
              <button
                onClick={submitInterview}
                disabled={submitting}
                className="btn-primary text-xs px-4 py-1.5"
              >
                {submitting ? 'Submitting…' : 'Submit →'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Briefing */}
        {phase === 'briefing' && (
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4">🎙️</div>
              <h1 className="text-2xl font-bold text-white mb-2">Interview Simulation</h1>
              <p className="text-gray-400">
                You have <strong className="text-white">45 minutes</strong> to design {activeMission.title}.
                A follow-up question will be injected at the midpoint — just like a real FAANG interview.
              </p>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-5 space-y-3">
              <h3 className="font-semibold text-white">How it works</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2"><span className="text-brand-400">1.</span> Design the architecture using the canvas</li>
                <li className="flex items-start gap-2"><span className="text-brand-400">2.</span> At 50% time elapsed, a follow-up question appears — answer it and continue</li>
                <li className="flex items-start gap-2"><span className="text-brand-400">3.</span> Submit before time runs out for maximum score</li>
                <li className="flex items-start gap-2"><span className="text-brand-400">4.</span> Scored on 5 dimensions: Correctness, Depth, Trade-offs, API Design, Time Management</li>
              </ul>
            </div>
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
              <p className="text-sm text-yellow-300">
                ⚠️ Once you start, the timer begins immediately. The Concept Advisor is disabled during simulation.
              </p>
            </div>
            <button onClick={startSession} className="btn-primary w-full py-3 text-base">
              Start Interview →
            </button>
          </div>
        )}

        {/* Active builder */}
        {(phase === 'active') && (
          <DragDropBuilder
            mission={activeMission}
            onSimulate={async () => {}}
            isSimulating={false}
            interviewMode
          />
        )}

        {/* Follow-up overlay */}
        <AnimatePresence>
          {phase === 'followup' && followup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-40"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
              >
                <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
                  <span>🎙️</span> Interviewer Follow-up
                </div>
                <p className="text-white text-base leading-relaxed">
                  "{followup.question}"
                </p>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                  placeholder="Type your answer here — then continue designing..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500 resize-none"
                />
                <button
                  onClick={resumeAfterFollowup}
                  disabled={!answer.trim()}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  Continue →
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {phase === 'result' && result && (
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 overflow-auto h-full">
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <h2 className="text-2xl font-bold text-white mb-2">Interview Complete</h2>
              <div className={`inline-block border rounded-full px-6 py-2 text-lg font-bold ${GRADE_COLORS[result.grade] ?? ''}`}>
                {result.grade}
              </div>
              <div className="text-3xl font-bold text-white mt-3">
                {result.totalScore}<span className="text-gray-500 text-xl">/100</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">+{result.xpEarned} XP earned</div>
            </div>

            {/* Rubric breakdown */}
            <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">5-Dimension Rubric</h3>
              {RUBRIC_DIMS.map(({ key, label, max, icon }) => {
                const score = result.rubricScores[key];
                const pct = (score / max) * 100;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">{icon} {label}</span>
                      <span className="text-white font-medium">{score}<span className="text-gray-600">/{max}</span></span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full">
                      <div
                        className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              {result.feedback.map((fb, i) => (
                <div key={i} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5">→</span>
                  {fb}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">
                ← Dashboard
              </button>
              <button onClick={() => { setPhase('briefing'); setElapsed(0); setResult(null); setFollowupAsked(false); }} className="btn-primary flex-1">
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
