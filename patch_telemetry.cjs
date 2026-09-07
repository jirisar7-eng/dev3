const fs = require('fs');
let path = './src/services/qa/ai/types.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'isFallback?: boolean;',
  'isFallback?: boolean;\n  fallbackReason?: string;\n  routingDecision?: string;\n  providerId?: string;\n  modelId?: string;'
);

fs.writeFileSync(path, code);

path = './src/services/qa/ai/aiStats.ts';
code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'isFallback?: boolean;',
  'isFallback?: boolean;\n    fallbackReason?: string;\n    routingDecision?: string;\n    providerId?: string;\n    modelId?: string;'
);

code = code.replace(
  'isFallback = false,',
  'isFallback = false,\n        fallbackReason,\n        routingDecision,\n        providerId,\n        modelId,'
);

code = code.replace(
  'isFallback,',
  'isFallback,\n        fallbackReason,\n        routingDecision,\n        providerId,\n        modelId,'
);

fs.writeFileSync(path, code);
