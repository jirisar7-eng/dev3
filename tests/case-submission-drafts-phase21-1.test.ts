import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import { SubmissionDraftService } from '../src/services/submissionDraftService';
import { AuthService } from '../src/services/authService';
import { dbStore } from '../src/services/dbStore';
import { parseAuthToken, requireAuth } from '../src/middleware/authMiddleware';
import caseRoutes from '../src/routes/caseRoutes';
import { User } from '../src/types';

describe('Phase 21.1 – Case Submission Drafts & Versioning', () => {
  const user1: User = {
    id: 'user-1',
    email: 'otik.novak@example.com',
    name: 'Jan Novák',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const user2: User = {
    id: 'user-2',
    email: 'petr.svoboda@example.com',
    name: 'Petr Svoboda',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const adminUser: User = {
    id: 'user-admin',
    email: 'admin@tatamapravo.cz',
    name: 'Admin Správce',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const testCaseId = 'case-demo-1'; // Owned by user-1 in dbStore

  // Setup express test application
  const app = express();
  app.use(express.json());
  app.use(parseAuthToken as any);
  app.use('/api/cases', requireAuth as any, caseRoutes);

  let tokenUser1: string;
  let tokenUser2: string;

  beforeEach(() => {
    // Reset in-memory store before each test
    dbStore.submissionDrafts = [];
    dbStore.submissionDraftVersions = [];

    // Ensure users exist in dbStore.users for authMiddleware lookup
    dbStore.users = dbStore.users.filter(u => u.id !== 'user-1' && u.id !== 'user-2' && u.id !== 'user-admin');
    dbStore.users.push(user1, user2, adminUser);

    tokenUser1 = AuthService.generateToken(user1);
    tokenUser2 = AuthService.generateToken(user2);
  });

  it('1. CRUD – should create, read, update, and delete a submission draft', async () => {
    // Create
    const created = await SubmissionDraftService.createDraft(testCaseId, user1, {
      title: 'Návrh na úpravu péče',
      templateId: 'navrh-stridava-pece',
      formData: { fatherName: 'Jan Novák', childName: 'Jakub Novák', careInterval: '7/7' },
      generatedContent: 'Žalobní návrh na úpravu poměrů nezletilého...',
      notes: 'Rozpracovaná verze pro právníka',
      status: 'DRAFT',
    });

    assert.ok(created.id, 'Draft should have a valid ID');
    assert.strictEqual(created.caseId, testCaseId);
    assert.strictEqual(created.userId, user1.id);
    assert.strictEqual(created.title, 'Návrh na úpravu péče');
    assert.strictEqual(created.version, 1);
    assert.strictEqual(created.status, 'DRAFT');
    assert.strictEqual(created.versions?.length, 1);
    assert.strictEqual(created.versions[0].changeSummary, 'Prvotní koncept podání');

    // Read by ID
    const fetched = await SubmissionDraftService.getDraftById(testCaseId, created.id, user1);
    assert.strictEqual(fetched.id, created.id);
    assert.strictEqual(fetched.title, 'Návrh na úpravu péče');

    // List for Case
    const draftsList = await SubmissionDraftService.getDraftsForCase(testCaseId, user1);
    assert.strictEqual(draftsList.length, 1);
    assert.strictEqual(draftsList[0].id, created.id);

    // Update draft
    const updated = await SubmissionDraftService.updateDraft(testCaseId, created.id, user1, {
      title: 'Návrh na střídavou péči (Finální)',
      status: 'FINAL',
      notes: 'Zkontrolováno právním poradcem',
      createNewVersion: true,
      changeSummary: 'Finální korektura textu',
    });

    assert.strictEqual(updated.title, 'Návrh na střídavou péči (Finální)');
    assert.strictEqual(updated.status, 'FINAL');
    assert.strictEqual(updated.version, 2);
    assert.strictEqual(updated.versions?.length, 2);
    assert.strictEqual(updated.versions[0].changeSummary, 'Finální korektura textu');

    // Delete
    const deleted = await SubmissionDraftService.deleteDraft(testCaseId, created.id, user1);
    assert.strictEqual(deleted, true);

    // Verify deletion
    await assert.rejects(
      async () => {
        await SubmissionDraftService.getDraftById(testCaseId, created.id, user1);
      },
      (err: Error) => err.message.includes('nebyl nalezen')
    );
  });

  it('2. BOLA / IDOR Isolation – unauthorized user cannot access another user\'s draft', async () => {
    // Create draft as user-1
    const draft = await SubmissionDraftService.createDraft(testCaseId, user1, {
      title: 'Citlivý dokument otce 1',
      formData: { secretNote: 'Důvěrná strategie pro soud' },
    });

    // User-2 attempts to list drafts of user-1's case
    await assert.rejects(
      async () => {
        await SubmissionDraftService.getDraftsForCase(testCaseId, user2);
      },
      (err: Error) => err.message.includes('Přístup odepřen')
    );

    // User-2 attempts to get draft by ID
    await assert.rejects(
      async () => {
        await SubmissionDraftService.getDraftById(testCaseId, draft.id, user2);
      },
      (err: Error) => err.message.includes('Přístup odepřen')
    );

    // User-2 attempts to update draft
    await assert.rejects(
      async () => {
        await SubmissionDraftService.updateDraft(testCaseId, draft.id, user2, {
          title: 'Hacker modify title',
        });
      },
      (err: Error) => err.message.includes('Přístup odepřen')
    );

    // User-2 attempts to delete draft
    await assert.rejects(
      async () => {
        await SubmissionDraftService.deleteDraft(testCaseId, draft.id, user2);
      },
      (err: Error) => err.message.includes('Přístup odepřen')
    );

    // Admin CAN access and read the draft for support/audit purposes
    const adminFetch = await SubmissionDraftService.getDraftById(testCaseId, draft.id, adminUser);
    assert.strictEqual(adminFetch.id, draft.id);
  });

  it('3. Versioning & Rollback – should create version history and restore previous versions', async () => {
    // Create draft (Version 1)
    const draft = await SubmissionDraftService.createDraft(testCaseId, user1, {
      title: 'První verze návrhu',
      generatedContent: 'Text verze 1: Žádám o péči v rozsahu 50/50.',
    });
    assert.strictEqual(draft.version, 1);

    // Update to Version 2
    const v2 = await SubmissionDraftService.updateDraft(testCaseId, draft.id, user1, {
      title: 'Druhá verze návrhu',
      generatedContent: 'Text verze 2: Upravený návrh na péči v rozsahu 60/40.',
      createNewVersion: true,
      changeSummary: 'Změna poměru péče',
    });
    assert.strictEqual(v2.version, 2);

    // Update to Version 3
    const v3 = await SubmissionDraftService.updateDraft(testCaseId, draft.id, user1, {
      title: 'Třetí verze návrhu',
      generatedContent: 'Text verze 3: Špatný text s chybami.',
      createNewVersion: true,
      changeSummary: 'Chybná úprava',
    });
    assert.strictEqual(v3.version, 3);
    assert.strictEqual(v3.generatedContent, 'Text verze 3: Špatný text s chybami.');

    // Rollback to Version 1
    const rolledBack = await SubmissionDraftService.rollbackDraftVersion(testCaseId, draft.id, 1, user1);

    assert.strictEqual(rolledBack.version, 4, 'Rollback should create version 4');
    assert.strictEqual(rolledBack.title, 'První verze návrhu', 'Title should match version 1');
    assert.strictEqual(
      rolledBack.generatedContent,
      'Text verze 1: Žádám o péči v rozsahu 50/50.',
      'Generated content should match version 1'
    );
    assert.strictEqual(rolledBack.versions?.length, 4);
    assert.strictEqual(rolledBack.versions[0].changeSummary, 'Obnovení verze 1');
  });

  it('4. Input Validation – should reject invalid input parameters', async () => {
    // Empty title
    await assert.rejects(
      async () => {
        await SubmissionDraftService.createDraft(testCaseId, user1, {
          title: '   ',
        });
      },
      (err: Error) => err.message.includes('Název konceptu podání je povinný')
    );

    // Invalid status
    await assert.rejects(
      async () => {
        await SubmissionDraftService.createDraft(testCaseId, user1, {
          title: 'Platný název',
          status: 'INVALID_STATUS',
        });
      },
      (err: Error) => err.message.includes('Neplatný stav konceptu podání')
    );

    // Rollback to non-existent version
    const draft = await SubmissionDraftService.createDraft(testCaseId, user1, {
      title: 'Testovací draft',
    });

    await assert.rejects(
      async () => {
        await SubmissionDraftService.rollbackDraftVersion(testCaseId, draft.id, 999, user1);
      },
      (err: Error) => err.message.includes('Verze 999 nebyla')
    );
  });

  it('5. REST HTTP Endpoints – full integration over HTTP router', async () => {
    // 5.1 Unauthenticated request -> 401
    const unauthRes = await request(app).get(`/api/cases/${testCaseId}/submissions`);
    assert.strictEqual(unauthRes.status, 401);

    // 5.2 POST create draft
    const createRes = await request(app)
      .post(`/api/cases/${testCaseId}/submissions`)
      .set('Authorization', `Bearer ${tokenUser1}`)
      .send({
        title: 'HTTP Návrh na péči',
        templateId: 'navrh-1',
        formData: { childAge: 8 },
        generatedContent: 'Obsah generovaný přes HTTP AI Forms',
      });

    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createRes.body.success, true);
    assert.strictEqual(createRes.body.data.title, 'HTTP Návrh na péči');
    const draftId = createRes.body.data.id;

    // 5.3 GET list drafts as owner (user1)
    const listRes = await request(app)
      .get(`/api/cases/${testCaseId}/submissions`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.body.success, true);
    assert.strictEqual(listRes.body.data.length, 1);

    // 5.4 GET single draft as unauthorized user (user2) -> 403 Forbidden
    const idorRes = await request(app)
      .get(`/api/cases/${testCaseId}/submissions/${draftId}`)
      .set('Authorization', `Bearer ${tokenUser2}`);

    assert.strictEqual(idorRes.status, 403);
    assert.strictEqual(idorRes.body.success, false);

    // 5.5 PUT update draft as owner
    const updateRes = await request(app)
      .put(`/api/cases/${testCaseId}/submissions/${draftId}`)
      .set('Authorization', `Bearer ${tokenUser1}`)
      .send({
        title: 'HTTP Návrh na péči v2',
        generatedContent: 'Nová verze obsahu',
        createNewVersion: true,
        changeSummary: 'Aktualizace přes HTTP API',
      });

    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.data.version, 2);

    // 5.6 GET version history
    const versionsRes = await request(app)
      .get(`/api/cases/${testCaseId}/submissions/${draftId}/versions`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    assert.strictEqual(versionsRes.status, 200);
    assert.strictEqual(versionsRes.body.data.length, 2);

    // 5.7 POST rollback version
    const rollbackRes = await request(app)
      .post(`/api/cases/${testCaseId}/submissions/${draftId}/rollback`)
      .set('Authorization', `Bearer ${tokenUser1}`)
      .send({ targetVersion: 1 });

    assert.strictEqual(rollbackRes.status, 200);
    assert.strictEqual(rollbackRes.body.data.version, 3);
    assert.strictEqual(rollbackRes.body.data.title, 'HTTP Návrh na péči');

    // 5.8 DELETE draft
    const deleteRes = await request(app)
      .delete(`/api/cases/${testCaseId}/submissions/${draftId}`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    assert.strictEqual(deleteRes.status, 200);
    assert.strictEqual(deleteRes.body.success, true);
  });
});

