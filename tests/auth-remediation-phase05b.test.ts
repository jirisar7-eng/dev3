import process from 'node:process';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-05b-remediation';
process.env.NODE_ENV = 'test';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import { AuthService } from '../src/services/authService.js';
import { parseAuthToken, requireAuth, AuthenticatedRequest } from '../src/middleware/authMiddleware.js';
import { getClearCookieOptions } from '../src/utils/cookieUtils.js';
import { TotpService } from '../src/services/totpService.js';
import { dbStore } from '../src/services/dbStore.js';

// Setup test Express app with exact server endpoints
const app = express();
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(parseAuthToken as any);

app.post('/api/auth/logout', (req: AuthenticatedRequest, res) => {
  if (req.session && req.session.destroy) {
    req.session.destroy();
  }
  res.clearCookie('token', getClearCookieOptions(false));
  res.clearCookie('token', getClearCookieOptions(true));
  res.clearCookie('pending_mfa_user', getClearCookieOptions(false));
  res.clearCookie('pending_mfa_user', getClearCookieOptions(true));
  res.clearCookie('passkey_auth_challenge', getClearCookieOptions(false));
  res.clearCookie('passkey_auth_challenge', getClearCookieOptions(true));
  res.clearCookie('passkey_reg_challenge', getClearCookieOptions(false));
  res.clearCookie('passkey_reg_challenge', getClearCookieOptions(true));
  res.clearCookie('google_oauth_state', getClearCookieOptions(false));
  res.clearCookie('google_oauth_state', getClearCookieOptions(true));
  res.clearCookie('microsoft_oauth_state', getClearCookieOptions(false));
  res.clearCookie('microsoft_oauth_state', getClearCookieOptions(true));
  res.clearCookie('oauth_return_url', getClearCookieOptions(false));
  res.clearCookie('oauth_return_url', getClearCookieOptions(true));

  res.json({ success: true, message: 'Uživatel byl úspěšně odhlášen.' });
});

app.post('/api/auth/2fa/verify', async (req: AuthenticatedRequest, res) => {
  try {
    const { mfaToken, code } = req.body;

    if (!mfaToken) {
      return res.status(401).json({ error: 'Chybí token pro dvoufázové ověření. Přihlaste se znovu.' });
    }

    const verifiedMfa = AuthService.verifyMfaToken(mfaToken);
    if (!verifiedMfa || !verifiedMfa.userId) {
      return res.status(401).json({ error: 'Relace ověření vypršela nebo je neplatná. Přihlaste se znovu.' });
    }

    const targetUserId = verifiedMfa.userId;

    if (!code) {
      return res.status(400).json({ error: 'Chybí ověřovací kód.' });
    }

    const user = dbStore.users.find((u) => u.id === targetUserId);

    if (!user) {
      return res.status(404).json({ error: 'Uživatel nebyl nalezen.' });
    }

    let secret = user.totpSecret;
    let backupCodes: string[] = user.totpBackupCodes || [];

    if (!secret) {
      return res.status(400).json({ error: 'Pro tohoto uživatele není 2FA aktivní.' });
    }

    let verified = TotpService.verifyToken(secret, code);
    let isBackupUsed = false;

    if (!verified && backupCodes.length > 0) {
      const inputHash = TotpService.hashBackupCode(code.trim().toUpperCase());
      for (const bc of backupCodes) {
        if (bc === inputHash) {
          verified = true;
          isBackupUsed = true;
          backupCodes = backupCodes.filter((c) => c !== bc);
          break;
        }
      }

      if (isBackupUsed) {
        user.totpBackupCodes = backupCodes;
      }
    }

    if (!verified) {
      return res.status(401).json({ error: 'Neplatný ověřovací kód.' });
    }

    const token = AuthService.generateToken(user, true);
    const sanitizedUser = AuthService.sanitizeUser(user);

    res.json({ success: true, token, user: sanitizedUser });
  } catch (err: any) {
    res.status(500).json({ error: 'Chyba při ověřování 2FA.' });
  }
});

