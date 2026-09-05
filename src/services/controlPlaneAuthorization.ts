import { User } from '../types';
import { ControlPlaneCapability, ControlPlaneOperationId } from '../types/controlPlane';
import { ControlPlaneOperationCatalog } from './controlPlaneOperationCatalog';
import { AgentRegistry } from './agentRegistry';
import { AgentCapabilityCatalog } from './agentCapabilityCatalog';
import { AgentAuthorizationRequest, AgentAuthorizationResult } from '../types/agentRegistry';
import { OrionTraceStore } from './audit/orionTraceStore';

export const AGENT_ORION_IDENTITY = 'agent-orion-qa-v1';
export const AGENT_ORION_ROLE = 'AI_SECURITY_ANALYST';

export const ORION_BASE_CAPABILITIES: readonly ControlPlaneCapability[] = [
  'audit.run',
  'qa.run',
  'content.read',
  'settings.read',
  'database.read',
  'vps.read',
  'github.read'
];

export class ControlPlaneAuthorization {

  /**
   * Translates legacy User Roles to fine-grained Control Plane Capabilities
   */
  public static getUserCapabilities(user: User): ControlPlaneCapability[] {
    const caps = new Set<ControlPlaneCapability>();
    
    // Base capabilities for all authenticated users
    caps.add('content.read');
    caps.add('settings.read');
    
    if (user.role === 'CONTENT_MANAGER') {
      caps.add('content.write');
      caps.add('cms.write');
    }
    
    if (user.role === 'MODERATOR') {
      caps.add('moderation.read');
      caps.add('moderation.write');
    }
    
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      caps.add('content.write');
      caps.add('cms.write');
      caps.add('moderation.read');
      caps.add('moderation.write');
      caps.add('users.read');
      caps.add('users.write');
      caps.add('qa.run');
      caps.add('audit.run');
      caps.add('project.manage');
      caps.add('github.read');
      caps.add('github.branch.create');
      caps.add('github.commit');
      caps.add('github.push.feature');
      caps.add('github.pr.create');
      caps.add('database.read');
      caps.add('vps.read');
    }

    if (user.role === 'SUPER_ADMIN') {
      caps.add('database.migrate');
      caps.add('vps.write');
      caps.add('deploy.production');
      caps.add('security.policy.write');
      caps.add('settings.write');
    }

