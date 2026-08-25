import { spawnSync } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';

console.log('--- TÁTA MÁ PRÁVO : TEST RUNNER ---');

const tests = [
  { cmd: 'node', args: ['--test', 'test/main.test.cjs'], name: 'Static & Security Integrity (PWA, Disclaimers, Auth, RBAC)' },
  { cmd: 'node', args: ['run_security_tests.cjs'], name: 'Security & Audit Integrations' },
  { cmd: 'npx', args: ['tsx', '--test', 'tests/state-admin-p1-p2.test.js'], name: 'State Administration API Hub (P1 & P2 Connectors)' },
  { cmd: 'node', args: ['scripts/test-mapa-subjektu.cjs'], name: 'Mapa Subjektů & Registr Integration' },
  { cmd: 'npx', args: ['tsx', '--test', 'tests/judgment-case-sync.test.ts'], name: 'Judgment AI Extractor -> Case Persistence Integration' },
  { cmd: 'npx', args: ['tsx', '--test', 'tests/care-occurrence-engine.test.ts'], name: 'Care Occurrence Engine & Calendar Integration' },
  { cmd: 'npx', args: ['tsx', '--test', 'tests/judgment-ai-extractor-fallback.test.ts'], name: 'AI Extractor Local PDF Fallback & Deterministic Extraction (20 Tests)' }
  , { cmd: 'npx', args: ['tsx', '--test', 'tests/branding-and-svg.test.ts'], name: 'Branding API & Secure SVG Sanitization' }
  , { cmd: 'npx', args: ['tsx', '--test', 'tests/branding-api.test.ts'], name: 'Branding API Integration' }
  , { cmd: 'npx', args: ['tsx', '--test', 'tests/prisma-fail-closed.test.ts'], name: 'Prisma Fail-Closed Security & Read-Only Fallback' }
  , { cmd: 'npx', args: ['tsx', '--test', 'tests/analytics-2-user-journey.test.ts'], name: 'Analytics 2.0 (User Journey, Funnels, Search Intelligence & Zero-PII)' }
];

let failed = false;

for (const t of tests) {
  console.log(`\n=============================================================`);
  console.log(`>>> RUNNING: ${t.name}`);
  console.log(`=============================================================`);
  
  const res = spawnSync(t.cmd, t.args, { stdio: 'inherit' });
  
  if (res.status !== 0) {
    console.error(`\n❌ [FAILED] ${t.name}`);
    failed = true;
  } else {
    console.log(`\n✅ [PASS] ${t.name}`);
  }
}

if (failed) {
  console.error('\n🚨 SOME TESTS FAILED.');
  process.exit(1);
} else {
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY.');
  process.exit(0);
}
