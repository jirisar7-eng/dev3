import { User } from '../types';
import { ControlPlaneCapability, ControlPlaneOperationId } from '../types/controlPlane';
import { ControlPlaneOperationCatalog } from './controlPlaneOperationCatalog';

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

    if (!capabilities.includes(opDef.requiredCapability)) {
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
