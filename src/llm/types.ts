/**
 * CÃ¡c kiá»ƒu dá»¯ liá»‡u TRUNG Láº¬P cho táº§ng LLM.
 *
 * Ã tÆ°á»Ÿng cá»‘t lÃµi: agent.ts chá»‰ lÃ m viá»‡c vá»›i nhá»¯ng kiá»ƒu nÃ y,
 * KHÃ”NG biáº¿t gÃ¬ vá» Claude hay Gemini. Nhá» Ä‘Ã³ Ä‘á»•i nhÃ  cung cáº¥p LLM
 * khÃ´ng cáº§n sá»­a agent.ts, tools/, api/ â€” chá»‰ thÃªm 1 file provider má»›i.
 */

/** Má»™t láº§n LLM quyáº¿t Ä‘á»‹nh gá»i tool */
export interface LLMToolCall {
  /** ID cá»§a láº§n gá»i (Claude cáº§n; Gemini khÃ´ng cÃ³ nÃªn ta tá»± sinh) */
  id: string;
  /** TÃªn tool Ä‘Æ°á»£c chá»n */
  name: string;
  /** Tham sá»‘ LLM truyá»n vÃ o tool */
  input: Record<string, unknown>;
  /**
   * Dá»¯ liá»‡u riÃªng cá»§a tá»«ng nhÃ  cung cáº¥p, cáº§n giá»¯ nguyÃªn vÃ  gá»­i tráº£ láº¡i.
   * VÃ­ dá»¥: Gemini 3 tráº£ vá» `thoughtSignature` (Ä‘iá»ƒm lÆ°u tráº¡ng thÃ¡i suy nghÄ©)
   * vÃ  Báº®T BUá»˜C pháº£i gá»­i láº¡i á»Ÿ lÆ°á»£t sau, náº¿u khÃ´ng sáº½ lá»—i 400.
   * Agent khÃ´ng cáº§n hiá»ƒu ná»™i dung nÃ y, chá»‰ cáº§n mang theo.
   */
  providerMeta?: Record<string, unknown>;
}

/** Káº¿t quáº£ tráº£ vá» tá»« 1 láº§n gá»i LLM */
export interface LLMResponse {
  /** Pháº§n text LLM tráº£ lá»i (cÃ³ thá»ƒ rá»—ng náº¿u nÃ³ chá»‰ gá»i tool) */
  text: string;
  /** Danh sÃ¡ch tool LLM muá»‘n gá»i (rá»—ng nghÄ©a lÃ  Ä‘Ã£ cÃ³ cÃ¢u tráº£ lá»i cuá»‘i) */
  toolCalls: LLMToolCall[];
}

/** Má»™t tin nháº¯n trong lá»‹ch sá»­ há»™i thoáº¡i (dáº¡ng trung láº­p) */
export type LLMMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: LLMToolCall[] }
  | { role: 'tool'; toolCallId: string; toolName: string; result: unknown };