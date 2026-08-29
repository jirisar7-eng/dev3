import { User } from '../types';
import { ControlPlaneCapability, ControlPlaneOperationId } from '../types/controlPlane';
import { ControlPlaneOperationCatalog } from './controlPlaneOperationCatalog';

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
}
