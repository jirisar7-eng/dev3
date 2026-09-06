import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

test('DEVOPS RELEASE PARITY & PRODUCTION SAFETY REGRESSION SUITE (P0)', async (t) => {
  const rootDir = process.cwd();

  await t.test('1. deploy-prod3.sh must exist and be safe', () => {
    const filePath = path.join(rootDir, 'deploy-prod3.sh');
    assert.strictEqual(fs.existsSync(filePath), true, 'deploy-prod3.sh must exist');

    const content = fs.readFileSync(filePath, 'utf8');
    assert.strictEqual(content.includes('db push'), false, 'deploy-prod3.sh must not contain "db push"');
    assert.strictEqual(content.includes('migrate reset'), false, 'deploy-prod3.sh must not contain "migrate reset"');
    assert.strictEqual(content.includes('down -v'), false, 'deploy-prod3.sh must not contain "down -v"');
    assert.strictEqual(content.includes('prisma migrate deploy'), false, 'deploy-prod3.sh must not contain "prisma migrate deploy"');
  });

  await t.test('2. deploy-prod3.sh must explicitly use docker-compose.prod.yml', () => {
    const filePath = path.join(rootDir, 'deploy-prod3.sh');
    const content = fs.readFileSync(filePath, 'utf8');
    
    assert.strictEqual(content.includes('docker-compose.prod.yml'), true, 'deploy-prod3.sh must use docker-compose.prod.yml');
    assert.strictEqual(content.includes('-f docker-compose.yml'), false, 'deploy-prod3.sh must NOT use standard docker-compose.yml');
    assert.strictEqual(content.includes('-f docker-compose.dev.yml'), false, 'deploy-prod3.sh must NOT use dev docker-compose.dev.yml');
  });

  await t.test('3. deploy.sh must explicitly use docker-compose.yml and contain no prod compose references', () => {
    const filePath = path.join(rootDir, 'deploy.sh');
    const content = fs.readFileSync(filePath, 'utf8');
    
    assert.strictEqual(content.includes('docker-compose.yml'), true, 'deploy.sh must use docker-compose.yml');
    assert.strictEqual(content.includes('docker-compose.prod.yml'), false, 'deploy.sh must NOT use prod docker-compose.prod.yml');
  });

  await t.test('4. All deployment scripts must implement fail-closed healthcheck verification loops', () => {
    const targets = ['deploy.sh', 'deploy-dev.sh', 'deploy-prod3.sh'];
    for (const target of targets) {
      const filePath = path.join(rootDir, target);
      const content = fs.readFileSync(filePath, 'utf8');

      assert.strictEqual(content.includes('exit 1'), true, `${target} must fail-closed with "exit 1" upon healthcheck error`);
      assert.strictEqual(content.includes('"status":"ok"'), true, `${target} must assert status:ok from health endpoint`);
    }
  });

  await t.test('5. server.ts health route must expose full release parity metadata block', () => {
    const serverCode = fs.readFileSync(path.join(rootDir, 'server.ts'), 'utf8');
    assert.strictEqual(serverCode.includes('release: {'), true, 'server.ts must return a release metadata block');
    assert.strictEqual(serverCode.includes('version:'), true, 'release block must include version');
    assert.strictEqual(serverCode.includes('gitSha:'), true, 'release block must include gitSha');
    assert.strictEqual(serverCode.includes('dockerImage:'), true, 'release block must include dockerImage');
    assert.strictEqual(serverCode.includes('dockerImageDigest:'), true, 'release block must include dockerImageDigest');
  });
});
