import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import type { OAuth2Client, Credentials } from 'google-auth-library';

/**
 * Quản lý xác thực OAuth 2.0 với Google.
 *
 * Luồng OAuth 2.0 (đơn giản hoá):
 *  1. Ta gửi người dùng tới trang đăng nhập Google kèm danh sách quyền cần xin
 *  2. Người dùng đồng ý -> Google chuyển hướng về redirect URI kèm 1 "code"
 *  3. Ta đổi "code" đó lấy access_token + refresh_token
 *  4. access_token hết hạn sau ~1 giờ, nhưng refresh_token dùng được lâu dài
 *     -> thư viện tự động dùng refresh_token để lấy access_token mới
 *
 * Token được lưu vào token.json (đã bị .gitignore chặn, không đẩy lên GitHub).
 */

/**
 * Danh sach quyen can xin.
 * Nguyen tac least privilege: chi xin dung nhung gi thuc su can.
 *  - gmail.readonly:   CHI DOC email, khong the gui/xoa
 *  - calendar.events:  doc va TAO su kien lich (can quyen ghi de dat lich)
 *
 * LUU Y: moi lan them scope moi, phai chay lai `npm run auth`
 * vi token cu khong bao gom quyen moi.
 */
export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

export const REDIRECT_URI = 'http://localhost:3001/oauth2callback';

export const TOKEN_PATH = path.join(process.cwd(), 'token.json');

/** Tạo OAuth client từ credentials trong .env (chưa có token) */
export function createOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Thieu GOOGLE_CLIENT_ID hoac GOOGLE_CLIENT_SECRET trong file .env'
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
}

/** Lưu token xuống file */
export function saveToken(credentials: Credentials): void {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2), 'utf-8');
}

/**
 * Lấy OAuth client ĐÃ có token, sẵn sàng gọi Gmail API.
 * Nếu chưa xác thực lần nào -> báo lỗi kèm hướng dẫn.
 */
export function getAuthorizedClient(): OAuth2Client {
  const client = createOAuthClient();

  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(
      'Chua xac thuc Google. Hay chay lenh: npm run auth'
    );
  }

  const token: Credentials = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  client.setCredentials(token);

  // Khi thu vien tu dong refresh token, luu lai de lan sau dung tiep
  client.on('tokens', (newTokens) => {
    const merged = { ...token, ...newTokens };
    saveToken(merged);
    console.log('[Auth] Token refreshed and saved');
  });

  return client;
}