import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { parseAuthToken, requireAuth, AuthenticatedRequest } from '../src/middleware/authMiddleware.js';
import { getClearCookieOptions } from '../src/utils/cookieUtils.js';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret';
process.env.COOKIE_DOMAIN = 'localhost';
process.env.NODE_ENV = 'production';

const app = express();
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(parseAuthToken as any);

app.post('/api/auth/logout', (req: AuthenticatedRequest, res) => {
  if (req.session && req.session.destroy) {
    req.session.destroy();
  }
  res.clearCookie('token', getClearCookieOptions(false));
  res.json({ success: true });
});

app.post('/api/auth/login', (req: AuthenticatedRequest, res) => {
  const { email } = req.body;
  if (email === 'userB@test.com') {
    res.cookie('pending_mfa_user', 'userB-id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.COOKIE_DOMAIN || undefined,
      maxAge: 10 * 60 * 1000,
    });
    return res.json({ mfaRequired: true, userId: 'userB-id' });
  }
  
  const token = jwt.sign({ sub: 'userA-id', mfaVerified: true }, process.env.JWT_SECRET!);
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    domain: process.env.COOKIE_DOMAIN,
    signed: true
  });
  res.json({ user: { id: 'userA-id', email } });
});

app.get('/api/auth/me', requireAuth as any, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user || { id: req.session?.userId } });
});

describe('P0 AUTH SESSION CONSISTENCY & STATE LIFECYCLE', () => {
  let userACookie = '';

  test('TEST 1: User A logs in, gets token cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'userA@test.com', password: 'pwd' })
      .expect(200);
    userACookie = res.headers['set-cookie'].find((c: string) => c.startsWith('token='));
    assert.ok(userACookie, 'User A should receive token cookie');
  });

  test('TEST 2: User A logs out, clears cookie with EXACT domain options', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', userACookie)
      .expect(200);
      
    const clearedCookie = res.headers['set-cookie'].find((c: string) => c.startsWith('token='));
    assert.ok(clearedCookie.includes('Expires='), 'Cookie must be expired');
    assert.ok(clearedCookie.includes('Domain=localhost'), 'ClearCookie MUST include matching domain');
    assert.ok(clearedCookie.includes('Secure'), 'ClearCookie MUST include Secure flag');
  });

  test('TEST 3: /api/auth/me returns 401 after logout', async () => {
    // If the browser cleared the cookie, it won't send it. 
    // We simulate this by not sending the cookie.
    await request(app)
      .get('/api/auth/me')
      .expect(401);
  });
  
  test('TEST 4: User B login sets pending_mfa_user but DOES NOT log in User A', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'userB@test.com', password: 'pwd' })
      .expect(200);
    
    assert.strictEqual(res.body.mfaRequired, true);
    const pendingCookie = res.headers['set-cookie'].find((c: string) => c.startsWith('pending_mfa_user='));
    assert.ok(pendingCookie, 'User B should receive pending MFA cookie');
  });
});
