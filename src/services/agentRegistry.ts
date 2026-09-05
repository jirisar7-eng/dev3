import { AgentRegistryEntry, AgentStatus, AgentType } from '../types/agentRegistry';

/**
 * Declarative Unified Agent Registry (Phase 1A)
 * 
 * STRICT SECURITY CONSTRAINTS:
 * - Purely declarative TypeScript configuration.
 * - DOES NOT grant permissions or bypass ControlPlaneAuthorization.
 * - DOES NOT alter RBAC or user credentials.
 * - DOES NOT execute any system actions or shell commands.
 * - DOES NOT perform any database reads or writes.
 */
export const UNIFIED_AGENT_REGISTRY: Record<string, AgentRegistryEntry> = {
  BUILD_WITH_AGENTS: {
    id: 'BUILD_WITH_AGENTS',
    name: 'Build With Agents',
    status: 'EXPERIMENTAL',
    allowedScopes: ['agent.build', 'code.generate'],
    requiredApproval: true,
    allowedProviders: ['gemini', 'grok'],
    traceRequired: true,
    enabled: true,
  },
  ANTIGRAVITY_PREVIEW: {
    id: 'ANTIGRAVITY_PREVIEW',
    name: 'Antigravity Preview',
    status: 'EXPERIMENTAL',
    allowedScopes: ['preview.render', 'ui.inspect'],
    requiredApproval: true,
    allowedProviders: ['gemini'],
    traceRequired: true,
    enabled: true,
  },
  AI_TALK_RADIO: {
    id: 'AI_TALK_RADIO',
    name: 'AI Talk Radio',
    status: 'PROPOSED',
    allowedScopes: ['audio.synthesize', 'content.read'],
    requiredApproval: true,
    allowedProviders: ['gemini'],
    traceRequired: true,
    enabled: false,
  },
  CUSTOMER_SUPPORT: {
    id: 'CUSTOMER_SUPPORT',
    name: 'Customer Support Agent',
    status: 'PROPOSED',
    allowedScopes: ['faq.read', 'ticket.read', 'support.respond'],
    requiredApproval: false,
    allowedProviders: ['gemini', 'groq'],
    traceRequired: true,
    enabled: false,
  },
  DATA_ANALYST: {
    id: 'DATA_ANALYST',
    name: 'Data Analyst Agent',
    status: 'EXPERIMENTAL',
    allowedScopes: ['analytics.read', 'metrics.query', 'report.generate'],
    requiredApproval: false,
    allowedProviders: ['gemini', 'groq'],
    traceRequired: true,
    enabled: true,
  },
  DOCUMENT_PROCESSOR: {
    id: 'DOCUMENT_PROCESSOR',
    name: 'Document Processor Agent',
    status: 'PARTIAL',
    allowedScopes: ['document.read', 'document.parse', 'ocr.extract'],
    requiredApproval: false,
    allowedProviders: ['gemini'],
    traceRequired: true,
    enabled: true,
  },
  REPO_MAINTAINER: {
    id: 'REPO_MAINTAINER',
    name: 'Repo Maintainer Agent',
    status: 'EXPERIMENTAL',
    allowedScopes: ['repo.read', 'audit.run', 'qa.run'],
    requiredApproval: true,
    allowedProviders: ['gemini', 'grok'],
    traceRequired: true,
    enabled: true,
  },
  // Backward compatibility mappings
  ORION_QA_ANALYST: {
    id: 'ORION_QA_ANALYST',
    name: 'Orion QA Security Analyst',
    status: 'IMPLEMENTED',
    allowedScopes: ['audit.run', 'findings.view', 'actions.propose'],
    requiredApproval: true,
    allowedProviders: ['gemini'],
    traceRequired: true,
    enabled: true,
  },
  ADMIN_COPILOT: {
    id: 'ADMIN_COPILOT',
    name: 'Admin Copilot Assistant',
    status: 'IMPLEMENTED',
    allowedScopes: ['admin.assist', 'content.read', 'faq.read'],
    requiredApproval: false,
    allowedProviders: ['gemini'],
    traceRequired: true,
    enabled: true,
  },
};

export class AgentRegistry {
  /**
   * Returns agent entry by ID or archetype name.
   */
  public static getAgent(agentId: string): AgentRegistryEntry | undefined {
    if (!agentId) return undefined;
    return UNIFIED_AGENT_REGISTRY[agentId] || Object.values(UNIFIED_AGENT_REGISTRY).find(a => a.id === agentId);
  }

  /**
   * Returns all registered agent entries.
   */
  public static getAllAgents(): AgentRegistryEntry[] {
    return Object.values(UNIFIED_AGENT_REGISTRY);
  }

  /**
   * Returns agents filtered by status.
   */
  public static getAgentsByStatus(status: AgentStatus): AgentRegistryEntry[] {
    return this.getAllAgents().filter(agent => agent.status === status);
  }

  /**
   * Checks if an agent is active and enabled.
   */
  public static isAgentAllowed(agentId: string): boolean {
    const agent = this.getAgent(agentId);
    if (!agent) return false; // Unknown agent = DENY
    if (!agent.enabled || agent.status === 'DISABLED') return false; // Disabled = DENY
    return true;
  }

  /**
   * Checks if an agent declarative scope is allowed.
   */
  public static hasScope(agentId: string, scope: string): boolean {
    const agent = this.getAgent(agentId);
    if (!agent || !agent.enabled || agent.status === 'DISABLED') return false;
    return agent.allowedScopes.includes(scope);
  }
}
