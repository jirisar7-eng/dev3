import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import agentRoutes from '../src/routes/agentRoutes';
import { AgentDispatcher } from '../src/services/agentDispatcher';
import { documentProcessorHandler } from '../src/services/agentHandlers/documentProcessorHandler';
import { dbStore } from '../src/services/dbStore';
import { ControlPlaneAuthorization } from '../src/services/controlPlaneAuthorization';
import { User, CaseDocument, ClientCase } from '../src/types';

// Mock auth middleware to control req.user in supertest
vi.mock('../src/middleware/authMiddleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    if (req.headers['x-test-no-auth']) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    req.user = {
      id: req.headers['x-test-user-id'] || 'admin_user_1',
      email: 'admin@synthesis.cz',
      role: req.headers['x-test-role'] || 'ADMIN',
      permissions: req.headers['x-test-permissions'] !== undefined
        ? (req.headers['x-test-permissions'] ? req.headers['x-test-permissions'].split(',') : [])
        : ['document.read', 'document.parse', 'ocr.extract'],
    };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/admin/agent', agentRoutes);

describe('Phase 2C — DOCUMENT PROCESSOR Agent Integration', () => {
  const adminUser: User = {
    id: 'admin_1',
    email: 'admin@synthesis.cz',
    role: 'ADMIN',
  } as any;

  const normalUser: User = {
    id: 'user_alice',
    email: 'alice@synthesis.cz',
    role: 'USER',
  } as any;

  const unauthorizedUser: User = {
    id: 'user_eve',
    email: 'eve@synthesis.cz',
    role: 'USER',
  } as any;

  const testCase: ClientCase = {
    id: 'case_test_100',
    ownerId: 'user_alice',
    title: 'Test Case Alice',
    status: 'ACTIVE',
    courtName: 'Okresní soud v Olomouci',
    caseNumber: '10 C 123/2026',
    participants: [
      { id: 'part_alice', caseId: 'case_test_100', name: 'Alice Test', role: 'MOTHER', userId: 'user_alice' },
      { id: 'part_bob', caseId: 'case_test_100', name: 'Bob Test', role: 'FATHER', userId: 'user_bob' },
    ] as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any;

  const testDocAlice: CaseDocument = {
    id: 'doc_alice_001',
    caseId: 'case_test_100',
    uploadedBy: 'user_alice',
    name: 'Rozsudek_Pece_2026.pdf',
    category: 'COURT',
    fileUrl: '/uploads/doc_alice_001.pdf',
    s3Bucket: 'tatovacesta-vault',
    s3ObjectKey: 'cases/case_test_100/doc_alice_001.pdf',
    fileType: 'pdf',
    mimeType: 'application/pdf',
    size: 204800,
    fileHash: 'sha256:abc123456789',
    storageProvider: 'MinIO',
    scanStatus: 'CLEAN',
    notes: 'Výrok I. Nezletilý se svěřuje do střídavé péče matky a otce v cyklu 7 dnů se střídáním v pátek v 16:00.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    // Seed dbStore test documents and cases
    const existingCaseIdx = dbStore.cases.findIndex((c: any) => c.id === testCase.id);
    if (existingCaseIdx >= 0) {
      dbStore.cases[existingCaseIdx] = testCase;
    } else {
      dbStore.cases.push(testCase);
    }

    const existingDocIdx = dbStore.caseDocuments.findIndex((d: any) => d.id === testDocAlice.id);
    if (existingDocIdx >= 0) {
      dbStore.caseDocuments[existingDocIdx] = testDocAlice;
    } else {
      dbStore.caseDocuments.push(testDocAlice);
    }
  });

  // =============================================================
  // 1. CAPABILITY: document.read
  // =============================================================
  describe('Capability: document.read', () => {
    it('1. Owner can safely read their document metadata via handler / unprivileged USER dispatch fails closed', async () => {
      // Direct handler execution verifies owner can read metadata
      const handlerResult = await documentProcessorHandler.execute(
        {
          agentId: 'DOCUMENT_PROCESSOR',
          capabilityId: 'document.read',
          payload: { documentId: 'doc_alice_001' },
          user: normalUser,
        },
        {
          decision: 'ALLOW',
          agentId: 'DOCUMENT_PROCESSOR',
          capabilityId: 'document.read',
          approvalRequired: false,
          traceRequired: false,
        }
      );

      expect((handlerResult as any).status).toBe('success');
      expect((handlerResult as any).capability).toBe('document.read');
      expect((handlerResult as any).document.id).toBe('doc_alice_001');
      expect((handlerResult as any).document.name).toBe('Rozsudek_Pece_2026.pdf');
      expect((handlerResult as any).document.category).toBe('COURT');
      expect((handlerResult as any).document.scanStatus).toBe('CLEAN');
      expect((handlerResult as any).document.caseId).toBe('case_test_100');

      // Dispatcher enforces that unprivileged USER lacks capability -> DENY
      const dispatchResult = await AgentDispatcher.dispatch({
        agentId: 'DOCUMENT_PROCESSOR',
        capabilityId: 'document.read',
        payload: { documentId: 'doc_alice_001' },
        user: normalUser,
      });
      expect(dispatchResult.decision).toBe('DENY');
      expect(dispatchResult.success).toBe(false);
      expect(dispatchResult.reason).toContain("lacks required capability 'document.read'");
    });

    it('2. Admin can read document metadata across cases', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DOCUMENT_PROCESSOR',
        capabilityId: 'document.read',
        payload: { documentId: 'doc_alice_001' },
        user: adminUser,
      });

      expect(result.decision).toBe('ALLOW');
      expect(result.success).toBe(true);
      expect((result.data as any).document.id).toBe('doc_alice_001');
    });

    it('3. Participant in the case can read case document metadata via handler / USER dispatch fails closed', async () => {
      const bobUser: User = {
        id: 'user_bob',
        email: 'bob@synthesis.cz',
        role: 'USER',
      } as any;

      // Direct handler execution verifies case participant can read document
      const handlerResult = await documentProcessorHandler.execute(
        {
          agentId: 'DOCUMENT_PROCESSOR',
          capabilityId: 'document.read',
          payload: { documentId: 'doc_alice_001' },
          user: bobUser,
        },
        {
          decision: 'ALLOW',
          agentId: 'DOCUMENT_PROCESSOR',
          capabilityId: 'document.read',
          approvalRequired: false,
          traceRequired: false,
        }
      );

      expect((handlerResult as any).status).toBe('success');
      expect((handlerResult as any).document.id).toBe('doc_alice_001');

      // Dispatcher enforces that unprivileged USER lacks capability -> DENY
      const dispatchResult = await AgentDispatcher.dispatch({
        agentId: 'DOCUMENT_PROCESSOR',
        capabilityId: 'document.read',
        payload: { documentId: 'doc_alice_001' },
        user: bobUser,
      });
      expect(dispatchResult.decision).toBe('DENY');
      expect(dispatchResult.success).toBe(false);
      expect(dispatchResult.reason).toContain("lacks required capability 'document.read'");
    });

    it('4. Unauthorized user (non-participant, non-owner) is rejected with access denied', async () => {
      const strangerUser: User = {
        id: 'user_charlie',
        email: 'charlie@synthesis.cz',
        role: 'USER',
      } as any;

      // Dispatcher rejects stranger at Control Plane gate
      const dispatchResult = await AgentDispatcher.dispatch({
        agentId: 'DOCUMENT_PROCESSOR',
        capabilityId: 'document.read',
        payload: { documentId: 'doc_alice_001' },
        user: strangerUser,
      });
      expect(dispatchResult.success).toBe(false);
      expect(dispatchResult.decision).toBe('DENY');

      // Handler rejects stranger with ownership/participant violation even if authorization gate was bypassed
      await expect(
        documentProcessorHandler.execute(
          {
            agentId: 'DOCUMENT_PROCESSOR',
            capabilityId: 'document.read',
            payload: { documentId: 'doc_alice_001' },
            user: strangerUser,
          },
          {
            decision: 'ALLOW',
            agentId: 'DOCUMENT_PROCESSOR',
            capabilityId: 'document.read',
            approvalRequired: false,
            traceRequired: false,
          }
        )
      ).rejects.toThrow('Access denied: User is not authorized to access document');
    });

    it('5. Non-existent documentId fails closed', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DOCUMENT_PROCESSOR',
        capabilityId: 'document.read',
        payload: { documentId: 'doc_non_existent_999' },
        user: adminUser,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('6. Path traversal in documentId is strictly blocked (fails closed)', async () => {
      const dangerousIds = [
        '../../etc/passwd',
        '..\\..\\windows\\system32',
        '/etc/shadow',
        '.env',
        'doc_001/../../secret',
      ];

      for (const dangerousId of dangerousIds) {
        const result = await AgentDispatcher.dispatch({
          agentId: 'DOCUMENT_PROCESSOR',
          capabilityId: 'document.read',
          payload: { documentId: dangerousId },
          user: adminUser,
        });

        expect(result.success).toBe(false);
        expect(result.reason).toMatch(/Path traversal|Invalid documentId format/);
      }
    });

    it('7. Missing documentId fails closed', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DOCUMENT_PROCESSOR',
        capabilityId: 'document.read',
        payload: {},
        user: adminUser,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toContain("Field 'documentId' is required");
    });

    it('8. Safe metadata returns no internal secrets or S3 bucket credentials', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DOCUMENT_PROCESSOR',
        capabilityId: 'document.read',
        payload: { documentId: 'doc_alice_001' },
        user: adminUser,
      });

      const doc = (result.data as any).document;
      expect(doc.s3Bucket).toBeUndefined();
      expect(doc.s3ObjectKey).toBeUndefined();
      expect(doc.password).toBeUndefined();
      expect(doc.secret).toBeUndefined();
    });
  });

  // =============================================================
  // 2. CAPABILITY: document.parse
  // =============================================================
  describe('Capability: document.parse', () => {
    it('9. Parses legal text directly using existing JudgmentParserService', async () => {
      const judgmentText = `
        ROZSUDEK JMÉNEM REPUBLIKY
        Okresní soud v Olomouci rozhodl takto:
        I. Nezletilý Jan Novák se svěřuje do střídavé péče matky a otce v cyklu 14 dnů.
        II. Otec je povinen přispívat na výživu částkou 4 500 Kč měsíčně.
        III. Žádný z účastníků nemá právo na náhradu nákladů řízení.
      `;

      const result = await AgentDispatcher.dispatch({
        agentId: 'DOCUMENT_PROCESSOR',
        capabilityId: 'document.parse',
        payload: { text: judgmentText },
        user: adminUser,
      });

      expect(result.decision).toBe('ALLOW');
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.status).toBe('success');
      expect(data.capability).toBe('document.parse');
      expect(data.parsed).toBeDefined();
      expect(Array.isArray(data.parsed.sentences)).toBe(true);
      expect(data.parsed.sentences.length).toBeGreaterThan(0);
    }, 30000);

    it('10. Parses document text resolved from authorized documentId (ADMIN) / unprivileged USER fails closed', async () => {
      // In the existing authorization model, ADMIN role is authorized to dispatch document.parse
      const result = await AgentDispatcher.dispatch({
        agentId: 'DOCUMENT_PROCESSOR',
        capabilityId: 'document.parse',
        payload: { documentId: 'doc_alice_001' },
        user: adminUser,
      });

      expect(result.decision).toBe('ALLOW');
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.status).toBe('success');
      expect(data.documentId).toBe('doc_alice_001');
      expect(data.parsed).toBeDefined();

      // And unprivileged USER is strictly rejected at Control Plane gate
      const userResult = await AgentDispatcher.dispatch({
        agentId: 'DOCUMENT_PROCESSOR',
        capabilityId: 'document.parse',
        payload: { documentId: 'doc_alice_001' },
        user: normalUser,
      });
      expect(userResult.decision).toBe('DENY');
      expect(userResult.success).toBe(false);
      expect(userResult.reason).toContain("lacks required capability 'document.parse'");
    }, 30000);

    it('11. Fails closed if empty text or no documentId provided', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DOCUMENT_PROCESSOR',
        capabilityId: 'document.parse',
        payload: { text: '   ' },
        user: adminUser,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toContain('empty');
    });

    it('12. Fails closed when attempting to parse caseId that caller does not own or participate in', async () => {
      const strangerUser: User = {
        id: 'user_charlie',
        email: 'charlie@synthesis.cz',
        role: 'USER',
      } as any;

      // Dispatcher rejects stranger at Control Plane gate
      const dispatchResult = await AgentDispatcher.dispatch({
        agentId: 'DOCUMENT_PROCESSOR',
        capabilityId: 'document.parse',
        payload: { text: 'Výrok I. Soud rozhodl...', caseId: 'case_test_100' },
        user: strangerUser,
      });
      expect(dispatchResult.success).toBe(false);
      expect(dispatchResult.decision).toBe('DENY');

      // Direct handler invocation verifies ClientCaseService case ownership check
      await expect(
        documentProcessorHandler.execute(
          {
            agentId: 'DOCUMENT_PROCESSOR',
            capabilityId: 'document.parse',
            payload: { text: 'Výrok I. Soud rozhodl...', caseId: 'case_test_100' },
            user: strangerUser,
          },
          {
            decision: 'ALLOW',
            agentId: 'DOCUMENT_PROCESSOR',
            capabilityId: 'document.parse',
            approvalRequired: false,
            traceRequired: false,
          }
        )
      ).rejects.toThrow('Přístup odepřen');
    });

    it('13. Strictly rejects forbidden parameters in payload (SQL, query, raw scripts)', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DOCUMENT_PROCESSOR',
        capabilityId: 'document.parse',
        payload: {
          text: 'Výrok I.',
          sql: 'DROP TABLE "CaseDocument"',
        },
        user: adminUser,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Client is strictly forbidden');
    });
  });

  // =============================================================
  // 3. CAPABILITY: ocr.extract (Section 7 Compliance)
  // =============================================================
  describe('Capability: ocr.extract', () => {
    it('14. Safely fails closed with unsupported capability error (no fake OCR)', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DOCUMENT_PROCESSOR',
        capabilityId: 'ocr.extract',
        payload: { documentId: 'doc_alice_001' },
        user: adminUser,
      });

      // Authorization allows it based on registry/catalog, but handler execution fails closed safely
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Capability \'ocr.extract\' is currently unsupported');
    });
  });

  // =============================================================
  // 4. CONTROL PLANE & RBAC AUTHORIZATION GATES
  // =============================================================
  describe('Control Plane & RBAC Enforcement', () => {
    it('15. Unauthorized actor (role USER with empty permissions) is rejected with DENY', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DOCUMENT_PROCESSOR',
        capabilityId: 'document.read',
        payload: { documentId: 'doc_alice_001' },
        user: unauthorizedUser,
      });

      expect(result.decision).toBe('DENY');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('lacks required capability');
    });

    it('16. Mismatched capability for DOCUMENT_PROCESSOR evaluates to DENY', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DOCUMENT_PROCESSOR',
        capabilityId: 'analytics.read',
        payload: {},
        user: adminUser,
      });

      expect(result.decision).toBe('DENY');
      expect(result.reason).toMatch(/not authorized|Capability mismatch/);
    });

    it('17. Mismatched capability for DATA_ANALYST evaluates to DENY', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'document.read',
        payload: { documentId: 'doc_alice_001' },
        user: adminUser,
      });

      expect(result.decision).toBe('DENY');
      expect(result.reason).toMatch(/not authorized|Capability mismatch/);
    });
  });

  // =============================================================
  // 5. DISPATCH HTTP API ENDPOINT (/api/admin/agent/dispatch)
  // =============================================================
  describe('Dispatch HTTP API Security', () => {
    it('18. HTTP 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/admin/agent/dispatch')
        .set('x-test-no-auth', 'true')
        .send({
          agentId: 'DOCUMENT_PROCESSOR',
          capabilityId: 'document.read',
          payload: { documentId: 'doc_alice_001' },
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('19. Client-spoofed user/role/permissions in payload are stripped and rejected', async () => {
      const res = await request(app)
        .post('/api/admin/agent/dispatch')
        .set('x-test-user-id', 'user_eve')
        .set('x-test-role', 'USER')
        .set('x-test-permissions', '')
        .send({
          agentId: 'DOCUMENT_PROCESSOR',
          capabilityId: 'document.read',
          payload: {
            documentId: 'doc_alice_001',
            user: { id: 'admin_1', role: 'SUPER_ADMIN' },
            role: 'SUPER_ADMIN',
            permissions: ['document.read', 'document.parse'],
          },
        });

      // The spoofed role/permissions are stripped server-side; Eve's actual token role (USER) is used -> DENY (403)
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('FAIL CLOSED: User');
    });

    it('20. Valid HTTP dispatch parses text and returns structured judgment', async () => {
      const res = await request(app)
        .post('/api/admin/agent/dispatch')
        .set('x-test-user-id', 'admin_1')
        .set('x-test-role', 'ADMIN')
        .send({
          agentId: 'DOCUMENT_PROCESSOR',
          capabilityId: 'document.parse',
          payload: {
            text: 'I. Soud svěřuje nezletilého do péče matky. II. Otec přispívá 3000 Kč.',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.parsed).toBeDefined();
    }, 30000);
  });

  // =============================================================
  // 6. FRONTEND INTEGRATION VERIFICATION
  // =============================================================
  describe('Frontend CareJudgmentImportModal Integration', () => {
    it('21. CareJudgmentImportModal uses dispatchAgent for document.parse', () => {
      const modalPath = path.resolve(__dirname, '../src/components/case/care/CareJudgmentImportModal.tsx');
      const content = fs.readFileSync(modalPath, 'utf8');

      expect(content).toContain("import { dispatchAgent } from '../../../services/agent/agentDispatchClient'");
      expect(content).toContain("agentId: 'DOCUMENT_PROCESSOR'");
      expect(content).toContain("capabilityId: 'document.parse'");
      expect(content).not.toContain("role:");
      expect(content).not.toContain("permissions:");
    });
  });
});
