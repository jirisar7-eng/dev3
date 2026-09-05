import { AgentAccessCheckResult, AgentCapability } from '../types/agentRegistry';
import { AgentRegistry } from './agentRegistry';

/**
 * Forbidden capabilities that MUST ALWAYS evaluate to DENY for all AI agents.
 * ABSOLUTNÍ ZÁKAZ (P0 Security Policy).
 */
export const FORBIDDEN_CAPABILITIES = [
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
  'git.push.auto',
] as const;

/**
 * Declarative Agent Capability Catalog (Phase 1A)
 * Capabilities are separated from agent identities.
 */
export const CAPABILITY_CATALOG: Record<string, AgentCapability> = {
  'agent.build': {
    capabilityId: 'agent.build',
    description: 'Build and configure agent definitions',
    riskLevel: 'P2',
    requiresHumanApproval: true,
    allowedForAgents: ['BUILD_WITH_AGENTS'],
  },
  'code.generate': {
    capabilityId: 'code.generate',
    description: 'Generate source code snippets',
    riskLevel: 'P2',
    requiresHumanApproval: true,
    allowedForAgents: ['BUILD_WITH_AGENTS'],
  },
  'preview.render': {
    capabilityId: 'preview.render',
    description: 'Render UI preview sandbox',
    riskLevel: 'P3',
    requiresHumanApproval: false,
    allowedForAgents: ['ANTIGRAVITY_PREVIEW'],
  },
  'ui.inspect': {
    capabilityId: 'ui.inspect',
    description: 'Inspect UI component structure',
    riskLevel: 'P3',
    requiresHumanApproval: false,
    allowedForAgents: ['ANTIGRAVITY_PREVIEW'],
  },
  'audio.synthesize': {
    capabilityId: 'audio.synthesize',
    description: 'Synthesize audio talk streams',
    riskLevel: 'P3',
    requiresHumanApproval: false,
    allowedForAgents: ['AI_TALK_RADIO'],
  },
  'content.read': {
    capabilityId: 'content.read',
    description: 'Read public content strings',
    riskLevel: 'P3',
    requiresHumanApproval: false,
    allowedForAgents: ['AI_TALK_RADIO', 'ADMIN_COPILOT'],
  },
  'faq.read': {
    capabilityId: 'faq.read',
    description: 'Read FAQ and support articles',
    riskLevel: 'P3',
    requiresHumanApproval: false,
    allowedForAgents: ['CUSTOMER_SUPPORT', 'ADMIN_COPILOT'],
  },
  'ticket.read': {
    capabilityId: 'ticket.read',
    description: 'Read support tickets',
    riskLevel: 'P2',
    requiresHumanApproval: false,
    allowedForAgents: ['CUSTOMER_SUPPORT'],
  },
  'support.respond': {
    capabilityId: 'support.respond',
    description: 'Generate support draft response',
    riskLevel: 'P3',
    requiresHumanApproval: false,
    allowedForAgents: ['CUSTOMER_SUPPORT'],
  },
  'analytics.read': {
    capabilityId: 'analytics.read',
    description: 'Read aggregated analytics metrics',
    riskLevel: 'P3',
    requiresHumanApproval: false,
    allowedForAgents: ['DATA_ANALYST'],
  },
  'metrics.query': {
    capabilityId: 'metrics.query',
    description: 'Query operational metrics',
    riskLevel: 'P3',
    requiresHumanApproval: false,
    allowedForAgents: ['DATA_ANALYST'],
  },
  'report.generate': {
    capabilityId: 'report.generate',
    description: 'Generate analytical reports',
    riskLevel: 'P3',
    requiresHumanApproval: false,
    allowedForAgents: ['DATA_ANALYST'],
  },
  'document.read': {
    capabilityId: 'document.read',
    description: 'Read user uploaded documents',
    riskLevel: 'P2',
    requiresHumanApproval: false,
    allowedForAgents: ['DOCUMENT_PROCESSOR'],
  },
  'document.parse': {
    capabilityId: 'document.parse',
    description: 'Parse structure of documents',
    riskLevel: 'P3',
    requiresHumanApproval: false,
    allowedForAgents: ['DOCUMENT_PROCESSOR'],
  },
  'ocr.extract': {
    capabilityId: 'ocr.extract',
    description: 'Extract text via OCR from images/PDFs',
    riskLevel: 'P3',
    requiresHumanApproval: false,
    allowedForAgents: ['DOCUMENT_PROCESSOR'],
  },
  'repo.read': {
    capabilityId: 'repo.read',
    description: 'Read repository file tree and metadata',
    riskLevel: 'P2',
    requiresHumanApproval: false,
    allowedForAgents: ['REPO_MAINTAINER'],
  },
  'audit.run': {
    capabilityId: 'audit.run',
    description: 'Run automated audit checks',
    riskLevel: 'P2',
    requiresHumanApproval: false,
    allowedForAgents: ['REPO_MAINTAINER', 'ORION_QA_ANALYST'],
  },
  'qa.run': {
    capabilityId: 'qa.run',
    description: 'Run QA test discovery suite',
    riskLevel: 'P2',
    requiresHumanApproval: false,
    allowedForAgents: ['REPO_MAINTAINER', 'ORION_QA_ANALYST'],
  },
  'findings.view': {
    capabilityId: 'findings.view',
    description: 'View audit findings',
    riskLevel: 'P3',
    requiresHumanApproval: false,
    allowedForAgents: ['REPO_MAINTAINER', 'ORION_QA_ANALYST'],
  },
  'actions.propose': {
    capabilityId: 'actions.propose',
    description: 'Propose draft control plane action',
    riskLevel: 'P1',
    requiresHumanApproval: true,
    allowedForAgents: ['REPO_MAINTAINER', 'ORION_QA_ANALYST'],
  },
  'admin.assist': {
    capabilityId: 'admin.assist',
    description: 'Assist admin users with UI guidance',
    riskLevel: 'P3',
    requiresHumanApproval: false,
    allowedForAgents: ['ADMIN_COPILOT'],
  },
};

