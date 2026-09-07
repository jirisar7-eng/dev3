import { User } from '../../types';
import { ControlPlaneCapability } from '../../types/controlPlane';
import { OrionPermissionResolver } from './orionPermissionResolver';
import { aiPolicyEngine } from '../ai/aiPolicyEngine';
import { AuditService } from '../auditService';
import { OrionTraceStore } from '../audit/orionTraceStore';

export type OrionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'P0' | 'P1' | 'P2' | 'P3';

export interface OrionCapabilityDefinition {
  capabilityId: ControlPlaneCapability;
  name: string;
  description: string;
  requiredPermission: string;
  riskLevel: OrionRiskLevel;
  requiresHumanApproval: boolean;
  isReadOnly: boolean;
  canMutate: boolean;
  policyEngineCheck: boolean;
  auditRequired: boolean;
  traceRequired: boolean;
}

export interface OrionActionExecutionRequest {
  user: User | undefined;
  capabilityId: ControlPlaneCapability;
  targetResource?: string;
  parameters?: Record<string, any>;
  correlationId?: string;
  ipAddress?: string;
}

export interface OrionActionExecutionResult {
  decision: 'ALLOW' | 'DENY' | 'HUMAN_APPROVAL_REQUIRED';
  capabilityId: ControlPlaneCapability;
  definition?: OrionCapabilityDefinition;
  reason: string;
  riskLevel: OrionRiskLevel;
  requiresHumanApproval: boolean;
  auditRecorded: boolean;
  traceId?: string;
  executionResult?: any;
}

/**
 * Unified Orion Action & Capability Catalog
 * Central declarative registry for all Orion capabilities, risk classifications,
 * Policy Engine constraints, and Human-in-the-Loop requirements.
 * 
 * ARCHITECTURAL PRINCIPLES:
 * - NOT a second RBAC system (RBAC determines if user holds the capability).
 * - Policy Engine determines if capability is permissible in current context.
 * - Control Plane determines execution workflow.
 * - Orion interprets intent, checks catalog, and bridges authorization.
 * - SUPER_ADMIN has full permissions, but NEVER bypasses Policy Engine, Audit, Trace, or HITL.
 */
