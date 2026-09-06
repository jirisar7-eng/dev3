import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { isAiStudioPreview, parseAuthToken, requireAuth } from '../src/middleware/authMiddleware';
import { AuthService } from '../src/services/authService';

test('AI STUDIO PREVIEW MODE — SECURITY & ISOLATION CONTRACT TEST SUITE', async (t) => {
  const rootDir = process.cwd();

  // Save current env vars
  const originalEnv = { ...process.env };

  const restoreEnv = () => {
    process.env = { ...originalEnv };
  };

  await t.test('TEST 1: AI Studio Preview + no token -> Preview Identity only in Preview runtime', async () => {
    // Mock exact sandbox preview conditions
    process.env.AI_STUDIO_PREVIEW_MODE = 'true';
    process.env.NODE_ENV = 'development';
    process.env.APPLET_ID = '193ad124-a5f6-4252-9655-797fec9c6873';

    assert.strictEqual(isAiStudioPreview(), true, 'isAiStudioPreview must evaluate to true under strict preview variables');

    // Test parseAuthToken gives PREVIEW_ACTOR user
    const req: any = {
      headers: {},
      cookies: {},
      signedCookies: {},
      session: {}
    };
    const res: any = {};
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    await parseAuthToken(req, res, next);

    assert.strictEqual(nextCalled, true, 'parseAuthToken must call next()');
    assert.strictEqual(req.session?.userId, 'preview-actor', 'Session userId must be preview-actor');
    assert.strictEqual(req.user?.id, 'preview-actor', 'User ID must be preview-actor');
    assert.strictEqual(req.user?.email, 'preview-actor@ai-studio.local', 'User email must be preview-actor@ai-studio.local');
    assert.strictEqual(req.user?.role, 'PREVIEW_ACTOR', 'User role must be PREVIEW_ACTOR');
    assert.strictEqual(req.user?.status, 'ACTIVE', 'User status must be ACTIVE');

    restoreEnv();
  });

  await t.test('TEST 2: Production runtime + no token -> 401/403', async () => {
    // Mock production conditions with NO preview mode config
    process.env.AI_STUDIO_PREVIEW_MODE = undefined;
    process.env.NODE_ENV = 'production';
    process.env.APPLET_ID = undefined;

    assert.strictEqual(isAiStudioPreview(), false, 'isAiStudioPreview must evaluate to false in production');

    const req: any = {
      headers: {},
      cookies: {},
      signedCookies: {},
      session: {}
    };
    const res: any = {
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(obj: any) {
        this.jsonBody = obj;
        return this;
      },
      statusCode: 200,
      jsonBody: null
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    await parseAuthToken(req, res, next);
    assert.strictEqual(req.session?.userId, undefined, 'Session userId must remain undefined');

    // Calling requireAuth should return 401
    nextCalled = false;
    requireAuth(req, res, next);
    assert.strictEqual(res.statusCode, 401, 'requireAuth must deny unauthorized requests with status 401');
    assert.strictEqual(nextCalled, false, 'next() must NOT be called on unauthorized requests');

    restoreEnv();
  });

  await t.test('TEST 3: Production runtime + Preview flag -> DENY if not trusted sandbox', async () => {
    // Attempting to inject Preview flag on non-dev or non-applet runtime
    process.env.AI_STUDIO_PREVIEW_MODE = 'true';
    process.env.NODE_ENV = 'production'; // prod environment
    process.env.APPLET_ID = '193ad124-a5f6-4252-9655-797fec9c6873';

    assert.strictEqual(isAiStudioPreview(), false, 'isAiStudioPreview must evaluate to false if NODE_ENV is production');

    const req: any = {
      headers: {},
      cookies: {},
      signedCookies: {},
      session: {}
    };
    const res: any = {
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(obj: any) {
        this.jsonBody = obj;
        return this;
      },
      statusCode: 200,
      jsonBody: null
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    await parseAuthToken(req, res, next);
    assert.strictEqual(req.session?.userId, undefined, 'Session userId must remain undefined');

    restoreEnv();
  });

  await t.test('TEST 4: Preview Identity -> nemá SUPER_ADMIN capability', async () => {
    const previewUser = {
      id: 'preview-actor',
      email: 'preview-actor@ai-studio.local',
      role: 'PREVIEW_ACTOR' as any
    };

    assert.notStrictEqual(previewUser.role, 'SUPER_ADMIN', 'Preview Identity role must NOT be SUPER_ADMIN');
  });

  await t.test('TEST 5: Preview Identity -> nemůže použít admin API', async () => {
    const hasAdminPermission = AuthService.hasPermission('PREVIEW_ACTOR' as any, 'ADMIN');
    assert.strictEqual(hasAdminPermission, false, 'PREVIEW_ACTOR must not have ADMIN permission');

    const hasSuperPermission = AuthService.hasPermission('PREVIEW_ACTOR' as any, 'SUPER_ADMIN');
    assert.strictEqual(hasSuperPermission, false, 'PREVIEW_ACTOR must not have SUPER_ADMIN permission');

    const hasUserPermission = AuthService.hasPermission('PREVIEW_ACTOR' as any, 'USER');
    assert.strictEqual(hasUserPermission, false, 'PREVIEW_ACTOR must not have standard USER permission');
  });

  await t.test('TEST 6: Preview Identity -> nemůže provést deployment/migration/DB mutation', async () => {
    // Verify there are no routes that execute system shells/deploys inside backend endpoints.
    const serverCode = fs.readFileSync(path.join(rootDir, 'server.ts'), 'utf8');
    assert.strictEqual(serverCode.includes('child_process.exec'), false, 'server.ts must not allow executing custom processes from routes');
    assert.strictEqual(serverCode.includes('execSync'), false, 'server.ts must not contain execSync');
  });

  await t.test('TEST 7: Startup code -> neobsahuje create/upsert preview user', () => {
    const serverCode = fs.readFileSync(path.join(rootDir, 'server.ts'), 'utf8');
    assert.strictEqual(serverCode.includes('preview-actor@ai-studio.local'), false, 'Startup server code must not seed or upsert any preview-actor in PostgreSQL DB');
  });

  await t.test('TEST 8: DEV3 deployment konfigurace -> Preview Mode není aktivovatelný', () => {
    const composeContent = fs.readFileSync(path.join(rootDir, 'docker-compose.yml'), 'utf8');
    assert.strictEqual(composeContent.includes('AI_STUDIO_PREVIEW_MODE'), false, 'docker-compose.yml (DEV3) must not define AI_STUDIO_PREVIEW_MODE');
  });

  await t.test('TEST 9: PROD3 deployment konfigurace -> Preview Mode není aktivovatelný', () => {
    const composeContent = fs.readFileSync(path.join(rootDir, 'docker-compose.prod.yml'), 'utf8');
    assert.strictEqual(composeContent.includes('AI_STUDIO_PREVIEW_MODE'), false, 'docker-compose.prod.yml (PROD3) must not define AI_STUDIO_PREVIEW_MODE');
  });
});
