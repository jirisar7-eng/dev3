const fs = require('fs');
let file = fs.readFileSync('src/types/agentRegistry.ts', 'utf8');
file = file.replace('context?: Record<string, unknown>;', 'context?: Record<string, unknown>;\n  hasValidHitlApproval?: boolean;');
fs.writeFileSync('src/types/agentRegistry.ts', file);
