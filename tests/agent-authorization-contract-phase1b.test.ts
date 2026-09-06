import { describe, it, expect, beforeEach } from 'vitest';
import { ControlPlaneAuthorization } from '../src/services/controlPlaneAuthorization';
import { AgentCapabilityCatalog } from '../src/services/agentCapabilityCatalog';
import { AgentRegistry } from '../src/services/agentRegistry';
import { OrionTraceStore } from '../src/services/audit/orionTraceStore';
import { User } from '../src/types';

describe('Phase 1B — Agent Authorization Contract', () => {
  const superAdminUser: User = {
    id: 'user-superadmin-1',
    email: 'superadmin@dev3.cz',
    role: 'SUPER_ADMIN',
  } as any;

  const adminUser: User = {
    id: 'user-admin-1',
    email: 'admin@dev3.cz',
    role: 'ADMIN',
  } as any;

  const regularUser: User = {
    id: 'user-regular-1',
    email: 'user@dev3.cz',
    role: 'USER',
  } as any;

  beforeEach(() => {
    OrionTraceStore.reset();
  });

  it('1. Valid agent + valid capability evaluates to ALLOW (when approval not required)', () => {
    const result = ControlPlaneAuthorization.authorizeAgentRequest({
      agentId: 'DATA_ANALYST',
      capabilityId: 'analytics.read',
      user: adminUser,
    });

    expect(result.decision).toBe('ALLOW');
    expect(result.agentId).toBe('DATA_ANALYST');
    expect(result.capabilityId).toBe('analytics.read');
    expect(result.approvalRequired).toBe(false);
    expect(result.traceRequired).toBe(true);
    expect(result.traceId).toBeDefined();
  });

  it('2. Unknown agent evaluates to DENY', () => {
    const result = ControlPlaneAuthorization.authorizeAgentRequest({
      agentId: 'UNKNOWN_AGENT_XYZ',
      capabilityId: 'analytics.read',
      user: adminUser,
    });

    expect(result.decision).toBe('DENY');
    expect(result.reason).toContain('Unknown agent');
  });

  it('3. Unknown capability evaluates to DENY', () => {
    const result = ControlPlaneAuthorization.authorizeAgentRequest({
      agentId: 'DATA_ANALYST',
      capabilityId: 'unknown.capability.xyz',
      user: adminUser,
    });

    expect(result.decision).toBe('DENY');
    expect(result.reason).toContain('Unknown capability');
  });

  it('4. Mismatched capability evaluates to DENY', () => {
    // DATA_ANALYST is not authorized for 'document.read'
    const result = ControlPlaneAuthorization.authorizeAgentRequest({
      agentId: 'DATA_ANALYST',
      capabilityId: 'document.read',
      user: adminUser,
    });

    expect(result.decision).toBe('DENY');
    expect(result.reason).toContain('mapping check failed');
  });

  it('5. Disabled agent evaluates to DENY', () => {
    // AI_TALK_RADIO is disabled
    const result = ControlPlaneAuthorization.authorizeAgentRequest({
      agentId: 'AI_TALK_RADIO',
      capabilityId: 'audio.synthesize',
      user: adminUser,
    });

    expect(result.decision).toBe('DENY');
    expect(result.reason).toContain('disabled');
  });

  it('6. Unauthorized user evaluates to DENY', () => {
    // Regular USER lacks 'content.write' / 'cms.write' capability
    const result = ControlPlaneAuthorization.authorizeAgentRequest({
      agentId: 'BUILD_WITH_AGENTS',
      capabilityId: 'agent.build',
      user: regularUser,
    });

    expect(result.decision).toBe('DENY');
    expect(result.reason).toContain('lacks required capability');
  });

  it('7. Policy DENY (Forbidden target) evaluates to DENY', () => {
    // Attempting content.read with targetResource 'secrets' (forbidden in CONTENT_READ operation)
    const result = ControlPlaneAuthorization.authorizeAgentRequest({
      agentId: 'ADMIN_COPILOT',
      capabilityId: 'content.read',
      user: adminUser,
      requestedOperation: 'CONTENT_READ',
      targetResource: 'secrets.vault',
    });

    expect(result.decision).toBe('DENY');
    expect(result.reason).toContain('forbidden');
  });

  it('8. Approval required capability evaluates to REQUIRE_HUMAN_APPROVAL', () => {
    // agent.build has requiresHumanApproval = true
    const result = ControlPlaneAuthorization.authorizeAgentRequest({
      agentId: 'BUILD_WITH_AGENTS',
      capabilityId: 'agent.build',
      user: adminUser,
    });

    expect(result.decision).toBe('REQUIRE_HUMAN_APPROVAL');
    expect(result.approvalRequired).toBe(true);
    expect(result.traceId).toBeDefined();
  });

  it('9. Approved operation evaluates to ALLOW when executed under SUPER_ADMIN and non-approval capability', () => {
    const result = ControlPlaneAuthorization.authorizeAgentRequest({
      agentId: 'DOCUMENT_PROCESSOR',
      capabilityId: 'document.parse',
      user: superAdminUser,
    });

    expect(result.decision).toBe('ALLOW');
    expect(result.approvalRequired).toBe(false);
  });

  it('10. Authorization error (missing user context) evaluates to DENY', () => {
    const result = ControlPlaneAuthorization.authorizeAgentRequest({
      agentId: 'DATA_ANALYST',
      capabilityId: 'analytics.read',
      user: undefined,
    });

    expect(result.decision).toBe('DENY');
    expect(result.reason).toContain('Unauthenticated actor');
  });

  it('11. Policy error (malformed or invalid request) evaluates to DENY', () => {
    const result = ControlPlaneAuthorization.authorizeAgentRequest({
      agentId: '',
      capabilityId: '',
      user: adminUser,
    });

    expect(result.decision).toBe('DENY');
    expect(result.reason).toContain('Missing agentId');
  });

  it('12. traceRequired=true binds and returns traceId', () => {
    const result = ControlPlaneAuthorization.authorizeAgentRequest({
      agentId: 'REPO_MAINTAINER',
      capabilityId: 'repo.read',
      user: adminUser,
    });

    expect(result.traceRequired).toBe(true);
    expect(result.traceId).toBeDefined();
    expect(typeof result.traceId).toBe('string');
  });

  it('13. Forbidden capability evaluates to DENY for all agents', () => {
    const forbiddenList = [
      'shell.execute',
      'shell.exec',
      'docker.socket',
      'filesystem.root',
      'secrets.read',
      'database.reset',
      'git.push.force',
    ];

    forbiddenList.forEach(forbiddenCap => {
      const result = ControlPlaneAuthorization.authorizeAgentRequest({
        agentId: 'BUILD_WITH_AGENTS',
        capabilityId: forbiddenCap,
        user: superAdminUser,
      });

      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('strictly forbidden');
    });
  });

  it('14. Direct checkAccess() does NOT grant user authorization without ControlPlaneAuthorization', () => {
    // Calling checkAccess directly only checks declarative capability mapping
    const directCheck = AgentCapabilityCatalog.checkAccess('BUILD_WITH_AGENTS', 'code.generate');
    expect(directCheck.allowed).toBe(true);

    // BUT authorizeAgentRequest under regularUser MUST evaluate to DENY
    const fullAuthResult = ControlPlaneAuthorization.authorizeAgentRequest({
      agentId: 'BUILD_WITH_AGENTS',
      capabilityId: 'code.generate',
      user: regularUser,
    });

    expect(fullAuthResult.decision).toBe('DENY');
  });

  it('15. Legacy ORION_QA_ANALYST compatibility', () => {
    const result = ControlPlaneAuthorization.authorizeAgentRequest({
      agentId: 'ORION_QA_ANALYST',
      capabilityId: 'audit.run',
      user: adminUser,
    });

    expect(result.decision).toBe('REQUIRE_HUMAN_APPROVAL');
    expect(result.agentId).toBe('ORION_QA_ANALYST');
    expect(result.capabilityId).toBe('audit.run');
    expect(result.approvalRequired).toBe(true);
    expect(result.traceId).toBeDefined();
  });

  it('16. Legacy ADMIN_COPILOT compatibility', () => {
    const result = ControlPlaneAuthorization.authorizeAgentRequest({
      agentId: 'ADMIN_COPILOT',
      capabilityId: 'admin.assist',
      user: adminUser,
    });

    expect(result.decision).toBe('ALLOW');
    expect(result.agentId).toBe('ADMIN_COPILOT');
    expect(result.capabilityId).toBe('admin.assist');
  });

  it('17. Existing ControlPlaneAuthorization regression tests remain 100% intact', () => {
    const userCaps = ControlPlaneAuthorization.getUserCapabilities(superAdminUser);
    expect(userCaps).toContain('deploy.production');
    expect(userCaps).toContain('database.migrate');

    expect(() => {
      ControlPlaneAuthorization.authorizeOperation(superAdminUser, 'CONTENT_READ', 'public_page');
    }).not.toThrow();

    expect(() => {
      ControlPlaneAuthorization.authorizeOperation(regularUser, 'CONFIG_UPDATE', 'settings');
    }).toThrow('FAIL CLOSED');
  });
});
