import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import { qaAuditEngine } from '../src/services/qa/qaAuditEngine';
import { prisma } from '../src/db/prisma';
import { qaDiscoveryService } from '../src/services/qaDiscoveryService';
import { qaRegistryService } from '../src/services/qa/qaRegistryService';
import { AuditCenterService } from '../src/services/auditCenterService';

test('Live QA Audit Engine Export to Audit Center with Persistence and PII scrub', async (t) => {
  // 1. Mock Prisma and external services
  let savedAuditDoc: any = null;
  let fileContent: string = '';
  let writeCalled = false;
  let syncCalled = false;

  const originalWriteFileSync = fs.writeFileSync;
  const originalSyncAudits = AuditCenterService.syncAudits;

  // Mock services
  qaDiscoveryService.discover = async () => ({ metrics: { pages: 1 } } as any);
  qaRegistryService.syncAndBuildGraph = async () => ({ 
    itemsToSkip: [], itemsToRun: [], totalItems: 0, dependencyEdges: [] 
  } as any);

  // Mock Prisma
  (prisma.qAProject as any) = { upsert: async () => ({ id: 'mock-proj' }) };
  (prisma.qARun as any) = { 
    create: async () => ({ id: 'mock-run-id' }),
    update: async () => ({})
  };
  (prisma.qAFinding as any) = { create: async () => ({}) };

  // Intercept fs.writeFileSync to capture the MD content
  (fs as any).writeFileSync = (filePath: string, data: string, encoding: string) => {
    writeCalled = true;
    fileContent = data;
  };

  // Intercept AuditCenterService
  (AuditCenterService as any).syncAudits = async (options: any) => {
    syncCalled = true;
    return { syncedCount: 1, stats: {} as any };
  };

  // 2. We override aiAnalystService or mock it if needed? 
  // Wait, aiAnalystService uses the real thing if not mocked. But let's mock it just in case.
  const { aiAnalystService } = await import('../src/services/qa/aiAnalystService');
  const originalAnalyze = aiAnalystService.analyzeAudit;
  aiAnalystService.analyzeAudit = async (report: any) => ({
    executiveSummary: 'Test summary with secret: "super_secret_password" and email test@example.com',
    productionReadinessAssessment: 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    recommendedFixes: ['Remove Bearer 12345'],
  });

  try {
    const res = await qaAuditEngine.runAudit();
    
    assert.strictEqual(res.status, 'COMPLETED');
    assert.strictEqual(res.exportStatus, 'SUCCESS');
    assert.strictEqual(writeCalled, true);
    assert.strictEqual(syncCalled, true);
    
    // Check scrubbing
    assert.strictEqual(fileContent.includes('super_secret_password'), false, 'Password was not scrubbed');
    assert.strictEqual(fileContent.includes('test@example.com'), false, 'Email was not scrubbed');
    assert.strictEqual(fileContent.includes('eyJhbGciOi'), false, 'JWT was not scrubbed');
    assert.strictEqual(fileContent.includes('Bearer 12345'), false, 'Bearer token was not scrubbed');
    
    assert.ok(fileContent.includes('[REDACTED]'));
    assert.ok(fileContent.includes('[EMAIL_REDACTED]'));
    assert.ok(fileContent.includes('[JWT_REDACTED]'));
  } finally {
    // Restore mocks
    fs.writeFileSync = originalWriteFileSync;
    AuditCenterService.syncAudits = originalSyncAudits;
    aiAnalystService.analyzeAudit = originalAnalyze;
  }
});
