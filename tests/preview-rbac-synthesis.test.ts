import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';

import synthesisRoutes from '../src/routes/synthesisRoutes';
import { SynthesisService } from '../src/services/synthesisService';
import { GithubSyncService } from '../src/services/synthesis/githubSyncService';
import { ControlPlaneAuthorization } from '../src/services/controlPlaneAuthorization';
import { AuthService } from '../src/services/authService';
import { dbStore } from '../src/services/dbStore';
import { setPrismaClientForTest } from '../src/db/prisma';
import { User } from '../src/types';

test('P1 RBAC REGRESSION TEST — Synthesis API (Real HTTP Route Check)', async (t) => {
  let mockUser: User | null = null;

  const app = express();
  app.use(express.json());

  // Dummy auth middleware to inject user instead of real parseAuthToken/requireAuth
  app.use((req: any, res, next) => {
    req.user = mockUser;
    req.session = { userId: mockUser ? mockUser.id : undefined };
    req.tokenMfaVerified = true;
    next();
  });

  app.use('/api/admin/synthesis', synthesisRoutes);

  const createTicketMock = t.mock.method(SynthesisService, 'createTicket', async () => ({ ticket: { id: 't1' }, isDuplicate: false }));
  const addCommentMock = t.mock.method(SynthesisService, 'addComment', async () => ({ id: 'c1' }));
  const ingestEsbirkaMock = t.mock.method(SynthesisService, 'ingestEsbirkaRemediationFinding', async () => ({ ticket: { id: 't2' }, isDuplicate: false }));
  const linkGithubMetadataMock = t.mock.method(GithubSyncService, 'linkGithubMetadata', async () => ({ id: 't1' }));

  // Mock AuthService so `requireExperimentalAccess` finds the user
  t.mock.method(AuthService, 'getUserById', async () => mockUser);

  // Mock dbStore to prevent background audit log writes from crashing prisma proxy
  t.mock.method(dbStore, 'logAudit', () => {});

  const previewUser: User = {
    id: 'preview-actor',
    email: 'preview-actor@ai-studio.local',
    name: 'AI Studio Preview',
    role: 'PREVIEW_ACTOR' as any,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const adminUser: User = {
    id: 'admin1',
    email: 'admin@tatamapravo.cz',
    name: 'Admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    totpEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const superAdminUser: User = {
    id: 'super1',
    email: 'super@tatamapravo.cz',
    name: 'Super',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    totpEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock Prisma for `requireExperimentalAccess` to allow ADMIN via systemSetting
  const mockPrisma = {
    systemSetting: {
      findUnique: async (args: any) => {
        if (args?.where?.key === 'experimental.approved_users') {
          return { value: JSON.stringify([{ email: adminUser.email }]) };
        }
        return null;
      }
    },
    user: {
      findUnique: async () => ({ id: 'mocked' })
    },
    auditLog: {
      create: async () => ({})
    }
  };

  t.beforeEach(() => {
    setPrismaClientForTest(mockPrisma);
  });

  t.after(() => {
    setPrismaClientForTest(null);
  });

  await t.test('1. PREVIEW_ACTOR: POST /tickets -> 403, SynthesisService.createTicket() není zavolán', async () => {
    mockUser = previewUser;
    createTicketMock.mock.resetCalls();

    const res = await request(app)
      .post('/api/admin/synthesis/tickets')
      .send({
        title: 'Test', description: 'Test desc', source: 'MANUAL_ADMIN', severity: 'P3_LOW', category: 'FUNCTIONAL'
      });

    assert.strictEqual(res.status, 403, 'Must return 403');
    assert.strictEqual(createTicketMock.mock.callCount(), 0, 'Mutating service must NOT be called');
  });

  await t.test('2. PREVIEW_ACTOR: POST /tickets/:id/comments -> 403', async () => {
    mockUser = previewUser;
    addCommentMock.mock.resetCalls();

    const res = await request(app)
      .post('/api/admin/synthesis/tickets/1/comments')
      .send({ content: 'test comment' });

    assert.strictEqual(res.status, 403, 'Must return 403');
    assert.strictEqual(addCommentMock.mock.callCount(), 0, 'Mutating service must NOT be called');
  });

  await t.test('3. PREVIEW_ACTOR: POST /ingest-esbirka -> 403', async () => {
    mockUser = previewUser;
    ingestEsbirkaMock.mock.resetCalls();

    const res = await request(app)
      .post('/api/admin/synthesis/ingest-esbirka')
      .send({});

    assert.strictEqual(res.status, 403, 'Must return 403');
    assert.strictEqual(ingestEsbirkaMock.mock.callCount(), 0, 'Mutating service must NOT be called');
  });

  await t.test('4. PREVIEW_ACTOR: POST /tickets/:id/github -> 403', async () => {
    mockUser = previewUser;
    linkGithubMetadataMock.mock.resetCalls();

    const res = await request(app)
      .post('/api/admin/synthesis/tickets/1/github')
      .send({ githubIssueNumber: 123 });

    assert.strictEqual(res.status, 403, 'Must return 403');
    assert.strictEqual(linkGithubMetadataMock.mock.callCount(), 0, 'Mutating service must NOT be called');
  });

  await t.test('5. ADMIN: POST /tickets projde autorizační branou', async () => {
    mockUser = adminUser;
    createTicketMock.mock.resetCalls();

    const res = await request(app)
      .post('/api/admin/synthesis/tickets')
      .send({
        title: 'Test', description: 'Test desc', source: 'MANUAL_ADMIN', severity: 'P3_LOW', category: 'FUNCTIONAL'
      });

    assert.notStrictEqual(res.status, 403, 'Admin must NOT get 403');
    assert.strictEqual(createTicketMock.mock.callCount(), 1, 'Mutating service MUST be called');
  });

  await t.test('6. SUPER_ADMIN: POST /tickets/:id/comments projde autorizační branou', async () => {
    mockUser = superAdminUser;
    addCommentMock.mock.resetCalls();

    const res = await request(app)
      .post('/api/admin/synthesis/tickets/1/comments')
      .send({ content: 'test comment' });

    assert.notStrictEqual(res.status, 403, 'Super Admin must NOT get 403');
    assert.strictEqual(addCommentMock.mock.callCount(), 1, 'Mutating service MUST be called');
  });

  await t.test('7. GET endpointy Synthesis zůstávají dostupné pro PREVIEW_ACTOR', async () => {
    mockUser = previewUser;
    const getTicketsMock = t.mock.method(SynthesisService, 'getTickets', async () => ({ tickets: [], total: 0, isDegraded: false }));

    const res = await request(app)
      .get('/api/admin/synthesis/tickets');

    assert.strictEqual(res.status, 200, 'GET must return 200');
    assert.strictEqual(getTicketsMock.mock.callCount(), 1, 'Query service must be called');
  });

  await t.test('8. Explicitní ověření pořadí: authorizeOperation -> service', () => {
    // Toto je implicitně prokázáno tím, že status je 403 a callCount() je 0 (bod 1-4).
    const caps = ControlPlaneAuthorization.getUserCapabilities(previewUser);
    assert.strictEqual(caps.includes('content.write'), false, 'PREVIEW_ACTOR nemá content.write');
  });
});
