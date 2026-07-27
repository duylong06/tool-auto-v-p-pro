import { Tool, ToolResult } from './base.tool';

/**
 * Tool đọc/tóm tắt email.
 * GIAI ĐOẠN HIỆN TẠI: trả dữ liệu GIẢ LẬP (mock) để test luồng agent.
 * TODO (giai đoạn sau): thay phần mock bằng gọi Gmail API thật (OAuth2).
 */
export const emailTool: Tool = {
  name: 'email_tool',
  description:
    'Đọc và tóm tắt email trong một khoảng thời gian. Dùng khi người dùng muốn xem, tổng hợp, hoặc tóm tắt email.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['summarize', 'list'],
        description: 'Hành động cần thực hiện',
      },
      range: {
        type: 'string',
        description: 'Khoảng thời gian, ví dụ "7d" (7 ngày), "24h" (24 giờ)',
      },
    },
    required: ['action', 'range'],
  },

  async execute(params): Promise<ToolResult> {
    // --- MOCK DATA - thay bằng Gmail API thật ở giai đoạn sau ---
    const mockEmails = [
      { from: 'sếp@company.com', subject: 'Deadline báo cáo Q3', important: true },
      { from: 'hr@company.com', subject: 'Nhắc lịch nghỉ phép', important: false },
      { from: 'partner@vendor.com', subject: 'Xác nhận hợp đồng', important: true },
    ];

    return {
      success: true,
      data: {
        action: params.action,
        range: params.range,
        emails: mockEmails,
        count: mockEmails.length,
      },
    };
  },
};
