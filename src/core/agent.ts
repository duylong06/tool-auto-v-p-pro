import Anthropic from '@anthropic-ai/sdk';
import { Tool } from '../tools/base.tool';
import { askClaude } from '../llm/claude';

interface AgentRunResult {
  finalAnswer: string;
  toolsUsed: string[];
}

/**
 * Vòng lặp Agent (ReAct pattern): suy nghĩ -> gọi tool -> quan sát -> lặp lại
 * cho tới khi Claude trả về câu trả lời cuối cùng (không còn gọi tool nữa).
 */
export async function runAgent(
  userMessage: string,
  tools: Tool[]
): Promise<AgentRunResult> {
  const toolsUsed: string[] = [];
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ];

  // Giới hạn số vòng lặp để tránh agent chạy vô hạn nếu có lỗi logic
  const MAX_TURNS = 5;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await askClaude(messages, tools);
    messages.push({ role: 'assistant', content: response.content });

    const toolUseBlock = response.content.find(
      (block: Anthropic.ContentBlock) => block.type === 'tool_use'
    );

    // Không còn tool nào được gọi -> đây là câu trả lời cuối cùng
    if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
      const textBlock = response.content.find(
        (block: Anthropic.ContentBlock) => block.type === 'text'
      );
      return {
        finalAnswer: textBlock && textBlock.type === 'text' ? textBlock.text : '',
        toolsUsed,
      };
    }

    // Tìm tool tương ứng và thực thi
    const tool = tools.find((t) => t.name === toolUseBlock.name);
    if (!tool) {
      throw new Error(`Không tìm thấy tool: ${toolUseBlock.name}`);
    }

    toolsUsed.push(tool.name);
    const result = await tool.execute(
      toolUseBlock.input as Record<string, unknown>
    );

    // Gửi kết quả tool ngược lại cho Claude để nó tổng hợp / quyết định bước tiếp theo
    messages.push({
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: toolUseBlock.id,
          content: JSON.stringify(result),
        },
      ],
    });
  }

  return {
    finalAnswer: 'Đã đạt giới hạn số vòng lặp mà chưa có câu trả lời cuối cùng.',
    toolsUsed,
  };
}
