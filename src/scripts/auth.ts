import 'dotenv/config';
import http from 'http';
import { URL } from 'url';
import {
  createOAuthClient,
  saveToken,
  SCOPES,
  TOKEN_PATH,
} from '../auth/google.auth';

/**
 * Script CHAY MOT LAN de xac thuc voi Google.
 * Cach dung: npm run auth
 *
 * Script se:
 *  1. In ra 1 duong link -> ban mo tren browser, dang nhap va dong y quyen
 *  2. Google chuyen huong ve http://localhost:3001/oauth2callback kem "code"
 *  3. Server tam thoi o day bat lay code, doi lay token, luu vao token.json
 *  4. Tu dong tat server
 */

const PORT = 3001;

async function main() {
  const client = createOAuthClient();

  const authUrl = client.generateAuthUrl({
    access_type: 'offline', // can 'offline' de nhan duoc refresh_token
    scope: SCOPES,
    prompt: 'consent', // luon hien trang dong y -> dam bao co refresh_token
  });

  console.log('\n=== XAC THUC GOOGLE ===\n');
  console.log('1. Mo link sau tren browser:\n');
  console.log(authUrl);
  console.log('\n2. Dang nhap va bam "Continue" / "Allow"');
  console.log('3. Doi thong bao thanh cong o day...\n');

  const server = http.createServer(async (req, res) => {
    if (!req.url?.startsWith('/oauth2callback')) {
      res.writeHead(404);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h2>Xac thuc bi tu choi</h2>');
      console.error('[Auth] Bi tu choi:', error);
      server.close();
      return;
    }

    if (!code) {
      res.writeHead(400);
      res.end('Thieu code');
      return;
    }

    try {
      const { tokens } = await client.getToken(code);
      saveToken(tokens);

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(
        '<h2>Xac thuc thanh cong!</h2><p>Ban co the dong tab nay va quay lai terminal.</p>'
      );

      console.log('[Auth] Thanh cong! Token da luu vao:', TOKEN_PATH);
      console.log('[Auth] Gio ban co the chay: npm run dev\n');
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h2>Loi khi doi code lay token</h2>');
      console.error('[Auth] Loi:', err);
    } finally {
      server.close();
      // Thoat sau 1 giay de kip gui response ve browser
      setTimeout(() => process.exit(0), 1000);
    }
  });

  server.listen(PORT, () => {
    console.log(`[Auth] Dang cho callback tai http://localhost:${PORT} ...\n`);
  });
}

main().catch((err) => {
  console.error('[Auth] Loi:', err);
  process.exit(1);
});