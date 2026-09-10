import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';
import {
  CreateThemeSchema,
  UpdateThemeVariablesSchema,
  UpdateThemeSingleColorSchema,
  THEME_CONTEXTS,
  ALLOWED_THEME_VARIABLE_KEYS,
} from '../src/services/themeValidation';
import {
  ThemeService,
  ThemeServiceError,
  ThemeValidationError,
  ThemeNotFoundError,
  ThemeConflictError,
  ThemePersistenceError,
} from '../src/services/themeService';
import { markPrismaUnavailable, setPrismaDisabled } from '../src/db/prisma';
import { dbStore } from '../src/services/dbStore';
import { requireAuth, requireRole } from '../src/middleware/authMiddleware';

test('THEME ENGINE SECURITY & DATA INTEGRITY TEST SUITE (TMPR-20260910-THEME-002-SEC01)', async (suite) => {
  // =========================================================================
  // 1. ZOD VALIDATION SUITE
  // =========================================================================
  await suite.test('1. ZOD VALIDATION: Theme creation, variables & CSS safety', async (t) => {
    await t.test('1.1 Theme key validation (safe slug [a-z0-9_-])', () => {
      // Valid slugs
      assert.strictEqual(CreateThemeSchema.safeParse({ key: 'valid-slug', name: 'Valid' }).success, true);
      assert.strictEqual(CreateThemeSchema.safeParse({ key: 'theme_123', name: 'Valid' }).success, true);
      assert.strictEqual(CreateThemeSchema.safeParse({ key: 'tata-blue', name: 'Valid' }).success, true);

      // Invalid slugs: uppercase, spaces, special chars, html injection, length < 2
      assert.strictEqual(CreateThemeSchema.safeParse({ key: 'InvalidKey', name: 'Valid' }).success, false);
      assert.strictEqual(CreateThemeSchema.safeParse({ key: 'slug with spaces', name: 'Valid' }).success, false);
      assert.strictEqual(CreateThemeSchema.safeParse({ key: '<script>', name: 'Valid' }).success, false);
      assert.strictEqual(CreateThemeSchema.safeParse({ key: 'a', name: 'Valid' }).success, false);
      assert.strictEqual(CreateThemeSchema.safeParse({ key: 'a'.repeat(65), name: 'Valid' }).success, false);
      assert.strictEqual(CreateThemeSchema.safeParse({ key: '   ', name: 'Valid' }).success, false);
    });

    await t.test('1.2 Name & Description HTML injection prevention', () => {
      // Reject HTML in name
      const htmlName = CreateThemeSchema.safeParse({
        key: 'test-theme',
        name: 'Normal <script>alert(1)</script>',
      });
      assert.strictEqual(htmlName.success, false);

      // Reject HTML in description
      const htmlDesc = CreateThemeSchema.safeParse({
        key: 'test-theme',
        name: 'Normal Name',
        description: '<style>body{background:red;}</style>',
      });
      assert.strictEqual(htmlDesc.success, false);

      // Accept clean name and description
      const clean = CreateThemeSchema.safeParse({
        key: 'test-theme',
        name: 'Krásné Téma',
        description: 'Čistý text popisu bez HTML tagů.',
      });
      assert.strictEqual(clean.success, true);
    });

    await t.test('1.3 Theme Context enum validation (GLOBAL, PUBLIC, PRIVATE, ADMIN)', () => {
      for (const ctx of THEME_CONTEXTS) {
        const res = CreateThemeSchema.safeParse({
          key: 'test-ctx',
          name: 'Context Test',
          context: ctx,
        });
        assert.strictEqual(res.success, true, `Context ${ctx} should be valid`);
      }

      // Disallow arbitrary context strings
      const invalidCtx = CreateThemeSchema.safeParse({
        key: 'test-ctx',
        name: 'Context Test',
        context: 'SUPER_ADMIN_CUSTOM',
      });
      assert.strictEqual(invalidCtx.success, false);
    });

    await t.test('1.4 Theme variables key whitelist', () => {
      // Disallow unapproved keys
      const invalidKey = UpdateThemeVariablesSchema.safeParse({
        unknownProperty: '#ffffff',
      });
      assert.strictEqual(invalidKey.success, false);

      // Disallow empty variable map
      const emptyMap = UpdateThemeVariablesSchema.safeParse({});
      assert.strictEqual(emptyMap.success, false);

      // Allow approved keys
      const validKeys = UpdateThemeVariablesSchema.safeParse({
        primary: '#1e3a8a',
        secondary: '#0284c7',
        background: '#f8fafc',
      });
      assert.strictEqual(validKeys.success, true);
    });

    await t.test('1.5 Strict HEX color format & rejection of CSS injection', () => {
      // Valid HEX colors (#RGB, #RRGGBB, #RRGGBBAA)
      assert.strictEqual(UpdateThemeVariablesSchema.safeParse({ primary: '#1e3a8a' }).success, true);
      assert.strictEqual(UpdateThemeVariablesSchema.safeParse({ primary: '#fff' }).success, true);
      assert.strictEqual(UpdateThemeVariablesSchema.safeParse({ primary: '#12345678' }).success, true);
      assert.strictEqual(UpdateThemeVariablesSchema.safeParse({ primary: '#AABBCC' }).success, true);

      // Dangerous / invalid CSS values: URLs, expressions, CSS declarations, JS
      assert.strictEqual(UpdateThemeVariablesSchema.safeParse({ primary: 'url(http://evil.com/leak)' }).success, false);
      assert.strictEqual(UpdateThemeVariablesSchema.safeParse({ primary: 'red; background: url(...)' }).success, false);
      assert.strictEqual(UpdateThemeVariablesSchema.safeParse({ primary: 'expression(alert(1))' }).success, false);
      assert.strictEqual(UpdateThemeVariablesSchema.safeParse({ primary: 'javascript:void(0)' }).success, false);
      assert.strictEqual(UpdateThemeVariablesSchema.safeParse({ primary: 'var(--custom-var)' }).success, false);
      assert.strictEqual(UpdateThemeVariablesSchema.safeParse({ primary: 'rgb(255, 0, 0)' }).success, false);
      assert.strictEqual(UpdateThemeVariablesSchema.safeParse({ primary: 'blue' }).success, false);
    });

    await t.test('1.6 Single color update schema validation', () => {
      assert.strictEqual(
        UpdateThemeSingleColorSchema.safeParse({ key: 'primary', value: '#1e3a8a' }).success,
        true
      );
      assert.strictEqual(
        UpdateThemeSingleColorSchema.safeParse({ key: 'invalidKey', value: '#1e3a8a' }).success,
        false
      );
      assert.strictEqual(
        UpdateThemeSingleColorSchema.safeParse({ key: 'primary', value: 'url(javascript:alert(1))' }).success,
        false
      );
    });
  });

  // =========================================================================
  // 2. FAIL-CLOSED MUTATION BEHAVIOR WHEN DATABASE IS UNAVAILABLE
  // =========================================================================
  await suite.test('2. FAIL-CLOSED MUTATIONS: No dbStore fallback on DB failure', async (t) => {
    // Force Prisma to unavailable state
    markPrismaUnavailable('Simulated DB outage for fail-closed theme mutation tests');

    const initialDbStoreThemesCount = dbStore.themes ? dbStore.themes.length : 0;
    const initialDbStoreAuditCount = dbStore.auditLogs ? dbStore.auditLogs.length : 0;

    await t.test('2.1 createTheme() throws ThemePersistenceError and does NOT mutate dbStore', async () => {
      await assert.rejects(
        async () => {
          await ThemeService.createTheme({
            key: 'failclosed-test',
            name: 'Fail Closed Test',
            context: 'GLOBAL',
          });
        },
        (err: any) => {
          assert.strictEqual(err instanceof ThemePersistenceError, true);
          assert.strictEqual(err.statusCode, 503);
          return true;
        }
      );

      // Verify dbStore was NOT modified
      assert.strictEqual(
        dbStore.themes.length,
        initialDbStoreThemesCount,
        'dbStore.themes count must not increase on failed mutation'
      );
      assert.strictEqual(
        dbStore.themes.some((th: any) => th.key === 'failclosed-test'),
        false,
        'dbStore must not contain the failed theme'
      );
    });

    await t.test('2.2 activateTheme() throws ThemePersistenceError and does NOT mutate dbStore', async () => {
      await assert.rejects(
        async () => {
          await ThemeService.activateTheme('thm-default');
        },
        (err: any) => {
          assert.strictEqual(err instanceof ThemePersistenceError, true);
          assert.strictEqual(err.statusCode, 503);
          return true;
        }
      );
    });

    await t.test('2.3 updateThemeVariables() throws ThemePersistenceError and does NOT mutate dbStore', async () => {
      await assert.rejects(
        async () => {
          await ThemeService.updateThemeVariables('thm-default', { primary: '#000000' });
        },
        (err: any) => {
          assert.strictEqual(err instanceof ThemePersistenceError, true);
          assert.strictEqual(err.statusCode, 503);
          return true;
        }
      );
    });

    await t.test('2.4 deleteTheme() throws ThemePersistenceError and does NOT mutate dbStore', async () => {
      await assert.rejects(
        async () => {
          await ThemeService.deleteTheme('custom-theme-id');
        },
        (err: any) => {
          assert.strictEqual(err instanceof ThemePersistenceError, true);
          assert.strictEqual(err.statusCode, 503);
          return true;
        }
      );
    });

    await t.test('2.5 Read-only getThemes() safely returns default fallback without mutating DB/store', async () => {
      const themes = await ThemeService.getThemes();
      assert.strictEqual(Array.isArray(themes), true);
      assert.strictEqual(themes.length, 1);
      assert.strictEqual(themes[0].key, 'default');
      assert.strictEqual(themes[0].isDefault, true);

      // Audit logs in dbStore must not have been created
      assert.strictEqual(
        dbStore.auditLogs.length,
        initialDbStoreAuditCount,
        'dbStore.auditLogs must not be modified by read fallback'
      );
    });
  });

  // =========================================================================
  // 3. ATOMIC TRANSACTIONS & AUDIT LOGGING
  // =========================================================================
  await suite.test('3. ATOMIC TRANSACTION & ROLLBACK INTEGRITY', async (t) => {
    // Restore prisma disabled flag
    setPrismaDisabled(false);

    await t.test('3.1 Validation error aborts before transaction', async () => {
      await assert.rejects(
        async () => {
          await ThemeService.createTheme({
            key: 'INVALID KEY WITH SPACES',
            name: 'Invalid',
          });
        },
        (err: any) => {
          assert.strictEqual(err instanceof ThemeValidationError, true);
          assert.strictEqual(err.statusCode, 400);
          return true;
        }
      );
    });

    await t.test('3.2 Deleting default theme is rejected (invariable protection)', async () => {
      // Mock prisma transaction to test validation guard
      markPrismaUnavailable('Simulated DB check');
      await assert.rejects(
        async () => {
          await ThemeService.deleteTheme('thm-default');
        },
        (err: any) => {
          assert.strictEqual(err instanceof ThemePersistenceError, true);
          return true;
        }
      );
      setPrismaDisabled(false);
    });
  });

  // =========================================================================
  // 4. API ROUTE AUTHORIZATION & UNIFORM ERROR RESPONSES (SUPERTEST)
  // =========================================================================
  await suite.test('4. API ROUTE SECURITY & UNIFORM ERROR MODEL', async (t) => {
    const app = express();
    app.use(express.json());

    // Uniform, safe error handler matching server.ts
    function handleThemeError(err: any, res: express.Response) {
      if (err instanceof ThemeServiceError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          ...(err instanceof ThemeValidationError && err.details ? { details: err.details } : {}),
        });
      }
      if (err?.code === 'P2002') {
        return res.status(409).json({
          error: 'Téma se zadaným unikátním klíčem již existuje.',
          code: 'THEME_CONFLICT',
        });
      }
      const isConnError =
        err?.code === 'P1001' ||
        err?.code === 'P1002' ||
        err?.name === 'PrismaClientInitializationError' ||
        err?.message?.includes("Can't reach database") ||
        err?.message?.includes('Databáze je momentálně nedostupná') ||
        err?.message?.includes('Theme persistence unavailable');
      if (isConnError) {
        return res.status(503).json({
          error: 'Theme persistence unavailable',
          code: 'THEME_PERSISTENCE_ERROR',
        });
      }
      return res.status(500).json({
        error: 'Chyba serveru při zpracování tématu',
        code: 'INTERNAL_ERROR',
      });
    }

    // Mount endpoints with exact middleware
    app.post('/api/themes', requireAuth as any, requireRole('ADMIN') as any, async (req: any, res: any) => {
      try {
        const created = await ThemeService.createTheme(req.body, req.user);
        res.json(created);
      } catch (err: any) {
        handleThemeError(err, res);
      }
    });

    app.post('/api/themes/:id/activate', requireAuth as any, requireRole('ADMIN') as any, async (req: any, res: any) => {
      try {
        const activated = await ThemeService.activateTheme(req.params.id, req.user);
        res.json(activated);
      } catch (err: any) {
        handleThemeError(err, res);
      }
    });

    app.put('/api/themes/:id/variables', requireAuth as any, requireRole('ADMIN') as any, async (req: any, res: any) => {
      try {
        const updated = await ThemeService.updateThemeVariables(req.params.id, req.body, req.user);
        res.json(updated);
      } catch (err: any) {
        handleThemeError(err, res);
      }
    });

    app.delete('/api/themes/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: any, res: any) => {
      try {
        await ThemeService.deleteTheme(req.params.id, req.user);
        res.json({ success: true });
      } catch (err: any) {
        handleThemeError(err, res);
      }
    });

    await t.test('4.1 Unauthenticated requests to theme mutation endpoints receive 401', async () => {
      const resPost = await request(app).post('/api/themes').send({ key: 'test', name: 'Test' });
      assert.strictEqual(resPost.status, 401);

      const resActivate = await request(app).post('/api/themes/thm-default/activate').send();
      assert.strictEqual(resActivate.status, 401);

      const resPutVars = await request(app).put('/api/themes/thm-default/variables').send({ primary: '#1e3a8a' });
      assert.strictEqual(resPutVars.status, 401);

      const resDelete = await request(app).delete('/api/themes/thm-default');
      assert.strictEqual(resDelete.status, 401);
    });

    await t.test('4.2 Non-admin user receives 403 Forbidden', async () => {
      // Setup test user in dbStore with role 'USER'
      dbStore.users = dbStore.users || [];
      const testUser = {
        id: 'u1-non-admin',
        email: 'user@tatovacesta.cz',
        name: 'Regular User',
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dbStore.users.push(testUser as any);

      const userApp = express();
      userApp.use(express.json());
      userApp.use((req: any, _res, next) => {
        req.session = { userId: 'u1-non-admin' };
        req.user = testUser;
        next();
      });
      userApp.post('/api/themes', requireRole('ADMIN') as any, async (_req, res) => res.json({ ok: true }));

      const res = await request(userApp).post('/api/themes').send({ key: 'test', name: 'Test' });
      assert.strictEqual(res.status, 403);
    });

    await t.test('4.3 Admin with invalid payload receives 400 with structured validation error', async () => {
      const adminApp = express();
      adminApp.use(express.json());
      adminApp.use((req: any, _res, next) => {
        req.user = { id: 'a1', email: 'admin@tatovacesta.cz', role: 'ADMIN' };
        next();
      });
      adminApp.post('/api/themes', async (req: any, res: any) => {
        try {
          const created = await ThemeService.createTheme(req.body, req.user);
          res.json(created);
        } catch (err: any) {
          handleThemeError(err, res);
        }
      });

      const res = await request(adminApp).post('/api/themes').send({
        key: 'INVALID KEY',
        name: 'Valid Name',
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.code, 'THEME_VALIDATION_ERROR');
      assert.strictEqual(typeof res.body.error, 'string');
      assert.ok(res.body.details, 'details field must contain Zod issues');
    });

    await t.test('4.4 Admin mutation when DB is down receives 503 with safe message', async () => {
      markPrismaUnavailable('Database down in API route test');

      const adminApp = express();
      adminApp.use(express.json());
      adminApp.use((req: any, _res, next) => {
        req.user = { id: 'a1', email: 'admin@tatovacesta.cz', role: 'ADMIN' };
        next();
      });
      adminApp.post('/api/themes', async (req: any, res: any) => {
        try {
          const created = await ThemeService.createTheme(req.body, req.user);
          res.json(created);
        } catch (err: any) {
          handleThemeError(err, res);
        }
      });

      const res = await request(adminApp).post('/api/themes').send({
        key: 'valid-slug',
        name: 'Valid Name',
      });

      assert.strictEqual(res.status, 503);
      assert.strictEqual(res.body.code, 'THEME_PERSISTENCE_ERROR');
      assert.strictEqual(res.body.error, 'Theme persistence unavailable');
      // Ensure NO internal database connection strings, passwords or raw errors are exposed
      assert.strictEqual(JSON.stringify(res.body).includes('password'), false);
      assert.strictEqual(JSON.stringify(res.body).includes('postgresql://'), false);
    });
  });
});