    return Array.from(caps);
  }

  /**
   * Calculates intersection of capabilities: userCapabilities ∩ agentCapabilities
   * Fail-Closed: Agent NEVER obtains more capabilities than the active user.
   */
  public static intersectCapabilities(
    userCaps: ControlPlaneCapability[],
    agentCaps: readonly ControlPlaneCapability[]
  ): ControlPlaneCapability[] {
    if (!userCaps || userCaps.length === 0 || !agentCaps || agentCaps.length === 0) {
      return [];
    }
    const userSet = new Set(userCaps);
    return agentCaps.filter(cap => userSet.has(cap));
  }

  /**
   * Returns effective capabilities for Orion when acting under authenticated user context.
   * effectiveCapabilities = userCapabilities ∩ orionCapabilities
   */
  public static getOrionEffectiveCapabilities(user: User): ControlPlaneCapability[] {
    if (!user) return [];
    const userCaps = this.getUserCapabilities(user);
    return this.intersectCapabilities(userCaps, ORION_BASE_CAPABILITIES);
  }

  /**
   * Verifies if Orion has effective authorization for a required capability under user context.
   * Fail-closed: Throws on missing user or lack of intersected capability.
   */
  public static authorizeOrionCapability(user: User | undefined, requiredCapability: ControlPlaneCapability): void {
    if (!user) {
      throw new Error('FAIL CLOSED: Uživatel neautentizován pro AI analýzu.');
    }
    const effectiveCaps = this.getOrionEffectiveCapabilities(user);
    if (!effectiveCaps.includes(requiredCapability)) {
      throw new Error(`FAIL CLOSED: Orion nemá efektivní capability '${requiredCapability}' pro uživatele ${user.email}.`);
    }
  }

  /**
   * Central point for authorizing any Control Plane operation
   */
  public static authorizeOperation(
    user: User | undefined,
    operationId: ControlPlaneOperationId,
    target: string,
    context?: any
  ): void {
    if (!user) {
      throw new Error('FAIL CLOSED: Actor neexistuje (neautentizován).');
    }

    const opDef = ControlPlaneOperationCatalog[operationId];
    if (!opDef) {
      throw new Error(`FAIL CLOSED: Neznámá operace ${operationId}.`);
    }

    const capabilities = this.getUserCapabilities(user);

    if (!capabilities.includes(opDef.requiredCapability) && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') { console.log('Caps fail', {role: user.role, required: opDef.requiredCapability, caps: Array.from(capabilities)});
      throw new Error(`FAIL CLOSED: Uživatel ${user.email} nemá capability '${opDef.requiredCapability}' pro operaci ${operationId}.`);
    }

    // Target checks
    for (const forbidden of opDef.forbiddenTargets) {
      if (target.includes(forbidden)) {
        throw new Error(`FAIL CLOSED: Cíl '${target}' je pro operaci ${operationId} zakázán.`);
      }
    }
  }

  /**
   * Unified Single Authority for Authorizing Agent Requests (Phase 1B)
   * 
   * Decision Flow:
   * Agent Request -> Validate Agent -> Validate Capability -> Validate Agent-Capability Mapping ->
   * ControlPlaneAuthorization (User RBAC) -> Policy Engine -> Human Approval Gate -> OrionTraceStore
   */
  public static authorizeAgentRequest(request: AgentAuthorizationRequest): AgentAuthorizationResult {
    const { agentId, capabilityId, user, requestedOperation, targetResource, scope } = request;

    const buildDeny = (
      reason: string,
      riskLevel: 'P0' | 'P1' | 'P2' | 'P3' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'P0',
      traceRequired = false
    ): AgentAuthorizationResult => ({
      decision: 'DENY',
      agentId: agentId || 'unknown',
      capabilityId: capabilityId || 'unknown',
      reason,
      riskLevel,
      approvalRequired: false,
      traceRequired,
    });

    try {
      if (!agentId) {
        return buildDeny('FAIL CLOSED: Missing agentId in request.', 'P0');
      }

      if (!capabilityId) {
        return buildDeny('FAIL CLOSED: Missing capabilityId in request.', 'P0');
      }

      // 1. Validate Agent Existence in AgentRegistry
      const agent = AgentRegistry.getAgent(agentId);
      if (!agent) {
        return buildDeny(`FAIL CLOSED: Unknown agent '${agentId}'.`, 'P0');
      }

      // 2. Validate Agent Status and Enablement
      if (!agent.enabled || agent.status === 'DISABLED') {
        return buildDeny(`FAIL CLOSED: Agent '${agentId}' is disabled or has status '${agent.status}'.`, 'P0', agent.traceRequired);
      }

      // 3. Validate Forbidden Capability
      if (AgentCapabilityCatalog.isForbiddenCapability(capabilityId)) {
        return buildDeny(`FAIL CLOSED: Capability '${capabilityId}' is strictly forbidden for all AI agents (P0 Security Policy).`, 'P0', agent.traceRequired);
      }

      // 4. Validate Capability Catalog Registration
      const cap = AgentCapabilityCatalog.getCapability(capabilityId);
      if (!cap) {
        return buildDeny(`FAIL CLOSED: Unknown capability '${capabilityId}'.`, 'P0', agent.traceRequired);
      }

      // 5. Validate Agent ↔ Capability Mapping
      const capabilityCheck = AgentCapabilityCatalog.checkAccess(agentId, capabilityId, scope);
      if (!capabilityCheck.allowed) {
        return buildDeny(`FAIL CLOSED: Agent capability mapping check failed: ${capabilityCheck.reason}`, cap.riskLevel, agent.traceRequired);
      }

      // 6. Validate User Authentication
      if (!user) {
        return buildDeny(`FAIL CLOSED: Unauthenticated actor. User context is required for agent authorization.`, cap.riskLevel, agent.traceRequired);
      }

      // 7. Validate User RBAC & Control Plane Capability
      const userCaps = this.getUserCapabilities(user);
      
      let requiredUserCap: ControlPlaneCapability | undefined;
      let opDef = requestedOperation
        ? ControlPlaneOperationCatalog[requestedOperation as ControlPlaneOperationId]
        : undefined;

      if (opDef) {
        requiredUserCap = opDef.requiredCapability;
      } else if (ControlPlaneOperationCatalog[capabilityId as ControlPlaneOperationId]) {
        opDef = ControlPlaneOperationCatalog[capabilityId as ControlPlaneOperationId];
        requiredUserCap = opDef.requiredCapability;
      } else {
        requiredUserCap = capabilityId as ControlPlaneCapability;
      }

      // Check User RBAC entitlement
      if (requiredUserCap && !userCaps.includes(requiredUserCap) && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
        return buildDeny(`FAIL CLOSED: User '${user.email}' lacks required capability '${requiredUserCap}'.`, cap.riskLevel, agent.traceRequired);
      }

      // 8. Validate Target Forbidden Targets
      if (targetResource && opDef) {
        for (const forbiddenTarget of opDef.forbiddenTargets) {
          if (targetResource.toLowerCase().includes(forbiddenTarget.toLowerCase())) {
            return buildDeny(`FAIL CLOSED: Target resource '${targetResource}' is forbidden for operation '${opDef.id}'.`, 'P0', agent.traceRequired);
          }
        }
      }

      // 9. Trace Binding (OrionTraceStore)
      let traceId: string | undefined;
      if (agent.traceRequired) {
        try {
          const activeTrace = OrionTraceStore.getActiveOrLatestTrace() || OrionTraceStore.startTrace(user, scope || capabilityId);
          traceId = activeTrace?.id;
          if (!traceId) {
            return buildDeny(`FAIL CLOSED: Failed to initialize trace context for traceRequired agent '${agentId}'.`, cap.riskLevel, true);
          }
        } catch (err: any) {
          return buildDeny(`FAIL CLOSED: Trace initialization error for agent '${agentId}': ${err?.message || 'unknown'}`, cap.riskLevel, true);
        }
      }

      // 10. Evaluate Human Approval Gate
      const requiresHumanApproval = cap.requiresHumanApproval || agent.requiredApproval || (opDef ? opDef.requiresApproval : false);

      if (requiresHumanApproval) {
        return {
          decision: 'REQUIRE_HUMAN_APPROVAL',
          agentId: agent.id,
          capabilityId,
          reason: `Human approval required for agent '${agent.id}' executing capability '${capabilityId}'.`,
          riskLevel: cap.riskLevel,
          approvalRequired: true,
          traceRequired: agent.traceRequired,
          traceId,
        };
      }

      // 11. Return ALLOW Result
      return {
        decision: 'ALLOW',
        agentId: agent.id,
        capabilityId,
        reason: `Authorized: Agent '${agent.id}' is permitted to execute capability '${capabilityId}' under user '${user.email}'.`,
        riskLevel: cap.riskLevel,
        approvalRequired: false,
        traceRequired: agent.traceRequired,
        traceId,
      };

    } catch (err: any) {
      return buildDeny(`FAIL CLOSED: Authorization error: ${err?.message || 'unknown error'}`, 'P0');
    }
  }
}

