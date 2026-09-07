const fs = require('fs');
let file = fs.readFileSync('src/middleware/orionAuthMiddleware.ts', 'utf8');

file = file.replace(
`        // Re-verify gates
        const authRes = ControlPlaneAuthorization.authorizeAgentRequest({
          agentId: AGENT_ORION_IDENTITY,
          capabilityId,
          user: req.user,
          scope: 'ai-engine'
        });
        
        if (authRes.decision === 'DENY') {
          res.status(403).json({ error: \`Security gates failed after approval: \${authRes.reason}\` });
          return;
        }`,
`        // Re-verify gates
        const authRes = ControlPlaneAuthorization.authorizeAgentRequest({
          agentId: AGENT_ORION_IDENTITY,
          capabilityId,
          user: req.user,
          scope: 'ai-engine',
          hasValidHitlApproval: true
        });
        
        if (authRes.decision !== 'ALLOW') {
          // Strictly fail-closed. If anything but ALLOW is returned (even REQUIRE_HUMAN_APPROVAL again), fail.
          res.status(403).json({ error: \`Security gates failed after approval: \${authRes.reason || authRes.decision}\` });
          return;
        }`);
fs.writeFileSync('src/middleware/orionAuthMiddleware.ts', file);
