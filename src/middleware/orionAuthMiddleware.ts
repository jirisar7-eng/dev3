import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { ControlPlaneAuthorization, AGENT_ORION_IDENTITY } from '../services/controlPlaneAuthorization';
import { ControlPlaneCapability } from '../types/controlPlane';
import { OrionApprovalStore } from '../services/orion/orionApprovalStore';

export const requireOrionAuth = (capabilityId: ControlPlaneCapability, operation: string = 'unknown') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const approvalId = req.headers['x-orion-approval-id'] as string;
      
      // Phase 1: Execution of an APPROVED request
      if (approvalId) {
        const approval = OrionApprovalStore.get(approvalId);
        if (!approval) {
           res.status(404).json({ error: 'Approval request not found.' });
           return;
        }
        if (approval.status !== 'APPROVED') {
           res.status(403).json({ error: `Approval status is ${approval.status}.` });
           return;
        }
        if (Date.now() > approval.expiresAt) {
           OrionApprovalStore.updateStatus(approvalId, 'EXPIRED');
           res.status(403).json({ error: 'Approval request has expired.' });
           return;
        }
        if (approval.userId !== req.user?.id) {
           res.status(403).json({ error: 'Actor binding mismatch. User mismatch.' });
           return;
        }
        
        // Re-verify gates
        const authRes = ControlPlaneAuthorization.authorizeAgentRequest({
          agentId: AGENT_ORION_IDENTITY,
          capabilityId,
          user: req.user,
          scope: 'ai-engine'
        });
        
        if (authRes.decision === 'DENY') {
          res.status(403).json({ error: `Security gates failed after approval: ${authRes.reason}` });
          return;
        }
        
        // Execute action
        OrionApprovalStore.updateStatus(approvalId, 'EXECUTED');
        next();
        return;
      }

      // Phase 2: Initial evaluation
      const authRes = ControlPlaneAuthorization.authorizeAgentRequest({
        agentId: AGENT_ORION_IDENTITY,
        capabilityId,
        user: req.user,
        scope: 'ai-engine'
      });

      if (authRes.decision === 'ALLOW') {
         next();
         return;
      } else if (authRes.decision === 'REQUIRE_HUMAN_APPROVAL') {
         const approval = OrionApprovalStore.create({
            agentId: AGENT_ORION_IDENTITY,
            capabilityId,
            userId: req.user?.id || 'unknown',
            operation: operation,
            target: req.originalUrl,
            scope: 'ai-engine',
            riskLevel: authRes.riskLevel || 'P1_HIGH',
            traceId: authRes.traceId || 'unknown',
            payload: req.body
         });
         res.status(202).json({
            decision: 'REQUIRE_HUMAN_APPROVAL',
            approvalId: approval.id,
            traceId: approval.traceId,
            status: 'PENDING',
            reason: 'Vyžadováno lidské schválení (HITL).',
            riskLevel: approval.riskLevel
         });
         return;
      } else {
         res.status(403).json({ error: authRes.reason });
         return;
      }
    } catch (err: any) {
      res.status(403).json({ error: err.message || 'Přístup zamítnut kontrolní rovinou Orion.' });
      return;
    }
  };
};
