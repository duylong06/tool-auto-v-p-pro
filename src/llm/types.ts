/**
 * Các kiểu dữ liệu TRUNG LẬP cho tầng LLM.
 *
 * Ý tưởng cốt lõi: agent.ts chỉ làm việc với những kiểu này,
 * KHÔNG biết gì về Claude hay Gemini. Nhờ đó đổi nhà cung cấp LLM
 * không cần sửa agent.ts, tools/, api/ — chỉ thêm 1 file provider mới.
 */

/** Một lần LLM quyết định gọi tool */
export interface LLMToolCall {
  /** ID của lần gọi (Claude cần; Gemini không có nên ta tự sinh) */
  id: string;
  /** Tên tool được chọn */
  name: string;
  /** Tham số LLM truyền vào tool */
  input: Record<string, unknown>;
}

/** Kết quả trả về từ 1 lần gọi LLM */
export interface LLMResponse {
  /** Phần text LLM trả lời (có thể rỗng nếu nó chỉ gọi tool) */
  text: string;
  /** Danh sách tool LLM muốn gọi (rỗng nghĩa là đã có câu trả lời cuối) */
  toolCalls: LLMToolCall[];
  /**
   * Dữ liệu thô riêng của từng nhà cung cấp, cần giữ nguyên và gửi trả lại.
   *
   * Ví dụ: Gemini 3+ gắn `thoughtSignature` (điểm lưu trạng thái suy nghĩ)
   * vào các part và BẮT BUỘC phải gửi lại y nguyên ở lượt sau, nếu không
   * API trả lỗi 400. Thay vì cố tách ra rồi dựng lại (dễ làm mất), ta lưu
   * nguyên khối và gửi trả nguyên khối.
   *
   * Agent KHÔNG cần hiểu nội dung này, chỉ cần mang theo.
   */
  providerMeta?: Record<string, unknown>;
}

/** Một tin nhắn trong lịch sử hội thoại (dạng trung lập) */
export type LLMMessage =
  | { role: 'user'; content: string }
  | {
      role: 'assistant';
      content: string;
      toolCalls?: LLMToolCall[];
      /** Dữ liệu thô của provider, xem giải thích ở LLMResponse */
      providerMeta?: Record<string, unknown>;
    }
  | { role: 'tool'; toolCallId: string; toolName: string; result: unknown };