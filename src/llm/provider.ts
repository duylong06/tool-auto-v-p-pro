import { Tool } from '../tools/base.tool';
import { LLMMessage, LLMResponse } from './types';

/**
 * Interface chung mÃ  Má»ŒI nhÃ  cung cáº¥p LLM pháº£i tuÃ¢n theo
 * (Gemini, Claude, Groq, Ollama...).
 *
 * Giá»‘ng há»‡t Ã½ tÆ°á»Ÿng cá»§a Tool interface: Ä‘á»‹nh nghÄ©a "hÃ¬nh dáº¡ng" chung,
 * cÃ²n cÃ¡ch lÃ m cá»¥ thá»ƒ thÃ¬ má»—i provider tá»± lo.
 */
export interface LLMProvider {
  /** TÃªn provider, chá»‰ dÃ¹ng Ä‘á»ƒ log cho dá»… debug */
  name: string;

  /**
   * Gá»­i lá»‹ch sá»­ há»™i thoáº¡i + danh sÃ¡ch tool cho LLM,
   * nháº­n láº¡i cÃ¢u tráº£ lá»i Ä‘Ã£ Ä‘Æ°á»£c chuáº©n hoÃ¡ vá» dáº¡ng trung láº­p.
   */
  chat(messages: LLMMessage[], tools: Tool[]): Promise<LLMResponse>;
}