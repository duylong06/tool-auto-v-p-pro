/**
 * Interface chung mà MỌI tool phải tuân theo.
 * Nhờ đó, thêm tool mới (email, calendar, game, social...) chỉ cần
 * tạo 1 file mới implement interface này, không cần sửa core/agent.ts.
 */

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface Tool {
  /** Tên định danh, LLM dùng tên này để gọi tool */
  name: string;

  /** Mô tả rõ ràng tool làm gì - LLM dựa vào đây để quyết định có nên gọi tool này không */
  description: string;

  /** JSON Schema mô tả tham số đầu vào (theo chuẩn Claude tool use) */
  inputSchema: Record<string, unknown>;

  /** Hàm thực thi thật - nhận tham số, trả kết quả */
  execute(params: Record<string, unknown>): Promise<ToolResult>;
}
