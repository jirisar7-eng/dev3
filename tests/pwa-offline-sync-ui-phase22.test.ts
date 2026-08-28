import { describe, it, beforeEach, before, afterEach } from 'node:test';
import assert from 'node:assert';
import 'fake-indexeddb/auto';
import express from 'express';
import request from 'supertest';
import { openDB } from 'idb';

import { CryptoService } from '../src/services/offline/CryptoService';
import { SecureDB } from '../src/services/offline/SecureDB';
import { OfflineSyncService } from '../src/services/offline/OfflineSyncService';
import { SubmissionDraftService } from '../src/services/submissionDraftService';
import { AuthService } from '../src/services/authService';
import { dbStore } from '../src/services/dbStore';
import { parseAuthToken, requireAuth } from '../src/middleware/authMiddleware';
import caseRoutes from '../src/routes/caseRoutes';
import { User } from '../src/types';

if (typeof globalThis.crypto === 'undefined' && typeof require !== 'undefined') {
  globalThis.crypto = require('crypto').webcrypto;
}

describe('Phase 22 – PWA Offline Vault Sync UI & Integration', () => {
  const userAuthorized: User = {
    id: 'user-pwa-auth-1',
    email: 'pwa.user1@example.com',
    name: 'Petr PWA Autorizovaný',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const userAttacker: User = {
    id: 'user-pwa-attacker-2',
    email: 'pwa.attacker@example.com',
    name: 'Útočník Cizí',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const testCaseId = 'case-pwa-vault-100';
  const pin = '654321';

  let tokenUserAuth: string;
  let tokenUserAttacker: string;
  let db: SecureDB;
  let saltBase64: string;

  const app = express();
  app.use(express.json());
  app.use(parseAuthToken as any);
  app.use('/api/cases', requireAuth as any, caseRoutes);

  before(async () => {
    tokenUserAuth = AuthService.generateToken(userAuthorized);
    tokenUserAttacker = AuthService.generateToken(userAttacker);
  });

  beforeEach(async () => {
    // Reset dbStore
    dbStore.submissionDrafts = [];
    dbStore.submissionDraftVersions = [];
    dbStore.users = dbStore.users.filter(
      (u) => u.id !== userAuthorized.id && u.id !== userAttacker.id
    );
    dbStore.users.push(userAuthorized, userAttacker);

    dbStore.cases = dbStore.cases.filter((c) => c.id !== testCaseId);
    dbStore.cases.push({
      id: testCaseId,
      caseNumber: 'PWA-2026/001',
      courtName: 'Městský soud v Praze',
      status: 'ACTIVE',
      ownerId: userAuthorized.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    // Reset IndexedDB
    const iDB = await openDB('tata_ma_pravo_secure_db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('encrypted_records')) {
          db.createObjectStore('encrypted_records', { keyPath: 'id' });
        }
      },
    });
    if (iDB.objectStoreNames.contains('encrypted_records')) {
      await iDB.clear('encrypted_records');
    }
    iDB.close();

    db = new SecureDB();
    const salt = CryptoService.generateSalt();
    saltBase64 = CryptoService.bufferToBase64(salt);
    await db.unlock(pin, saltBase64);
  });

  afterEach(async () => {
    if (db) {
      db.lock();
    }
  });

  it('1. should verify offline queue count and item structure in SecureDB', async () => {
    const item1 = await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      action: 'CREATE',
      payload: {
        title: 'Draft Offline 1',
        status: 'DRAFT',
      },
    });

    const item2 = await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      action: 'UPDATE',
      payload: {
        title: 'Draft Offline 1 - Upraveno',
      },
    });

    const queue = await OfflineSyncService.getQueue(db);
    assert.strictEqual(queue.length, 2);
    assert.strictEqual(queue[0].operationId, item1.operationId);
    assert.strictEqual(queue[1].operationId, item2.operationId);
    assert.strictEqual(queue[0].status, 'PENDING');
  });

  it('2. should verify processQueue sends offline operations to backend and marks them COMPLETED', async () => {
    await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      action: 'CREATE',
      payload: {
        title: 'Návrh na střídavou péči (PWA Offline)',
        notes: 'Vytvořeno offline v terénu',
        status: 'DRAFT',
      },
    });

    const mockFetcher = async (endpoint: string, opts: any) => {
      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${tokenUserAuth}`)
        .send(opts.body ? JSON.parse(opts.body) : {});
      return res.body;
    };

    const summary = await OfflineSyncService.processQueue(db, mockFetcher);
    assert.strictEqual(summary.syncedCount, 1);
    assert.strictEqual(summary.conflictCount, 0);
    assert.strictEqual(summary.failedCount, 0);

    const queue = await OfflineSyncService.getQueue(db);
    assert.strictEqual(queue[0].status, 'COMPLETED');

    // Verify draft created in server database
    assert.strictEqual(dbStore.submissionDrafts.length, 1);
    assert.strictEqual(dbStore.submissionDrafts[0].title, 'Návrh na střídavou péči (PWA Offline)');
  });

  it('3. should verify conflict resolution with LOCAL version override', async () => {
    // 1. Server draft exists at version 2
    const serverDraft = await SubmissionDraftService.createDraft(testCaseId, userAuthorized, {
      title: 'Serverová verze před konfliktem',
      status: 'DRAFT',
    });
    await SubmissionDraftService.updateDraft(testCaseId, serverDraft.id, userAuthorized, {
      title: 'Serverová verze v2 (předbíhá klient)',
      createNewVersion: true,
    });

    // 2. Client offline operation based on version 1
    const offlineItem = await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      draftId: serverDraft.id,
      action: 'UPDATE',
      payload: {
        title: 'Místní offline úprava z terénu',
      },
      baseVersion: 1,
    });

    const mockFetcher = async (endpoint: string, opts: any) => {
      const method = (opts.method || 'GET').toLowerCase();
      const reqCall = (request(app) as any)[method](endpoint).set(
        'Authorization',
        `Bearer ${tokenUserAuth}`
      );
      if (opts.body) reqCall.send(JSON.parse(opts.body));
      const res = await reqCall;
      if (res.status >= 400 && res.status !== 409) {
        const err: any = new Error(res.body.error || 'API Error');
        err.status = res.status;
        err.details = res.body;
        throw err;
      }
      return res.body;
    };

    // Process queue -> produces CONFLICT
    const summary = await OfflineSyncService.processQueue(db, mockFetcher);
    assert.strictEqual(summary.conflictCount, 1);

    let queue = await OfflineSyncService.getQueue(db);
    assert.strictEqual(queue[0].status, 'CONFLICT');

    // Resolve conflict choosing LOCAL
    await OfflineSyncService.resolveConflict(
      db,
      offlineItem.operationId,
      'LOCAL',
      mockFetcher
    );

    queue = await OfflineSyncService.getQueue(db);
    assert.strictEqual(queue[0].status, 'COMPLETED');

    // Verify server draft now reflects LOCAL changes
    const updatedServerDraft = await SubmissionDraftService.getDraftById(
      testCaseId,
      serverDraft.id,
      userAuthorized
    );
    assert.strictEqual(updatedServerDraft?.title, 'Místní offline úprava z terénu');
  });

  it('4. should verify conflict resolution with SERVER version override', async () => {
    const serverDraft = await SubmissionDraftService.createDraft(testCaseId, userAuthorized, {
      title: 'Serverová verze v1',
      status: 'DRAFT',
    });
    await SubmissionDraftService.updateDraft(testCaseId, serverDraft.id, userAuthorized, {
      title: 'Serverová verze v2 (autoritativní)',
      createNewVersion: true,
    });

    const offlineItem = await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      draftId: serverDraft.id,
      action: 'UPDATE',
      payload: {
        title: 'Zahozená lokální verze',
      },
      baseVersion: 1,
    });

    const mockFetcher = async (endpoint: string, opts: any) => {
      const method = (opts.method || 'GET').toLowerCase();
      const reqCall = (request(app) as any)[method](endpoint).set(
        'Authorization',
        `Bearer ${tokenUserAuth}`
      );
      if (opts.body) reqCall.send(JSON.parse(opts.body));
      const res = await reqCall;
      if (res.status >= 400 && res.status !== 409) {
        const err: any = new Error(res.body.error || 'API Error');
        err.status = res.status;
        err.details = res.body;
        throw err;
      }
      return res.body;
    };

    await OfflineSyncService.processQueue(db, mockFetcher);

    // Resolve choosing SERVER
    await OfflineSyncService.resolveConflict(
      db,
      offlineItem.operationId,
      'SERVER',
      mockFetcher
    );

    const queue = await OfflineSyncService.getQueue(db);
    assert.strictEqual(queue[0].status, 'COMPLETED');

    // Server draft remains untouched as 'Serverová verze v2 (autoritativní)'
    const finalServerDraft = await SubmissionDraftService.getDraftById(
      testCaseId,
      serverDraft.id,
      userAuthorized
    );
    assert.strictEqual(finalServerDraft?.title, 'Serverová verze v2 (autoritativní)');
  });

  it('5. should enforce Fail-Closed when SecureDB is locked', async () => {
    db.lock();
    assert.strictEqual(db.isLocked(), true);

    await assert.rejects(
      async () => {
        await OfflineSyncService.enqueueOperation(db, {
          caseId: testCaseId,
          action: 'CREATE',
          payload: { title: 'Test locked' },
        });
      },
      (err: any) => err.message.includes('ACCESS_DENIED') || err.message.includes('locked')
    );
  });

  it('6. should verify TOKEN PROTECTION: No auth tokens stored in SecureDB items', async () => {
    await db.unlock(pin, saltBase64);
    const item = await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      action: 'CREATE',
      payload: {
        title: 'Bezpečnostní test bez tokenu',
        notes: 'Citlivé poznámky',
      },
    });

    const rawJson = JSON.stringify(item);
    assert.strictEqual(rawJson.includes('tatovacesta_auth_token'), false);
    assert.strictEqual(rawJson.includes('Bearer'), false);
    assert.strictEqual(rawJson.includes('eyJ'), false);
  });

  it('7. should enforce BOLA/IDOR protection on CaseSubmissionDraft endpoints during sync', async () => {
    // Attempt sync as userAttacker for userAuthorized's case
    const res = await request(app)
      .post(`/api/cases/${testCaseId}/submissions`)
      .set('Authorization', `Bearer ${tokenUserAttacker}`)
      .send({
        title: 'Neoprávněné podání útočníka',
        status: 'DRAFT',
      });

    assert.strictEqual(res.status, 403);
    assert.ok(res.body.error.includes('Přístup odepřen'));
  });

  it('8. should verify regression on CaseSubmissionDraft API versions history', async () => {
    const createRes = await request(app)
      .post(`/api/cases/${testCaseId}/submissions`)
      .set('Authorization', `Bearer ${tokenUserAuth}`)
      .send({
        title: 'Verze 1 PWA',
        status: 'DRAFT',
      });

    assert.strictEqual(createRes.status, 201);
    const draftId = createRes.body.data.id;

    const updateRes = await request(app)
      .put(`/api/cases/${testCaseId}/submissions/${draftId}`)
      .set('Authorization', `Bearer ${tokenUserAuth}`)
      .send({
        title: 'Verze 2 PWA',
        createNewVersion: true,
      });

    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.data.version, 2);

    const historyRes = await request(app)
      .get(`/api/cases/${testCaseId}/submissions/${draftId}/versions`)
      .set('Authorization', `Bearer ${tokenUserAuth}`);

    assert.strictEqual(historyRes.status, 200);
    assert.strictEqual(historyRes.body.data.length, 2);
  });
  it('9. should handle synchronization error and mark item as FAILED', async () => {
    await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      action: 'CREATE',
      payload: { title: 'Test chyby' },
    });

    const mockFetcher = async () => {
      throw new Error('Simulated network error');
    };

    const summary = await OfflineSyncService.processQueue(db, mockFetcher);
    assert.strictEqual(summary.failedCount, 1);

    const queue = await OfflineSyncService.getQueue(db);
    assert.strictEqual(queue[0].status, 'PENDING');
    assert.strictEqual(queue[0].retryCount, 1);
    assert.strictEqual(queue[0].error, 'Simulated network error');
  });

  it('10. should handle repeated sync attempts idempotently (opakované spuštění)', async () => {
    await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      action: 'CREATE',
      payload: { title: 'Test opakování' },
    });

    let calls = 0;
    const mockFetcher = async (endpoint: string, opts: any) => {
      calls++;
      return { data: { id: 'draft-1', version: 1, status: 'SYNCED' } };
    };

    // První spuštění
    await OfflineSyncService.processQueue(db, mockFetcher);
    
    // Druhé spuštění (nemělo by už nic posílat, protože je COMPLETED)
    const summary2 = await OfflineSyncService.processQueue(db, mockFetcher);
    assert.strictEqual(summary2.syncedCount, 0);
    assert.strictEqual(calls, 1); // call count remains 1
  });

  it('11. should block sync for unauthenticated user (nepřihlášený uživatel)', async () => {
    const res = await request(app)
      .post(`/api/cases/${testCaseId}/submissions`)
      .send({
        title: 'Anonymní podání',
        status: 'DRAFT',
      });

    assert.strictEqual(res.status, 401);
  });

});
