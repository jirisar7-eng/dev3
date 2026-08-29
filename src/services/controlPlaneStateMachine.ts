import { ControlPlaneStatus, ControlPlaneOperationId, ControlPlaneAction, ControlPlaneSnapshot } from '../types/controlPlane';
import { ControlPlaneOperationCatalog } from './controlPlaneOperationCatalog';

export interface StateTransitionRequest {
  action: ControlPlaneAction;
  requestedState: ControlPlaneStatus;
  actorId: string;
  actorCapabilities: string[]; // From RBAC
  snapshot?: ControlPlaneSnapshot;
  approvalPresent?: boolean;
}

export class ControlPlaneStateMachine {
  // Strict transition matrix
  private static readonly TRANSITIONS: Record<ControlPlaneStatus, ControlPlaneStatus[]> = {
    DRAFT: ['DISCOVERY', 'BLOCKED', 'FAILED'],
    DISCOVERY: ['PLANNED', 'BLOCKED', 'FAILED'],
    PLANNED: ['SNAPSHOTTED', 'BLOCKED', 'FAILED'],
    SNAPSHOTTED: ['WAITING_APPROVAL', 'APPROVED', 'BLOCKED', 'FAILED'], // Can go to APPROVED if no approval required
    WAITING_APPROVAL: ['APPROVED', 'BLOCKED', 'FAILED', 'REJECTED'],
    APPROVED: ['EXECUTING', 'BLOCKED', 'FAILED'],
    EXECUTING: ['BRANCH_CREATED', 'COMPLETED', 'FAILED', 'BLOCKED'],
    BRANCH_CREATED: ['COMMITTED', 'FAILED', 'BLOCKED'],
    COMMITTED: ['PUSHED', 'FAILED', 'BLOCKED'],
    PUSHED: ['PR_CREATED', 'FAILED', 'BLOCKED'],
    PR_CREATED: ['CI_RUNNING', 'FAILED', 'BLOCKED'],
    CI_RUNNING: ['QA_RUNNING', 'CI_FAILED', 'BLOCKED'],
    CI_FAILED: ['AI_REVIEW', 'FAILED', 'BLOCKED'],
    QA_RUNNING: ['AI_REVIEW', 'QA_FAILED', 'BLOCKED'],
    QA_FAILED: ['AI_REVIEW', 'FAILED', 'BLOCKED'],
    AI_REVIEW: ['WAITING_MERGE_APPROVAL', 'FAILED', 'BLOCKED'],
    WAITING_MERGE_APPROVAL: ['MERGED', 'BLOCKED', 'FAILED', 'REJECTED'],
    MERGED: ['DEPLOYING', 'FAILED', 'BLOCKED'],
    DEPLOYING: ['DEPLOYED', 'FAILED', 'BLOCKED'],
    DEPLOYED: ['MONITORING', 'FAILED', 'BLOCKED'],
    MONITORING: ['ROLLBACK_WINDOW', 'FINALIZED', 'FAILED', 'BLOCKED'],
    ROLLBACK_WINDOW: ['ROLLED_BACK', 'FINALIZED', 'FAILED', 'BLOCKED'],
    ROLLED_BACK: ['FINALIZED', 'FAILED', 'BLOCKED'],
    FINALIZED: [], // Terminal
    FAILED: [], // Terminal, unless we want to allow retry, but keeping strict for now
    BLOCKED: [], // Terminal
    REJECTED: [],
    COMPLETED: ['FINALIZED', 'ROLLBACK_WINDOW', 'FAILED'],
    PLAN_CREATED: ['SNAPSHOTTED', 'BLOCKED', 'FAILED'],
    AWAITING_APPROVAL: ['APPROVED', 'BLOCKED', 'FAILED', 'REJECTED'],
    ROLLBACK_IN_PROGRESS: ['ROLLED_BACK', 'FINALIZED', 'FAILED', 'BLOCKED']
  };

  /**
   * Evaluates if a transition is structurally valid (regardless of permissions)
   */
  public static isValidTransitionPath(currentState: ControlPlaneStatus, requestedState: ControlPlaneStatus): boolean {
    if (currentState === requestedState) return true; // Idempotent
    const allowedNext = this.TRANSITIONS[currentState] || [];
    return allowedNext.includes(requestedState);
  }

  /**
   * Main Guard for transitions
   */
  public static validateTransition(req: StateTransitionRequest): void {
    const { action, requestedState, actorId, actorCapabilities, snapshot, approvalPresent } = req;
    
    // 1. Check path validity
    if (!this.isValidTransitionPath(action.status, requestedState)) {
      throw new Error(`FAIL CLOSED: Neplatný přechod stavu ze stavu ${action.status} do ${requestedState}`);
    }

    if (action.status === requestedState) return;

    // 2. Check invariants for specific states
    
    // EXECUTING
    if (requestedState === 'EXECUTING') {
      if (action.approvalLevel === 'CRITICAL_MUTATION' && !approvalPresent) {
        throw new Error(`FAIL CLOSED: Obejito schvalování. Operace typu CRITICAL_MUTATION vyžaduje approval pro přechod do EXECUTING.`);
      }
      
      const opId = action.operationId;
      if (opId) {
        const opDef = ControlPlaneOperationCatalog[opId];
        if (opDef.requiresApproval && !approvalPresent) {
           throw new Error(`FAIL CLOSED: Obejito schvalování. Operace ${opId} vyžaduje explicitní schválení.`);
        }
        if (opDef.requiresSnapshot && !snapshot) {
           throw new Error(`FAIL CLOSED: Chybí snapshot. Operace ${opId} vyžaduje 48h snapshot.`);
        }
      }
    }

    // MERGED
    if (requestedState === 'MERGED') {
      if (!approvalPresent) {
        throw new Error(`FAIL CLOSED: MERGE_MAIN je zakázán bez explicitního human approval.`);
      }
    }

    // DEPLOYED
    if (requestedState === 'DEPLOYING' || requestedState === 'DEPLOYED') {
      if (!approvalPresent) {
         throw new Error(`FAIL CLOSED: DEPLOY je zakázán bez explicitního human approval.`);
      }
    }

    // MAIN PROTECTION (Double check)
    if (requestedState === 'PUSHED' || requestedState === 'COMMITTED') {
      if (action.branch === 'main' || action.branch === 'master') {
         throw new Error(`FAIL CLOSED: PUSH na main větev z Copilota je absolutně zakázán. Lze pouze vytvořit PR.`);
      }
    }
    
    // RBAC Capability Check 
    // In actual implementation this is also checked before creating the action, but checking again is safer.
    if (action.operationId) {
       const opDef = ControlPlaneOperationCatalog[action.operationId];
       if (opDef && !actorCapabilities.includes(opDef.requiredCapability)) {
         // Allow if SUPER_ADMIN? The spec says: SUPER_ADMIN ≠ automatický bypass approval.
         // But SUPER_ADMIN has "all capabilities", so actorCapabilities should contain it.
         throw new Error(`FAIL CLOSED: Nedostatečné capability pro operaci ${action.operationId}. (Požadováno: ${opDef.requiredCapability})`);
       }
    }
  }
}
