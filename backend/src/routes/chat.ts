import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  sendChatMessage, ChatMessage, ArchitectureContext,
  generateSimulationAnalysis, SimulationAnalysisRequest,
} from '../services/chatService';

export const chatRouter = Router();

// POST /api/chat/message
chatRouter.post('/message', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { message, history, context, chatId } = req.body as {
    message: string;
    history: ChatMessage[];
    context: ArchitectureContext;
    chatId?: string;
  };

  if (!message || !context) {
    res.status(400).json({ error: 'message and context are required' });
    return;
  }

  try {
    const result = await sendChatMessage(
      message,
      Array.isArray(history) ? history : [],
      context,
      chatId,
    );
    res.json(result);
  } catch (err) {
    console.error('[ChatRoute] Error:', err);
    res.status(500).json({ error: 'Chat service unavailable' });
  }
});

// POST /api/chat/simulation-analysis
chatRouter.post('/simulation-analysis', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const body = req.body as SimulationAnalysisRequest;

  if (!body?.metrics || !body?.requirements || !body?.components) {
    res.status(400).json({ error: 'metrics, requirements, and components are required' });
    return;
  }

  try {
    const result = await generateSimulationAnalysis(body);
    if (result) {
      res.json(result);
    } else {
      res.status(503).json({ error: 'AI analysis unavailable' });
    }
  } catch (err) {
    console.error('[ChatRoute] Simulation analysis error:', err);
    res.status(500).json({ error: 'Analysis service unavailable' });
  }
});
