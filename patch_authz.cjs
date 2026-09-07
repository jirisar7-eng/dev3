const fs = require('fs');
let file = fs.readFileSync('src/services/controlPlaneAuthorization.ts', 'utf8');
file = file.replace(
`      // 10. Evaluate Human Approval Gate
      const requiresHumanApproval = cap.requiresHumanApproval || agent.requiredApproval || (opDef ? opDef.requiresApproval : false);
      if (requiresHumanApproval) {`,
`      // 10. Evaluate Human Approval Gate
      const requiresHumanApproval = cap.requiresHumanApproval || agent.requiredApproval || (opDef ? opDef.requiresApproval : false);
      if (requiresHumanApproval && !request.hasValidHitlApproval) {`);
fs.writeFileSync('src/services/controlPlaneAuthorization.ts', file);
