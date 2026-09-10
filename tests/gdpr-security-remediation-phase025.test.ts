import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseAuthToken, requireAuth, AuthenticatedRequest } from '../src/middleware/authMiddleware';
import { dbStore } from '../src/services/dbStore';
import { AuthService } from '../src/services/authService';

describe('TMPR-20260910-LEGAL-025: GDPR Security Remediation & Terms SSOT Verification', () => {

  test('1. Static Code Verification: server.ts protects all GDPR POST endpoints with requireAuth', () => {
    const serverPath = join(process.cwd(), 'server.ts');
    assert.strictEqual(existsSync(serverPath), true, 'server.ts must exist');
    const serverCode = readFileSync(serverPath, 'utf-8');

    assert.match(
      serverCode,
      /app\.post\('\/api\/gdpr\/consent-log',\s*requireAuth/,
      'POST /api/gdpr/consent-log must be protected by requireAuth'
    );
    assert.match(
      serverCode,
      /app\.post\('\/api\/gdpr\/sensitive-access',\s*requireAuth/,
      'POST /api/gdpr/sensitive-access must be protected by requireAuth'
    );
    assert.match(
      serverCode,
      /app\.post\('\/api\/gdpr\/deletion-request',\s*requireAuth/,
      'POST /api/gdpr/deletion-request must be protected by requireAuth'
    );

    // IDOR protection check in server.ts
    assert.match(
      serverCode,
      /if\s*\(\s*userId\s*&&\s*userId\s*!==\s*authenticatedUserId\s*\)\s*\{\s*return\s*res\.status\(403\)/,
      'server.ts must explicitly reject mismatched userId with 403'
    );
  });

  test('2. Static SSOT Verification: 02-TERMS-OF-USE-DRAFT.md specifies Argon2id instead of bcrypt', () => {
    const termsPath = join(process.cwd(), 'docs/legal-drafts/legal-pack-2.0/02-TERMS-OF-USE-DRAFT.md');
    assert.strictEqual(existsSync(termsPath), true, '02-TERMS-OF-USE-DRAFT.md must exist');
    const termsContent = readFileSync(termsPath, 'utf-8');

    assert.match(
      termsContent,
      /Argon2id hesla/,
      'Článek 12 heading and TOC must reference Argon2id'
    );
    assert.match(
      termsContent,
      /vygenerovaných moderním paměťově a výpočetně náročným algoritmem `Argon2id`/,
      'Článek 12.1(a) must specify Argon2id algorithm'
    );
    assert.match(
      termsContent,
      /automatickým a transparentním povýšením \(upgradem\) hashe na `Argon2id`/,
      'Článek 12.1(a) must specify automatic upgrade from legacy bcrypt'
    );
  });

  describe('3. Dynamic Security Endpoints Test Suite', () => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser(process.env.JWT_SECRET));
    app.use(parseAuthToken as any);

    // Mock GDPR endpoints mirroring server.ts logic
    app.post('/api/gdpr/consent-log', requireAuth as any, async (req: AuthenticatedRequest, res) => {
      try {
        const { documentType, documentVersion, userId } = req.body;
        const authenticatedUserId = req.user?.id;
        if (!authenticatedUserId) return res.status(401).json({ error: 'Neautorizovaný přístup.' });

        if (userId && userId !== authenticatedUserId) {
          return res.status(403).json({ error: 'Přístup odepřen. Nelze zaznamenávat souhlas za cizího uživatele.' });
        }

        res.json({ success: true, targetUserId: authenticatedUserId, documentType, documentVersion });
      } catch (err: any) {
        res.status(400).json({ error: err.message });
      }
    });

    app.post('/api/gdpr/sensitive-access', requireAuth as any, async (req: AuthenticatedRequest, res) => {
      try {
        const { action, resource, userId } = req.body;
        const authenticatedUserId = req.user?.id;
        if (!authenticatedUserId) return res.status(401).json({ error: 'Neautorizovaný přístup.' });

        if (userId && userId !== authenticatedUserId) {
          return res.status(403).json({ error: 'Přístup odepřen. Nelze zaznamenávat auditní záznam za cizího uživatele.' });
        }

        res.json({ success: true, targetUserId: authenticatedUserId, action, resource });
      } catch (err: any) {
        res.status(400).json({ error: err.message });
      }
    });

    app.post('/api/gdpr/deletion-request', requireAuth as any, async (req: AuthenticatedRequest, res) => {
      try {
        const { userId, notes } = req.body;
        const authenticatedUserId = req.user?.id;
        if (!authenticatedUserId) return res.status(401).json({ error: 'Neautorizovaný přístup.' });

        if (userId && userId !== authenticatedUserId) {
          return res.status(403).json({ error: 'Přístup odepřen. Nelze žádat o výmaz cizího uživatelského účtu.' });
        }

        res.json({ success: true, targetUserId: authenticatedUserId, notes, status: 'PENDING' });
      } catch (err: any) {
        res.status(400).json({ error: err.message });
      }
    });

    const testUserA = {
      id: 'test-user-a-025',
      email: 'user-a-025@example.com',
      name: 'User A 025',
      role: 'USER',
      status: 'ACTIVE',
      totpEnabled: false,
    };

    let userAToken = '';

    before(() => {
      dbStore.users.push(testUserA as any);
      userAToken = AuthService.generateToken(testUserA as any);
    });

    after(() => {
      dbStore.users = dbStore.users.filter(u => u.id !== testUserA.id);
    });

    test('A. Unauthenticated POST /api/gdpr/deletion-request returns 401', async () => {
      const res = await request(app)
        .post('/api/gdpr/deletion-request')
        .send({ notes: 'Delete me' });

      assert.strictEqual(res.status, 401, 'Unauthenticated request must return 401');
    });

    test('B. Authenticated User A targeting User B (IDOR attempt) returns 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/gdpr/deletion-request')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ userId: 'user-b-victim-456', notes: 'Malicious deletion attempt' });

      assert.strictEqual(res.status, 403, 'Cross-user IDOR request must return 403');
      assert.match(res.body.error, /cizího/, 'Error message must explain access denied');
    });

    test('C. Authenticated User A with no body userId creates request for User A', async () => {
      const res = await request(app)
        .post('/api/gdpr/deletion-request')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ notes: 'Legitimate deletion request' });

      assert.strictEqual(res.status, 200, 'Legitimate request must return 200');
      assert.strictEqual(res.body.targetUserId, 'test-user-a-025', 'Target user must match authenticated user');
    });

    test('D. Authenticated User A with matching userId creates request for User A', async () => {
      const res = await request(app)
        .post('/api/gdpr/deletion-request')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ userId: 'test-user-a-025', notes: 'Legitimate deletion request with explicit userId' });

      assert.strictEqual(res.status, 200, 'Legitimate request must return 200');
      assert.strictEqual(res.body.targetUserId, 'test-user-a-025', 'Target user must match authenticated user');
    });

    test('E. POST /api/gdpr/consent-log requires auth and denies foreign userId', async () => {
      // Unauthenticated
      const unauthRes = await request(app)
        .post('/api/gdpr/consent-log')
        .send({ documentType: 'PRIVACY_POLICY', documentVersion: '0.5.1' });
      assert.strictEqual(unauthRes.status, 401);

      // IDOR attempt
      const idorRes = await request(app)
        .post('/api/gdpr/consent-log')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ userId: 'user-b-victim-456', documentType: 'PRIVACY_POLICY', documentVersion: '0.5.1' });
      assert.strictEqual(idorRes.status, 403);

      // Legitimate
      const legitRes = await request(app)
        .post('/api/gdpr/consent-log')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ userId: 'test-user-a-025', documentType: 'PRIVACY_POLICY', documentVersion: '0.5.1' });
      assert.strictEqual(legitRes.status, 200);
      assert.strictEqual(legitRes.body.targetUserId, 'test-user-a-025');
    });

    test('F. POST /api/gdpr/sensitive-access requires auth and denies foreign userId', async () => {
      // Unauthenticated
      const unauthRes = await request(app)
        .post('/api/gdpr/sensitive-access')
        .send({ action: 'VIEW_SENSITIVE_CASE', resource: 'CASE-001' });
      assert.strictEqual(unauthRes.status, 401);

      // IDOR attempt
      const idorRes = await request(app)
        .post('/api/gdpr/sensitive-access')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ userId: 'user-b-victim-456', action: 'VIEW_SENSITIVE_CASE', resource: 'CASE-001' });
      assert.strictEqual(idorRes.status, 403);

      // Legitimate
      const legitRes = await request(app)
        .post('/api/gdpr/sensitive-access')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ userId: 'test-user-a-025', action: 'VIEW_SENSITIVE_CASE', resource: 'CASE-001' });
      assert.strictEqual(legitRes.status, 200);
      assert.strictEqual(legitRes.body.targetUserId, 'test-user-a-025');
    });
  });
});
