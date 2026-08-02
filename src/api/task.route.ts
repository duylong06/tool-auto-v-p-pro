import { Router, Request, Response } from 'express';
import { runAgent } from '../core/agent';
import { emailTool } from '../tools/email.tool';
import { createLLMProvider } from '../llm';

export const taskRouter = Router();

// Danh sÃ¡ch tool kháº£ dá»¥ng - thÃªm tool má»›i á»Ÿ Ä‘Ã¢y khi cÃ³ (calendar, sheet, game...)
const availableTools = [emailTool];

// Khá»Ÿi táº¡o LLM provider 1 láº§n khi server start (Ä‘á»c tá»« .env)
const llm = createLLMProvider();
console.log(`[LLM] Provider: ${llm.name}`);

taskRouter.post('/task', async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Thiáº¿u trÆ°á»ng "message" (kiá»ƒu string)' });
  }

  try {
    const result = await runAgent(message, availableTools, llm);
    res.json(result);
  } catch (err) {
    // In lá»—i Ä‘áº§y Ä‘á»§ ra terminal Ä‘á»ƒ debug
    console.error('[Agent Error]', err);
    res.status(500).json({
      error: 'Lá»—i khi agent xá»­ lÃ½ task',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});