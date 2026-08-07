import Anthropic from '@anthropic-ai/sdk';
import { Tool } from '../tools/base.tool';
import { LLMProvider } from './provider';
import { LLMMessage, LLMResponse, LLMToolCall } from './types';

/**
 * Provider dùng Claude API (Anthropic).
 * LƯU Ý: Claude API TÍNH PHÍ theo token, không có gói miễn phí.
 * Chỉ dùng khi bạn đã nạp credit tại https://console.anthropic.com/
 *
 * File này để sẵn nhằm minh hoạ: đổi nhà cung cấp LLM chỉ cần
 * thêm 1 file provider, không đụng vào agent.ts hay tools/.
 */

/** Chuyển lịch sử hội thoại trung lập sang định dạng messages của Claude */
function toClaudeMessages(messages: LLMMessage[]): Anthropic.MessageParam[] {
  return messages.map((msg): Anthropic.MessageParam => {
    if (msg.role === 'user') {
      return { role: 'user', content: msg.content };
    }

    if (msg.role === 'assistant') {
      const blocks: Anthropic.ContentBlockParam[] = [];
      if (msg.content) {
        blocks.push({ type: 'text', text: msg.content });
      }
      for (const call of msg.toolCalls ?? []) {
        blocks.push({
          type: 'tool_use',
          id: call.id,
          name: call.name,
          input: call.input,
        });
      }
      return { role: 'assistant', content: blocks };
    }

    // msg.role === 'tool'
    return {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: msg.toolCallId,
          content: JSON.stringify(msg.result),
        },
      ],
    };
  });
}

export class ClaudeProvider implements LLMProvider {
  name = 'claude';

  private client: Anthropic;
  private model: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Thiếu ANTHROPIC_API_KEY trong file .env');
    }

    this.client = new Anthropic({ apiKey });
    this.model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
  }

  async chat(
    messages: LLMMessage[],
    tools: Tool[],
    systemPrompt?: string
  ): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: systemPrompt,
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema as Anthropic.Tool['input_schema'],
      })),
      messages: toClaudeMessages(messages),
    });

    // Chuẩn hoá kết quả về dạng trung lập
    let text = '';
    const toolCalls: LLMToolCall[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        text += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
      }
    }

    return { text, toolCalls };
  }
}