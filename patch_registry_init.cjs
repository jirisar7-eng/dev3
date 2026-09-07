const fs = require('fs');
const path = './src/services/ai/aiModelRegistry.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'public async init() {\n    await this.refreshCache();\n  }',
  'public async init() {\n    await this.seedInitialCatalog();\n  }'
);

fs.writeFileSync(path, code);
