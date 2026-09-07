const fs = require('fs');
const path = './src/services/qa/ai/synthesisMultiAIOrchestrator.ts';
let code = fs.readFileSync(path, 'utf8');

// Add import
if (!code.includes('aiModelRegistry')) {
  code = "import { aiModelRegistry } from '../../ai/aiModelRegistry';\n" + code;
}

// In callProviderWithRetry:
// change to fetch the preferred model and inject it
// Wait, SynthesisMultiAIOrchestrator currently calls providers based on their name.
// e.g. state.provider.name

code = code.replace(
  'const res = await state.provider.analyze(sanitizedPrompt, { timeoutMs });',
  `
        const route = await aiModelRegistry.getRoute({ preferredProviderKey: state.provider.name });
        const modelOverride = route ? route.modelName : undefined;
        const res = await state.provider.analyze(sanitizedPrompt, { timeoutMs, modelOverride });
        if (modelOverride) { res.model = modelOverride; }
`
);

fs.writeFileSync(path, code);
