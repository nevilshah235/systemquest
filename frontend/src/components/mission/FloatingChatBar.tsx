import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore, ChatMessage } from '../../stores/chatStore';
import { COMPONENT_META, ComponentType } from '../../data/types';

// ── SVG Robot Logo (Arch Assistant) ──────────────────────────────────────────
// Swappable: pass logoSrc prop to use a custom image asset instead.
// Colour palette: #4F7FFF (brand blue) / #93AEFF (light blue) / #1A2F6A (dark navy)
const RobotLogo: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Antenna */}
    <line x1="16" y1="3.5" x2="16" y2="8.5" stroke="#93AEFF" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="16" cy="2.5" r="1.8" fill="#4F7FFF" />

    {/* Head */}
    <rect x="6" y="9" width="20" height="14" rx="5" fill="#1A2F6A" stroke="#4F7FFF" strokeWidth="1.5" />

    {/* Eyes */}
    <circle cx="11.5" cy="15" r="2.5" fill="#93AEFF" opacity="0.9" />
    <circle cx="20.5" cy="15" r="2.5" fill="#93AEFF" opacity="0.9" />
    {/* Eye highlights */}
    <circle cx="12.2" cy="14.2" r="0.9" fill="white" />
    <circle cx="21.2" cy="14.2" r="0.9" fill="white" />

    {/* Smile */}
    <path d="M12 19.5 Q16 22 20 19.5" stroke="#93AEFF" strokeWidth="1.4" strokeLinecap="round" fill="none" />

    {/* Neck */}
    <rect x="13.5" y="23" width="5" height="3" fill="#1A2F6A" />

    {/* Body */}
    <rect x="9" y="26" width="14" height="5" rx="3" fill="#1A2F6A" stroke="#4F7FFF" strokeWidth="1" />

    {/* Chest indicator dots */}
    <circle cx="13" cy="28.5" r="1" fill="#4F7FFF" opacity="0.7" />
    <circle cx="16" cy="28.5" r="1" fill="#4F7FFF" opacity="0.7" />
    <circle cx="19" cy="28.5" r="1" fill="#4F7FFF" opacity="0.7" />
  </svg>
);

// ── Lightweight markdown renderer (bold + newlines) ──────────────────────
function renderMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    const lines = part.split('\n');
    return lines.map((line, j) => (
      <React.Fragment key={`${i}-${j}`}>
        {line}
        {j < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  });
}

// ── Action badge ──────────────────────────────────────────────────────────────
interface ActionProps {
  type: string;
  componentType?: string;
  fromType?: string;
  toType?: string;
}
function ActionBadge({ action }: { action: ActionProps }) {
  if (action.type === 'add_component' && action.componentType) {
    const meta = COMPONENT_META[action.componentType as ComponentType];
    if (!meta) return null;
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-brand-900/60 text-brand-300 border border-brand-700/50 rounded-full px-2 py-0.5">
        {meta.icon} Added {meta.label}
      </span>
    );
  }
  if (action.type === 'connect') {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-green-900/40 text-green-300 border border-green-700/50 rounded-full px-2 py-0.5">
        🔗 Connected {action.fromType} → {action.toType}
      </span>
    );
  }
  return null;
}

// ── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-brand-600 text-white rounded-tr-sm'
            : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700/50'
        }`}
      >
        {isUser ? msg.content : renderMarkdown(msg.content)}
      </div>

      {!isUser && msg.actions && msg.actions.length > 0 && (
        <div className="flex flex-wrap gap-1 max-w-[88%]">
          {msg.actions.map((a, i) => (
            <ActionBadge key={i} action={a} />
          ))}
        </div>
      )}

      <span className="text-[10px] text-gray-600 px-1">
        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-start">
      <div className="bg-gray-800 border border-gray-700/50 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Quick prompts ──────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { label: '💡 Hint',    text: 'What should I add next?' },
  { label: '⚡ Latency', text: 'How do I reduce latency?' },
  { label: '📈 Scale',   text: 'How do I increase throughput?' },
  { label: '🛡️ Uptime',  text: 'How do I improve availability?' },
];

// ── Session storage key for first-visit attention animation ──────────────────
const ATTENTION_KEY = 'arch-assistant-attention-shown';

// ── FloatingChatBar ──────────────────────────────────────────────────────────────

export interface FloatingChatBarProps {
  missionSlug: string;
  /** Optional: swap the built-in SVG robot for a custom image URL */
  logoSrc?: string;
}

export const FloatingChatBar: React.FC<FloatingChatBarProps> = ({ missionSlug, logoSrc }) => {
  const { messages, isLoading, isOpen, toggleOpen, sendMessage, clearChat } = useChatStore();
  const [input, setInput] = useState('');
  /** Count of new assistant messages received while panel was collapsed */
  const [unreadCount, setUnreadCount] = useState(0);
  /** Controls the slide-in entrance animation */
  const [mounted, setMounted] = useState(false);
  /** Controls the one-time attention ring ping (first visit per session) */
  const [showAttentionRing, setShowAttentionRing] = useState(false);
  /** Controls the floating "Ask Arch Assistant →" nudge label */
  const [showNudge, setShowNudge] = useState(false);
  /** Detects macOS for keyboard shortcut hint */
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const prevLenRef = useRef(messages.length);

  // ── Slide-in entrance on mount ──────────────────────────────────────────────
  useEffect(() => {
    // Small delay so the CSS transition fires after the first paint
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // ── One-time attention ring + nudge label (first visit per session) ─────────
  useEffect(() => {
    const alreadyShown = sessionStorage.getItem(ATTENTION_KEY);
    if (!alreadyShown) {
      // Show the nudge label after 1.5 s
      const nudgeTimer = setTimeout(() => setShowNudge(true), 1500);
      // Show the ring ping briefly
      const ringTimer = setTimeout(() => setShowAttentionRing(true), 800);
      // Hide ring after 2.4 s (3 pings)
      const ringOff = setTimeout(() => setShowAttentionRing(false), 3200);
      // Hide nudge after 4 s
      const nudgeOff = setTimeout(() => setShowNudge(false), 5000);
      // Mark as shown so it won't fire again this session
      sessionStorage.setItem(ATTENTION_KEY, '1');
      return () => {
        clearTimeout(nudgeTimer);
        clearTimeout(ringTimer);
        clearTimeout(ringOff);
        clearTimeout(nudgeOff);
      };
    }
  }, []);

  // ── Global keyboard shortcut: Ctrl+/ or Cmd+/ to toggle chat ───────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleOpen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleOpen]);

  // Track unread assistant messages while collapsed
  useEffect(() => {
    const newLen = messages.length;
    if (newLen > prevLenRef.current && !isOpen) {
      const newMsgs      = messages.slice(prevLenRef.current);
      const newAssistant = newMsgs.filter((m) => m.role === 'assistant').length;
      if (newAssistant > 0) setUnreadCount((c) => c + newAssistant);
    }
    prevLenRef.current = newLen;
  }, [messages, isOpen]);

  // Clear unread badge when panel opens
  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  // Auto-scroll to bottom when messages change or panel opens
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isOpen]);

  // Auto-focus input when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen]);

  // Dismiss nudge as soon as the user opens the panel
  useEffect(() => {
    if (isOpen) setShowNudge(false);
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    await sendMessage(text, missionSlug);
    inputRef.current?.focus();
  }, [input, isLoading, sendMessage, missionSlug]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = messages.length === 0;

  /** Resolves the logo element — custom image or built-in SVG */
  const logoEl = logoSrc
    ? <img src={logoSrc} alt="Arch Assistant" className="w-7 h-7 object-contain flex-shrink-0" />
    : <RobotLogo size={28} />;

  /** Keyboard shortcut label adapts to OS */
  const shortcutHint = isMac ? '⌘/ to open' : 'Ctrl+/ to open';

  return (
    /**
     * Fixed bottom-right container.
     * Slides in from the right on mount via translate-x transition.
     * pointer-events are none on the wrapper so the canvas below stays
     * interactive outside the bar footprint; re-enabled on each child.
     */
    <div
      className={`
        fixed bottom-6 right-6 z-50 flex flex-col items-end
        transition-transform duration-500 ease-out
        ${mounted ? 'translate-x-0' : 'translate-x-[calc(100%+1.5rem)]'}
      `}
      style={{ pointerEvents: 'none' }}
    >
      {/* ── Floating nudge label — appears briefly on first visit ──────────── */}
      <div
        className={`
          mb-3 mr-1 px-3 py-1.5 rounded-xl
          bg-brand-600 text-white text-xs font-medium
          shadow-lg shadow-brand-900/40
          flex items-center gap-1.5
          transition-all duration-400
          ${showNudge ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
        `}
        style={{ pointerEvents: showNudge ? 'auto' : 'none' }}
        aria-hidden={!showNudge}
      >
        <span>Ask Arch Assistant</span>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>

      {/* ── Expanded chat panel ───────────────────────────────────────────── */}
      <div
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        className={`
          w-[390px] mb-2 rounded-2xl overflow-hidden
          border border-gray-700/80 bg-gray-950
          flex flex-col
          shadow-2xl shadow-black/60
          transition-all duration-300 ease-out
          ${
            isOpen
              ? 'opacity-100 max-h-[560px]'
              : 'opacity-0 max-h-0'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/70 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {logoEl}
            <div>
              <p className="text-sm font-semibold text-white leading-none">Arch Assistant</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Ask anything about architecture</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-2 py-1 rounded hover:bg-gray-800"
                title="Clear chat history"
              >
                Clear
              </button>
            )}
            {/* Collapse chevron */}
            <button
              onClick={toggleOpen}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
              title={`Collapse chat (${isMac ? '⌘/' : 'Ctrl+/'})`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Message thread */}
        <div
          className="flex-1 overflow-y-auto px-3 py-4 space-y-3"
          style={{ maxHeight: '360px' }}
        >
          {/* Empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center gap-4 text-center px-4 py-6">
              <div className="text-4xl">🏗️</div>
              <div>
                <p className="text-sm font-medium text-gray-300 mb-1">Your Architecture Assistant</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Ask me to explain components, help you meet requirements, or say &ldquo;add a cache&rdquo; and I&apos;ll place it for you.
                </p>
              </div>
              {/* Quick prompt grid */}
              <div className="grid grid-cols-2 gap-2 w-full mt-1">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => { setInput(q.text); setTimeout(() => inputRef.current?.focus(), 50); }}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl px-3 py-2 border border-gray-700 transition-colors text-left"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isEmpty && messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompt strip (when thread has messages) */}
        {!isEmpty && (
          <div className="flex gap-1.5 px-3 py-2 overflow-x-auto flex-shrink-0 border-t border-gray-800/50">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q.label}
                onClick={() => sendMessage(q.text, missionSlug)}
                disabled={isLoading}
                className="text-[11px] bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-400 rounded-full px-2.5 py-1 border border-gray-700 transition-colors whitespace-nowrap flex-shrink-0"
              >
                {q.label}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="px-3 pb-3 pt-2 border-t border-gray-800 flex-shrink-0">
          <div className="flex items-end gap-2 bg-gray-800 rounded-2xl px-3 py-2 border border-gray-700 focus-within:border-brand-600 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about architecture or say 'add cache'…"
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-600 resize-none focus:outline-none disabled:opacity-50 max-h-28 leading-relaxed"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-gray-700 disabled:opacity-40 flex items-center justify-center transition-colors"
              title="Send message"
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-gray-700 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>

      {/* ── Floating trigger bar ──────────────────────────────────────────── */}
      <div className="relative flex-shrink-0" style={{ pointerEvents: 'auto' }}>
        {/*
          Attention ring ping — fires once per session on first visit.
          Uses an absolutely-positioned pseudo-ring that animates outward.
        */}
        {showAttentionRing && (
          <span className="absolute inset-0 rounded-2xl animate-ping bg-brand-500/30 pointer-events-none" />
        )}

        <button
          onClick={toggleOpen}
          className={`
            relative flex items-center gap-3 px-4 py-3 rounded-2xl
            border cursor-pointer select-none
            transition-all duration-200
            ${
              isOpen
                ? 'bg-gray-900 border-brand-600/70 text-white shadow-xl shadow-black/40'
                : 'bg-gray-900 border-gray-700/80 hover:border-brand-600/60 text-gray-200 hover:text-white shadow-xl shadow-black/40 hover:shadow-brand-900/30'
            }
          `}
          style={{
            // Subtle brand glow in closed state to improve visibility against dark canvas
            boxShadow: isOpen
              ? undefined
              : '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(79,127,255,0.12), 0 4px 16px rgba(79,127,255,0.08)',
          }}
          aria-label={isOpen ? 'Collapse Arch Assistant' : 'Open Arch Assistant'}
          title={isOpen ? `Collapse (${isMac ? '⌘/' : 'Ctrl+/'})` : `Open Arch Assistant (${isMac ? '⌘/' : 'Ctrl+/'})`}
        >
          {/* Logo with online status dot */}
          <div className="relative flex-shrink-0">
            {logoEl}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-gray-900 block" />
          </div>

          {/* Label */}
          <div className="text-left">
            <p className="text-sm font-semibold leading-none">Arch Assistant</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {isOpen ? `${isMac ? '⌘/' : 'Ctrl+/'} to close` : shortcutHint}
            </p>
          </div>

          {/* Unread badge — pulsing when new messages arrive while collapsed */}
          {unreadCount > 0 && !isOpen && (
            <div className="ml-1 flex-shrink-0 min-w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center px-1.5 animate-pulse">
              <span className="text-[11px] font-bold text-white leading-none">{unreadCount}</span>
            </div>
          )}

          {/* Chevron rotates when open */}
          <svg
            className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ml-auto ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};
