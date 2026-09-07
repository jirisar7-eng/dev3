const fs = require('fs');
let file = fs.readFileSync('src/services/orion/orionApprovalStore.ts', 'utf8');

// replace fallbackApprovals map entirely
file = file.replace(/  private static fallbackApprovals: Map<string, OrionApprovalRequest> = new Map\(\);\n/g, '');

file = file.replace(
`    const canonical = JSON.stringify(payload ?? null);
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  public static generateBindingHash(data: {
    id: string;
    agentId: string;
    capabilityId: string;
    userId: string;
    operation: string;
    target: string;
    scope: string;
    traceId: string;
    riskLevel: string;
    payloadHash: string;
  }): string {
    const parts = [
      data.id,
      data.agentId,
      data.capabilityId,
      data.userId,
      data.operation,
      data.target,
      data.scope,
      data.traceId,
      data.riskLevel,
      data.payloadHash
    ];
    return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
  }`,
`    const canonical = JSON.stringify(payload ?? null);
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  public static generateBindingHash(data: {
    id: string;
    agentId: string;
    capabilityId: string;
    userId: string;
    operation: string;
    target: string;
    scope: string;
    traceId: string;
    riskLevel: string;
    payloadHash: string;
  }): string {
    const canonicalObj = {
      bindingVersion: '1.0',
      approvalId: data.id,
      agentId: data.agentId,
      capabilityId: data.capabilityId,
      userId: data.userId,
      operation: data.operation,
      target: data.target,
      scope: data.scope,
      traceId: data.traceId,
      riskLevel: data.riskLevel,
      payloadHash: data.payloadHash
    };
    const canonical = JSON.stringify(canonicalObj);
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }`
);

// find all fallback logic and throw or return false
// let's just replace the whole class.
