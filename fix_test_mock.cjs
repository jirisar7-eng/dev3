const fs = require('fs');
let code = fs.readFileSync('tests/pwa-offline-sync-ui-phase22.test.ts', 'utf8');

// Fix test 9: expect PENDING instead of FAILED, and check retryCount
code = code.replace(/assert\.strictEqual\(queue\[0\]\.status, 'FAILED'\);/g, "assert.strictEqual(queue[0].status, 'PENDING');\n    assert.strictEqual(queue[0].retryCount, 1);");

// Fix test 10: return status: 'SYNCED'
code = code.replace(/return \{ data: \{ id: 'draft-1', version: 1 \} \};/g, "return { data: { id: 'draft-1', version: 1, status: 'SYNCED' } };");

fs.writeFileSync('tests/pwa-offline-sync-ui-phase22.test.ts', code);
