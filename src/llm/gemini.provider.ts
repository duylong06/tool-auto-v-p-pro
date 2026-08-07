import { GoogleGenAI, type Content, type Part, type FunctionDeclaration } from '@google/genai';
import { Tool } from '../tools/base.tool';
import { LLMProvider } from './provider';
import { LLMMessage, LLMResponse, LLMToolCall } from './types';

/**
 * Provider dùng Google Gemini API (có gói MIỄN PHÍ, không cần thẻ tín dụng).
 * Lấy API key tại: https://aistudio.google.com/apikey
 *
 * LƯU Ý 1: đừng bật billing trên project Google Cloud, vì khi bật billing
 * thì gói miễn phí sẽ biến mất và mọi request đều bị tính tiền.
 *
 * LƯU Ý 2 (quan trọng): các model Gemini 3+ có cơ chế "thinking". Khi model
 * gọi tool, nó gắn kèm chuỗi `thoughtSignature` vào các part — giống như
 * "điểm lưu" trạng thái suy nghĩ. Ở lượt tiếp theo ta BẮT BUỘC phải gửi lại
 * y nguyên, nếu không API trả lỗi 400 INVALID_ARGUMENT.
 *
 * Cách xử lý: thay vì tách chữ ký ra rồi tự dựng lại part (dễ làm mất khi
 * model trả về nhiều part), ta LƯU NGUYÊN KHỐI parts gốc vào providerMeta
 * và gửi trả lại nguyên khối.
 */

/**
 * Gemini yêu cầu kiểu dữ liệu trong schema viết HOA (OBJECT, STRING...),
 * trong khi JSON Schema chuẩn viết thường (object, string...).
 * Hàm này chuyển đổi đệ quy cho khớp.
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

/** Chuyển Tool nội bộ sang định dạng function declaration của Gemini */
function toGeminiTool(tool: Tool): FunctionDeclaration {
  return {
    name: tool.name,
    description: tool.description,
    parameters: toGeminiSchema(tool.inputSchema) as FunctionDeclaration['parameters'],
  };
}

/** Chuyển lịch sử hội thoại trung lập sang định dạng `contents` của Gemini */
function toGeminiContents(messages: LLMMessage[]): Content[] {
  return messages.map((msg): Content => {
    if (msg.role === 'user') {
      return { role: 'user', parts: [{ text: msg.content }] };
    }

    if (msg.role === 'assistant') {
      // Ưu tiên gửi lại NGUYÊN KHỐI parts gốc (giữ trọn thoughtSignature)
      const rawParts = msg.providerMeta?.rawParts;
      if (Array.isArray(rawParts) && rawParts.length > 0) {
        return { role: 'model', parts: rawParts as Part[] };
      }

      // Dự phòng: nếu không có parts gốc thì tự dựng lại
      const parts: Part[] = [];
      if (msg.content) {
        parts.push({ text: msg.content });
      }
      for (const call of msg.toolCalls ?? []) {
        parts.push({ functionCall: { name: call.name, args: call.input } });
      }
      return { role: 'model', parts };
    }

    // msg.role === 'tool' -> Gemini coi kết quả tool là 1 lượt của "user"
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
    this.model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  }

  async chat(
    messages: LLMMessage[],
    tools: Tool[],
    systemPrompt?: string
  ): Promise<LLMResponse> {
    const contents = toGeminiContents(messages);

    // Bat debug bang cach dat DEBUG_LLM=1 trong .env
    if (process.env.DEBUG_LLM === '1') {
      console.log('[Gemini] contents gui di:');
      console.log(JSON.stringify(contents, null, 2).slice(0, 3000));
    }

    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config: {
        tools: [{ functionDeclarations: tools.map(toGeminiTool) }],
        systemInstruction: systemPrompt,
      },
    });

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
        });
      }
    }

    return {
      text,
      toolCalls,
      // Giu nguyen khoi parts goc de gui tra lai o luot sau
      providerMeta: { rawParts: parts },
    };
  }
}