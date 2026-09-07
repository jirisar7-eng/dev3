import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { User } from '../src/types';
import {
  OrionActionCatalog,
  ORION_ACTION_CATALOG
} from '../src/services/orion/orionActionCatalog';
import { OrionPermissionResolver } from '../src/services/orion/orionPermissionResolver';
import { ControlPlaneAuthorization } from '../src/services/controlPlaneAuthorization';
import { aiPolicyEngine } from '../src/services/ai/aiPolicyEngine';
import { AuditService } from '../src/services/auditService';
import { OrionTraceStore } from '../src/services/audit/orionTraceStore';
import { ControlPlaneCapability } from '../src/types/controlPlane';

describe('CMD-ORION-20260907-002: Orion Action Catalog & Authorization Bridge', () => {
  const regularUser: User = {
    id: 'usr-regular-cat-1',
    email: 'jan.novak@tatamapravo.cz',
    role: 'USER',
    name: 'Jan Novák',
    passwordHash: 'hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const editorUser: User = {
    id: 'usr-editor-cat-1',
    email: 'editor@tatamapravo.cz',
    role: 'CONTENT_MANAGER',
    name: 'Editor Eva',
    passwordHash: 'hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const adminUser: User = {
    id: 'usr-admin-cat-1',
    email: 'admin@tatamapravo.cz',
    role: 'ADMIN',
    name: 'Admin Petr',
    passwordHash: 'hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const superAdminUser: User = {
    id: 'usr-superadmin-cat-1',
    email: 'superadmin@tatamapravo.cz',
    role: 'SUPER_ADMIN',
    name: 'Super Admin',
    passwordHash: 'hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuditService, 'recordLog').mockResolvedValue(true as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Capability Catalog Integrity & Schema Verification
  it('1. Capability Catalog Integrity: All capabilities defined with mandatory structural properties', () => {
    const definitions = OrionActionCatalog.getAllDefinitions();
    expect(definitions.length).toBeGreaterThanOrEqual(30);

    for (const def of definitions) {
      expect(def).toHaveProperty('capabilityId');
      expect(def).toHaveProperty('name');
      expect(def).toHaveProperty('description');
      expect(def).toHaveProperty('requiredPermission');
      expect(def).toHaveProperty('riskLevel');
      expect(typeof def.requiresHumanApproval).toBe('boolean');
      expect(typeof def.isReadOnly).toBe('boolean');
      expect(typeof def.canMutate).toBe('boolean');
      expect(typeof def.policyEngineCheck).toBe('boolean');
      expect(typeof def.auditRequired).toBe('boolean');
      expect(typeof def.traceRequired).toBe('boolean');
    }
  });

  // 2. USER Role Capability Filtering
  it('2. USER capability filtering: Returns base capabilities only, filtering out admin actions', () => {
    const userDefs = OrionActionCatalog.getCapabilitiesForUser(regularUser);
    const userCapIds = userDefs.map(d => d.capabilityId);

    expect(userCapIds).toContain('content.read');
    expect(userCapIds).toContain('legal.read');
    expect(userCapIds).not.toContain('vps.write');
    expect(userCapIds).not.toContain('database.migrate');
    expect(userCapIds).not.toContain('rbac.manage');
  });

  // 3. EDITOR Role Capability Filtering
  it('3. EDITOR capability filtering: Includes content creation and management capabilities', () => {
    const editorDefs = OrionActionCatalog.getCapabilitiesForUser(editorUser);
    const editorCapIds = editorDefs.map(d => d.capabilityId);

    expect(editorCapIds).toContain('content.create');
    expect(editorCapIds).toContain('content.write');
    expect(editorCapIds).toContain('content.publish');
    expect(editorCapIds).not.toContain('vps.write');
    expect(editorCapIds).not.toContain('database.migrate');
  });

  // 4. Legal Specialization Capability Resolution
  it('4. Legal specialization capability filtering: Resolves legal research capabilities for advokat specialization', () => {
    const advokatUser: User = {
      ...regularUser,
      id: 'usr-advokat-1',
      specialization: 'legal_advokat'
    } as any;

    const defs = OrionActionCatalog.getCapabilitiesForUser(advokatUser);
    const capIds = defs.map(d => d.capabilityId);

    expect(capIds).toContain('legal.research');
    expect(capIds).toContain('judikatura.read');
  });

  // 5. Custom Role Capability Resolution
  it('5. Custom Role capability filtering: Dynamic permissions attached to user object are resolved in catalog', () => {
    const customUser: User = {
      ...regularUser,
      id: 'usr-custom-cat-1',
      permissions: ['audit.run', 'cms.write']
    } as any;

    const defs = OrionActionCatalog.getCapabilitiesForUser(customUser);
    const capIds = defs.map(d => d.capabilityId);

    expect(capIds).toContain('audit.run');
    expect(capIds).toContain('cms.write');
  });

  // 6. Unauthorized Capability Request DENY
  it('6. Unauthorized capability: Requesting capability outside effective permissions returns DENY', async () => {
    const result = await OrionActionCatalog.authorizeAndBridgeAction({
      user: regularUser,
      capabilityId: 'vps.write'
    });

    expect(result.decision).toBe('DENY');
    expect(result.reason).toContain('FAIL CLOSED');
    expect(result.auditRecorded).toBe(true);
  });

  // 7. Capability Spoofing Prevention
  it('7. Capability spoofing: Client-side role override attempts fail closed with DENY', async () => {
    // Client payload attempts spoofing by passing a user with fake role in memory
    const spoofedUser: User = {
      ...regularUser,
      role: 'USER' // Authentic server object is USER
    };

    const result = await OrionActionCatalog.authorizeAndBridgeAction({
      user: spoofedUser,
      capabilityId: 'database.migrate' // High priv capability
    });

    expect(result.decision).toBe('DENY');
    expect(result.reason).toContain('FAIL CLOSED');
  });

  // 8. Policy Engine Denial
  it('8. Policy Engine denial: Blocks capability execution if Policy Engine returns false', async () => {
    let callCount = 0;
    const policySpy = vi.spyOn(aiPolicyEngine, 'evaluatePolicy').mockImplementation(() => {
      callCount++;
      return callCount === 1; // True during permission resolution, false during explicit action policy check
    });

    const result = await OrionActionCatalog.authorizeAndBridgeAction({
      user: regularUser,
      capabilityId: 'content.read'
    });

    expect(result.decision).toBe('DENY');
    expect(result.reason).toContain('BLOCKED BY POLICY ENGINE');

    policySpy.mockRestore();
  });

  // 9. Read-Only Action Authorization
  it('9. Read-only action: Low-risk read-only capability (content.read) returns ALLOW', async () => {
    const result = await OrionActionCatalog.authorizeAndBridgeAction({
      user: regularUser,
      capabilityId: 'content.read'
    });

    expect(result.decision).toBe('ALLOW');
    expect(result.definition?.isReadOnly).toBe(true);
    expect(result.requiresHumanApproval).toBe(false);
  });

  // 10. Mutating Action Identification
  it('10. Mutating action: Mutating capability (content.write) identifies canMutate: true and HITL requirement', async () => {
    const result = await OrionActionCatalog.authorizeAndBridgeAction({
      user: editorUser,
      capabilityId: 'content.write'
    });

    expect(result.definition?.canMutate).toBe(true);
    expect(result.decision).toBe('HUMAN_APPROVAL_REQUIRED');
    expect(result.requiresHumanApproval).toBe(true);
  });

  // 11. Destructive Action Classification
  it('11. Destructive action: Critical capabilities (database.migrate) classified as CRITICAL risk', async () => {
    const def = OrionActionCatalog.getCapabilityDefinition('database.migrate');
    expect(def?.riskLevel).toBe('CRITICAL');
    expect(def?.requiresHumanApproval).toBe(true);
    expect(def?.canMutate).toBe(true);
  });

  // 12. HUMAN_APPROVAL_REQUIRED Enforcement
  it('12. HUMAN_APPROVAL_REQUIRED: High risk / mutating actions return HUMAN_APPROVAL_REQUIRED', async () => {
    const result = await OrionActionCatalog.authorizeAndBridgeAction({
      user: superAdminUser,
      capabilityId: 'vps.write'
    });

    expect(result.decision).toBe('HUMAN_APPROVAL_REQUIRED');
    expect(result.requiresHumanApproval).toBe(true);
    expect(result.riskLevel).toBe('CRITICAL');
  });

  // 13. SUPER_ADMIN Subject to Policy Engine, Audit, Trace, and HITL (NO BYPASS)
  it('13. SUPER_ADMIN without bypass: SUPER_ADMIN is subject to Policy Engine, Audit, Trace, and HITL', async () => {
    const auditSpy = vi.spyOn(AuditService, 'recordLog');
    const traceSpy = vi.spyOn(OrionTraceStore, 'startTrace').mockReturnValue({ id: 'tr-super-1' } as any);

    const result = await OrionActionCatalog.authorizeAndBridgeAction({
      user: superAdminUser,
      capabilityId: 'database.migrate',
      targetResource: 'postgres:main_db'
    });

    // Zero-Bypass check: SUPER_ADMIN MUST NOT automatically execute CRITICAL database.migrate
    expect(result.decision).toBe('HUMAN_APPROVAL_REQUIRED');
    expect(result.requiresHumanApproval).toBe(true);
    expect(auditSpy).toHaveBeenCalledWith(
      'ORION_HUMAN_APPROVAL_PROPOSED',
      'ORION_CATALOG',
      expect.stringContaining('superadmin@tatamapravo.cz'),
      superAdminUser,
      '127.0.0.1'
    );
    expect(traceSpy).toHaveBeenCalled();
  });

  // 14. Anonymous User DENY
  it('14. Anonymous user: Unauthenticated action request returns DENY', async () => {
    const result = await OrionActionCatalog.authorizeAndBridgeAction({
      user: undefined,
      capabilityId: 'content.read'
    });

    expect(result.decision).toBe('DENY');
    expect(result.reason).toContain('Neautentizovaný uživatel');
  });

  // 15. Dynamic Capability Discovery with Catalog Titles
  it('15. Capability discovery: Generates user capability summary with catalog titles and descriptions', () => {
    const resolved = OrionPermissionResolver.resolveEffectivePermissions(editorUser);
    const text = OrionPermissionResolver.generateCapabilityDiscoveryResponse(resolved);

    expect(text).toContain('CONTENT_MANAGER');
    expect(text).toContain('Tvorba nového obsahu');
    expect(text).toContain('content.create');
    expect(text).toContain('Úprava obsahu');
    expect(text).toContain('content.write');
  });

  // 16. Re-authorization Before Execution (Server-side Zero-Trust)
  it('16. Re-authorization before execution: Re-evaluates server-side effective permissions before bridging', async () => {
    const resolverSpy = vi.spyOn(OrionPermissionResolver, 'resolveEffectivePermissions');

    await OrionActionCatalog.authorizeAndBridgeAction({
      user: adminUser,
      capabilityId: 'audit.run'
    });

    expect(resolverSpy).toHaveBeenCalledWith(adminUser);
  });

  // 17. Audit Evidence Recording
  it('17. Audit evidence: Records audit log entry during authorization check', async () => {
    const auditSpy = vi.spyOn(AuditService, 'recordLog');

    await OrionActionCatalog.authorizeAndBridgeAction({
      user: regularUser,
      capabilityId: 'content.read'
    });

    expect(auditSpy).toHaveBeenCalledWith(
      'ORION_ACTION_EXECUTED',
      'ORION_CATALOG',
      expect.stringContaining('content.read'),
      regularUser,
      '127.0.0.1'
    );
  });

  // 18. Trace Evidence Recording
  it('18. Trace evidence: Invokes OrionTraceStore to track execution workflow', async () => {
    const traceStartSpy = vi.spyOn(OrionTraceStore, 'startTrace').mockReturnValue({ id: 'tr-test-123' } as any);
    const traceCompSpy = vi.spyOn(OrionTraceStore, 'completeTrace').mockReturnValue(true as any);

    await OrionActionCatalog.authorizeAndBridgeAction({
      user: regularUser,
      capabilityId: 'content.read'
    });

    expect(traceStartSpy).toHaveBeenCalledWith(regularUser, 'content.read');
    expect(traceCompSpy).toHaveBeenCalledWith('Action content.read authorized', undefined, 'COMPLETED');
  });
});

describe('CMD-ORION-20260907-005: P1 Legacy ControlPlaneAuthorization Hardening & Zero-Bypass', () => {
  const regularUser: User = {
    id: 'sec-user-1',
    email: 'user@tatamapravo.cz',
    role: 'USER',
    name: 'Jan Novák',
    passwordHash: 'hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const editorUser: User = {
    id: 'sec-editor-1',
    email: 'editor@tatamapravo.cz',
    role: 'CONTENT_MANAGER',
    name: 'Editor Eva',
    passwordHash: 'hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const legalEditorUser: User = {
    id: 'sec-legal-editor-1',
    email: 'legal.editor@tatamapravo.cz',
    role: 'LEGAL_EDITOR',
    name: 'Legal Editor Karel',
    passwordHash: 'hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const moderatorUser: User = {
    id: 'sec-moderator-1',
    email: 'moderator@tatamapravo.cz',
    role: 'MODERATOR',
    name: 'Moderator Milan',
    passwordHash: 'hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const adminUser: User = {
    id: 'sec-admin-1',
    email: 'admin@tatamapravo.cz',
    role: 'ADMIN',
    name: 'Admin Petr',
    passwordHash: 'hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const superAdminUser: User = {
    id: 'sec-superadmin-1',
    email: 'superadmin@tatamapravo.cz',
    role: 'SUPER_ADMIN',
    name: 'Super Admin',
    passwordHash: 'hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuditService, 'recordLog').mockResolvedValue(true as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. ADMIN with granted capability: allows operation or requires HITL based on risk
  describe('1. ADMIN Role Behavior (No Role Bypass)', () => {
    it('ADMIN + granted read-only capability evaluates to ALLOW', async () => {
      // Direct ControlPlaneAuthorization check
      expect(() => {
        ControlPlaneAuthorization.authorizeOperation(adminUser, 'AUDIT_RUN', 'system');
      }).not.toThrow();

      // Orion Action Catalog Bridge check
      const result = await OrionActionCatalog.authorizeAndBridgeAction({
        user: adminUser,
        capabilityId: 'audit.run'
      });
      expect(result.decision).toBe('ALLOW');
      expect(result.requiresHumanApproval).toBe(false);
    });

    it('ADMIN + granted mutating capability evaluates to HUMAN_APPROVAL_REQUIRED', async () => {
      // content.write is granted to ADMIN, but is mutating -> requires HITL
      const result = await OrionActionCatalog.authorizeAndBridgeAction({
        user: adminUser,
        capabilityId: 'content.write',
        targetResource: 'article:123'
      });
      expect(result.decision).toBe('HUMAN_APPROVAL_REQUIRED');
      expect(result.requiresHumanApproval).toBe(true);
      expect(result.definition?.canMutate).toBe(true);
    });

    it('ADMIN + missing capability strictly fails closed with DENY (rejection of P1 bypass in authorizeOperation)', () => {
      // ADMIN does NOT have deploy.production or settings.write or database.migrate
      // Previously, user.role !== 'ADMIN' allowed this to bypass without throwing!
      expect(() => {
        ControlPlaneAuthorization.authorizeOperation(adminUser, 'DEPLOY', 'production');
      }).toThrow(/FAIL CLOSED.*nemá capability 'deploy\.production'/);

      expect(() => {
        ControlPlaneAuthorization.authorizeOperation(adminUser, 'CONFIG_UPDATE', 'system_config');
      }).toThrow(/FAIL CLOSED.*nemá capability 'settings\.write'/);
    });

    it('ADMIN + missing capability strictly fails closed with DENY in OrionActionCatalog', async () => {
      // database.migrate is reserved for SUPER_ADMIN
      const result = await OrionActionCatalog.authorizeAndBridgeAction({
        user: adminUser,
        capabilityId: 'database.migrate',
        targetResource: 'postgres:prod'
      });
      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('FAIL CLOSED');
    });

    it('ADMIN + missing capability strictly fails closed in authorizeAgentRequest', () => {
      // Agent request with capability not in ADMIN capabilities must return DENY
      const result = ControlPlaneAuthorization.authorizeAgentRequest({
        agentId: 'ORION_QA_ANALYST',
        capabilityId: 'database.migrate',
        user: adminUser
      });
      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('FAIL CLOSED');
    });
  });

  // 2. SUPER_ADMIN Role Behavior (No Role Bypass)
  describe('2. SUPER_ADMIN Role Behavior (Zero Bypass Invariant)', () => {
    it('SUPER_ADMIN + granted capability evaluates according to operation risk (ALLOW for read-only)', async () => {
      expect(() => {
        ControlPlaneAuthorization.authorizeOperation(superAdminUser, 'CONTENT_READ', 'page');
      }).not.toThrow();

      const result = await OrionActionCatalog.authorizeAndBridgeAction({
        user: superAdminUser,
        capabilityId: 'content.read'
      });
      expect(result.decision).toBe('ALLOW');
      expect(result.requiresHumanApproval).toBe(false);
    });

    it('SUPER_ADMIN + granted critical capability requires HUMAN_APPROVAL_REQUIRED (HITL)', async () => {
      // SUPER_ADMIN has deploy.production and database.migrate, but CRITICAL operations require approval
      const result = await OrionActionCatalog.authorizeAndBridgeAction({
        user: superAdminUser,
        capabilityId: 'database.migrate',
        targetResource: 'postgres:cluster'
      });
      expect(result.decision).toBe('HUMAN_APPROVAL_REQUIRED');
      expect(result.requiresHumanApproval).toBe(true);
      expect(result.riskLevel).toBe('CRITICAL');
    });

    it('SUPER_ADMIN + ungranted or fictitious capability strictly evaluates to DENY', async () => {
      const result = await OrionActionCatalog.authorizeAndBridgeAction({
        user: superAdminUser,
        capabilityId: 'nonexistent.fictitious.capability' as any
      });
      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('FAIL CLOSED');
    });

    it('SUPER_ADMIN + forbidden capability in authorizeAgentRequest strictly evaluates to DENY', () => {
      const result = ControlPlaneAuthorization.authorizeAgentRequest({
        agentId: 'BUILD_WITH_AGENTS',
        capabilityId: 'shell.execute',
        user: superAdminUser
      });
      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('strictly forbidden');
    });
  });

  // 3. Privilege Escalation Across All Roles
  describe('3. Privilege Escalation Prevention', () => {
    it('USER cannot access admin capabilities (audit.run, vps.read, deploy.production)', async () => {
      expect(() => {
        ControlPlaneAuthorization.authorizeOperation(regularUser, 'AUDIT_RUN', 'system');
      }).toThrow(/FAIL CLOSED/);

      expect(() => {
        ControlPlaneAuthorization.authorizeOperation(regularUser, 'DEPLOY', 'production');
      }).toThrow(/FAIL CLOSED/);

      const result = await OrionActionCatalog.authorizeAndBridgeAction({
        user: regularUser,
        capabilityId: 'audit.run'
      });
      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('FAIL CLOSED');
    });

    it('CONTENT_MANAGER (EDITOR) cannot access admin capabilities (audit.run, vps.read)', async () => {
      expect(() => {
        ControlPlaneAuthorization.authorizeOperation(editorUser, 'AUDIT_RUN', 'system');
      }).toThrow(/FAIL CLOSED/);

      const result = await OrionActionCatalog.authorizeAndBridgeAction({
        user: editorUser,
        capabilityId: 'vps.read'
      });
      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('FAIL CLOSED');
    });

    it('LEGAL_EDITOR cannot access admin capabilities (audit.run, vps.read)', async () => {
      expect(() => {
        ControlPlaneAuthorization.authorizeOperation(legalEditorUser, 'AUDIT_RUN', 'system');
      }).toThrow(/FAIL CLOSED/);

      const result = await OrionActionCatalog.authorizeAndBridgeAction({
        user: legalEditorUser,
        capabilityId: 'audit.run'
      });
      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('FAIL CLOSED');
    });

    it('MODERATOR cannot access admin capabilities or content mutation', async () => {
      expect(() => {
        ControlPlaneAuthorization.authorizeOperation(moderatorUser, 'AUDIT_RUN', 'system');
      }).toThrow(/FAIL CLOSED/);

      const result = await OrionActionCatalog.authorizeAndBridgeAction({
        user: moderatorUser,
        capabilityId: 'content.create'
      });
      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('FAIL CLOSED');
    });

    it('ADMIN cannot access super_admin-only ungranted capabilities (deploy.production, database.migrate)', async () => {
      expect(() => {
        ControlPlaneAuthorization.authorizeOperation(adminUser, 'DEPLOY', 'production');
      }).toThrow(/FAIL CLOSED/);

      const result = await OrionActionCatalog.authorizeAndBridgeAction({
        user: adminUser,
        capabilityId: 'deploy.production'
      });
      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('FAIL CLOSED');
    });

    it('SUPER_ADMIN cannot access nonexistent capabilities', async () => {
      const result = await OrionActionCatalog.authorizeAndBridgeAction({
        user: superAdminUser,
        capabilityId: 'invalid.capability' as any
      });
      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('FAIL CLOSED');
    });
  });

  // 4. Policy Engine Override (RBAC ALLOW + Policy DENY = DENY)
  describe('4. Policy Engine Integration (Fail-Closed)', () => {
    it('RBAC ALLOW + Policy Engine DENY evaluates strictly to DENY', async () => {
      // adminUser has audit.run in RBAC capabilities
      const userCaps = ControlPlaneAuthorization.getUserCapabilities(adminUser);
      expect(userCaps).toContain('audit.run');

      // But Policy Engine explicitly denies the action at step 3
      let auditRunCallCount = 0;
      const policySpy = vi.spyOn(aiPolicyEngine, 'evaluatePolicy').mockImplementation((_user: any, cap: any) => {
        if (cap === 'audit.run') {
          auditRunCallCount++;
          // 1st call is in OrionPermissionResolver -> allow so it passes into effective capabilities
          // 2nd call is in OrionActionCatalog step 3 -> deny to test policy block
          return auditRunCallCount === 1;
        }
        return true;
      });

      const result = await OrionActionCatalog.authorizeAndBridgeAction({
        user: adminUser,
        capabilityId: 'audit.run'
      });

      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('BLOCKED BY POLICY ENGINE');

      policySpy.mockRestore();
    });
  });

  // 5. HITL (Human-In-The-Loop) Verification
  describe('5. HITL (Human-In-The-Loop) Enforcement', () => {
    it('Valid capability + mutating operation evaluates to HUMAN_APPROVAL_REQUIRED', async () => {
      // editorUser has content.write, which is a mutating action
      const result = await OrionActionCatalog.authorizeAndBridgeAction({
        user: editorUser,
        capabilityId: 'content.write',
        targetResource: 'article:99'
      });

      expect(result.decision).toBe('HUMAN_APPROVAL_REQUIRED');
      expect(result.requiresHumanApproval).toBe(true);
      expect(result.definition?.canMutate).toBe(true);
    });

    it('Valid capability + critical operation evaluates to HUMAN_APPROVAL_REQUIRED for SUPER_ADMIN', async () => {
      // superAdminUser has database.migrate, which is a critical mutating action
      const result = await OrionActionCatalog.authorizeAndBridgeAction({
        user: superAdminUser,
        capabilityId: 'database.migrate',
        targetResource: 'postgres:schema'
      });

      expect(result.decision).toBe('HUMAN_APPROVAL_REQUIRED');
      expect(result.requiresHumanApproval).toBe(true);
      expect(result.riskLevel).toBe('CRITICAL');
    });
  });
});
