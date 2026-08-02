import { LLMProvider } from './provider';
import { GeminiProvider } from './gemini.provider';
import { ClaudeProvider } from './claude.provider';

export * from './types';
export * from './provider';

/**
 * Factory: chá»n LLM provider dá»±a trÃªn biáº¿n LLM_PROVIDER trong .env
 *
 * Muá»‘n Ä‘á»•i tá»« Gemini (miá»…n phÃ­) sang Claude (tÃ­nh phÃ­) hay ngÆ°á»£c láº¡i,
 * chá»‰ cáº§n sá»­a 1 dÃ²ng trong .env â€” khÃ´ng Ä‘á»¥ng vÃ o code.
 *
 * Muá»‘n thÃªm provider má»›i (Groq, Ollama...)? Táº¡o thÃªm 1 file
 * implement LLMProvider rá»“i thÃªm 1 case á»Ÿ Ä‘Ã¢y lÃ  xong.
 */
export function createLLMProvider(): LLMProvider {
  const provider = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();

  switch (provider) {
    case 'gemini':
      return new GeminiProvider();
    case 'claude':
      return new ClaudeProvider();
    default:
      throw new Error(
        `LLM_PROVIDER khÃ´ng há»£p lá»‡: "${provider}". Chá»‰ há»— trá»£: gemini, claude`
      );
  }
}