export class AgentCapabilityCatalog {
  /**
   * Retrieves a capability entry by ID.
   */
  public static getCapability(capabilityId: string): AgentCapability | undefined {
    if (!capabilityId) return undefined;
    return CAPABILITY_CATALOG[capabilityId];
  }

  /**
   * Returns all capability entries.
   */
  public static getAllCapabilities(): AgentCapability[] {
    return Object.values(CAPABILITY_CATALOG);
  }

  /**
   * Checks if a capability is explicitly forbidden for all AI agents.
   */
  public static isForbiddenCapability(capabilityId: string): boolean {
    if (!capabilityId) return true;
    const lower = capabilityId.toLowerCase();
    return FORBIDDEN_CAPABILITIES.some(forbidden => lower.includes(forbidden.toLowerCase()));
  }

  /**
   * Evaluates access for an agent against a capability and optional scope.
   * DEFAULT RULE: DENY (Fail-closed).
   */
  public static checkAccess(agentId: string, capabilityId: string, scope?: string): AgentAccessCheckResult {
    // 1. Forbidden check (Absolute P0 Prohibition)
    if (this.isForbiddenCapability(capabilityId)) {
      return {
        allowed: false,
        reason: `FAIL CLOSED: Capability '${capabilityId}' is strictly forbidden for all AI agents (P0 Security Policy).`,
        riskLevel: 'P0',
        requiresHumanApproval: true,
      };
    }

    // 2. Validate Agent Existence in Registry
    const agent = AgentRegistry.getAgent(agentId);
    if (!agent) {
      return {
        allowed: false,
        reason: `FAIL CLOSED: Unknown agent '${agentId}'.`,
      };
    }

    // 3. Validate Agent Enablement
    if (!agent.enabled || agent.status === 'DISABLED') {
      return {
        allowed: false,
        reason: `FAIL CLOSED: Agent '${agentId}' is disabled or has status '${agent.status}'.`,
      };
    }

    // 4. Validate Capability Existence in Catalog
    const cap = this.getCapability(capabilityId);
    if (!cap) {
      return {
        allowed: false,
        reason: `FAIL CLOSED: Unknown capability '${capabilityId}'.`,
      };
    }

    // 5. Validate Agent Membership in Capability's allowedForAgents
    const isAgentAuthorizedForCap = cap.allowedForAgents.some(
      a => a === agent.id || a === agentId
    );
    if (!isAgentAuthorizedForCap) {
      return {
        allowed: false,
        reason: `FAIL CLOSED: Capability '${capabilityId}' is not authorized for agent '${agentId}'.`,
        riskLevel: cap.riskLevel,
        requiresHumanApproval: cap.requiresHumanApproval,
      };
    }

    // 6. Validate Scope if specified
    if (scope && !agent.allowedScopes.includes(scope)) {
      return {
        allowed: false,
        reason: `FAIL CLOSED: Scope '${scope}' is not in allowedScopes for agent '${agentId}'.`,
        riskLevel: cap.riskLevel,
        requiresHumanApproval: cap.requiresHumanApproval,
      };
    }

    // 7. Authorization Passed
    return {
      allowed: true,
      reason: `Authorized: Agent '${agentId}' holds capability '${capabilityId}'${scope ? ` in scope '${scope}'` : ''}.`,
      riskLevel: cap.riskLevel,
      requiresHumanApproval: cap.requiresHumanApproval || agent.requiredApproval,
    };
  }
}
