import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

test('STARTUP & DEPLOYMENT DATABASE SAFETY REGRESSION SUITE (P0)', async (t) => {
  const rootDir = process.cwd();

  await t.test('1. server.ts must NOT contain prisma db push, --accept-data-loss, or automatic seeds at startup', () => {
    const serverCode = fs.readFileSync(path.join(rootDir, 'server.ts'), 'utf8');
    assert.strictEqual(
      serverCode.includes('db push'),
      false,
      'server.ts must not contain "db push"'
    );
    assert.strictEqual(
      serverCode.includes('--accept-data-loss'),
      false,
      'server.ts must not contain "--accept-data-loss"'
    );
    assert.strictEqual(
      serverCode.includes('runSeed()'),
      false,
      'server.ts must not run automatic runSeed() at startup'
    );
    assert.strictEqual(
      serverCode.includes('seedDatabaseIfEmpty()'),
      false,
      'server.ts must not run automatic seedDatabaseIfEmpty() at startup'
    );
    assert.strictEqual(
      serverCode.includes('execSync(\'npx prisma'),
      false,
      'server.ts must not execute prisma schema mutations at runtime'
    );
  });

  await t.test('2. deploy.sh must NOT contain automatic schema mutations or db push', () => {
    const deploySh = fs.readFileSync(path.join(rootDir, 'deploy.sh'), 'utf8');
    assert.strictEqual(
      deploySh.includes('db push'),
      false,
      'deploy.sh must not contain "db push"'
    );
    assert.strictEqual(
      deploySh.includes('prisma migrate deploy'),
      false,
      'deploy.sh must not execute automatic "prisma migrate deploy"'
    );
    assert.strictEqual(
      deploySh.includes('prisma validate'),
      true,
      'deploy.sh must retain read-only "prisma validate"'
    );
  });

  await t.test('3. deploy-dev.sh must NOT contain automatic schema mutations or db push', () => {
    const deployDevSh = fs.readFileSync(path.join(rootDir, 'deploy-dev.sh'), 'utf8');
    assert.strictEqual(
      deployDevSh.includes('db push'),
      false,
      'deploy-dev.sh must not contain "db push"'
    );
    assert.strictEqual(
      deployDevSh.includes('prisma migrate deploy'),
      false,
      'deploy-dev.sh must not execute automatic "prisma migrate deploy"'
    );
    assert.strictEqual(
      deployDevSh.includes('prisma validate'),
      true,
      'deploy-dev.sh must retain read-only "prisma validate"'
    );
  });

  await t.test('4. src/routes/system.ts webhook must NOT contain schema mutations, exec, or process.exit', () => {
    const systemRoutes = fs.readFileSync(path.join(rootDir, 'src/routes/system.ts'), 'utf8');
    assert.strictEqual(
      systemRoutes.includes('db push'),
      false,
      'src/routes/system.ts must not contain "db push"'
    );
    assert.strictEqual(
      systemRoutes.includes('npx prisma migrate deploy'),
      false,
      'src/routes/system.ts must not execute "npx prisma migrate deploy"'
    );
    assert.strictEqual(
      systemRoutes.includes('process.exit'),
      false,
      'src/routes/system.ts must not call process.exit for redeploy'
    );
    assert.strictEqual(
      systemRoutes.includes('503'),
      true,
      'src/routes/system.ts must return 503 Service Unavailable for legacy redeploys'
    );
  });

  await t.test('5. No executable source files or scripts in codebase contain --accept-data-loss', () => {
    const targets = ['server.ts', 'src/routes/system.ts', 'deploy.sh', 'deploy-dev.sh', 'prisma/seed.ts'];
    for (const target of targets) {
      const fullPath = path.join(rootDir, target);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        assert.strictEqual(
          content.includes('--accept-data-loss'),
          false,
          `${target} must not contain --accept-data-loss`
        );
      }
    }
  });
});
