export type OrionTraceStepId =
  | 'USER'
  | 'CONTEXT'
  | 'SOURCES'
  | 'SANITIZER'
  | 'PERMISSION_INTERSECTION'
  | 'AI_PROVIDER'
  | 'EVIDENCE'
  | 'RECOMMENDATION'
  | 'CONTROL_PLANE_DRAFT'
  | 'HUMAN_APPROVAL_GATE';

export type OrionTraceStepStatus = 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'BLOCKED';

export interface OrionTraceStep {
  id: OrionTraceStepId;
  title: string;
  subtitle: string;
  status: OrionTraceStepStatus;
  latencyMs?: number;
  details?: Record<string, any>;
  error?: string;
  evidenceRef?: string;
}

export interface OrionTraceRecord {
  id: string;
  agentId: 'agent-orion-qa-v1';
  trustLevel: 'AI_RECOMMENDATION';
  timestamp: string;
  actor: {
    email: string;
    role: string;
  };
  scope: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  currentStepId: OrionTraceStepId;
  totalLatencyMs: number;
  provider: {
    primary: string;
    active: string;
    fallbackUsed: boolean;
    model: string;
  };
  telemetry: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
  effectiveCapabilities: string[];
  sanitized: boolean;
  steps: OrionTraceStep[];
  recommendationSummary?: string;
  proposedActionId?: string;
}
