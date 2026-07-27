import { Router, Request, Response } from 'express';
import { runAgent } from '../core/agent';
import { emailTool } from '../tools/email.tool';

export const taskRouter = Router();

// Danh sách tool khả dụng - thêm tool mới ở đây khi có (calendar, sheet...)
const availableTools = [emailTool];

taskRouter.post('/task', async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Thiếu trường "message" (kiểu string)' });
  }

  try {
    const result = await runAgent(message, availableTools);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi agent xử lý task' });
  }
});
