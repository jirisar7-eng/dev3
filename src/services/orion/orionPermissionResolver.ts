import { User, UserRole } from '../../types';
import { ControlPlaneCapability } from '../../types/controlPlane';
import { ControlPlaneAuthorization } from '../controlPlaneAuthorization';
import { aiPolicyEngine } from '../ai/aiPolicyEngine';
import { ORION_ACTION_CATALOG } from './orionActionCatalog';

export interface OrionEffectivePermissions {
  isAnonymous: boolean;
  userId?: string;
  userRole: UserRole | 'ANONYMOUS';
  accountStatus: string;
  directPermissions: string[];
  customRoles: string[];
  customRolePermissions: string[];
  specializations: string[];
  specializationCapabilities: ControlPlaneCapability[];
  baseCapabilities: ControlPlaneCapability[];
  effectiveUserCapabilities: ControlPlaneCapability[];
  orionEffectiveCapabilities: ControlPlaneCapability[];
  policyRestrictions: ControlPlaneCapability[];
}

export class OrionPermissionResolver {
  /**
   * Central server-side Effective Permission Resolver for Orion.
   * NEVER accepts untrusted role, customRole, specialization, or permissions from client payload.
   */
  public static resolveEffectivePermissions(
    authenticUser: User | undefined,
    options?: { ipAddress?: string; route?: string }
  ): OrionEffectivePermissions {
    if (!authenticUser) {
      return {
        isAnonymous: true,
        userRole: 'ANONYMOUS',
        accountStatus: 'ANONYMOUS',
        directPermissions: [],
        customRoles: [],
        customRolePermissions: [],
        specializations: [],
        specializationCapabilities: [],
        baseCapabilities: [],
        effectiveUserCapabilities: [],
        orionEffectiveCapabilities: [],
        policyRestrictions: [],
      };
    }

    const accountStatus = authenticUser.status || 'ACTIVE';

    if (accountStatus === 'SUSPENDED' || accountStatus === 'BANNED') {
      return {
        isAnonymous: false,
        userId: authenticUser.id,
        userRole: authenticUser.role,
        accountStatus,
        directPermissions: [],
        customRoles: [],
        customRolePermissions: [],
        specializations: [],
        specializationCapabilities: [],
        baseCapabilities: [],
        effectiveUserCapabilities: [],
        orionEffectiveCapabilities: [],
        policyRestrictions: [],
      };
    }

    const baseCaps = new Set<ControlPlaneCapability>(
      ControlPlaneAuthorization.getUserCapabilities(authenticUser)
    );

    // 1. Direct permissions on authenticUser object
    const directPerms: string[] = Array.isArray((authenticUser as any).permissions)
      ? (authenticUser as any).permissions
      : Array.isArray((authenticUser as any).customPermissions)
      ? (authenticUser as any).customPermissions
      : [];

    const customRoleList: string[] = [];
    if ((authenticUser as any).customRole) {
      customRoleList.push((authenticUser as any).customRole);
    }
    if (Array.isArray((authenticUser as any).customRoles)) {
      customRoleList.push(...(authenticUser as any).customRoles);
    }

    // 2. Custom Role permissions evaluation
    const customRolePerms: string[] = [];
    for (const permKey of directPerms) {
      customRolePerms.push(permKey);
      OrionPermissionResolver.mapPermissionToCapability(permKey, baseCaps);
    }

    if (Array.isArray((authenticUser as any).customRolePermissions)) {
      for (const permKey of (authenticUser as any).customRolePermissions) {
        customRolePerms.push(permKey);
        OrionPermissionResolver.mapPermissionToCapability(permKey, baseCaps);
      }
    }

    // 3. Specializations (authenticUser object ONLY)
    const userSpecs: string[] = [];
    if ((authenticUser as any).specialization) {
      userSpecs.push((authenticUser as any).specialization);
    }
    if (Array.isArray((authenticUser as any).specializations)) {
      userSpecs.push(...(authenticUser as any).specializations);
    }
    if (authenticUser.profile && (authenticUser.profile as any).specialization) {
      userSpecs.push((authenticUser.profile as any).specialization);
    }

    const specCaps = new Set<ControlPlaneCapability>();
    for (const spec of userSpecs) {
      const lower = spec.toLowerCase();
      if (lower.includes('legal') || lower.includes('lawyer') || lower.includes('advokat') || lower.includes('compliance')) {
        specCaps.add('legal.read');
        specCaps.add('legal.research');
        specCaps.add('judikatura.read');
      }
      if (lower.includes('moderation') || lower.includes('moderator')) {
        specCaps.add('moderation.read');
        specCaps.add('moderation.write');
      }
      if (lower.includes('it') || lower.includes('dev') || lower.includes('qa')) {
        specCaps.add('qa.run');
      }
    }

    for (const cap of specCaps) {
      baseCaps.add(cap);
    }

    const effectiveUserCaps = Array.from(baseCaps);

    // 4. Policy Engine Evaluation
    const policyRestrictedCaps: ControlPlaneCapability[] = [];
    const allowedOrionCaps: ControlPlaneCapability[] = [];

    for (const cap of effectiveUserCaps) {
      const policyAllowed = aiPolicyEngine.evaluatePolicy(authenticUser, cap);
      if (policyAllowed) {
        allowedOrionCaps.push(cap);
      } else {
        policyRestrictedCaps.push(cap);
      }
    }

    return {
      isAnonymous: false,
      userId: authenticUser.id,
      userRole: authenticUser.role,
      accountStatus,
      directPermissions: directPerms,
      customRoles: customRoleList,
      customRolePermissions: customRolePerms,
      specializations: userSpecs,
      specializationCapabilities: Array.from(specCaps),
      baseCapabilities: Array.from(baseCaps),
      effectiveUserCapabilities: effectiveUserCaps,
      orionEffectiveCapabilities: allowedOrionCaps,
      policyRestrictions: policyRestrictedCaps,
    };
  }

