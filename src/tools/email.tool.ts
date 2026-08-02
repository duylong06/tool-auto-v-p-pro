import { google } from 'googleapis';
import { Tool, ToolResult } from './base.tool';
import { getAuthorizedClient } from '../auth/google.auth';

/**
 * Tool doc va tom tat email tu Gmail THAT (qua Gmail API).
 *
 * Truoc khi dung, phai xac thuc mot lan: npm run auth
 *
 * Luu y: tool nay chi xin quyen DOC (gmail.readonly), khong the gui
 * hoac xoa email - nguyen tac least privilege (xin it quyen nhat co the).
 */

interface EmailSummary {
  from: string;
  subject: string;
  date: string;
  important: boolean;
  snippet: string;
}

/**
 * Chuyen khoang thoi gian dang "7d" / "24h" sang cu phap tim kiem cua Gmail.
 * Gmail chi ho tro don vi ngay/thang/nam (d/m/y), khong ho tro gio.
 */
function toGmailQuery(range: string): string {
  const match = range.trim().toLowerCase().match(/^(\d+)\s*([dhmy])$/);

  if (!match) {
    return 'newer_than:7d'; // gia tri mac dinh an toan
  }

  const amount = parseInt(match[1], 10);
  const unit = match[2];

  // Gmail khong ho tro gio -> quy doi thanh ngay (toi thieu 1 ngay)
  if (unit === 'h') {
    return `newer_than:${Math.max(1, Math.ceil(amount / 24))}d`;
  }

  return `newer_than:${amount}${unit}`;
}

/** Lay gia tri 1 header tu danh sach headers cua Gmail */
function getHeader(
  headers: Array<{ name?: string | null; value?: string | null }>,
  name: string
): string {
  const found = headers.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  );
  return found?.value ?? '';
}

export const emailTool: Tool = {
  name: 'email_tool',
  description:
    'Doc va tom tat email tu Gmail trong mot khoang thoi gian. Dung khi nguoi dung muon xem, tong hop, hoac tom tat email cua ho.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['summarize', 'list'],
        description: 'Hanh dong can thuc hien',
      },
      range: {
        type: 'string',
        description:
          'Khoang thoi gian, vi du "7d" (7 ngay), "1m" (1 thang). Mac dinh 7d.',
      },
      maxResults: {
        type: 'number',
        description: 'So email toi da can lay (mac dinh 20, toi da 50)',
      },
    },
    required: ['action', 'range'],
  },

  async execute(params): Promise<ToolResult> {
    try {
      const auth = getAuthorizedClient();
      const gmail = google.gmail({ version: 'v1', auth });

      const range = typeof params.range === 'string' ? params.range : '7d';
      const query = toGmailQuery(range);

      const requested =
        typeof params.maxResults === 'number' ? params.maxResults : 20;
      const maxResults = Math.min(Math.max(1, requested), 50);

      // Buoc 1: lay danh sach ID cua cac email khop dieu kien
      const listRes = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      });

      const messages = listRes.data.messages ?? [];

      if (messages.length === 0) {
        return {
          success: true,
          data: { query, count: 0, emails: [] },
        };
      }

      // Buoc 2: lay chi tiet tung email.
      // Chi lay metadata (header) + snippet -> nhanh hon va it ton quota
      // hon la tai toan bo noi dung email.
      const emails: EmailSummary[] = [];

      for (const msg of messages) {
        if (!msg.id) continue;

        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        });

        const headers = detail.data.payload?.headers ?? [];

        emails.push({
          from: getHeader(headers, 'From'),
          subject: getHeader(headers, 'Subject'),
          date: getHeader(headers, 'Date'),
          important: detail.data.labelIds?.includes('IMPORTANT') ?? false,
          snippet: detail.data.snippet ?? '',
        });
      }

      return {
        success: true,
        data: {
          action: params.action,
          query,
          count: emails.length,
          emails,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
};