import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { ControlPlaneAuthorization, AGENT_ORION_IDENTITY } from '../services/controlPlaneAuthorization';
import { ControlPlaneCapability } from '../types/controlPlane';
import { OrionApprovalStore } from '../services/orion/orionApprovalStore';

export const requireOrionAuth = (capabilityId: ControlPlaneCapability, operation: string = 'unknown') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const approvalId = req.headers['x-orion-approval-id'] as string;
      
      // Phase 1: Execution of an APPROVED request
      if (approvalId) {
        const approval = await OrionApprovalStore.get(approvalId);
        if (!approval) {
           res.status(404).json({ error: 'Approval request not found.' });
           return;
        }
        if (approval.status !== 'APPROVED') {
           res.status(403).json({ error: `Approval status is ${approval.status}. Expected APPROVED.` });
           return;
        }
        if (Date.now() > approval.expiresAt) {
           await OrionApprovalStore.transitionStatus(approvalId, 'APPROVED', 'EXPIRED');
           res.status(403).json({ error: 'Approval request has expired.' });
           return;
        }
        if (approval.userId !== req.user?.id) {
           res.status(403).json({ error: 'Actor binding mismatch. User mismatch.' });
           return;
        }

        // Verify cryptographic binding
        const currentPayloadHash = OrionApprovalStore.generatePayloadHash(req.body);
        if (currentPayloadHash !== approval.payloadHash) {
           res.status(403).json({ error: 'Payload tampering detected. Payload hash mismatch.' });
           return;
        }
        
        const currentBindingHash = OrionApprovalStore.generateBindingHash({
           id: approval.id,
           agentId: AGENT_ORION_IDENTITY,
           capabilityId,
           userId: req.user?.id || 'unknown',
           operation: operation,
           target: req.originalUrl,
           scope: 'ai-engine',
           traceId: approval.traceId,
           riskLevel: approval.riskLevel,
           payloadHash: currentPayloadHash
        });

        if (currentBindingHash !== approval.bindingHash) {
           res.status(403).json({ error: 'Full binding tampering detected. Binding hash mismatch.' });
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
        
        // Atomic execution lock
        const transitioned = await OrionApprovalStore.transitionStatus(approvalId, 'APPROVED', 'EXECUTING');
        if (!transitioned) {
           res.status(403).json({ error: 'Failed to acquire execution lock. Request may be already executing.' });
           return;
        }

        res.on('finish', async () => {
           if (res.statusCode >= 200 && res.statusCode < 400) {
              await OrionApprovalStore.transitionStatus(approvalId, 'EXECUTING', 'EXECUTED');
           } else {
              await OrionApprovalStore.transitionStatus(approvalId, 'EXECUTING', 'FAILED');
           }
        });

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
         const approval = await OrionApprovalStore.create({
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
