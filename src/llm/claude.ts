import Anthropic from '@anthropic-ai/sdk';
import { Tool } from '../tools/base.tool';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/** Chuyển đổi Tool nội bộ sang định dạng tool mà Claude API yêu cầu */
function toClaudeToolFormat(tool: Tool) {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
  };
}

/**
 * Gọi Claude, cho phép Claude tự quyết định có cần gọi tool nào không.
 * Nhận trực tiếp mảng messages đầy đủ (bao gồm cả tool_result nếu có)
 * để agent.ts toàn quyền kiểm soát lịch sử hội thoại.
 */
export async function askClaude(
  messages: Anthropic.MessageParam[],
  tools: Tool[]
) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    tools: tools.map(toClaudeToolFormat),
    messages,
  });

  return response;
}
