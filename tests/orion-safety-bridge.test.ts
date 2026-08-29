import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../src/types';
import {
  AGENT_ORION_IDENTITY,
  AGENT_ORION_ROLE,
  ORION_BASE_CAPABILITIES,
  ControlPlaneAuthorization,
} from '../src/services/controlPlaneAuthorization';
import { OrionService } from '../src/services/audit/orionService';
import { AiService } from '../src/services/AiService';
import { AuditService } from '../src/services/auditService';
import { ControlPlaneService } from '../src/services/controlPlaneService';
import { ReleaseGateService } from '../src/services/audit/releaseGateService';
import { dbStore } from '../src/services/dbStore';
import { RuntimeEvidence } from '../src/services/audit/types';

const TEST_AUDIT_DIR = path.join(process.cwd(), 'temp-test-orion-audits');

function createAuditFile(name: string, content: string) {
  if (!fs.existsSync(TEST_AUDIT_DIR)) {
    fs.mkdirSync(TEST_AUDIT_DIR, { recursive: true });
  }
  fs.writeFileSync(path.join(TEST_AUDIT_DIR, name), content, 'utf8');
}

describe('Orion Identity & AI Safety Bridge', () => {
  const adminUser: User = {
    id: 'usr-admin-1',
    email: 'admin@tatamapravo.cz',
    role: 'ADMIN',
    name: 'Admin User',
    passwordHash: 'secret-hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const contentUser: User = {
    id: 'usr-content-1',
    email: 'editor@tatamapravo.cz',
    role: 'CONTENT_MANAGER',
    name: 'Content Editor',
    passwordHash: 'secret-hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    if (fs.existsSync(TEST_AUDIT_DIR)) {
      fs.rmSync(TEST_AUDIT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_AUDIT_DIR, { recursive: true });
    dbStore.auditLogs = [];
    vi.spyOn(AiService, 'generateContent').mockResolvedValue(
      JSON.stringify({
        summary: 'Bezpečnostní analýza připravena.',
        findingsAnalysis: [],
        safetyWarnings: [],
        suggestedDraftActions: [],
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (fs.existsSync(TEST_AUDIT_DIR)) {
      fs.rmSync(TEST_AUDIT_DIR, { recursive: true, force: true });
    }
  });

  it('1. Orion identity and role verification', () => {
    expect(OrionService.AGENT_ID).toBe('agent-orion-qa-v1');
    expect(OrionService.AGENT_ROLE).toBe('AI_SECURITY_ANALYST');
    expect(OrionService.TRUST_LEVEL).toBe('AI_RECOMMENDATION');
    expect(AGENT_ORION_IDENTITY).toBe('agent-orion-qa-v1');
    expect(AGENT_ORION_ROLE).toBe('AI_SECURITY_ANALYST');
  });

  it('2. Capability intersection: UserCapabilities ∩ OrionCapabilities', () => {
    const adminEffectiveCaps = ControlPlaneAuthorization.getOrionEffectiveCapabilities(adminUser);
    expect(adminEffectiveCaps).toContain('audit.run');
    expect(adminEffectiveCaps).toContain('qa.run');
    expect(adminEffectiveCaps).toContain('content.read');
    expect(adminEffectiveCaps).not.toContain('deploy.production');
    expect(adminEffectiveCaps).not.toContain('vps.write');

    const contentEffectiveCaps = ControlPlaneAuthorization.getOrionEffectiveCapabilities(contentUser);
    // Content manager only has content.read, settings.read, content.write, cms.write
    expect(contentEffectiveCaps).toContain('content.read');
    expect(contentEffectiveCaps).toContain('settings.read');
    expect(contentEffectiveCaps).not.toContain('audit.run');
    expect(contentEffectiveCaps).not.toContain('qa.run');
  });

  it('3. Fail-Closed: User without audit.run is rejected with DENY', async () => {
    await expect(
      OrionService.analyze(contentUser, {}, TEST_AUDIT_DIR)
    ).rejects.toThrow(/FAIL CLOSED.*Orion nemá efektivní capability 'audit\.run'/);
  });

  it('4. Prohibit approve: Orion cannot approve actions', async () => {
    // Attempting to approve an action as Orion or without SUPER_ADMIN must throw
    const action = await ControlPlaneService.createAction(
      adminUser,
      'Test mutation action',
      { target: 'config' }
    );

    // Pretend Orion tries to approve or unauthorized actor tries to approve
    await expect(
      ControlPlaneService.approveAction(
        { ...adminUser, id: AGENT_ORION_IDENTITY, role: 'AI_SECURITY_ANALYST' as any },
        action.id
      )
    ).rejects.toThrow();
  });

  it('5. Prohibit execute: Orion cannot execute actions', async () => {
    const action = await ControlPlaneService.createAction(
      adminUser,
      'Deploy production',
      { target: 'prod' }
    );

    await expect(
      ControlPlaneService.executeAction(
        { ...adminUser, id: AGENT_ORION_IDENTITY, role: 'AI_SECURITY_ANALYST' as any },
        action.id
      )
    ).rejects.toThrow();
  });

  it('6. Prompt sanitization: Secrets and PII are redacted before sending to LLM', async () => {
    createAuditFile(
      'AUDIT_2026-08-20_test.md',
      `# Audit\nStatus: PASS\n## Nálezy\n| Kód | Název | Závažnost | Stav |\n| SEC-01 | Rodné číslo 850101/1234 a API key AIzaSyABCDEF12345678901234567890123 a email test@tatamapravo.cz | P1 | OPEN |\n`
    );

    let promptCaptured = '';
    vi.spyOn(AiService, 'generateContent').mockImplementation(async (prompt) => {
      promptCaptured = prompt;
      return JSON.stringify({
        summary: 'Bezpečnostní analýza nálezů.',
        findingsAnalysis: [
          {
            code: 'SEC-01',
            title: 'Zranitelnost',
            severity: 'P1',
            riskEvaluation: 'Riziko P1',
            recommendedRemediation: 'Opravit konfiguraci',
          },
        ],
        safetyWarnings: [],
        suggestedDraftActions: [],
      });
    });

    const result = await OrionService.analyze(adminUser, {}, TEST_AUDIT_DIR);

    expect(promptCaptured).not.toContain('850101/1234');
    expect(promptCaptured).not.toContain('AIzaSyABCDEF12345678901234567890123');
    expect(promptCaptured).not.toContain('test@tatamapravo.cz');
    expect(promptCaptured).toContain('[REDACTED_RC_PII]');
    expect(promptCaptured).toContain('[REDACTED_API_KEY]');
    expect(promptCaptured).toContain('[REDACTED_EMAIL]');
    expect(result.trustLevel).toBe('AI_RECOMMENDATION');
  });

  it('7. Output sanitization: Re-sanitizes output before returning', async () => {
    createAuditFile(
      'AUDIT_2026-08-20_test.md',
      `# Audit\nStatus: PASS\n## Shrnutí\nVše v pořádku.`
    );

    vi.spyOn(AiService, 'generateContent').mockResolvedValue(
      JSON.stringify({
        summary: 'Nalezen uniklý klíč AIzaSyDUMMYKEY1234567890123456789012345 a RČ 9005051234.',
        findingsAnalysis: [],
        safetyWarnings: ['Varování pro user@tatamapravo.cz'],
        suggestedDraftActions: [],
      })
    );

    const result = await OrionService.analyze(adminUser, {}, TEST_AUDIT_DIR);

    expect(result.summary).not.toContain('AIzaSyDUMMYKEY1234567890123456789012345');
    expect(result.summary).not.toContain('9005051234');
    expect(result.safetyWarnings[0]).not.toContain('user@tatamapravo.cz');
    expect(result.summary).toContain('[REDACTED_API_KEY]');
    expect(result.summary).toContain('[REDACTED_RC_PII]');
  });

  it('8. Zod validation & graceful fallback on malformed LLM response', async () => {
    createAuditFile('AUDIT_2026-08-20_test.md', `# Audit\nStatus: PASS\n`);

    vi.spyOn(AiService, 'generateContent').mockResolvedValue('INVALID_NON_JSON_OUTPUT');

    const result = await OrionService.analyze(adminUser, {}, TEST_AUDIT_DIR);

    expect(result.trustLevel).toBe('AI_RECOMMENDATION');
    expect(result.safetyWarnings.length).toBeGreaterThan(0);
    expect(result.findingsAnalysis).toEqual([]);
  });

  it('9. ControlPlaneAction proposal is strictly created as DRAFT requiring human approval', async () => {
    const proposal = await OrionService.proposeDraftAction(adminUser, {
      title: 'Oprava bezpečnostního nálezu SEC-01',
      intent: 'Aktualizovat firewall pravidla',
      findingReference: 'SEC-01',
      payload: { rule: 'deny_all' },
    });

    expect(proposal.agentId).toBe('agent-orion-qa-v1');
    expect(proposal.trustLevel).toBe('AI_RECOMMENDATION');
    expect(proposal.status).toBe('PLAN_CREATED');
    expect(proposal.requiresHumanApproval).toBe(true);
    expect(proposal.action.id).toBeDefined();

    // Verify stored action
    const actions = await ControlPlaneService.getAllActions();
    const stored = actions.find(a => a.id === proposal.actionId);
    expect(stored).toBeDefined();
    expect(stored?.status).toBe('PLAN_CREATED');
  });

  it('10. Release Gate remains deterministic and cannot be altered by Orion', async () => {
    createAuditFile(
      'AUDIT_2026-08-20_test.md',
      `# Audit\nStatus: PASS\n## Nálezy\n| Kód | Název | Závažnost | Stav |\n| SEC-01 | SQL Injection | P0 | OPEN |\n`
    );

    const verifiedEvidence: RuntimeEvidence = {
      tscStatus: 'VERIFIED',
      testSuiteStatus: 'VERIFIED',
      buildStatus: 'VERIFIED',
      migrationStatus: 'VERIFIED',
    };

    // Even if Orion produces an analysis saying "everything is great"
    vi.spyOn(AiService, 'generateContent').mockResolvedValue(
      JSON.stringify({
        summary: 'Orion tvrdí, že vše je v pořádku a lze mergovat.',
        findingsAnalysis: [],
        safetyWarnings: [],
        suggestedDraftActions: [],
      })
    );

    await OrionService.analyze(adminUser, {}, TEST_AUDIT_DIR);

    // Evaluate release gate
    const gateResult = await ReleaseGateService.evaluateReleaseGate(verifiedEvidence, TEST_AUDIT_DIR);

    // Release gate MUST still evaluate strictly to DO_NOT_MERGE due to P0 OPEN finding
    expect(gateResult.verdict).toBe('DO_NOT_MERGE');
    expect(gateResult.isMergeable).toBe(false);
    expect(gateResult.blockers.some(b => b.code === 'OPEN_P0_FINDING')).toBe(true);
  });

  it('11. AuditLog records ORION_* events without secrets', async () => {
    createAuditFile('AUDIT_2026-08-20_test.md', `# Audit\nStatus: PASS\n`);

    await OrionService.analyze(adminUser, {}, TEST_AUDIT_DIR);

    const logs = await AuditService.getLogs('ORION_AI');
    expect(logs.some(l => l.action === 'ORION_ANALYSIS_STARTED')).toBe(true);
    expect(logs.some(l => l.action === 'ORION_ANALYSIS_COMPLETED')).toBe(true);

    for (const log of logs) {
      expect(log.details).not.toContain('secret-hash');
      expect(log.details).not.toContain('password');
    }
  });
});
