import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { ControlPlaneAuthorization, AGENT_ORION_IDENTITY } from '../services/controlPlaneAuthorization';
import { ControlPlaneCapability } from '../types/controlPlane';

export const requireOrionAuth = (capabilityId: ControlPlaneCapability) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authRes = ControlPlaneAuthorization.authorizeAgentRequest({
        agentId: AGENT_ORION_IDENTITY,
        capabilityId,
        user: req.user,
        scope: 'ai-engine'
      });
      if (authRes.decision !== 'ALLOW') {
        res.status(403).json({ error: authRes.reason });
        return;
      }
      next();
    } catch (err: any) {
      res.status(403).json({ error: err.message || 'Přístup zamítnut kontrolní rovinou Orion.' });
      return;
    }
  };
};