export const ORION_ACTION_CATALOG: Record<ControlPlaneCapability, OrionCapabilityDefinition> = {
  'content.read': {
    capabilityId: 'content.read',
    name: 'Čtení veřejného obsahu',
    description: 'Zobrazení a čtení článků, příruček a veřejného obsahu portálu',
    requiredPermission: 'content.read',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: false,
    traceRequired: true,
  },
  'content.create': {
    capabilityId: 'content.create',
    name: 'Tvorba nového obsahu',
    description: 'Vytváření konceptů článků, dopisů a podání',
    requiredPermission: 'content.create',
    riskLevel: 'MEDIUM',
    requiresHumanApproval: false,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'content.write': {
    capabilityId: 'content.write',
    name: 'Úprava obsahu',
    description: 'Úprava a aktualizace existujících článků a textů',
    requiredPermission: 'content.write',
    riskLevel: 'MEDIUM',
    requiresHumanApproval: true,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'content.publish': {
    capabilityId: 'content.publish',
    name: 'Publikace obsahu',
    description: 'Schvalování a zveřejňování článků na živý portál',
    requiredPermission: 'content.publish',
    riskLevel: 'HIGH',
    requiresHumanApproval: true,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'legal.read': {
    capabilityId: 'legal.read',
    name: 'Čtení právních textů',
    description: 'Přístup k právním předpisům, článkům a veřejné poradně',
    requiredPermission: 'legal.read',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: false,
    traceRequired: true,
  },
  'legal.research': {
    capabilityId: 'legal.research',
    name: 'Právní výzkum a výklady',
    description: 'Pokročilá právní rešerše a příprava výkladů legislativy',
    requiredPermission: 'legal.research',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'judikatura.read': {
    capabilityId: 'judikatura.read',
    name: 'Čtení judikatury',
    description: 'Vyhledávání a rozbor soudních rozhodnutí a nálezů ÚS ČR',
    requiredPermission: 'judikatura.read',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: false,
    traceRequired: true,
  },
  'ai.chat': {
    capabilityId: 'ai.chat',
    name: 'AI konverzace a asistence',
    description: 'Konverzace s asistentem Orion pro obecné a orientační dotazy',
    requiredPermission: 'ai.chat',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: false,
    traceRequired: true,
  },
  'ai.generate': {
    capabilityId: 'ai.generate',
    name: 'AI generování textů a návrhů',
    description: 'Generování strukturovaných textových předloh, rozborů a výstupů',
    requiredPermission: 'ai.generate',
    riskLevel: 'MEDIUM',
    requiresHumanApproval: false,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'cms.write': {
    capabilityId: 'cms.write',
    name: 'Správa CMS stránek',
    description: 'Úprava CMS stránek, bloků a struktury obsahu',
    requiredPermission: 'cms.write',
    riskLevel: 'HIGH',
    requiresHumanApproval: true,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'settings.read': {
    capabilityId: 'settings.read',
    name: 'Zobrazení nastavení',
    description: 'Čtení základní systémové a projektové konfigurace',
    requiredPermission: 'settings.read',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: false,
    traceRequired: true,
  },
  'settings.write': {
    capabilityId: 'settings.write',
    name: 'Úprava nastavení',
    description: 'Změny systémových parametrů, integrací a konfigurace',
    requiredPermission: 'settings.write',
    riskLevel: 'CRITICAL',
    requiresHumanApproval: true,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'users.read': {
    capabilityId: 'users.read',
    name: 'Zobrazení uživatelů',
    description: 'Přehled uživatelských účtů a registrace',
    requiredPermission: 'users.read',
    riskLevel: 'MEDIUM',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'users.write': {
    capabilityId: 'users.write',
    name: 'Úprava profilů uživatelů',
    description: 'Aktualizace profilů, e-mailů a kontaktních údajů',
    requiredPermission: 'users.write',
    riskLevel: 'HIGH',
    requiresHumanApproval: true,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'users.manage': {
    capabilityId: 'users.manage',
    name: 'Správa uživatelských účtů',
    description: 'Blokování, aktivace, mazání a správa uživatelských účtů',
    requiredPermission: 'users.manage',
    riskLevel: 'CRITICAL',
    requiresHumanApproval: true,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'rbac.manage': {
    capabilityId: 'rbac.manage',
    name: 'Správa rolí a oprávnění',
    description: 'Přiřazování systémových rolí, Custom Roles a přístupových práv',
    requiredPermission: 'rbac.manage',
    riskLevel: 'CRITICAL',
    requiresHumanApproval: true,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'qa.run': {
    capabilityId: 'qa.run',
    name: 'Spuštění QA testovací sady',
    description: 'Spuštění verifikačních a regresních testů v systému',
    requiredPermission: 'qa.run',
    riskLevel: 'MEDIUM',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'audit.run': {
    capabilityId: 'audit.run',
    name: 'Spuštění systémového auditu',
    description: 'Provedení bezpečnostního, architektonického a kódového auditu',
    requiredPermission: 'audit.run',
    riskLevel: 'MEDIUM',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'github.read': {
    capabilityId: 'github.read',
    name: 'Čtení GitHub repozitáře',
    description: 'Zobrazení stavu repozitáře, větví, PR a commitů',
    requiredPermission: 'github.read',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: false,
    traceRequired: true,
  },
  'github.branch.create': {
    capabilityId: 'github.branch.create',
    name: 'Vytvoření Git větve',
    description: 'Založení nové vývojové nebo oprawné větve',
    requiredPermission: 'github.branch.create',
    riskLevel: 'MEDIUM',
    requiresHumanApproval: false,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'github.commit': {
    capabilityId: 'github.commit',
    name: 'Vytvoření Git commitu',
    description: 'Zapsání změn kódu do repozitáře',
    requiredPermission: 'github.commit',
    riskLevel: 'HIGH',
    requiresHumanApproval: true,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'github.push.feature': {
    capabilityId: 'github.push.feature',
    name: 'Push větve na GitHub',
    description: 'Odeslání feature větve na vzdálený repozitář',
    requiredPermission: 'github.push.feature',
    riskLevel: 'HIGH',
    requiresHumanApproval: true,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'github.pr.create': {
    capabilityId: 'github.pr.create',
    name: 'Vytvoření Pull Requestu',
    description: 'Založení Pull Requestu pro schválení změn',
    requiredPermission: 'github.pr.create',
    riskLevel: 'MEDIUM',
    requiresHumanApproval: false,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'database.read': {
    capabilityId: 'database.read',
    name: 'Čtení databáze',
    description: 'Dotazování do databázových schémat a tabulek',
    requiredPermission: 'database.read',
    riskLevel: 'MEDIUM',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'database.migrate': {
    capabilityId: 'database.migrate',
    name: 'Databázové migrace',
    description: 'Aplikace strukturálních migrací schéma v databázi',
    requiredPermission: 'database.migrate',
    riskLevel: 'CRITICAL',
    requiresHumanApproval: true,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'vps.read': {
    capabilityId: 'vps.read',
    name: 'Čtení stavu VPS',
    description: 'Zobrazení systémových statistik, stavu procesů a logů VPS',
    requiredPermission: 'vps.read',
    riskLevel: 'MEDIUM',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'vps.write': {
    capabilityId: 'vps.write',
    name: 'Správa VPS a operací',
    description: 'Restart služeb, zásahy na serveru a údržbové operace',
    requiredPermission: 'vps.write',
    riskLevel: 'CRITICAL',
    requiresHumanApproval: true,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'deploy.production': {
    capabilityId: 'deploy.production',
    name: 'Produkční nasazení (Deploy)',
    description: 'Spuštění nasazení aplikace do produkčního prostředí',
    requiredPermission: 'deploy.production',
    riskLevel: 'CRITICAL',
    requiresHumanApproval: true,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'security.policy.write': {
    capabilityId: 'security.policy.write',
    name: 'Úprava bezpečnostních politik',
    description: 'Konfigurace pravidel v AI Policy Enginu a pravidlech přístupu',
    requiredPermission: 'security.policy.write',
    riskLevel: 'CRITICAL',
    requiresHumanApproval: true,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'project.manage': {
    capabilityId: 'project.manage',
    name: 'Správa projektů a tenantů',
    description: 'Konfigurace projektových modulů a multi-tenant izolace',
    requiredPermission: 'project.manage',
    riskLevel: 'HIGH',
    requiresHumanApproval: true,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'moderation.read': {
    capabilityId: 'moderation.read',
    name: 'Čtení moderační fronty',
    description: 'Zobrazení nahlášených příspěvků a reakcí ke kontrole',
    requiredPermission: 'moderation.read',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: false,
    traceRequired: true,
  },
  'moderation.write': {
    capabilityId: 'moderation.write',
    name: 'Schvalování a moderace',
    description: 'Schvalování, skrytí nebo smazání nahlášeného obsahu',
    requiredPermission: 'moderation.write',
    riskLevel: 'MEDIUM',
    requiresHumanApproval: false,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'agent.build': {
    capabilityId: 'agent.build',
    name: 'agent.build (Agent)',
    description: 'Agent capability for agent.build',
    requiredPermission: 'agent.build',
    riskLevel: 'HIGH',
    requiresHumanApproval: true,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'code.generate': {
    capabilityId: 'code.generate',
    name: 'code.generate (Agent)',
    description: 'Agent capability for code.generate',
    requiredPermission: 'code.generate',
    riskLevel: 'MEDIUM',
    requiresHumanApproval: false,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'preview.render': {
    capabilityId: 'preview.render',
    name: 'preview.render (Agent)',
    description: 'Agent capability for preview.render',
    requiredPermission: 'preview.render',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'ui.inspect': {
    capabilityId: 'ui.inspect',
    name: 'ui.inspect (Agent)',
    description: 'Agent capability for ui.inspect',
    requiredPermission: 'ui.inspect',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'audio.synthesize': {
    capabilityId: 'audio.synthesize',
    name: 'audio.synthesize (Agent)',
    description: 'Agent capability for audio.synthesize',
    requiredPermission: 'audio.synthesize',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'faq.read': {
    capabilityId: 'faq.read',
    name: 'faq.read (Agent)',
    description: 'Agent capability for faq.read',
    requiredPermission: 'faq.read',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'ticket.read': {
    capabilityId: 'ticket.read',
    name: 'ticket.read (Agent)',
    description: 'Agent capability for ticket.read',
    requiredPermission: 'ticket.read',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'support.respond': {
    capabilityId: 'support.respond',
    name: 'support.respond (Agent)',
    description: 'Agent capability for support.respond',
    requiredPermission: 'support.respond',
    riskLevel: 'MEDIUM',
    requiresHumanApproval: false,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'analytics.read': {
    capabilityId: 'analytics.read',
    name: 'analytics.read (Agent)',
    description: 'Agent capability for analytics.read',
    requiredPermission: 'analytics.read',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'metrics.query': {
    capabilityId: 'metrics.query',
    name: 'metrics.query (Agent)',
    description: 'Agent capability for metrics.query',
    requiredPermission: 'metrics.query',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'report.generate': {
    capabilityId: 'report.generate',
    name: 'report.generate (Agent)',
    description: 'Agent capability for report.generate',
    requiredPermission: 'report.generate',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'document.read': {
    capabilityId: 'document.read',
    name: 'document.read (Agent)',
    description: 'Agent capability for document.read',
    requiredPermission: 'document.read',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'document.parse': {
    capabilityId: 'document.parse',
    name: 'document.parse (Agent)',
    description: 'Agent capability for document.parse',
    requiredPermission: 'document.parse',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'ocr.extract': {
    capabilityId: 'ocr.extract',
    name: 'ocr.extract (Agent)',
    description: 'Agent capability for ocr.extract',
    requiredPermission: 'ocr.extract',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'repo.read': {
    capabilityId: 'repo.read',
    name: 'repo.read (Agent)',
    description: 'Agent capability for repo.read',
    requiredPermission: 'repo.read',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'findings.view': {
    capabilityId: 'findings.view',
    name: 'findings.view (Agent)',
    description: 'Agent capability for findings.view',
    requiredPermission: 'findings.view',
    riskLevel: 'LOW',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'actions.propose': {
    capabilityId: 'actions.propose',
    name: 'actions.propose (Agent)',
    description: 'Agent capability for actions.propose',
    requiredPermission: 'actions.propose',
    riskLevel: 'MEDIUM',
    requiresHumanApproval: false,
    isReadOnly: false,
    canMutate: true,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
  'admin.assist': {
    capabilityId: 'admin.assist',
    name: 'admin.assist (Agent)',
    description: 'Agent capability for admin.assist',
    requiredPermission: 'admin.assist',
    riskLevel: 'MEDIUM',
    requiresHumanApproval: false,
    isReadOnly: true,
    canMutate: false,
    policyEngineCheck: true,
    auditRequired: true,
    traceRequired: true,
  },
};

export class OrionActionCatalog {
  /**
   * Retrieves a capability definition by ID.
   */
  public static getCapabilityDefinition(
    capabilityId: ControlPlaneCapability | string
  ): OrionCapabilityDefinition | undefined {
    if (!capabilityId) return undefined;
    return ORION_ACTION_CATALOG[capabilityId as ControlPlaneCapability];
  }

  /**
   * Returns all capability definitions from the catalog.
   */
  public static getAllDefinitions(): OrionCapabilityDefinition[] {
    return Object.values(ORION_ACTION_CATALOG);
  }

  /**
   * Filters and returns capabilities available to a user based on Effective Permissions & Policy Engine.
   */
  public static getCapabilitiesForUser(
    user: User | undefined
  ): OrionCapabilityDefinition[] {
    const resolved = OrionPermissionResolver.resolveEffectivePermissions(user);
    if (resolved.isAnonymous || !resolved.orionEffectiveCapabilities) {
      return [];
    }

    return resolved.orionEffectiveCapabilities
      .map(cap => ORION_ACTION_CATALOG[cap])
      .filter((def): def is OrionCapabilityDefinition => def !== undefined);
  }

  /**
   * Authorization Bridge & Action Execution Engine.
   * Performs server-side re-authorization, Policy Engine verification,
   * risk evaluation, Human-in-the-Loop check, Audit logging, and Trace recording.
   * 
   * ZERO-TRUST GUARANTEE:
   * Re-evaluates effective permissions from authentic server user object.
   * NO bypasses for SUPER_ADMIN or client payloads.
   */
  public static async authorizeAndBridgeAction(
    request: OrionActionExecutionRequest
  ): Promise<OrionActionExecutionResult> {
    const correlationId = request.correlationId || `orion-act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ipAddress = request.ipAddress || '127.0.0.1';
    const { user, capabilityId, targetResource } = request;

    let auditRecorded = false;
    let traceId: string | undefined;

    // 1. RE-AUTHORIZATION STEP (Zero-Trust)
    const resolvedPermissions = OrionPermissionResolver.resolveEffectivePermissions(user);

    if (resolvedPermissions.isAnonymous || !user) {
      await AuditService.recordLog(
        'ORION_ACTION_UNAUTHORIZED',
        'ORION_CATALOG',
        `Zamítnut pokus o akci '${capabilityId}' neautentizovaným uživatelem (CorrelationId: ${correlationId})`,
        undefined,
        ipAddress
      );
      return {
        decision: 'DENY',
        capabilityId,
        reason: `FAIL CLOSED: Neautentizovaný uživatel nemůže provádět akce s capability '${capabilityId}'.`,
        riskLevel: 'P0',
        requiresHumanApproval: false,
        auditRecorded: true,
      };
    }

    const definition = this.getCapabilityDefinition(capabilityId);
    if (!definition) {
      await AuditService.recordLog(
        'ORION_ACTION_UNAUTHORIZED',
        'ORION_CATALOG',
        `Zamítnuta neznámá capability '${capabilityId}' pro uživatele ${user.email}`,
        user,
        ipAddress
      );
      return {
        decision: 'DENY',
        capabilityId,
        reason: `FAIL CLOSED: Capability '${capabilityId}' není registrována v Orion Action Catalogu.`,
        riskLevel: 'P0',
        requiresHumanApproval: false,
        auditRecorded: true,
      };
    }

    // 2. CHECK EFFECTIVE PERMISSION ENTITLEMENT
    const isEntitled = resolvedPermissions.orionEffectiveCapabilities.includes(capabilityId);
    if (!isEntitled) {
      await AuditService.recordLog(
        'ORION_ACTION_UNAUTHORIZED',
        'ORION_CATALOG',
        `Uživatel ${user.email} (${user.role}) nemá efektivní oprávnění pro capability '${capabilityId}'`,
        user,
        ipAddress
      );
      return {
        decision: 'DENY',
        capabilityId,
        definition,
        reason: `FAIL CLOSED: Uživatel '${user.email}' nemá efektivní capability '${capabilityId}'.`,
        riskLevel: definition.riskLevel,
        requiresHumanApproval: definition.requiresHumanApproval,
        auditRecorded: true,
      };
    }

    // 3. POLICY ENGINE EVALUATION
    const policyAllowed = aiPolicyEngine.evaluatePolicy(user, capabilityId);
    if (!policyAllowed) {
      await AuditService.recordLog(
        'ORION_POLICY_VIOLATION',
        'AI_POLICY_ENGINE',
        `Policy Engine zamítl akční požadavek '${capabilityId}' pro uživatele ${user.email}`,
        user,
        ipAddress
      );
      return {
        decision: 'DENY',
        capabilityId,
        definition,
        reason: `BLOCKED BY POLICY ENGINE: Capability '${capabilityId}' je zakázána bezpečnostní konfigurací AI Policy Engine.`,
        riskLevel: definition.riskLevel,
        requiresHumanApproval: definition.requiresHumanApproval,
        auditRecorded: true,
      };
    }

    // 4. TRACE INITIALIZATION
    if (definition.traceRequired) {
      try {
        const trace = OrionTraceStore.startTrace(user, capabilityId);
        traceId = trace.id;
      } catch {
        // Trace error fallback
      }
    }

    // 5. HUMAN-IN-THE-LOOP & RISK EVALUATION
    // Even SUPER_ADMIN is subject to HITL for mutating / high / critical / P0 / P1 risk actions!
    const isHighRiskOrMutating =
      definition.requiresHumanApproval ||
      definition.canMutate ||
      definition.riskLevel === 'HIGH' ||
      definition.riskLevel === 'CRITICAL' ||
      definition.riskLevel === 'P0' ||
      definition.riskLevel === 'P1';

    if (isHighRiskOrMutating) {
      await AuditService.recordLog(
        'ORION_HUMAN_APPROVAL_PROPOSED',
        'ORION_CATALOG',
        `Akce '${capabilityId}' (Riziko: ${definition.riskLevel}) vyžaduje lidské schválení (User: ${user.email}, Role: ${user.role})`,
        user,
        ipAddress
      );
      auditRecorded = true;

      return {
        decision: 'HUMAN_APPROVAL_REQUIRED',
        capabilityId,
        definition,
        reason: `HUMAN APPROVAL REQUIRED: Akce '${capabilityId}' má úroveň rizika '${definition.riskLevel}' a vyžaduje lidské schválení.`,
        riskLevel: definition.riskLevel,
        requiresHumanApproval: true,
        auditRecorded,
        traceId,
      };
    }

    // 6. READ-ONLY / SAFE ACTION EXECUTION
    await AuditService.recordLog(
      'ORION_ACTION_EXECUTED',
      'ORION_CATALOG',
      `Akce '${capabilityId}' autorizována a schválena pro uživatele ${user.email}`,
      user,
      ipAddress
    );
    auditRecorded = true;

    if (traceId) {
      try {
        OrionTraceStore.completeTrace(`Action ${capabilityId} authorized`, undefined, 'COMPLETED');
      } catch {
        // Trace completion fallback
      }
    }

    return {
      decision: 'ALLOW',
      capabilityId,
      definition,
      reason: `Akce '${capabilityId}' byla úspěšně autorizována.`,
      riskLevel: definition.riskLevel,
      requiresHumanApproval: false,
      auditRecorded,
      traceId,
    };
  }
}
