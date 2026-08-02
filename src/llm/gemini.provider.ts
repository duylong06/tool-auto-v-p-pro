import { GoogleGenAI, type Content, type Part, type FunctionDeclaration } from '@google/genai';
import { Tool } from '../tools/base.tool';
import { LLMProvider } from './provider';
import { LLMMessage, LLMResponse, LLMToolCall } from './types';

/**
 * Provider dÃ¹ng Google Gemini API (cÃ³ gÃ³i MIá»„N PHÃ, khÃ´ng cáº§n tháº» tÃ­n dá»¥ng).
 * Láº¥y API key táº¡i: https://aistudio.google.com/apikey
 *
 * LÆ¯U Ã 1: Ä‘á»«ng báº­t billing trÃªn project Google Cloud, vÃ¬ khi báº­t billing
 * thÃ¬ gÃ³i miá»…n phÃ­ sáº½ biáº¿n máº¥t vÃ  má»i request Ä‘á»u bá»‹ tÃ­nh tiá»n.
 *
 * LÆ¯U Ã 2 (quan trá»ng): cÃ¡c model Gemini 3 trá»Ÿ lÃªn cÃ³ cÆ¡ cháº¿ "thinking".
 * Khi model gá»i tool, nÃ³ tráº£ kÃ¨m 1 chuá»—i `thoughtSignature` â€” giá»‘ng nhÆ°
 * "Ä‘iá»ƒm lÆ°u" tráº¡ng thÃ¡i suy nghÄ©. á»ž lÆ°á»£t tiáº¿p theo ta Báº®T BUá»˜C pháº£i gá»­i
 * láº¡i chuá»—i nÃ y y nguyÃªn, náº¿u khÃ´ng API tráº£ lá»—i 400.
 * VÃ¬ váº­y ta lÆ°u nÃ³ vÃ o `providerMeta` cá»§a má»—i tool call.
 */

/**
 * Gemini yÃªu cáº§u kiá»ƒu dá»¯ liá»‡u trong schema viáº¿t HOA (OBJECT, STRING...),
 * trong khi JSON Schema chuáº©n viáº¿t thÆ°á»ng (object, string...).
 * HÃ m nÃ y chuyá»ƒn Ä‘á»•i Ä‘á»‡ quy cho khá»›p.
 */
function toGeminiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) {
    return schema.map(toGeminiSchema);
  }
  if (schema !== null && typeof schema === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema)) {
      if (key === 'type' && typeof value === 'string') {
        result[key] = value.toUpperCase();
      } else {
        result[key] = toGeminiSchema(value);
      }
    }
    return result;
  }
  return schema;
}

/** Chuyá»ƒn Tool ná»™i bá»™ sang Ä‘á»‹nh dáº¡ng function declaration cá»§a Gemini */
function toGeminiTool(tool: Tool): FunctionDeclaration {
  return {
    name: tool.name,
    description: tool.description,
    parameters: toGeminiSchema(tool.inputSchema) as FunctionDeclaration['parameters'],
  };
}

/** Chuyá»ƒn lá»‹ch sá»­ há»™i thoáº¡i trung láº­p sang Ä‘á»‹nh dáº¡ng `contents` cá»§a Gemini */
function toGeminiContents(messages: LLMMessage[]): Content[] {
  return messages.map((msg): Content => {
    if (msg.role === 'user') {
      return { role: 'user', parts: [{ text: msg.content }] };
    }

    if (msg.role === 'assistant') {
      const parts: Part[] = [];

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      for (const call of msg.toolCalls ?? []) {
        const part: Part = {
          functionCall: { name: call.name, args: call.input },
        };

        // Gá»­i tráº£ láº¡i thoughtSignature y nguyÃªn - Báº®T BUá»˜C vá»›i Gemini 3+
        const signature = call.providerMeta?.thoughtSignature;
        if (typeof signature === 'string') {
          part.thoughtSignature = signature;
        }

        parts.push(part);
      }

      return { role: 'model', parts };
    }

    // msg.role === 'tool' -> Gemini coi káº¿t quáº£ tool lÃ  1 lÆ°á»£t cá»§a "user"
    return {
      role: 'user',
      parts: [
        {
          functionResponse: {
            name: msg.toolName,
            response: { result: msg.result },
          },
        },
      ],
    };
  });
}

export class GeminiProvider implements LLMProvider {
  name = 'gemini';

  private client: GoogleGenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Thieu GEMINI_API_KEY trong file .env');
    }

    this.client = new GoogleGenAI({ apiKey });
    // Co the doi model qua .env. Xem model kha dung tai https://aistudio.google.com
    this.model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  }

  async chat(messages: LLMMessage[], tools: Tool[]): Promise<LLMResponse> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: toGeminiContents(messages),
      config: {
        tools: [{ functionDeclarations: tools.map(toGeminiTool) }],
      },
    });

    // Doc truc tiep tu parts (thay vi response.functionCalls) de lay duoc
    // ca thoughtSignature di kem moi functionCall.
    const parts = response.candidates?.[0]?.content?.parts ?? [];

    let text = '';
    const toolCalls: LLMToolCall[] = [];

    for (const [index, part] of parts.entries()) {
      if (part.text) {
        text += part.text;
      }

      if (part.functionCall) {
        toolCalls.push({
          // Gemini khong tra ve id, nen ta tu sinh de dung thong nhat voi Claude
          id: `${part.functionCall.name}-${index}-${Date.now()}`,
          name: part.functionCall.name ?? '',
          input: (part.functionCall.args ?? {}) as Record<string, unknown>,
          providerMeta: part.thoughtSignature
            ? { thoughtSignature: part.thoughtSignature }
            : undefined,
        });
      }
    }

    return { text, toolCalls };
  }
}