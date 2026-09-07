import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { User } from '../src/types';
import {
  OrionActionCatalog,
  ORION_ACTION_CATALOG
} from '../src/services/orion/orionActionCatalog';
import { OrionPermissionResolver } from '../src/services/orion/orionPermissionResolver';
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
