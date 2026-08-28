import { describe, it, beforeEach, before, afterEach } from 'node:test';
import assert from 'node:assert';
import 'fake-indexeddb/auto';
import express from 'express';
import request from 'supertest';
import { openDB } from 'idb';

import { CryptoService } from '../src/services/offline/CryptoService';
import { SecureDB } from '../src/services/offline/SecureDB';
import { OfflineSyncService, OfflineSyncItem } from '../src/services/offline/OfflineSyncService';
import { SubmissionDraftService } from '../src/services/submissionDraftService';
import { AuthService } from '../src/services/authService';
import { dbStore } from '../src/services/dbStore';
import { parseAuthToken, requireAuth } from '../src/middleware/authMiddleware';
import caseRoutes from '../src/routes/caseRoutes';
import { User } from '../src/types';

if (typeof globalThis.crypto === 'undefined' && typeof require !== 'undefined') {
  globalThis.crypto = require('crypto').webcrypto;
}

describe('Phase 21.2 – Offline Sync Queue & Conflict Resolution', () => {
  const user1: User = {
    id: 'user-sync-1',
    email: 'tata.sync1@example.com',
    name: 'Tomáš Synchronní',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const user2: User = {
    id: 'user-sync-2',
    email: 'tata.sync2@example.com',
    name: 'Pavel Opatrný',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const testCaseId = 'case-sync-demo-1';
  const pin = '123456';

  let tokenUser1: string;
  let tokenUser2: string;
  let db: SecureDB;
  let saltBase64: string;

  // Setup Express server for integration tests
  const app = express();
  app.use(express.json());
  app.use(parseAuthToken as any);
  app.use('/api/cases', requireAuth as any, caseRoutes);

  before(async () => {
    tokenUser1 = AuthService.generateToken(user1);
    tokenUser2 = AuthService.generateToken(user2);
  });

  beforeEach(async () => {
    // Reset dbStore
    dbStore.submissionDrafts = [];
    dbStore.submissionDraftVersions = [];
    dbStore.users = dbStore.users.filter(u => u.id !== user1.id && u.id !== user2.id);
    dbStore.users.push(user1, user2);

    dbStore.cases = dbStore.cases.filter(c => c.id !== testCaseId);
    dbStore.cases.push({
      id: testCaseId,
      caseNumber: 'SYNC-123/2026',
      courtName: 'Okresní soud v Olomouci',
      status: 'ACTIVE',
      ownerId: user1.id,
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

  it('1. should safely enqueue offline draft changes into SecureDB with encryption', async () => {
    const item = await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      action: 'CREATE',
      payload: {
        title: 'Návrh na úpravu střídavé péče',
        templateId: 'STATED_CARE_01',
        formData: { childName: 'Anička' },
      },
    });

    assert.ok(item.operationId.startsWith('op-'));
    assert.strictEqual(item.status, 'PENDING');
    assert.strictEqual(item.caseId, testCaseId);

    const queue = await OfflineSyncService.getQueue(db);
    assert.strictEqual(queue.length, 1);
    assert.strictEqual(queue[0].payload.title, 'Návrh na úpravu střídavé péče');

    // Verify raw IndexedDB record is encrypted with AES-256-GCM
    const iDB = await openDB('tata_ma_pravo_secure_db', 1);
    const rawRecord = await iDB.get('encrypted_records', OfflineSyncService.QUEUE_KEY);
    assert.ok(rawRecord, 'Record must exist in IDB');
    assert.ok(rawRecord.ciphertext, 'Ciphertext must exist');
    assert.doesNotMatch(rawRecord.ciphertext, /střídavé péče/, 'Raw IDB record MUST NOT contain plaintext');
    iDB.close();
  });

  it('2. should fail-closed and throw ACCESS_DENIED if SecureDB is locked', async () => {
    db.lock();
    assert.strictEqual(db.isLocked(), true);

    await assert.rejects(
      async () => {
        await OfflineSyncService.enqueueOperation(db, {
          caseId: testCaseId,
          action: 'CREATE',
          payload: { title: 'Test' },
        });
      },
      (err: Error) => {
        assert.match(err.message, /ACCESS_DENIED/);
        return true;
      }
    );

    await assert.rejects(
      async () => {
        await OfflineSyncService.getQueue(db);
      },
      (err: Error) => {
        assert.match(err.message, /ACCESS_DENIED/);
        return true;
      }
    );
  });

  it('3. should process offline queue and successfully sync changes to backend API', async () => {
    await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      action: 'CREATE',
      payload: {
        title: 'Vyjádření k návrhu matky',
        templateId: 'OSPOD_REPLY_02',
        formData: { notes: 'Doklad o příjmech doložen' },
      },
    });

    // Custom API fetcher that calls local Express supertest endpoint
    const apiFetcher = async (endpoint: string, options: any) => {
      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send(JSON.parse(options.body));
      return res.body;
    };

    const syncResult = await OfflineSyncService.processQueue(db, apiFetcher);
    assert.strictEqual(syncResult.processedCount, 1);
    assert.strictEqual(syncResult.syncedCount, 1);

    const updatedQueue = await OfflineSyncService.getQueue(db);
    assert.strictEqual(updatedQueue[0].status, 'COMPLETED');

    // Verify draft now exists on server
    const drafts = await SubmissionDraftService.getDraftsForCase(testCaseId, user1);
    assert.strictEqual(drafts.length, 1);
    assert.strictEqual(drafts[0].title, 'Vyjádření k návrhu matky');
    assert.strictEqual(drafts[0].version, 1);
  });

  it('4. should enforce idempotency on repeated sync operations', async () => {
    const draftOnServer = await SubmissionDraftService.createDraft(testCaseId, user1, {
      title: 'Idempotentní návrh',
    });

    // Enqueue create with existing draftId
    await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      draftId: draftOnServer.id,
      action: 'CREATE',
      payload: { title: 'Idempotentní návrh' },
    });

    const apiFetcher = async (endpoint: string, options: any) => {
      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send(JSON.parse(options.body));
      return res.body;
    };

    const syncResult = await OfflineSyncService.processQueue(db, apiFetcher);
    assert.strictEqual(syncResult.processedCount, 1);
    assert.strictEqual(syncResult.results[0].status, 'ALREADY_SYNCED');

    // Verify no duplicates were created
    const drafts = await SubmissionDraftService.getDraftsForCase(testCaseId, user1);
    assert.strictEqual(drafts.length, 1);
  });

  it('5. should detect conflict when server draft updated before sync', async () => {
    // 1. Initial draft on server (v1)
    const serverDraft = await SubmissionDraftService.createDraft(testCaseId, user1, {
      title: 'Původní verze 1',
      generatedContent: 'Obsah v1',
    });

    // 2. Server draft updated to v2 (e.g. from another device)
    await SubmissionDraftService.updateDraft(testCaseId, serverDraft.id, user1, {
      title: 'Serverová verze 2',
      generatedContent: 'Obsah v2 ze serveru',
      createNewVersion: true,
    });

    // 3. Client enqueues update based on baseVersion 1
    await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      draftId: serverDraft.id,
      action: 'UPDATE',
      baseVersion: 1, // Client thought base version was 1!
      payload: {
        title: 'Lokální verze z mobilu',
        generatedContent: 'Obsah z mobilu',
      },
    });

    const apiFetcher = async (endpoint: string, options: any) => {
      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send(JSON.parse(options.body));
      return { status: res.status, ...res.body };
    };

    const syncResult = await OfflineSyncService.processQueue(db, apiFetcher);
    assert.strictEqual(syncResult.conflictCount, 1);

    const queue = await OfflineSyncService.getQueue(db);
    assert.strictEqual(queue[0].status, 'CONFLICT');
    assert.ok(queue[0].conflictDetails);
    assert.strictEqual(queue[0].conflictDetails?.serverDraft.title, 'Serverová verze 2');
    assert.strictEqual(queue[0].conflictDetails?.localDraft.title, 'Lokální verze z mobilu');

    // Server draft MUST NOT be automatically overwritten
    const draftAfterSync = await SubmissionDraftService.getDraftById(testCaseId, serverDraft.id, user1);
    assert.strictEqual(draftAfterSync.title, 'Serverová verze 2');
    assert.strictEqual(draftAfterSync.version, 2);
  });

  it('6. should resolve conflict using LOCAL resolution mode', async () => {
    const serverDraft = await SubmissionDraftService.createDraft(testCaseId, user1, { title: 'Verze 1' });
    await SubmissionDraftService.updateDraft(testCaseId, serverDraft.id, user1, { title: 'Verze 2 na serveru', createNewVersion: true });

    const op = await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      draftId: serverDraft.id,
      action: 'UPDATE',
      baseVersion: 1,
      payload: { title: 'Můj lokální návrh v03' },
    });

    const apiFetcher = async (endpoint: string, options: any) => {
      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send(JSON.parse(options.body));
      return res.body;
    };

    // First process queue -> results in CONFLICT
    await OfflineSyncService.processQueue(db, apiFetcher);

    // Now user explicitly chooses LOCAL resolution
    const resolved = await OfflineSyncService.resolveConflict(db, op.operationId, 'LOCAL', apiFetcher);
    assert.strictEqual(resolved.title, 'Můj lokální návrh v03');
    assert.strictEqual(resolved.version, 3); // Incremented to v3

    const queue = await OfflineSyncService.getQueue(db);
    assert.strictEqual(queue[0].status, 'COMPLETED');
  });

  it('7. should resolve conflict using SERVER resolution mode', async () => {
    const serverDraft = await SubmissionDraftService.createDraft(testCaseId, user1, { title: 'Verze 1' });
    await SubmissionDraftService.updateDraft(testCaseId, serverDraft.id, user1, { title: 'Server vyhrál', createNewVersion: true });

    const op = await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      draftId: serverDraft.id,
      action: 'UPDATE',
      baseVersion: 1,
      payload: { title: 'Lokální pokus' },
    });

    const apiFetcher = async (endpoint: string, options: any) => {
      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send(JSON.parse(options.body));
      return res.body;
    };

    await OfflineSyncService.processQueue(db, apiFetcher);

    // User chooses SERVER resolution
    const resolved = await OfflineSyncService.resolveConflict(db, op.operationId, 'SERVER', apiFetcher);
    assert.strictEqual(resolved.title, 'Server vyhrál');
    assert.strictEqual(resolved.version, 2);

    const queue = await OfflineSyncService.getQueue(db);
    assert.strictEqual(queue[0].status, 'COMPLETED');
  });

  it('8. should retry failed network operations up to maxRetries before marking FAILED', async () => {
    await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      action: 'CREATE',
      payload: { title: 'Dávkový test' },
    });

    // Mock failing API fetcher (500 Server Error)
    const mockFailingApi = async () => {
      throw new Error('Chyba sítě 500: Server nedostupný');
    };

    // Attempt 1
    await OfflineSyncService.processQueue(db, mockFailingApi);
    let queue = await OfflineSyncService.getQueue(db);
    assert.strictEqual(queue[0].retryCount, 1);
    assert.strictEqual(queue[0].status, 'PENDING');

    // Attempt 2
    await OfflineSyncService.processQueue(db, mockFailingApi);
    queue = await OfflineSyncService.getQueue(db);
    assert.strictEqual(queue[0].retryCount, 2);
    assert.strictEqual(queue[0].status, 'PENDING');

    // Attempt 3 (reaches maxRetries = 3)
    await OfflineSyncService.processQueue(db, mockFailingApi);
    queue = await OfflineSyncService.getQueue(db);
    assert.strictEqual(queue[0].retryCount, 3);
    assert.strictEqual(queue[0].status, 'FAILED');
  });

  it('9. should handle expired or invalid session and mark item FAILED with EXPIRED_SESSION', async () => {
    await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      action: 'CREATE',
      payload: { title: 'Zkouška neplatné relace' },
    });

    // Mock API fetcher that returns 401 Unauthorized
    const mockUnauthorizedApi = async () => {
      const err: any = new Error('Přístup odepřen: Neplatný token.');
      err.status = 401;
      throw err;
    };

    const syncResult = await OfflineSyncService.processQueue(db, mockUnauthorizedApi);
    assert.strictEqual(syncResult.failedCount, 1);

    const queue = await OfflineSyncService.getQueue(db);
    assert.strictEqual(queue[0].status, 'FAILED');
    assert.match(queue[0].error || '', /EXPIRED_SESSION/);
  });

  it('10. should reject unauthorized caseId sync attempt on server (BOLA/IDOR protection)', async () => {
    // User 2 attempts to send sync item targeting user 1's caseId
    const syncItem: OfflineSyncItem = {
      operationId: 'op-idor-test',
      caseId: testCaseId, // Owned by user 1
      action: 'CREATE',
      payload: { title: 'Hacker draft' },
      clientTimestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      status: 'PENDING',
    };

    const res = await request(app)
      .post(`/api/cases/${testCaseId}/submissions/sync`)
      .set('Authorization', `Bearer ${tokenUser2}`) // User 2!
      .send({ item: syncItem });

    assert.strictEqual(res.status, 403);
    assert.match(res.body.error, /Přístup odepřen/);
  });

  it('11. should NEVER store JWT or session tokens in SecureDB', async () => {
    await OfflineSyncService.enqueueOperation(db, {
      caseId: testCaseId,
      action: 'CREATE',
      payload: { title: 'Kontrola absence tokenů' },
    });

    const queue = await OfflineSyncService.getQueue(db);
    const queueJson = JSON.stringify(queue);
    
    // Check that JWT signature format (eyJ...) or tokens are not present
    assert.doesNotMatch(queueJson, /Bearer/);
    assert.doesNotMatch(queueJson, /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+/);

    // Verify raw IndexedDB record
    const iDB = await openDB('tata_ma_pravo_secure_db', 1);
    const rawRecord = await iDB.get('encrypted_records', OfflineSyncService.QUEUE_KEY);
    const rawJson = JSON.stringify(rawRecord);
    assert.doesNotMatch(rawJson, /Bearer/);
    assert.doesNotMatch(rawJson, /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+/);
    iDB.close();
  });
});