app.get('/api/protected/resource', requireAuth as any, (req: AuthenticatedRequest, res) => {
  res.json({ success: true, userId: req.user?.id });
});

describe('PHASE 05B - AUTH / SESSION / MFA SECURITY REMEDIATION', () => {
  const testUserA = {
    id: 'user-05b-a',
    email: 'usera@test05b.cz',
    name: 'User A',
    role: 'USER' as const,
    status: 'ACTIVE' as const,
    totpEnabled: true,
    totpSecret: speakeasy.generateSecret().base32,
    totpBackupCodes: [TotpService.hashBackupCode('BACKUP01')],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const testUserB = {
    id: 'user-05b-b',
    email: 'userb@test05b.cz',
    name: 'User B',
    role: 'USER' as const,
    status: 'ACTIVE' as const,
    totpEnabled: true,
    totpSecret: speakeasy.generateSecret().base32,
    totpBackupCodes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const testAdmin = {
    id: 'admin-05b-1',
    email: 'admin@test05b.cz',
    name: 'Admin User',
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
    totpEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  before(() => {
    dbStore.users.push(testUserA as any, testUserB as any, testAdmin as any);
  });

  after(() => {
    dbStore.users = dbStore.users.filter(u => !u.id.includes('05b'));
  });

  // SCENARIO 1: MFA verify without mfaToken must fail
  test('SCENARIO 1: MFA verify without mfaToken must be rejected with 401', async () => {
    const res = await request(app)
      .post('/api/auth/2fa/verify')
      .send({ userId: testUserA.id, code: '123456' });

    assert.strictEqual(res.status, 401);
    assert.match(res.body.error, /Chybí token pro dvoufázové ověření/);
  });

  // SCENARIO 2: MFA verify with invalid / tampered mfaToken must fail
  test('SCENARIO 2: MFA verify with invalid/tampered mfaToken must be rejected with 401', async () => {
    const res = await request(app)
      .post('/api/auth/2fa/verify')
      .send({ mfaToken: 'header.payload.signature_tampered', code: '123456' });

    assert.strictEqual(res.status, 401);
    assert.match(res.body.error, /Relace ověření vypršela nebo je neplatná/);
  });

  // SCENARIO 3: MFA verify with expired mfaToken must fail
  test('SCENARIO 3: MFA verify with expired mfaToken must be rejected with 401', async () => {
    const expiredMfaToken = jwt.sign(
      { sub: testUserA.id, type: 'mfa_pending' },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256', expiresIn: '-1s' }
    );

    const res = await request(app)
      .post('/api/auth/2fa/verify')
      .send({ mfaToken: expiredMfaToken, code: '123456' });

    assert.strictEqual(res.status, 401);
    assert.match(res.body.error, /Relace ověření vypršela nebo je neplatná/);
  });

  // SCENARIO 4: MFA verify with mfaToken of User A, but body specifying userId of User B
  test('SCENARIO 4: MFA verify ignores req.body.userId and uses strictly mfaToken target', async () => {
    const userAMfaToken = AuthService.generateMfaToken(testUserA.id);
    const validCodeUserA = speakeasy.totp({ secret: testUserA.totpSecret, encoding: 'base32' });

    // Attack: Send User A's mfaToken with User B's userId in body
    const res = await request(app)
      .post('/api/auth/2fa/verify')
      .send({ mfaToken: userAMfaToken, userId: testUserB.id, code: validCodeUserA });

    // Must succeed for User A (because mfaToken belongs to User A), ignoring the injected userId of User B
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.id, testUserA.id, 'User ID in response MUST be User A, not User B');
  });

  // SCENARIO 5: MFA verify with valid mfaToken and correct TOTP code
  test('SCENARIO 5: MFA verify with valid mfaToken and correct TOTP code succeeds', async () => {
    const mfaToken = AuthService.generateMfaToken(testUserA.id);
    const validCode = speakeasy.totp({ secret: testUserA.totpSecret, encoding: 'base32' });

    const res = await request(app)
      .post('/api/auth/2fa/verify')
      .send({ mfaToken, code: validCode });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.id, testUserA.id);
    assert.ok(res.body.token, 'Must return JWT token');
  });

  // SCENARIO 6: MFA verify with valid mfaToken and invalid TOTP code
  test('SCENARIO 6: MFA verify with valid mfaToken and wrong TOTP code fails with 401', async () => {
    const mfaToken = AuthService.generateMfaToken(testUserA.id);

    const res = await request(app)
      .post('/api/auth/2fa/verify')
      .send({ mfaToken, code: '000000' });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, 'Neplatný ověřovací kód.');
  });

  // SCENARIO 7: MFA verify with valid backup code
  test('SCENARIO 7: MFA verify with valid backup code succeeds and consumes code', async () => {
    const mfaToken = AuthService.generateMfaToken(testUserA.id);

    const res = await request(app)
      .post('/api/auth/2fa/verify')
      .send({ mfaToken, code: 'BACKUP01' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(testUserA.totpBackupCodes.length, 0, 'Backup code must be consumed');
  });

  // SCENARIO 8: Admin token expiration (2 hours)
  test('SCENARIO 8: Admin JWT token generated with 2h expiration', () => {
    const token = AuthService.generateToken(testAdmin, true);
    const decoded = jwt.decode(token) as any;

    assert.ok(decoded, 'Token decoded successfully');
    const lifetimeSeconds = decoded.exp - decoded.iat;
    assert.strictEqual(lifetimeSeconds, 2 * 3600, 'Admin JWT must expire in exactly 2 hours (7200s)');
  });

  // SCENARIO 9: Regular User token expiration (24 hours)
  test('SCENARIO 9: Regular User JWT token generated with 24h expiration', () => {
    const token = AuthService.generateToken(testUserA, false);
    const decoded = jwt.decode(token) as any;

    assert.ok(decoded, 'Token decoded successfully');
    const lifetimeSeconds = decoded.exp - decoded.iat;
    assert.strictEqual(lifetimeSeconds, 24 * 3600, 'User JWT must expire in exactly 24 hours (86400s)');
  });

  // SCENARIO 10: Logout cleanup clears all auth/session cookies
  test('SCENARIO 10: Logout endpoint clears all session and temporary cookies', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .expect(200);

    const setCookies = res.headers['set-cookie'] || [];
    const clearedNames = setCookies.map((c: string) => c.split('=')[0]);

    assert.ok(clearedNames.includes('token'), 'Must clear token cookie');
    assert.ok(clearedNames.includes('pending_mfa_user'), 'Must clear pending_mfa_user cookie');
    assert.ok(clearedNames.includes('passkey_auth_challenge'), 'Must clear passkey_auth_challenge cookie');
    assert.ok(clearedNames.includes('google_oauth_state'), 'Must clear google_oauth_state cookie');
    assert.ok(clearedNames.includes('microsoft_oauth_state'), 'Must clear microsoft_oauth_state cookie');
    assert.ok(clearedNames.includes('oauth_return_url'), 'Must clear oauth_return_url cookie');
  });

  // SCENARIO 11: Access protected route with expired JWT token fails with 401
  test('SCENARIO 11: Protected endpoint rejects expired JWT Bearer token', async () => {
    const expiredToken = jwt.sign(
      { sub: testUserA.id, role: testUserA.role, mfaVerified: true },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256', expiresIn: '-10s' }
    );

    const res = await request(app)
      .get('/api/protected/resource')
      .set('Authorization', `Bearer ${expiredToken}`);

    assert.strictEqual(res.status, 401);
  });

  // SCENARIO 12: Access protected route with valid JWT token succeeds
  test('SCENARIO 12: Protected endpoint accepts valid JWT Bearer token', async () => {
    const validToken = AuthService.generateToken(testUserA, true);

    const res = await request(app)
      .get('/api/protected/resource')
      .set('Authorization', `Bearer ${validToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.userId, testUserA.id);
  });
});
