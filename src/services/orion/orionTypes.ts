import { User, UserRole } from '../../types';
import { ControlPlaneCapability, ControlPlaneOperationId } from '../../types/controlPlane';

export type OrionDecision = 'ALLOW' | 'DENY' | 'AI_RECOMMENDATION' | 'HUMAN_APPROVAL_REQUIRED';

export type OrionIntent =
  | 'conversational'
  | 'informational'
  | 'guidance'
  | 'analytical'
  | 'content_generation'
  | 'audit'
  | 'operational';

export interface OrionContext {
  user?: User;
  userRole: UserRole | 'ANONYMOUS';
  effectiveCapabilities: ControlPlaneCapability[];
  currentRoute: string;
  pageContext?: Record<string, any>;
  correlationId: string;
}

export interface OrionQueryRequest {
  message: string;
  currentRoute?: string;
  pageContext?: Record<string, any>;
  requestedCapability?: ControlPlaneCapability;
  correlationId?: string;
}

export interface OrionProposedAction {
  title: string;
  intent: string;
  targetResource: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'P0' | 'P1' | 'P2' | 'P3';
  requiresHumanApproval: boolean;
  operationId?: ControlPlaneOperationId;
}

export interface OrionQueryResponse {
  correlationId: string;
  timestamp: string;
  decision: OrionDecision;
  trustLevel: 'AI_RECOMMENDATION' | 'ALLOW' | 'DENY';
  message: string;
  effectiveCapabilities: ControlPlaneCapability[];
  proposedActions?: OrionProposedAction[];
  requiresHumanApproval?: boolean;
  traceId?: string;
  error?: string;
  intent?: OrionIntent;
  scope: 'PUBLIC' | 'AUTHENTICATED' | 'ELEVATED';
}
