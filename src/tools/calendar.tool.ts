import { google } from 'googleapis';
import { Tool, ToolResult } from './base.tool';
import { getAuthorizedClient } from '../auth/google.auth';

/**
 * Tool lam viec voi Google Calendar.
 *
 * Ho tro 2 hanh dong:
 *  - list:   xem cac su kien trong khoang thoi gian
 *  - create: tao su kien moi
 *
 * LUU Y: tool nay co quyen GHI vao lich cua ban (tao su kien that).
 * Neu chi muon cho phep doc, doi scope trong google.auth.ts sang
 * 'calendar.readonly' va bo action 'create'.
 */

const TIME_ZONE = 'Asia/Ho_Chi_Minh';

interface EventSummary {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  description: string;
}

export const calendarTool: Tool = {
  name: 'calendar_tool',
  description:
    'Xem hoac tao su kien tren Google Calendar. Dung khi nguoi dung hoi ve lich hen, cuoc hop, hoac muon dat lich moi.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'create'],
        description: 'list = xem su kien, create = tao su kien moi',
      },
      timeMin: {
        type: 'string',
        description:
          'Thoi diem bat dau tim kiem, dang ISO (vd: 2026-08-07T00:00:00). Chi dung voi action=list.',
      },
      timeMax: {
        type: 'string',
        description:
          'Thoi diem ket thuc tim kiem, dang ISO. Chi dung voi action=list.',
      },
      title: {
        type: 'string',
        description: 'Tieu de su kien. Bat buoc khi action=create.',
      },
      startTime: {
        type: 'string',
        description:
          'Thoi gian bat dau su kien, dang ISO (vd: 2026-08-08T14:00:00). Bat buoc khi action=create.',
      },
      endTime: {
        type: 'string',
        description:
          'Thoi gian ket thuc su kien, dang ISO. Bat buoc khi action=create.',
      },
      location: {
        type: 'string',
        description: 'Dia diem to chuc (tuy chon).',
      },
      description: {
        type: 'string',
        description: 'Mo ta chi tiet su kien (tuy chon).',
      },
    },
    required: ['action'],
  },

  async execute(params): Promise<ToolResult> {
    try {
      const auth = getAuthorizedClient();
      const calendar = google.calendar({ version: 'v3', auth });

      // ---------- XEM SU KIEN ----------
      if (params.action === 'list') {
        const now = new Date();
        const defaultMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const timeMin =
          typeof params.timeMin === 'string'
            ? new Date(params.timeMin).toISOString()
            : now.toISOString();

        const timeMax =
          typeof params.timeMax === 'string'
            ? new Date(params.timeMax).toISOString()
            : defaultMax.toISOString();

        const res = await calendar.events.list({
          calendarId: 'primary',
          timeMin,
          timeMax,
          singleEvents: true, // tach su kien lap lai thanh tung lan rieng
          orderBy: 'startTime',
          maxResults: 30,
        });

        const events: EventSummary[] = (res.data.items ?? []).map((item) => ({
          id: item.id ?? '',
          title: item.summary ?? '(khong co tieu de)',
          // Su kien ca ngay dung 'date', su kien co gio dung 'dateTime'
          start: item.start?.dateTime ?? item.start?.date ?? '',
          end: item.end?.dateTime ?? item.end?.date ?? '',
          location: item.location ?? '',
          description: item.description ?? '',
        }));

        return {
          success: true,
          data: { action: 'list', timeMin, timeMax, count: events.length, events },
        };
      }

      // ---------- TAO SU KIEN ----------
      if (params.action === 'create') {
        const title = params.title;
        const startTime = params.startTime;
        const endTime = params.endTime;

        if (typeof title !== 'string' || !title.trim()) {
          return { success: false, error: 'Thieu tieu de su kien (title)' };
        }
        if (typeof startTime !== 'string' || typeof endTime !== 'string') {
          return {
            success: false,
            error: 'Thieu thoi gian bat dau (startTime) hoac ket thuc (endTime)',
          };
        }

        const res = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: title,
            location: typeof params.location === 'string' ? params.location : undefined,
            description:
              typeof params.description === 'string' ? params.description : undefined,
            start: { dateTime: startTime, timeZone: TIME_ZONE },
            end: { dateTime: endTime, timeZone: TIME_ZONE },
          },
        });

        return {
          success: true,
          data: {
            action: 'create',
            id: res.data.id,
            title: res.data.summary,
            start: res.data.start?.dateTime,
            end: res.data.end?.dateTime,
            link: res.data.htmlLink,
          },
        };
      }

      return {
        success: false,
        error: `Hanh dong khong hop le: ${String(params.action)}`,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
};