import { Tool } from '../tools/base.tool';
import { LLMProvider, LLMMessage } from '../llm';

export interface AgentRunResult {
  finalAnswer: string;
  toolsUsed: string[];
  turns: number;
}

/**
 * Vòng lặp Agent (ReAct pattern): suy nghĩ -> gọi tool -> quan sát -> lặp lại
 * cho tới khi LLM trả về câu trả lời cuối cùng (không còn muốn gọi tool nữa).
 *
 * Lưu ý: hàm này KHÔNG biết đang dùng Gemini hay Claude.
 * Nó chỉ làm việc qua interface LLMProvider -> đổi provider không cần sửa file này.
 */
export async function runAgent(
  userMessage: string,
  tools: Tool[],
  llm: LLMProvider
): Promise<AgentRunResult> {
  const toolsUsed: string[] = [];
  const messages: LLMMessage[] = [{ role: 'user', content: userMessage }];

  // Giới hạn số vòng lặp để agent không chạy vô hạn nếu có lỗi logic
  const MAX_TURNS = 5;

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const response = await llm.chat(messages, tools);

    // LLM không gọi tool nữa -> đây là câu trả lời cuối cùng
    if (response.toolCalls.length === 0) {
      return { finalAnswer: response.text, toolsUsed, turns: turn };
    }

    // Ghi lại lượt của LLM (gồm cả các tool nó muốn gọi)
    messages.push({
      role: 'assistant',
      content: response.text,
      toolCalls: response.toolCalls,
      // Mang theo du lieu rieng cua provider (vd: thoughtSignature cua Gemini)
      providerMeta: response.providerMeta,
    });

    // Thực thi từng tool mà LLM yêu cầu
    for (const call of response.toolCalls) {
      const tool = tools.find((t) => t.name === call.name);

      if (!tool) {
        messages.push({
          role: 'tool',
          toolCallId: call.id,
          toolName: call.name,
          result: { success: false, error: `Không tìm thấy tool: ${call.name}` },
        });
        continue;
      }

      toolsUsed.push(tool.name);
      console.log(`[Agent] Calling tool "${tool.name}" with:`, call.input);

      let result;
      try {
        result = await tool.execute(call.input);
      } catch (err) {
        // Tool lỗi thì báo lại cho LLM biết, để nó tự xử lý/thử cách khác
        result = {
          success: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }

      messages.push({
        role: 'tool',
        toolCallId: call.id,
        toolName: tool.name,
        result,
      });
    }
  }

  return {
    finalAnswer: 'Đã đạt giới hạn số vòng lặp mà chưa có câu trả lời cuối cùng.',
    toolsUsed,
    turns: MAX_TURNS,
  };
}