  /**
   * Maps permission keys to ControlPlaneCapability
   */
  public static mapPermissionToCapability(
    permKey: string,
    capSet: Set<ControlPlaneCapability>
  ): void {
    if (!permKey) return;
    const key = permKey.toLowerCase();

    if (key === 'audit.run' || key === 'system.logs' || key === 'system_logs') capSet.add('audit.run');
    if (key === 'vps.write' || key === 'vps_write' || key === 'vps.exec') capSet.add('vps.write');
    if (key === 'vps.read') capSet.add('vps.read');
    if (key === 'database.migrate' || key === 'db_migrate') capSet.add('database.migrate');
    if (key === 'database.read') capSet.add('database.read');
    if (key === 'users.manage' || key === 'users_manage' || key === 'users.write') {
      capSet.add('users.read');
      capSet.add('users.write');
      capSet.add('users.manage');
    }
    if (key === 'rbac.manage' || key === 'rbac_manage') capSet.add('rbac.manage');
    if (key === 'content.publish' || key === 'content_publish') {
      capSet.add('content.read');
      capSet.add('content.create');
      capSet.add('content.write');
      capSet.add('content.publish');
    }
    if (key === 'content.create' || key === 'content_create') {
      capSet.add('content.read');
      capSet.add('content.create');
    }
    if (key === 'content.write' || key === 'content_write') {
      capSet.add('content.read');
      capSet.add('content.write');
    }
    if (key === 'legal.edit' || key === 'legal_edit' || key === 'legal.research') {
      capSet.add('legal.read');
      capSet.add('legal.research');
      capSet.add('judikatura.read');
    }
    if (key === 'judikatura.read' || key === 'judikatura_read') {
      capSet.add('judikatura.read');
    }
    if (key === 'cms.write' || key === 'cms_write') capSet.add('cms.write');
    if (key === 'ai.chat') capSet.add('ai.chat');
    if (key === 'ai.generate') capSet.add('ai.generate');
    if (key === 'qa.run') capSet.add('qa.run');
    if (key === 'deploy.production') capSet.add('deploy.production');
  }

  /**
   * Generates Czech capability discovery response.
   */
  public static generateCapabilityDiscoveryResponse(
    resolved: OrionEffectivePermissions
  ): string {
    if (resolved.isAnonymous) {
      return (
        `Jsem Orion – asistenční inteligence a bezpečnostní kopilot portálu Synthesis.\n\n` +
        `Jako **anonymní návštěvník** máte k dispozici:\n` +
        `• Neformální konverzaci a orientaci v portálu (conversational)\n` +
        `• Právní průvodce, rozcestníky a kalkulačky péče (guidance)\n` +
        `• Obecné technologické informace (informational)\n\n` +
        `*Pro přístup k pokročilým schopnostem, správě obsahu nebo administrátorským nástrojům se prosím přihlaste.*`
      );
    }

    const caps = resolved.orionEffectiveCapabilities;
    const roleLabel = resolved.userRole;

    const formattedCaps = caps.map(c => {
      const def = ORION_ACTION_CATALOG[c];
      if (def) {
        return `• **${def.name}** (\`${c}\`) – ${def.description}`;
      }
      return `• \`${c}\``;
    }).join('\n');

    return (
      `Jsem Orion – váš asistent a bezpečnostní kopilot portálu Synthesis.\n\n` +
      `Na základě server-side ověření vašeho účtu (**${roleLabel}**) máte k dispozici následující schválené schopnosti (Effective Capabilities):\n\n` +
      `${formattedCaps || '• Žádné specifické rozšiřující schopnosti.'}\n\n` +
      `*Veškeré operace podléhají server-side RBAC, Policy Enginu, auditování a Human-in-the-Loop schvalování podle míry rizika.*`
    );
  }
}
