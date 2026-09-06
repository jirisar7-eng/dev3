import { describe, it, expect } from 'vitest';
import { AgentRegistry, UNIFIED_AGENT_REGISTRY } from '../src/services/agentRegistry';
import { AgentCapabilityCatalog, CAPABILITY_CATALOG, FORBIDDEN_CAPABILITIES } from '../src/services/agentCapabilityCatalog';
import { ExperimentalAgentArchetype } from '../src/types/agentRegistry';

describe('Unified Agent Registry & Capability Catalog — Phase 1A', () => {
  const REQUIRED_ARCHETYPES: ExperimentalAgentArchetype[] = [
    'BUILD_WITH_AGENTS',
    'ANTIGRAVITY_PREVIEW',
    'AI_TALK_RADIO',
    'CUSTOMER_SUPPORT',
    'DATA_ANALYST',
    'DOCUMENT_PROCESSOR',
    'REPO_MAINTAINER',
  ];

  it('1. Verifies all 7 experimental agent archetypes exist in the registry', () => {
    REQUIRED_ARCHETYPES.forEach(archetype => {
      const agent = AgentRegistry.getAgent(archetype);
      expect(agent, `Agent archetype ${archetype} must be defined in AgentRegistry`).toBeDefined();
      expect(agent?.id).toBe(archetype);
      expect(agent?.name).toBeDefined();
      expect(typeof agent?.name).toBe('string');
      expect(agent?.name.length).toBeGreaterThan(0);
    });
  });

  it('2. Verifies fail-closed enforcement (no agent has implicit DENY bypass)', () => {
    // Disabled agents must be denied
    const disabledCheck = AgentCapabilityCatalog.checkAccess('AI_TALK_RADIO', 'audio.synthesize');
    expect(disabledCheck.allowed, 'Disabled agent AI_TALK_RADIO must be denied access').toBe(false);

    // Unregistered scope must be denied
    const unallowedScopeCheck = AgentCapabilityCatalog.checkAccess('DATA_ANALYST', 'analytics.read', 'unauthorized.scope');
    expect(unallowedScopeCheck.allowed, 'Unallowed scope must be denied').toBe(false);
  });

  it('3. Verifies unknown agent evaluates to DENY', () => {
    const unknownAgentCheck = AgentCapabilityCatalog.checkAccess('NON_EXISTENT_AGENT_123', 'analytics.read');
    expect(unknownAgentCheck.allowed).toBe(false);
    expect(unknownAgentCheck.reason).toContain('Unknown agent');
  });

  it('4. Verifies unknown capability evaluates to DENY', () => {
    const unknownCapCheck = AgentCapabilityCatalog.checkAccess('DATA_ANALYST', 'unknown.capability.xyz');
    expect(unknownCapCheck.allowed).toBe(false);
    expect(unknownCapCheck.reason).toContain('Unknown capability');
  });

  it('5. Verifies capabilities requiring Human Approval are correctly marked', () => {
    const sensitiveCap = AgentCapabilityCatalog.getCapability('actions.propose');
    expect(sensitiveCap?.requiresHumanApproval).toBe(true);

    const buildCap = AgentCapabilityCatalog.getCapability('agent.build');
    expect(buildCap?.requiresHumanApproval).toBe(true);

    const codeGenCap = AgentCapabilityCatalog.getCapability('code.generate');
    expect(codeGenCap?.requiresHumanApproval).toBe(true);

    const checkResult = AgentCapabilityCatalog.checkAccess('ORION_QA_ANALYST', 'actions.propose');
    expect(checkResult.requiresHumanApproval).toBe(true);
  });

  it('6. Verifies Registry itself does NOT grant permissions or bypass authorization', () => {
    const allAgents = AgentRegistry.getAllAgents();
    allAgents.forEach(agent => {
      // Ensure no agent entry contains methods or triggers to auto-grant RBAC
      expect((agent as any).grantPermissions).toBeUndefined();
      expect((agent as any).bypassAuthorization).toBeUndefined();
      expect((agent as any).executeAction).toBeUndefined();
    });
  });

  it('7. Verifies Registry does not alter existing RBAC user roles or credentials', () => {
    const registryEntry = AgentRegistry.getAgent('DATA_ANALYST');
    expect(registryEntry).toBeDefined();
    // Registry entries are purely declarative configuration interfaces
    expect(Object.keys(registryEntry!)).toEqual([
      'id',
      'name',
      'status',
      'allowedScopes',
      'requiredApproval',
      'allowedProviders',
      'traceRequired',
      'enabled',
    ]);
  });

  it('8. Verifies traceRequired is defined as boolean for all agents', () => {
    const allAgents = AgentRegistry.getAllAgents();
    expect(allAgents.length).toBeGreaterThan(0);
    allAgents.forEach(agent => {
      expect(typeof agent.traceRequired).toBe('boolean');
      expect(agent.traceRequired).toBe(true);
    });
  });

  it('9. Verifies NO agent has shell/docker/secrets/database reset execution capability', () => {
    const forbiddenCapabilitiesToTest = [
      'shell.execute',
      'shell.exec',
      'exec.post',
      'server.exec',
      'docker.socket',
      'filesystem.root',
      'secrets.read',
      'secrets.write',
      'env.modify',
      'database.reset',
      'database.push',
      'migrate.reset',
      'migrate.deploy',
      'deploy.automatic',
      'git.push.force',
    ];

    const allAgents = AgentRegistry.getAllAgents();

    forbiddenCapabilitiesToTest.forEach(forbiddenCap => {
      expect(AgentCapabilityCatalog.isForbiddenCapability(forbiddenCap)).toBe(true);

      allAgents.forEach(agent => {
        const check = AgentCapabilityCatalog.checkAccess(agent.id, forbiddenCap);
        expect(
          check.allowed,
          `Agent ${agent.id} MUST NOT be allowed capability ${forbiddenCap}`
        ).toBe(false);
      });
    });

    // Ensure catalog has zero forbidden capabilities registered as allowed
    Object.values(CAPABILITY_CATALOG).forEach(cap => {
      expect(
        AgentCapabilityCatalog.isForbiddenCapability(cap.capabilityId),
        `Catalog capability ${cap.capabilityId} must not be a forbidden capability`
      ).toBe(false);
    });
  });

  it('10. Verifies all registry values conform to TypeScript types and constraints', () => {
    const validStatuses = ['EXPERIMENTAL', 'PARTIAL', 'IMPLEMENTED', 'PROPOSED', 'DISABLED'];
    const allAgents = AgentRegistry.getAllAgents();

    allAgents.forEach(agent => {
      expect(typeof agent.id).toBe('string');
      expect(typeof agent.name).toBe('string');
      expect(validStatuses).toContain(agent.status);
      expect(Array.isArray(agent.allowedScopes)).toBe(true);
      expect(typeof agent.requiredApproval).toBe('boolean');
      expect(Array.isArray(agent.allowedProviders)).toBe(true);
      expect(typeof agent.traceRequired).toBe('boolean');
      expect(typeof agent.enabled).toBe('boolean');
    });
  });
});
