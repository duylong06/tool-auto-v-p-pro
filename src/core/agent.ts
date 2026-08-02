import { Tool } from '../tools/base.tool';
import { LLMProvider, LLMMessage } from '../llm';

export interface AgentRunResult {
  finalAnswer: string;
  toolsUsed: string[];
  turns: number;
}

/**
 * VÃ²ng láº·p Agent (ReAct pattern): suy nghÄ© -> gá»i tool -> quan sÃ¡t -> láº·p láº¡i
 * cho tá»›i khi LLM tráº£ vá» cÃ¢u tráº£ lá»i cuá»‘i cÃ¹ng (khÃ´ng cÃ²n muá»‘n gá»i tool ná»¯a).
 *
 * LÆ°u Ã½: hÃ m nÃ y KHÃ”NG biáº¿t Ä‘ang dÃ¹ng Gemini hay Claude.
 * NÃ³ chá»‰ lÃ m viá»‡c qua interface LLMProvider -> Ä‘á»•i provider khÃ´ng cáº§n sá»­a file nÃ y.
 */
export async function runAgent(
  userMessage: string,
  tools: Tool[],
  llm: LLMProvider
): Promise<AgentRunResult> {
  const toolsUsed: string[] = [];
  const messages: LLMMessage[] = [{ role: 'user', content: userMessage }];

  // Giá»›i háº¡n sá»‘ vÃ²ng láº·p Ä‘á»ƒ agent khÃ´ng cháº¡y vÃ´ háº¡n náº¿u cÃ³ lá»—i logic
  const MAX_TURNS = 5;

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const response = await llm.chat(messages, tools);

    // LLM khÃ´ng gá»i tool ná»¯a -> Ä‘Ã¢y lÃ  cÃ¢u tráº£ lá»i cuá»‘i cÃ¹ng
    if (response.toolCalls.length === 0) {
      return { finalAnswer: response.text, toolsUsed, turns: turn };
    }

    // Ghi láº¡i lÆ°á»£t cá»§a LLM (gá»“m cáº£ cÃ¡c tool nÃ³ muá»‘n gá»i)
    messages.push({
      role: 'assistant',
      content: response.text,
      toolCalls: response.toolCalls,
    });

    // Thá»±c thi tá»«ng tool mÃ  LLM yÃªu cáº§u
    for (const call of response.toolCalls) {
      const tool = tools.find((t) => t.name === call.name);

      if (!tool) {
        messages.push({
          role: 'tool',
          toolCallId: call.id,
          toolName: call.name,
          result: { success: false, error: `KhÃ´ng tÃ¬m tháº¥y tool: ${call.name}` },
        });
        continue;
      }

      toolsUsed.push(tool.name);
      console.log(`[Agent] Calling tool "${tool.name}" with:`, call.input);

      let result;
      try {
        result = await tool.execute(call.input);
      } catch (err) {
        // Tool lá»—i thÃ¬ bÃ¡o láº¡i cho LLM biáº¿t, Ä‘á»ƒ nÃ³ tá»± xá»­ lÃ½/thá»­ cÃ¡ch khÃ¡c
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
    finalAnswer: 'ÄÃ£ Ä‘áº¡t giá»›i háº¡n sá»‘ vÃ²ng láº·p mÃ  chÆ°a cÃ³ cÃ¢u tráº£ lá»i cuá»‘i cÃ¹ng.',
    toolsUsed,
    turns: MAX_TURNS,
  };
}