import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore, ChatMessage } from '../../stores/chatStore';
import { COMPONENT_META, ComponentType } from '../../data/types';

// Lightweight markdown renderer — handles **bold** and \n newlines
function renderMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // Handle newlines
    const lines = part.split('\n');
    return lines.map((line, j) => (
      <React.Fragment key={`${i}-${j}`}>
        {line}
        {j < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  });
}

// Action badge shown under an assistant message
function ActionBadge({ action }: { action: { type: string; componentType?: string } }) {
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

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-brand-600 text-white rounded-tr-sm'
            : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700/50'
        }`}
      >
        {isUser ? msg.content : renderMarkdown(msg.content)}
      </div>

      {/* Action badges below assistant messages */}
      {!isUser && msg.actions && msg.actions.length > 0 && (
        <div className="flex flex-wrap gap-1 max-w-[85%]">
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

const QUICK_PROMPTS = [
  { label: '💡 Hint', text: 'What should I add next?' },
  { label: '⚡ Latency', text: 'How do I reduce latency?' },
  { label: '📈 Scale', text: 'How do I increase throughput?' },
  { label: '🛡️ Uptime', text: 'How do I improve availability?' },
];

interface ChatAssistantProps {
  missionSlug: string;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ missionSlug }) => {
  const { messages, isLoading, sendMessage, clearChat } = useChatStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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

  return (
    <div className="flex flex-col h-full bg-gray-950 border-l border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div>
            <p className="text-sm font-semibold text-white">Arch Assistant</p>
            <p className="text-[10px] text-gray-500">Ask anything about architecture</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-2 py-1 rounded hover:bg-gray-800"
            title="Clear chat"
          >
            Clear
          </button>
        )}
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 min-h-0">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
            <div className="text-4xl">🏗️</div>
            <div>
              <p className="text-sm font-medium text-gray-300 mb-1">Your Architecture Assistant</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Ask me to explain components, help you meet requirements, or say "add a cache" and I'll place it for you.
              </p>
            </div>

            {/* Quick prompt chips */}
            <div className="grid grid-cols-2 gap-2 w-full mt-2">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => { setInput(q.text); inputRef.current?.focus(); }}
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

      {/* Quick prompts strip (when there are messages) */}
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
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-gray-700 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
};
