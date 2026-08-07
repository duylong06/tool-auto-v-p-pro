import { Router, Request, Response } from 'express';
import { runAgent } from '../core/agent';
import { emailTool } from '../tools/email.tool';
import { calendarTool } from '../tools/calendar.tool';
import { createLLMProvider } from '../llm';

export const taskRouter = Router();

// Danh sách tool khả dụng - thêm tool mới ở đây khi có (calendar, sheet, game...)
const availableTools = [emailTool, calendarTool];

// Khởi tạo LLM provider 1 lần khi server start (đọc từ .env)
const llm = createLLMProvider();
console.log(`[LLM] Provider: ${llm.name}`);

taskRouter.post('/task', async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Thiếu trường "message" (kiểu string)' });
  }

  try {
    const result = await runAgent(message, availableTools, llm);
    res.json(result);
  } catch (err) {
    // In lỗi đầy đủ ra terminal để debug
    console.error('[Agent Error]', err);
    res.status(500).json({
      error: 'Lỗi khi agent xử lý task',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});