/**
 * Unified Agent Registry Types (Phase 1A)
 * Declarative type definitions for experimental agent layer.
 */

export type ExperimentalAgentArchetype =
  | 'BUILD_WITH_AGENTS'
  | 'ANTIGRAVITY_PREVIEW'
  | 'AI_TALK_RADIO'
  | 'CUSTOMER_SUPPORT'
  | 'DATA_ANALYST'
  | 'DOCUMENT_PROCESSOR'
  | 'REPO_MAINTAINER';

export type LegacyAgentArchetype = 'ORION_QA_ANALYST' | 'ADMIN_COPILOT' | 'agent-orion-qa-v1';

export type AgentType = ExperimentalAgentArchetype | LegacyAgentArchetype | (string & {});

export type AgentStatus = 'EXPERIMENTAL' | 'PARTIAL' | 'IMPLEMENTED' | 'PROPOSED' | 'DISABLED';

export interface AgentUxMetadata {
  shortDescription: string;
  longDescription: string;
  purpose: string;
  howToUse: string;
  capabilities: string[];
  limitations: string[];
  warnings: string[];
  examples: string[];
  status: AgentStatus;
  docPath?: string;
}

export interface AgentRegistryEntry {
  id: AgentType;
  name: string;
  status: AgentStatus;
  allowedScopes: string[];
  requiredApproval: boolean;
  allowedProviders: string[];
  traceRequired: boolean;
  enabled: boolean;
  uxMetadata?: AgentUxMetadata;
}

export interface AgentCapability {
  capabilityId: string;
  description: string;
  riskLevel: 'P0' | 'P1' | 'P2' | 'P3';
  requiresHumanApproval: boolean;
  allowedForAgents: AgentType[];
}

export interface AgentAccessCheckResult {
  allowed: boolean;
  reason: string;
  riskLevel?: 'P0' | 'P1' | 'P2' | 'P3';
  requiresHumanApproval?: boolean;
}

export type AgentDecision = 'ALLOW' | 'DENY' | 'REQUIRE_HUMAN_APPROVAL';

export interface AgentAuthorizationRequest {
  agentId: string;
  capabilityId: string;
  user?: any;
  requestedOperation?: string; // ControlPlaneOperationId
  targetResource?: string;
  scope?: string;
  context?: Record<string, unknown>;
}

export interface AgentAuthorizationResult {
  decision: AgentDecision;
  agentId: string;
  capabilityId: string;
  reason: string;
  riskLevel: 'P0' | 'P1' | 'P2' | 'P3' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  approvalRequired: boolean;
  traceRequired: boolean;
  traceId?: string;
}
