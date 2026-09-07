import assert from 'node:assert';
import { aiModelRegistry } from '../services/ai/aiModelRegistry';

async function runTests() {
  console.log('Running AI Model Registry unit tests...');

  assert.ok(aiModelRegistry, 'aiModelRegistry should be defined');
  assert.strictEqual(typeof aiModelRegistry.getCachedPricing, 'function');
  assert.strictEqual(typeof aiModelRegistry.getRoute, 'function');
  assert.strictEqual(typeof aiModelRegistry.getFallbacks, 'function');

  const route = await aiModelRegistry.getRoute({
    preferredProviderKey: 'non-existent-provider'
  });
  assert.ok(route === null || typeof route === 'object', 'getRoute should return null or object');

  console.log('AI Model Registry unit tests passed.');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
