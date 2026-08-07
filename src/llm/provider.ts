import { Tool } from '../tools/base.tool';
import { LLMMessage, LLMResponse } from './types';

/**
 * Interface chung mà MỌI nhà cung cấp LLM phải tuân theo
 * (Gemini, Claude, Groq, Ollama...).
 *
 * Giống hệt ý tưởng của Tool interface: định nghĩa "hình dạng" chung,
 * còn cách làm cụ thể thì mỗi provider tự lo.
 */
export interface LLMProvider {
  /** Tên provider, chỉ dùng để log cho dễ debug */
  name: string;

  /**
   * Gửi lịch sử hội thoại + danh sách tool cho LLM,
   * nhận lại câu trả lời đã được chuẩn hoá về dạng trung lập.
   *
   * @param systemPrompt Hướng dẫn chung (vai trò, ngày giờ hiện tại, quy tắc).
   *                     Mỗi provider tự lo cách truyền vào API của mình.
   */
  chat(
    messages: LLMMessage[],
    tools: Tool[],
    systemPrompt?: string
  ): Promise<LLMResponse>;
}