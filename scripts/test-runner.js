import { spawnSync } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';

console.log('--- TÁTA MÁ PRÁVO : TEST RUNNER ---');

const tests = [
  { cmd: 'node', args: ['--test', 'test/main.test.cjs'], name: 'Static & Security Integrity (PWA, Disclaimers, Auth, RBAC)' },
  { cmd: 'node', args: ['run_security_tests.cjs'], name: 'Security & Audit Integrations' },
  { cmd: 'npx', args: ['tsx', '--test', 'tests/state-admin-p1-p2.test.js'], name: 'State Administration API Hub (P1 & P2 Connectors)' },
  { cmd: 'node', args: ['scripts/test-mapa-subjektu.cjs'], name: 'Mapa Subjektů & Registr Integration' }
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
