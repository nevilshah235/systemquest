import { create } from 'zustand';
import api from '../data/api';
import { useBuilderStore } from './builderStore';
import { ComponentType } from '../data/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
}

export interface ChatAction {
  type: 'add_component' | 'connect';
  componentType?: string;
  fromType?: string;
  toType?: string;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  chatId: string | undefined;

  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  sendMessage: (userText: string, missionSlug: string) => Promise<void>;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  isLoading: false,
  isOpen: false,
  chatId: undefined,

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (open) => set({ isOpen: open }),

  clearChat: () => set({ messages: [], chatId: undefined }),

  sendMessage: async (userText, _missionSlug) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };

    set((s) => ({ messages: [...s.messages, userMsg], isLoading: true }));

    try {
      // Build architecture context from the builder store
      const builderState = useBuilderStore.getState();
      const arch = builderState.architecture;

      // Get enriched mission context registered by MissionPage
      const missionCtx = (window as any).__missionContext ?? {
        missionTitle: 'System Architecture Mission',
        requirements: { latencyMs: 200, availability: 99, throughput: 1000, budget: 500, growth: 'steady' },
      };

      const context = {
        missionTitle:      missionCtx.missionTitle,
        problemStatement:  missionCtx.problemStatement,
        objectives:        missionCtx.objectives,
        requirements:      missionCtx.requirements,
        phase:             missionCtx.phase,
        simulationMetrics: missionCtx.simulationMetrics ?? undefined,
        missionPassed:     missionCtx.missionPassed ?? undefined,
        components: arch.components.map((c) => ({ id: c.id, type: c.type })),
        connections: arch.connections.map((c) => ({ from: c.from, to: c.to })),
      };

      const history = get().messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      const data = await api
        .post('/chat/message', {
          message: userText,
          history,
          context,
          chatId: get().chatId,
        })
        .then((r) => r.data);

      // Apply any builder actions the AI returned
      const actions: ChatAction[] = data.actions ?? [];
      executeActions(actions);

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        actions: actions.length ? actions : undefined,
      };

      set((s) => ({
        messages: [...s.messages, assistantMsg],
        isLoading: false,
        chatId: data.chatId ?? s.chatId,
      }));
    } catch (err) {
      console.error('[ChatStore] sendMessage error:', err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I had trouble responding. Please try again.',
        timestamp: new Date(),
      };
      set((s) => ({ messages: [...s.messages, errorMsg], isLoading: false }));
    }
  },
}));

// ── Execute builder actions returned from AI ─────────────────────────────────

function executeActions(actions: ChatAction[]) {
  const { addComponent, addConnection, architecture } = useBuilderStore.getState();

  for (const action of actions) {
    if (action.type === 'add_component' && action.componentType) {
      const type = action.componentType as ComponentType;
      // Place the component at a smart position: offset from the last component
      const count = architecture.components.length;
      const col = count % 4;
      const row = Math.floor(count / 4);
      addComponent(type, 120 + col * 160, 120 + row * 140);
    }

    if (action.type === 'connect' && action.fromType && action.toType) {
      // Find the first component of each type and connect them
      const { architecture: arch } = useBuilderStore.getState();
      const fromComp = arch.components.find((c) => c.type === action.fromType);
      const toComp   = arch.components.find((c) => c.type === action.toType);
      if (fromComp && toComp) {
        addConnection(fromComp.id, toComp.id);
      }
    }
  }
}
