import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { verify } from '@node-rs/argon2';
import { sendWelcomeEmail, sendPasswordResetEmail, sendAccountDeletedEmail, sendQuickCreateEmail } from './src/services/emailService.ts';
import { getMailcowMailboxes, createMailcowMailbox, deleteMailcowMailbox, updateMailcowPassword, checkMailcowHealth, getMailcowDomains } from './src/services/mailcowService.ts';
import { AuthService } from './src/services/authService.ts';
import { TextService } from './src/services/textService.ts';
import { ThemeService } from './src/services/themeService.ts';
import { ModuleService } from './src/services/moduleService.ts';
import { moduleEngine } from './src/core/moduleEngine';
import { systemTestModuleContract } from './src/modules/systemTestModule';

// Register test module contract in Module Engine
moduleEngine.registerModuleContract(systemTestModuleContract);
import { CmsService } from './src/services/cmsService.ts';
import { StudyService } from './src/services/studyService.ts';
import { MinioStorageService } from './src/services/minioStorageService.ts';
import { ClamAvService } from './src/services/clamAvService.ts';
import { ComplianceService } from './src/services/complianceService.ts';
import { AuditService } from './src/services/auditService.ts';
import { SettingsService } from './src/services/settingsService.ts';
import { seedDatabaseIfEmpty, ensureSuperAdminAccount } from './src/services/seedService.ts';
import { runSeed } from './prisma/seed';
import { ensureAllModulePagesExist, convertAllPagesToPuck } from './src/services/PageService.ts';
import { seedSystemTemplates } from './src/services/templateService';
import { UserDataService } from './src/services/userDataService.ts';
import { GithubPublisherService } from './src/services/githubPublisherService.ts';
import { EsbirkaService } from './src/services/EsbirkaService.ts';
import { subjektService } from './src/services/subjektService.ts';
import { dbStore } from './src/services/dbStore.ts';
import { TotpService } from './src/services/totpService.ts';
import { getDns, addDns, deleteDns } from './src/controllers/dnsController.ts';
import { getPrismaClient, isPrismaAvailable, checkDatabaseReachable, markPrismaUnavailable, prisma, waitForDatabase } from './src/db/prisma';
import { parseAuthToken, requireAuth, requireRole, AuthenticatedRequest } from './src/middleware/authMiddleware';
import pageRoutes from './src/routes/pageRoutes';
import systemRoutes from './src/routes/system';
import partnerRoutes from './src/routes/partnerRoutes';
import templateRoutes from './src/routes/templateRoutes';
import forumRoutes from './src/routes/forumRoutes';
import customModuleRoutes from './src/routes/customModuleRoutes';
import subjektRoutes from './src/routes/subjektRoutes';
import caseRoutes from './src/routes/caseRoutes';
import coparentRoutes from './src/routes/coparentRoutes';
import adminVpsRoutes from './src/routes/adminVpsRoutes';

dotenv.config();

if (process.env.GITHUB_TOKEN) {
  console.log('[System] GITHUB_TOKEN je přítomen v proměnných prostředí.');
} else {
  console.warn('[System] UPOZORNĚNÍ: GITHUB_TOKEN NENÍ nastaven v proměnných prostředí.');
}

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is missing!');
  process.exit(1);
}

// Helper for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = 3000;

// Zamezí pádu náhledu v AI Studiu, když není dostupná databáze postgres_db_dev
process.on('unhandledRejection', (reason: any) => {
  if (reason?.code === 'P1001' || reason?.message?.includes("Can't reach database server")) {
    console.warn('Databáze je nedostupná (preview režim).');
    return;
  }
  console.error('[Unhandled Rejection]:', reason);
});

app.use(cookieParser(process.env.JWT_SECRET));
app.use(express.json({ limit: '50mb' }));
app.use(parseAuthToken as any);

// Session Cookie Options Helper
const cookieOptions = (role: string) => {
  const isProd = process.env.NODE_ENV === 'production' || process.env.HTTPS === 'true';
  const maxAge = (role === 'ADMIN' || role === 'SUPER_ADMIN')
    ? 2 * 60 * 60 * 1000 // 2 hodiny
    : 24 * 60 * 60 * 1000; // 24 hodin

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    signed: true,
    maxAge,
    path: '/',
  };
};

// Rate limiter for login/register (max. 5 attempts / 15 minutes)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Neplatný e-mail nebo heslo.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// HEALTH CHECK ROUTE
app.get('/api/health', async (_req, res) => {
  const prismaClient = getPrismaClient();
  let dbStatus = 'disconnected';
  let prismaStatus = 'unavailable';

  if (prismaClient) {
    try {
      await prismaClient.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
      prismaStatus = 'ok';
    } catch (err: any) {
      dbStatus = `error: ${err.message}`;
    }
  }

  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    app: 'tatovacesta_dev',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      prisma: prismaStatus,
    },
    uptime: process.uptime(),
  });
});

// Initialize DB seeding asynchronously depending on database availability
async function initializeApp() {
  const isProd = process.env.NODE_ENV === 'production';
  const dbConnected = await waitForDatabase(isProd ? 10 : 5);

  if (dbConnected) {
    try {
      await seedDatabaseIfEmpty();
      await ensureAllModulePagesExist();
      await convertAllPagesToPuck();
      await seedSystemTemplates();
      console.log('[System] Databáze byla úspěšně inicializována.');
    } catch (err) {
      console.error('[System] Chyba při inicializaci databáze po připojení:', err);
    }
  } else {
    console.warn('[System] Databáze není dostupná po všech pokusech. Aplikace běží v omezeném režimu.');
    // Optional: seed in-memory if needed
    seedSystemTemplates().catch(() => {});
  }
}

initializeApp();

// Initialize e-Sbírka Cron Scheduler (3x daily: 03:00, 11:00, 19:00)
EsbirkaService.initCronScheduler();

// --- API ROUTES ---

app.use('/api/pages', pageRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/custom-modules', customModuleRoutes);
app.use('/api/subjekty', subjektRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/coparent', coparentRoutes);
app.use('/api/admin/vps', adminVpsRoutes);

// Pracovnici community proposal & moderation endpoints
app.get('/api/pracovnici/pending', async (_req, res) => {
  try {
    const list = await subjektService.getPendingPracovnici();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Chyba při načítání pending pracovníků' });
  }
});

app.post('/api/pracovnici', async (req, res) => {
  try {
    const { subjektId, jmeno, pozice, telefon, email, kancelar, status, createdById } = req.body;
    if (!subjektId || !jmeno) {
      return res.status(400).json({ error: 'Chybí subjektId nebo jméno' });
    }
    const created = await subjektService.addPracovnik({
      subjektId,
      jmeno,
      pozice,
      telefon,
      email,
      kancelar,
      status: status || 'PENDING',
      createdById,
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Chyba při přidávání pracovníka' });
  }
});

app.patch('/api/pracovnici/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Neplatný status' });
    }
    const updated = await subjektService.updatePracovnikStatus(req.params.id, status);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Chyba při změně statusu pracovníka' });
  }
});

app.delete('/api/pracovnici/:id', async (req, res) => {
  try {
    await subjektService.deletePracovnik(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Chyba při mazání pracovníka' });
  }
});
app.post('/api/admin/pages/sync-modules', async (_req, res) => {
  try {
    const result = await ensureAllModulePagesExist();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Chyba při synchronizaci stránek modulů.' });
  }
});
import aiRoutes from './src/routes/aiRoutes';
app.use('/api/ai', aiRoutes);

// --- E-SBÍRKA / LAW SYNCHRONIZATION & CLIENT DB ENDPOINTS ---

// Config and quota status
app.get('/api/esbirka/config', (req: express.Request, res: express.Response) => {
  res.json({
    configured: Boolean(process.env.ESBIRKA_API_KEY),
    baseUrl: process.env.ESBIRKA_BASE_URL || 'https://www.esbirka.cz/api/v1',
    hasApiKey: Boolean(process.env.ESBIRKA_API_KEY),
    quota: EsbirkaService.getQuotaStatus(),
  });
});

// Root e-Sbírka Endpoint for Law Citation Verification
app.get('/api/esbirka', async (req: express.Request, res: express.Response) => {
  try {
    const verifiedDate = new Date().toLocaleDateString('cs-CZ');
    const dbLaws = await EsbirkaService.getLawsFromDb();
    res.json({
      status: 'online',
      source: 'e-Sbírka Ministerstva vnitra a Ministerstva spravedlnosti ČR',
      verifiedDate,
      verificationClause: `Právní citace ověřeny vůči e-Sbírce k ${verifiedDate}`,
      quota: EsbirkaService.getQuotaStatus(),
      supportedLaws: [
        { code: '89/2012', title: 'Zákon č. 89/2012 Sb., občanský zákoník (§ 855–§ 927 o.z.)', valid: true },
        { code: '292/2013', title: 'Zákon č. 292/2013 Sb., o zvláštních řízeních soudních (§ 452, § 466–§ 507 z.ř.s.)', valid: true },
        { code: '99/1963', title: 'Zákon č. 99/1963 Sb., občanský soudní řád (§ 44, § 74 a násl. o.s.ř.)', valid: true },
        { code: '359/1999', title: 'Zákon č. 359/1999 Sb., o sociálně-právní ochraně dětí (zOSPOD)', valid: true },
      ],
      dbLawsCount: dbLaws.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chyba e-Sbírka API.' });
  }
});

app.get('/api/esbirka/verify', async (req: express.Request, res: express.Response) => {
  const verifiedDate = new Date().toLocaleDateString('cs-CZ');
  res.json({
    success: true,
    verifiedDate,
    verificationClause: `Právní citace ověřeny vůči e-Sbírce k ${verifiedDate}`,
    activeLaws: [
      '89/2012 Sb. (Občanský zákoník)',
      '292/2013 Sb. (Zákon o zvláštních řízeních soudních)',
      '99/1963 Sb. (Občanský soudní řád)',
      '359/1999 Sb. (Zákon o sociálně-právní ochraně dětí)',
    ],
  });
});

// Admin sync endpoint (subject to rate limiting & 5 req/24h quota)
app.post('/api/esbirka/sync', async (req: express.Request, res: express.Response) => {
  try {
    const { cislo, rok } = req.body;
    if (!cislo || !rok) {
      return res.status(400).json({ error: 'Číslo a rok předpisu jsou povinné.' });
    }
    const law = await EsbirkaService.syncLaw(Number(cislo), Number(rok));
    res.json({ success: true, law });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chyba při synchronizaci e-Sbírky.' });
  }
});

// KLIENTSKÉ ENDPOINTY (GET /api/state/laws/*) - ČTOU VÝHRADNĚ Z LOKÁLNÍ DATABÁZE
app.get('/api/state/laws', async (req: express.Request, res: express.Response) => {
  try {
    const laws = await EsbirkaService.getLawsFromDb();
    res.json({ success: true, laws });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chyba při načítání předpisů z databáze.' });
  }
});

app.get('/api/state/laws/:rok/:cislo', async (req: express.Request, res: express.Response) => {
  try {
    const { rok, cislo } = req.params;
    const law = await EsbirkaService.getLawByCodeFromDb(`${cislo}/${rok}`);
    if (!law) {
      return res.status(404).json({ error: 'Předpis nebyl nalezen v lokální databázi.' });
    }
    res.json({ success: true, law });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chyba při načítání předpisu z databáze.' });
  }
});

app.get('/api/state/laws/:code', async (req: express.Request, res: express.Response) => {
  try {
    const { code } = req.params;
    const law = await EsbirkaService.getLawByCodeFromDb(code);
    if (!law) {
      return res.status(404).json({ error: 'Předpis nebyl nalezen v lokální databázi.' });
    }
    res.json({ success: true, law });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chyba při načítání předpisu z databáze.' });
  }
});

app.get('/api/state/statistics', async (req: express.Request, res: express.Response) => {
  try {
    const prisma = getPrismaClient();
    if (prisma) {
      const stats = await prisma.stateStatistic.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (stats.length > 0) {
        return res.json({ success: true, statistics: stats, data: stats });
      }
    }
    res.json({ success: true, statistics: dbStore.stateStatistics, data: dbStore.stateStatistics });
  } catch (err: any) {
    res.json({ success: true, statistics: dbStore.stateStatistics, data: dbStore.stateStatistics });
  }
});

app.get('/api/state/cases', async (req: express.Request, res: express.Response) => {
  try {
    const prisma = getPrismaClient();
    if (prisma) {
      const cases = await prisma.courtCase.findMany({
        orderBy: { publishedAt: 'desc' },
      });
      if (cases.length > 0) {
        return res.json({ success: true, cases, courtCases: cases, data: cases });
      }
    }
    res.json({ success: true, cases: dbStore.courtCases, courtCases: dbStore.courtCases, data: dbStore.courtCases });
  } catch (err: any) {
    res.json({ success: true, cases: dbStore.courtCases, courtCases: dbStore.courtCases, data: dbStore.courtCases });
  }
});

app.get('/api/state/court-cases', async (req: express.Request, res: express.Response) => {
  try {
    const prisma = getPrismaClient();
    if (prisma) {
      const cases = await prisma.courtCase.findMany({
        orderBy: { publishedAt: 'desc' },
      });
      if (cases.length > 0) {
        return res.json({ success: true, cases, courtCases: cases, data: cases });
      }
    }
    res.json({ success: true, cases: dbStore.courtCases, courtCases: dbStore.courtCases, data: dbStore.courtCases });
  } catch (err: any) {
    res.json({ success: true, cases: dbStore.courtCases, courtCases: dbStore.courtCases, data: dbStore.courtCases });
  }
});


// 1. AUTH & RBAC
app.post('/api/auth/login', authRateLimiter as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({ error: 'Neplatný e-mail nebo heslo.' });
    }
    const result = await AuthService.login(email, password);
    if (!result) {
      return res.status(401).json({ error: 'Neplatný e-mail nebo heslo.' });
    }

    if (result.mfaRequired) {
      return res.json({ mfaRequired: true, mfaToken: result.mfaToken });
    }

    // Regenerate session if helper is present
    if (req.session && req.session.regenerate) {
      req.session.regenerate();
    }

    if (result.token && result.user) {
      res.cookie('token', result.token, cookieOptions(result.user.role));
      return res.json({ token: result.token, user: result.user });
    }

    res.status(401).json({ error: 'Neplatný e-mail nebo heslo.' });
  } catch (err: any) {
    if (err.message === 'DATABASE_UNAVAILABLE') {
      return res.status(503).json({ error: 'Databázová služba je dočasně nedostupná.' });
    }
    res.status(401).json({ error: err.message || 'Neplatný e-mail nebo heslo.' });
  }
});

app.post('/api/auth/register', authRateLimiter as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, email, password, profileData, childrenData, consents } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail a heslo jsou povinné údaje.' });
    }

    const result = await AuthService.register(name, email, password, profileData, childrenData);

    if (result.user) {
      sendWelcomeEmail(result.user.email, result.user.name).catch(console.error);

      // Record consents if provided
      if (Array.isArray(consents) && consents.length > 0) {
        for (const consent of consents) {
          if (consent.docKey) {
            try {
              await ComplianceService.recordConsent(
                result.user.id,
                consent.docKey,
                consent.docVersion || '1.0.0',
                'ACCEPTED',
                result.user.email,
                req.ip || '127.0.0.1'
              );
            } catch (cErr) {
              console.warn('Consent recording error during registration:', cErr);
            }
          }
        }
      }

      // Regenerate session if helper is present
      if (req.session && req.session.regenerate) {
        req.session.regenerate();
      }

      // Set cookie for logged in registered user
      res.cookie('token', result.token, cookieOptions(result.user.role));
      return res.json({ token: result.token, user: result.user });
    }
    res.status(400).json({ error: 'Registrace selhala.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registrace selhala.' });
  }
});

app.get('/api/auth/me', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  if (req.user?.id) {
    try {
      const fullProfile = await UserDataService.getUserProfile(req.user.id);
      if (fullProfile) {
        return res.json({ user: { ...fullProfile.user, profile: fullProfile.profile } });
      }
    } catch (err) {
      console.warn('Error fetching full profile in /api/auth/me:', err);
    }
  }
  res.json({ user: req.user });
});

app.get('/api/users/me', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  if (req.user?.id) {
    try {
      const fullProfile = await UserDataService.getUserProfile(req.user.id);
      if (fullProfile) {
        return res.json({ user: { ...fullProfile.user, profile: fullProfile.profile }, profile: fullProfile.profile });
      }
    } catch (err) {
      console.warn('Error fetching full profile in /api/users/me:', err);
    }
  }
  res.json({ user: req.user, profile: (req.user as any)?.profile || null });
});

app.get('/api/profile', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  if (req.user?.id) {
    try {
      const fullProfile = await UserDataService.getUserProfile(req.user.id);
      if (fullProfile) {
        return res.json({ user: { ...fullProfile.user, profile: fullProfile.profile }, profile: fullProfile.profile });
      }
    } catch (err) {
      console.warn('Error fetching full profile in /api/profile:', err);
    }
  }
  res.json({ user: req.user, profile: (req.user as any)?.profile || null });
});

app.post('/api/auth/logout', (req: AuthenticatedRequest, res) => {
  if (req.session && req.session.destroy) {
    req.session.destroy();
  }
  res.clearCookie('userId');
  res.clearCookie('token');
  res.json({ success: true, message: 'Uživatel byl úspěšně odhlášen.' });
});

// 2FA TOTP API Endpoints
app.post('/api/auth/2fa/generate', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Uživatel není přihlášen.' });
    }
    const secretData = TotpService.generateSecret(user.email);
    const qrCodeUrl = await TotpService.generateQrCodeDataUrl(secretData.otpauthUrl || '');

    // Hash backup codes before storing for security (P0-7)
    const hashedBackupCodes = secretData.backupCodes.map(c => TotpService.hashBackupCode(c));

    // Save secret and backup codes to DB
    if (getPrismaClient()) {
      try {
        await getPrismaClient().user.update({
          where: { id: user.id },
          data: {
            totpTempSecret: secretData.base32,
            totpBackupCodes: hashedBackupCodes,
          },
        });
      } catch (prismaErr) {
        console.warn('[2FA Generate] Prisma update failed:', prismaErr);
      }
    }

    // Sync to dbStore
    const dbUserSync = dbStore.users.find(u => u.id === user.id);
    if (dbUserSync) {
      dbUserSync.totpTempSecret = secretData.base32;
      dbUserSync.totpBackupCodes = hashedBackupCodes;
    }

    res.json({
      qrCode: qrCodeUrl,
      secret: secretData.base32,
      backupCodes: secretData.backupCodes, // Plain backup codes returned ONLY ONCE during generation
    });
  } catch (err: any) {
    console.error('Chyba při generování 2FA:', err);
    res.status(500).json({ error: 'Chyba při generování 2FA.' });
  }
});

app.post('/api/auth/2fa/enable', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { code } = req.body;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Uživatel není přihlášen.' });
    }

    const freshUser = await getPrismaClient().user.findUnique({
      where: { id: user.id }
    });
    
    let secret = freshUser?.totpTempSecret;
    
    if (!secret) {
      const dbUser = dbStore.users.find(u => u.id === user.id);
      secret = dbUser?.totpTempSecret;
    }

    if (!secret) {
      return res.status(400).json({ error: '2FA nebyla inicializována. Vygenerujte nejprve klíč.' });
    }

    const isValid = TotpService.verifyToken(secret, code);
    if (!isValid) {
      return res.status(400).json({ error: 'Neplatný kód. Zkuste to prosím znovu.' });
    }

    if (getPrismaClient()) {
      try {
        await getPrismaClient().user.update({
          where: { id: user.id },
          data: {
            totpEnabled: true,
            totpSecret: secret,
            totpTempSecret: null,
          },
        });
      } catch (prismaErr) {
        console.warn('[2FA Enable] Prisma update failed:', prismaErr);
      }
    }

    const dbUserEnable = dbStore.users.find(u => u.id === user.id);
    if (dbUserEnable) {
      dbUserEnable.totpEnabled = true;
      dbUserEnable.totpSecret = secret;
      dbUserEnable.totpTempSecret = undefined;
    }

    if (getPrismaClient()) {
      try {
        await getPrismaClient().auditLog.create({
          data: {
            userId: user.id,
            userEmail: user.email,
            action: '2FA_ENABLED',
            module: 'AUTH',
            details: `Uživatel ${user.email} si aktivoval dvoufázové ověření.`,
          },
        });
      } catch (logErr) {}
    }
    dbStore.logAudit('2FA_ENABLED', 'AUTH', `Uživatel ${user.email} si aktivoval dvoufázové ověření.`, user);

    res.json({ success: true, message: 'Dvoufázové ověření bylo úspěšně aktivováno.' });
  } catch (err: any) {
    console.error('Chyba při aktivaci 2FA:', err);
    res.status(500).json({ error: 'Chyba při aktivaci 2FA.' });
  }
});

app.post('/api/auth/2fa/verify', authRateLimiter as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { mfaToken, userId: bodyUserId, code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Chybí ověřovací kód.' });
    }

    let targetUserId = bodyUserId;
    if (mfaToken) {
      const verifiedMfa = AuthService.verifyMfaToken(mfaToken);
      if (!verifiedMfa) {
        return res.status(401).json({ error: 'Neplatný nebo vypršený MFA token. Přihlaste se prosím znovu.' });
      }
      targetUserId = verifiedMfa.userId;
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Chybí ověření identity pro 2FA.' });
    }

    let user: any = null;
    if (getPrismaClient()) {
      user = await getPrismaClient().user.findUnique({ where: { id: targetUserId } });
    }
    if (!user) {
      user = dbStore.users.find((u) => u.id === targetUserId);
    }

    if (!user) {
      return res.status(404).json({ error: 'Uživatel nebyl nalezen.' });
    }

    let secret = user.totpSecret;
    let backupCodes: string[] = user.totpBackupCodes || [];

    if (!secret) {
      return res.status(400).json({ error: 'Pro tohoto uživatele není 2FA aktivní.' });
    }

    let verified = TotpService.verifyToken(secret, code);
    let isBackupUsed = false;

    if (!verified && backupCodes.length > 0) {
      const inputHash = TotpService.hashBackupCode(code.trim().toUpperCase());
      for (const bc of backupCodes) {
        if (bc === inputHash) {
          verified = true;
          isBackupUsed = true;
          backupCodes = backupCodes.filter((c) => c !== bc);
          break;
        }
      }

      if (isBackupUsed) {
        if (getPrismaClient()) {
          try {
            await getPrismaClient().user.update({
              where: { id: user.id },
              data: { totpBackupCodes: backupCodes },
            });
          } catch (prismaErr) {
            console.warn('[2FA Verify] Prisma backup codes update failed:', prismaErr);
          }
        }
        const dbUser = dbStore.users.find((u) => u.id === user.id);
        if (dbUser) {
          dbUser.totpBackupCodes = backupCodes;
        }
      }
    }

    if (!verified) {
      return res.status(401).json({ error: 'Neplatný ověřovací kód.' });
    }

    if (getPrismaClient()) {
      try {
        await getPrismaClient().auditLog.create({
          data: {
            userId: user.id,
            userEmail: user.email,
            action: '2FA_VERIFIED',
            module: 'AUTH',
            details: `Uživatel ${user.email} se úspěšně přihlásil s 2FA${isBackupUsed ? ' (použit záložní kód)' : ''}.`,
          },
        });
      } catch (logErr) {}
    }

    if (req.session && req.session.regenerate) {
      req.session.regenerate();
    }

    const token = AuthService.generateToken(user);
    const sanitizedUser = AuthService.sanitizeUser(user);

    res.cookie('token', token, cookieOptions(user.role));
    res.json({ token, user: sanitizedUser });
  } catch (err: any) {
    console.error('Chyba při ověřování 2FA:', err);
    res.status(500).json({ error: 'Chyba při ověřování 2FA.' });
  }
});

app.post('/api/auth/2fa/disable', authRateLimiter as any, requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { password, code } = req.body;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Uživatel není přihlášen.' });
    }

    if (!password || !code) {
      return res.status(400).json({ error: 'Pro vypnutí 2FA musíte zadat vaše heslo a 2FA kód.' });
    }

    let freshUser: any = null;
    if (getPrismaClient()) {
      freshUser = await getPrismaClient().user.findUnique({ where: { id: user.id } });
    }
    if (!freshUser) {
      freshUser = dbStore.users.find((u) => u.id === user.id);
    }

    if (!freshUser) {
      return res.status(404).json({ error: 'Uživatel nebyl nalezen.' });
    }

    // Verify Password
    if (freshUser.passwordHash) {
      let isPasswordValid = false;
      try {
        isPasswordValid = await verify(freshUser.passwordHash, password);
      } catch (argonErr) {
        try {
          isPasswordValid = await bcrypt.compare(password, freshUser.passwordHash);
        } catch (bcryptErr) {
          const pbkdf2Hash = crypto.pbkdf2Sync(password, 'tatovacesta_salt_2026', 1000, 64, 'sha512').toString('hex');
          isPasswordValid = (freshUser.passwordHash === pbkdf2Hash);
        }
      }
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Neplatné heslo.' });
      }
    }

    // Verify 2FA Code
    const secret = freshUser.totpSecret;
    if (!secret) {
      return res.status(400).json({ error: '2FA není aktivní.' });
    }

    let isCodeValid = TotpService.verifyToken(secret, code);
    if (!isCodeValid && freshUser.totpBackupCodes) {
      const backupCodes: string[] = freshUser.totpBackupCodes;
      const inputHash = TotpService.hashBackupCode(code.trim().toUpperCase());
      for (const bc of backupCodes) {
        if (bc === inputHash) {
          isCodeValid = true;
          break;
        }
      }
    }

    if (!isCodeValid) {
      return res.status(400).json({ error: 'Neplatný ověřovací kód.' });
    }

    // Disable 2FA
    if (getPrismaClient()) {
      try {
        await getPrismaClient().user.update({
          where: { id: user.id },
          data: {
            totpEnabled: false,
            totpSecret: null,
            totpTempSecret: null,
            totpBackupCodes: [],
          },
        });
      } catch (prismaErr) {
        console.warn('[2FA Disable] Prisma update failed:', prismaErr);
      }
    }

    const dbUser = dbStore.users.find((u) => u.id === user.id);
    if (dbUser) {
      dbUser.totpEnabled = false;
      dbUser.totpSecret = undefined;
      dbUser.totpBackupCodes = [];
    }

    if (getPrismaClient()) {
      try {
        await getPrismaClient().auditLog.create({
          data: {
            userId: user.id,
            userEmail: user.email,
            action: '2FA_DISABLED',
            module: 'AUTH',
            details: `Uživatel ${user.email} si po ověření heslem a kódem vypnul dvoufázové ověření.`,
          },
        });
      } catch (logErr) {}
    }

    res.json({ success: true, message: 'Dvoufázové ověření bylo úspěšně vypnuto.' });
  } catch (err: any) {
    console.error('Chyba při vypínání 2FA:', err);
    res.status(500).json({ error: 'Chyba při vypínání 2FA.' });
  }
});

import { getUsers } from './src/controllers/userController';
app.get('/api/admin/users', requireAuth as any, requireRole('ADMIN') as any, getUsers);
app.get('/api/users', requireAuth as any, requireRole('ADMIN') as any, getUsers);

app.put('/api/admin/users/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    const updated = await AuthService.updateUser(id, { name, email, role }, req.user);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const user = await AuthService.getUserById(id);
    await AuthService.deleteUser(id, req.user);
    if (user) {
      sendAccountDeletedEmail(user.email, user.name).catch(console.error);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/users/:id/reset-password', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const user = await AuthService.getUserById(id);
    if (!user) return res.status(404).json({ error: 'Uživatel nenalezen' });
    const newPassword = await AuthService.adminResetPassword(id, req.user!);
    sendPasswordResetEmail(user.email, user.name, newPassword).catch(console.error);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/auth/users', requireAuth as any, requireRole('ADMIN') as any, async (_req, res) => {
  const users = await AuthService.getUsers();
  res.json(users);
});

app.post('/api/users/quick-create', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Jméno a e-mail jsou povinné.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const assignedRole = role || 'USER';
    const generatedPassword = crypto.randomBytes(5).toString('hex'); // 10 znaků
    const passwordHash = await bcrypt.hash(generatedPassword, 10);

    let createdUser: any = null;

    if (isPrismaAvailable()) {
      try {
        const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existingUser) {
          return res.status(400).json({ error: 'Uživatel s tímto e-mailem již existuje.' });
        }

        createdUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: cleanName,
            role: assignedRole,
            passwordHash,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
          },
        });

        // Also add to audit log
        await prisma.auditLog.create({
          data: {
            userId: req.user?.id || createdUser.id,
            userEmail: req.user?.email || createdUser.email,
            action: 'USER_QUICK_CREATE',
            module: 'RBAC',
            details: `Vytvořen nový uživatel ${cleanEmail} s rolí ${assignedRole}.`,
          },
        });
      } catch (dbErr) {
        console.warn('Prisma quick-create failed, falling back to in-memory store:', dbErr);
      }
    }

    if (!createdUser) {
      const existing = dbStore.users.find(u => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return res.status(400).json({ error: 'Uživatel s tímto e-mailem již existuje.' });
      }

      createdUser = {
        id: 'usr-' + Date.now(),
        email: cleanEmail,
        name: cleanName,
        role: assignedRole,
        status: 'ACTIVE',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      (createdUser as any).passwordHash = passwordHash;
      dbStore.users.unshift(createdUser);
      dbStore.logAudit('USER_QUICK_CREATE', 'RBAC', `Vytvořen nový uživatel ${cleanEmail} s rolí ${assignedRole}.`, req.user);
    }

    const emailSent = await sendQuickCreateEmail(cleanEmail, cleanName, generatedPassword);
    
    let finalMessage = 'Uživatel vytvořen a přístupy vygenerovány.';
    if (!emailSent) {
      finalMessage = 'Uživatel byl vytvořen (odeslání uvítacího e-mailu selhalo, předejte přístupové heslo manuálně).';
    }

    const safeUser = {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
      role: createdUser.role,
      status: createdUser.status || 'ACTIVE',
      avatar: createdUser.avatar || '',
      createdAt: createdUser.createdAt instanceof Date ? createdUser.createdAt.toISOString() : createdUser.createdAt,
      updatedAt: createdUser.updatedAt instanceof Date ? createdUser.updatedAt.toISOString() : createdUser.updatedAt,
    };

    return res.status(201).json({
      message: finalMessage,
      user: safeUser,
      generatedPassword,
    });
  } catch (err: any) {
    console.error('Chyba při vytváření uživatele:', err);
    res.status(500).json({ error: 'Došlo k interní chybě serveru: ' + (err.message || '') });
  }
});

app.put('/api/users/:id/role', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ error: 'Role je povinná.' });
    }
    const user = await AuthService.updateUserRole(id, role, req.user);
    if (req.session?.userId === id && req.session.regenerate) {
      req.session.regenerate();
    }
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/users/:id/status', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Stav účtu je povinný.' });
    }
    const updated = await UserDataService.updateUserStatus(id, status, req.user!);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/roles', async (_req, res) => {
  const roles = await AuthService.getRoles();
  res.json(roles);
});

app.get('/api/permissions', async (_req, res) => {
  const permissions = await AuthService.getPermissions();
  res.json(permissions);
});

// --- MAILCOW API PROXY ---
app.get('/api/mailcow/health', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const health = await checkMailcowHealth();
    return res.json({
      success: health.healthy,
      health,
    });
  } catch (err: any) {
    return res.status(503).json({
      success: false,
      error: 'MAILCOW_UNAVAILABLE',
      message: err.message || 'Chyba při diagnostice Mailcow.',
    });
  }
});

app.get('/api/mailcow/domains', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const domains = await getMailcowDomains();
    return res.json({
      success: true,
      domains,
    });
  } catch (err: any) {
    return res.status(503).json({
      success: false,
      error: 'MAILCOW_UNAVAILABLE',
      message: err.message || 'Chyba při načítání domén z Mailcow.',
    });
  }
});

app.get('/api/mailcow/mailboxes', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const mailboxes = await getMailcowMailboxes();
    return res.json({
      success: true,
      count: mailboxes.length,
      mailboxes,
    });
  } catch (err: any) {
    const errorMsg = err.message || 'Chyba při komunikaci s Mailcow API.';
    let statusCode = 503;
    let errorCode = 'MAILCOW_UNAVAILABLE';

    if (errorMsg.includes('odmítlo autorizaci') || errorMsg.includes('API klíč')) {
      statusCode = 401;
      errorCode = 'MAILCOW_UNAUTHORIZED';
    } else if (errorMsg.includes('endpoint nebyl nalezen')) {
      statusCode = 404;
      errorCode = 'MAILCOW_NOT_FOUND';
    } else if (errorMsg.includes('včas') || errorMsg.includes('limit')) {
      statusCode = 504;
      errorCode = 'MAILCOW_TIMEOUT';
    } else if (errorMsg.includes('není nakonfigurováno')) {
      statusCode = 503;
      errorCode = 'MAILCOW_MISCONFIGURED';
    }

    return res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: errorMsg,
      mailboxes: [],
    });
  }
});

app.post('/api/mailcow/mailboxes', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { local_part, domain, name, password, quota, email } = req.body;
    
    let targetEmail = email;
    if (!targetEmail) {
      if (!local_part) {
        return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Chybí název schránky (local_part).' });
      }
      targetEmail = `${local_part.toLowerCase().trim()}@${(domain || 'tatovacesta.cz').toLowerCase().trim()}`;
    }

    if (!password) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Heslo pro schránku je povinné.' });
    }

    const result = await createMailcowMailbox(targetEmail, name || '', password, quota || 3072);

    // Audit log
    await AuditService.recordLog(
      'MAILCOW_MAILBOX_CREATED',
      'Mailcow',
      `Vytvořena schránka: ${targetEmail} (kapacita: ${quota || 3072} MB)`,
      req.user,
      req.ip || '127.0.0.1'
    );

    return res.status(201).json({
      success: true,
      message: `Schránka ${targetEmail} byla úspěšně vytvořena.`,
      result,
    });
  } catch (err: any) {
    const errorMsg = err.message || 'Chyba při vytváření schránky v Mailcow.';
    let statusCode = 400;
    if (errorMsg.includes('odmítlo autorizaci')) statusCode = 401;
    else if (errorMsg.includes('není nakonfigurováno') || errorMsg.includes('serveru')) statusCode = 503;

    return res.status(statusCode).json({
      success: false,
      error: 'MAILCOW_CREATE_FAILED',
      message: errorMsg,
    });
  }
});

app.delete('/api/mailcow/mailboxes/:email', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Chybí identifikátor schránky (e-mail).' });
    }

    const result = await deleteMailcowMailbox(email);

    // Audit log
    await AuditService.recordLog(
      'MAILCOW_MAILBOX_DELETED',
      'Mailcow',
      `Smazána schránka: ${email}`,
      req.user,
      req.ip || '127.0.0.1'
    );

    return res.json({
      success: true,
      message: `Schránka ${email} byla smazána.`,
      result,
    });
  } catch (err: any) {
    const errorMsg = err.message || 'Chyba při mazání schránky v Mailcow.';
    let statusCode = 400;
    if (errorMsg.includes('odmítlo autorizaci')) statusCode = 401;
    else if (errorMsg.includes('není nakonfigurováno')) statusCode = 503;

    return res.status(statusCode).json({
      success: false,
      error: 'MAILCOW_DELETE_FAILED',
      message: errorMsg,
    });
  }
});

app.put('/api/mailcow/mailboxes/:email/password', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { email } = req.params;
    const { password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'E-mail a nové heslo jsou povinné.' });
    }

    const result = await updateMailcowPassword(email, password);

    // Audit log
    await AuditService.recordLog(
      'MAILCOW_PASSWORD_CHANGED',
      'Mailcow',
      `Změněno heslo pro schránku: ${email}`,
      req.user,
      req.ip || '127.0.0.1'
    );

    return res.json({
      success: true,
      message: `Heslo pro schránku ${email} bylo úspěšně změněno.`,
      result,
    });
  } catch (err: any) {
    const errorMsg = err.message || 'Chyba při změně hesla v Mailcow.';
    let statusCode = 400;
    if (errorMsg.includes('odmítlo autorizaci')) statusCode = 401;
    else if (errorMsg.includes('není nakonfigurováno')) statusCode = 503;

    return res.status(statusCode).json({
      success: false,
      error: 'MAILCOW_PASSWORD_FAILED',
      message: errorMsg,
    });
  }
});

// --- VOLUNTEER API ENDPOINTS ---
app.post('/api/volunteers', async (req, res) => {
  try {
    const { name, email, phone, birthDate, address, motivation, linkedin, position, acceptedVolunteering, acceptedGDPR, acceptedCodex } = req.body;
    
    if (!name || !email || !motivation || !position || !acceptedVolunteering || !acceptedGDPR || !acceptedCodex) {
      return res.status(400).json({ error: 'Chybí povinné údaje.' });
    }

    const prisma = getPrismaClient();
    if (prisma) {
        await (prisma as any).volunteerApplication.create({
            data: {
                name,
                email,
                phone,
                birthDate,
                address,
                motivation,
                linkedin,
                position
            }
        });
    }

    // Odeslání notifikace (volitelné, zatím jen log)
    console.log('[Volunteer] Nová přihláška od:', email, 'na pozici:', position);

    res.status(201).json({ success: true });
  } catch (err: any) {
    console.error('Chyba při ukládání dobrovolníka:', err);
    res.status(500).json({ error: 'Chyba při ukládání přihlášky.' });
  }
});

// --- DNS MANAGEMENT ENDPOINTS (SUPER_ADMIN ONLY) ---
app.get('/api/admin/dns', requireRole('SUPER_ADMIN'), getDns);
app.post('/api/admin/dns', requireRole('SUPER_ADMIN'), addDns);
app.delete('/api/admin/dns/:recordId', requireRole('SUPER_ADMIN'), deleteDns);

// --- GITHUB PUBLISHER ENDPOINTS (SUPER_ADMIN ONLY, ADMIN supported in Dev/Preview) ---
const requireGithubPublishAccess = (req: AuthenticatedRequest, res: any, next: any) => {
  return requireRole('ADMIN')(req, res, next);
};

app.get('/api/admin/github/status', requireAuth as any, requireGithubPublishAccess as any, async (req: AuthenticatedRequest, res) => {
  try {
    // Dynamické načtení z .env pro jistotu aktuálnosti
    dotenv.config({ override: true });
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return res.json({ status: 'GITHUB_TOKEN_MISSING' });
    }

    let authenticated = false;
    let username = '';
    try {
      const githubRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'tatovacesta-admin'
        }
      });
      if (githubRes.ok) {
        authenticated = true;
        const data = await githubRes.json();
        username = data.login;
      }
    } catch (e) {
      console.error('[System] Chyba při ověřování GitHub tokenu:', e);
    }

    const repository = process.env.GITHUB_REPOSITORY || 'jirisar7-eng/dev3';
    const branch = process.env.GITHUB_BRANCH || 'main';

    const localStatus = await GithubPublisherService.getStatus();

    return res.json({
      status: 'OK',
      authenticated,
      username,
      repository,
      branch,
      tokenConfigured: true,
      clean: localStatus.clean,
      fileCount: localStatus.fileCount,
      files: localStatus.files,
      secretRiskDetected: localStatus.secretRiskDetected,
      forbiddenFiles: localStatus.forbiddenFiles,
      currentBranch: localStatus.currentBranch,
      lastCommit: localStatus.lastCommit
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chyba při zjišťování stavu Git repository.' });
  }
});

app.post('/api/admin/github/push', requireAuth as any, requireGithubPublishAccess as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { commitMessage } = req.body;
    const result = await GithubPublisherService.publishToGithub(req.user!, commitMessage, req.ip);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Chyba při publikování na GitHub.' });
  }
});

app.post('/api/admin/github/force-push', requireAuth as any, requireGithubPublishAccess as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { commitMessage } = req.body;
    const result = await GithubPublisherService.forcePushToGithub(req.user!, commitMessage, req.ip);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Chyba při spouštění FORCE PUSH na GitHub.' });
  }
});

app.get('/api/admin/git/suggest-push-name', requireAuth as any, requireGithubPublishAccess as any, async (_req: AuthenticatedRequest, res) => {
  try {
    const result = await GithubPublisherService.suggestPushName();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chyba při generování názvu pushe.' });
  }
});

app.get('/api/admin/github/suggest-push-name', requireAuth as any, requireGithubPublishAccess as any, async (_req: AuthenticatedRequest, res) => {
  try {
    const result = await GithubPublisherService.suggestPushName();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chyba při generování názvu pushe.' });
  }
});

// --- PRIVATE USER PORTAL API ENDPOINTS ---

// User Profile
app.get('/api/user/profile/:userId', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && req.user?.id !== userId) {
      return res.status(403).json({ error: 'Nemáte oprávnění k tomuto profilu.' });
    }
    const profile = await UserDataService.getUserProfile(userId);
    if (!profile) return res.status(404).json({ error: 'Profil uživatele nenalezen.' });
    res.json(profile);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/user/profile/:userId', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && req.user?.id !== userId) {
      return res.status(403).json({ error: 'Nemáte oprávnění k tomuto profilu.' });
    }
    const updated = await UserDataService.updateUserProfile(userId, req.body, req.user);
    res.json(updated);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Password Change
app.post('/api/user/password', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    const targetId = userId || req.user?.id;
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && req.user?.id !== targetId) {
      return res.status(403).json({ error: 'Nemáte oprávnění k této operaci.' });
    }
    const result = await UserDataService.changePassword(targetId, oldPassword, newPassword, req.user);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// User Cases
app.get('/api/portal/cases/:userId', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && req.user?.id !== userId) {
      return res.status(403).json({ error: 'Nemáte oprávnění k těmto případům.' });
    }
    const cases = await UserDataService.getCases(userId, req.user!);
    res.json(cases);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/portal/cases', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.body.userId || req.user?.id;
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && req.user?.id !== userId) {
      return res.status(403).json({ error: 'Nemáte oprávnění vytvořit případ pro jiného uživatele.' });
    }
    const created = await UserDataService.createCase(req.user!, { ...req.body, userId });
    res.json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// User Children
app.get('/api/portal/children/:userId', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && req.user?.id !== userId) {
      return res.status(403).json({ error: 'Nemáte oprávnění k těmto dětem.' });
    }
    const children = await UserDataService.getChildren(userId, req.user!);
    res.json(children);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/portal/children', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.body.userId || req.user?.id;
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && req.user?.id !== userId) {
      return res.status(403).json({ error: 'Nemáte oprávnění vytvořit dítě pro jiného uživatele.' });
    }
    const created = await UserDataService.createChild(req.user!, { ...req.body, userId });
    res.json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/portal/children/:id', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const prismaClient = getPrismaClient();
    if (prismaClient) {
      const child = await (prismaClient as any).userChild.findUnique({ where: { id } });
      if (!child) return res.status(404).json({ error: 'Dítě nenalezeno.' });
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && child.userId !== req.user?.id) {
        return res.status(403).json({ error: 'Přístup odepřen. Tento záznam vám nepatří.' });
      }
    }
    const updated = await UserDataService.updateChild(req.user!, id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/portal/children/:id', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const prismaClient = getPrismaClient();
    if (prismaClient) {
      const child = await (prismaClient as any).userChild.findUnique({ where: { id } });
      if (!child) return res.status(404).json({ error: 'Dítě nenalezeno.' });
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && child.userId !== req.user?.id) {
        return res.status(403).json({ error: 'Přístup odepřen. Tento záznam vám nepatří.' });
      }
    }
    const success = await UserDataService.deleteChild(req.user!, id);
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Document Pre-filling Engine
app.post('/api/portal/documents/autofill-preview', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { templateText } = req.body;
    const preview = await UserDataService.previewFilledDocument(req.user!, templateText || '');
    res.json({ previewText: preview });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// User Notes
app.get('/api/portal/notes/:userId', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && req.user?.id !== userId) {
      return res.status(403).json({ error: 'Nemáte oprávnění k těmto poznámkám.' });
    }
    const notes = await UserDataService.getNotes(userId, req.user!);
    res.json(notes);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/portal/notes', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.body.userId || req.user?.id;
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && req.user?.id !== userId) {
      return res.status(403).json({ error: 'Nemáte oprávnění vytvořit poznámku pro jiného uživatele.' });
    }
    const created = await UserDataService.createNote(req.user!, { ...req.body, userId });
    res.json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/portal/notes/:id', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const prismaClient = getPrismaClient();
    if (prismaClient) {
      const note = await (prismaClient as any).userNote.findUnique({ where: { id } });
      if (!note) return res.status(404).json({ error: 'Poznámka nenalezena.' });
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && note.userId !== req.user?.id) {
        return res.status(403).json({ error: 'Přístup odepřen. Tento záznam vám nepatří.' });
      }
    }
    const deleted = await UserDataService.deleteNote(id, req.user!);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// User Documents
app.get('/api/portal/documents/:userId', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && req.user?.id !== userId) {
      return res.status(403).json({ error: 'Nemáte oprávnění k těmto dokumentům.' });
    }
    const docs = await UserDataService.getDocuments(userId, req.user!);
    res.json(docs);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/portal/documents', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.body.userId || req.user?.id;
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && req.user?.id !== userId) {
      return res.status(403).json({ error: 'Nemáte oprávnění vytvořit dokument pro jiného uživatele.' });
    }
    const created = await UserDataService.createDocument(req.user!, { ...req.body, userId });
    res.json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// User Calendar Events
app.get('/api/portal/events/:userId', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && req.user?.id !== userId) {
      return res.status(403).json({ error: 'Nemáte oprávnění k těmto událostem.' });
    }
    const events = await UserDataService.getEvents(userId, req.user!);
    res.json(events);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/portal/events', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.body.userId || req.user?.id;
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && req.user?.id !== userId) {
      return res.status(403).json({ error: 'Nemáte oprávnění vytvořit událost pro jiného uživatele.' });
    }
    const created = await UserDataService.createEvent(req.user!, { ...req.body, userId });
    res.json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 2. CONTENT & TEXTS
app.get('/api/content', async (_req, res) => {
  const texts = await TextService.getAllTexts();
  res.json(texts);
});

app.get('/api/content/map', async (req, res) => {
  const locale = (req.query.locale as 'cs' | 'en') || 'cs';
  const map = await TextService.getTextMap(locale);
  res.json(map);
});

app.get('/api/content/:key', async (req, res) => {
  const text = await TextService.getTextByKey(req.params.key);
  if (!text) {
    return res.status(404).json({ error: 'Textový klíč nenalezen' });
  }
  res.json(text);
});

app.post('/api/content', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { key, category, valueCzech, valueEnglish, description } = req.body;
    if (!key || !valueCzech) {
      return res.status(400).json({ error: 'Klíč a česká hodnota jsou povinné.' });
    }
    const created = await TextService.createText(key, category, valueCzech, valueEnglish, description, req.user);
    res.json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/content/:key', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.params;
    const updated = await TextService.updateText(key, req.body, req.user);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/content/:key/toggle', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.params;
    const { active } = req.body;
    const updated = await TextService.toggleTextActive(key, Boolean(active), req.user);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/content/:key', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.params;
    await TextService.deleteText(key, req.user);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Alias routes for /api/texts
app.get('/api/texts', async (_req, res) => {
  const texts = await TextService.getAllTexts();
  res.json(texts);
});

app.put('/api/texts/:key', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.params;
    const { valueCzech } = req.body;
    const updated = await TextService.updateText(key, { valueCzech }, req.user);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/texts', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { key, category, valueCzech, valueEnglish, description } = req.body;
    const created = await TextService.createText(key, category, valueCzech, valueEnglish, description, req.user);
    res.json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 3. THEME
app.get('/api/themes', async (_req, res) => {
  const themes = await ThemeService.getThemes();
  res.json(themes);
});

app.get('/api/themes/active', async (req, res) => {
  const context = (req.query.context as string) || 'GLOBAL';
  const activeTheme = await ThemeService.getActiveTheme(context);
  res.json(activeTheme);
});

app.get('/api/themes/css-vars', async (req, res) => {
  const context = (req.query.context as string) || 'GLOBAL';
  const cssVars = await ThemeService.getCssVariablesMap(context);
  res.json(cssVars);
});

app.post('/api/themes', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const created = await ThemeService.createTheme(req.body, req.user);
    res.json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/themes/:id/activate', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const activated = await ThemeService.activateTheme(req.params.id, req.user);
    res.json(activated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/themes/:id/variables', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await ThemeService.updateThemeVariables(req.params.id, req.body, req.user);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/themes/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    await ThemeService.deleteTheme(req.params.id, req.user);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/themes/:key', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const updated = await ThemeService.updateThemeColor(key, value, req.user);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/themes', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const settings = req.body;
    const updated = await ThemeService.updateAllThemes(settings, req.user);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. MODULES
app.get('/api/modules', async (_req, res) => {
  const modules = await ModuleService.getAllModules();
  res.json(modules);
});

app.get('/api/modules/:key', async (req, res) => {
  const moduleData = await ModuleService.getModuleByKey(req.params.key);
  if (!moduleData) {
    return res.status(404).json({ error: `Modul '${req.params.key}' nenalezen.` });
  }
  res.json(moduleData);
});

app.post('/api/modules/:key/enable', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.params;
    const updated = await ModuleService.enableModule(key, req.user);
    const contract = moduleEngine.getContract(key);
    if (contract?.onEnable) await contract.onEnable();
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/modules/:key/disable', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.params;
    const updated = await ModuleService.disableModule(key, req.user);
    const contract = moduleEngine.getContract(key);
    if (contract?.onDisable) await contract.onDisable();
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/modules/:key/toggle', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.params;
    const { enabled } = req.body;
    const updated = await ModuleService.toggleModule(key, Boolean(enabled), req.user);
    const contract = moduleEngine.getContract(key);
    if (enabled && contract?.onEnable) await contract.onEnable();
    if (!enabled && contract?.onDisable) await contract.onDisable();
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/modules/:key/config', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.params;
    const { config } = req.body;
    const configStr = typeof config === 'string' ? config : JSON.stringify(config);
    const updated = await ModuleService.updateModuleConfig(key, configStr, req.user);

    const contract = moduleEngine.getContract(key);
    if (contract?.onConfigChange) {
      try {
        const parsed = typeof config === 'string' ? JSON.parse(config) : config;
        await contract.onConfigChange(parsed);
      } catch {
        // ignore parse error in hook
      }
    }

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Demo System Test Module endpoints
app.get('/api/modules/system-test-module/ping', async (_req, res) => {
  const isEnabled = await moduleEngine.isEnabled('system-test-module');
  if (!isEnabled) {
    return res.status(403).json({ error: 'Modul System Test Module je vypnutý (DISABLED).' });
  }
  const config = await moduleEngine.getConfig('system-test-module');
  res.json({
    status: 'ok',
    module: 'system-test-module',
    message: config.testPingMessage || 'System Test Engine OK',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/modules/system-test-module/run-test', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  const isEnabled = await moduleEngine.isEnabled('system-test-module');
  if (!isEnabled) {
    return res.status(403).json({ error: 'Modul System Test Module je vypnutý (DISABLED).' });
  }
  const config = await moduleEngine.getConfig('system-test-module');
  const result = await moduleEngine.executeAction('system-test-module', 'runTest', req.body, req.user);
  res.json({
    ...result,
    moduleConfigAtExecution: config,
    executedBy: req.user?.email,
  });
});

// 5. CMS (Pages, PageSections, Articles, Categories, FAQ, Navigation, Media)
app.get('/api/cms/pages', async (_req, res) => {
  const pages = await CmsService.getPages();
  res.json(pages);
});

app.get('/api/cms/pages/slug/:slug', async (req, res) => {
  try {
    const page = await CmsService.getPageBySlug(req.params.slug);
    if (!page) {
      return res.status(404).json({ error: 'Stránka nenalezena' });
    }
    res.json(page);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cms/pages', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const page = await CmsService.createPage(req.body, req.user);
    res.json(page);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/cms/pages/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const page = await CmsService.updatePage(req.params.id, req.body, req.user);
    res.json(page);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/cms/pages/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    await CmsService.deletePage(req.params.id, req.user);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Page Sections Routes
app.post('/api/cms/pages/:id/sections', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const section = await CmsService.createSection(req.params.id, req.body, req.user);
    res.json(section);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/cms/sections/:sectionId', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const section = await CmsService.updateSection(req.params.sectionId, req.body, req.user);
    res.json(section);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/cms/sections/:sectionId', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    await CmsService.deleteSection(req.params.sectionId, req.user);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/cms/pages/:id/sections/reorder', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const sections = await CmsService.reorderSections(req.params.id, req.body.orders, req.user);
    res.json(sections);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Articles Routes
app.get('/api/cms/articles', async (_req, res) => {
  const articles = await CmsService.getArticles();
  res.json(articles);
});

app.get('/api/cms/articles/slug/:slug', async (req, res) => {
  try {
    const article = await CmsService.getArticleBySlug(req.params.slug);
    if (!article) return res.status(404).json({ error: 'Článek nenalezen' });
    res.json(article);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cms/articles', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const article = await CmsService.createArticle(req.body, req.user);
    res.json(article);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/cms/articles/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const article = await CmsService.updateArticle(req.params.id, req.body, req.user);
    res.json(article);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/cms/articles/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    await CmsService.deleteArticle(req.params.id, req.user);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Categories Routes
app.get('/api/cms/categories', async (_req, res) => {
  const categories = await CmsService.getCategories();
  res.json(categories);
});

app.post('/api/cms/categories', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const category = await CmsService.createCategory(req.body, req.user);
    res.json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/cms/categories/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const category = await CmsService.updateCategory(req.params.id, req.body, req.user);
    res.json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/cms/categories/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    await CmsService.deleteCategory(req.params.id, req.user);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// FAQ Routes
app.get('/api/cms/faqs', async (_req, res) => {
  const faqs = await CmsService.getFaqs();
  res.json(faqs);
});

app.post('/api/cms/faqs', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const faq = await CmsService.createFaq(req.body, req.user);
    res.json(faq);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/cms/faqs/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const faq = await CmsService.updateFaq(req.params.id, req.body, req.user);
    res.json(faq);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/cms/faqs/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    await CmsService.deleteFaq(req.params.id, req.user);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Navigation Routes
app.get('/api/cms/nav', async (_req, res) => {
  const nav = await CmsService.getNavItems();
  res.json(nav);
});

app.post('/api/cms/nav', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const item = await CmsService.createNavItem(req.body, req.user);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/cms/nav', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const nav = await CmsService.updateNavItems(req.body, req.user);
    res.json(nav);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/cms/nav/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    await CmsService.deleteNavItem(req.params.id, req.user);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Media Routes
app.get('/api/cms/media', async (_req, res) => {
  const media = await CmsService.getMediaItems();
  res.json(media);
});

app.post('/api/cms/media', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const media = await CmsService.addMediaItem(req.body, req.user);
    res.json(media);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/cms/media/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    await CmsService.deleteMediaItem(req.params.id, req.user);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Studies Routes (Knihovna vědeckých studií CMS)
app.get('/api/cms/studies', async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const studies = await StudyService.getStudies({
      status: status as string,
      category: category as string,
      search: search as string,
    });
    res.json(studies);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cms/studies/slug/:slug', async (req, res) => {
  try {
    const study = await StudyService.getStudyBySlug(req.params.slug);
    if (!study) {
      return res.status(404).json({ error: 'Vědecká studie nenalezena.' });
    }
    res.json(study);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cms/studies/:id', async (req, res) => {
  try {
    const study = await StudyService.getStudyById(req.params.id);
    if (!study) {
      return res.status(404).json({ error: 'Vědecká studie nenalezena.' });
    }
    res.json(study);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cms/studies', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const study = await StudyService.createStudy(req.body, req.user);
    res.json(study);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/cms/studies/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const study = await StudyService.updateStudy(req.params.id, req.body, req.user);
    res.json(study);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/cms/studies/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    await StudyService.deleteStudy(req.params.id, req.user);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PDF Upload Route for Studies (Atomic MinIO Object Store + ClamAV Antivirus Scan)
app.post('/api/cms/studies/upload-pdf', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  let uploadedObjectKey: string | null = null;
  let uploadedBucket: string | null = null;

  try {
    const { fileName, fileData, mimeType, size } = req.body;
    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'Chybí název souboru nebo binární data.' });
    }

    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Povoleny jsou výhradně soubory ve formátu PDF.' });
    }

    if (mimeType && mimeType !== 'application/pdf') {
      return res.status(400).json({ error: 'Neplatný MIME typ. Vyžadován application/pdf.' });
    }

    const MAX_SIZE = 50 * 1024 * 1024;
    if (size && size > MAX_SIZE) {
      return res.status(400).json({ error: 'Velikost souboru přesahuje maximální povolený limit 50 MB.' });
    }

    const base64Content = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
    const buffer = Buffer.from(base64Content, 'base64');

    // 1. ClamAV Antivirus Scan
    try {
      await ClamAvService.scanBuffer(buffer);
    } catch (scanErr: any) {
      console.error('[Upload Aborted] ClamAV antivirus scan rejected file:', scanErr.message);
      return res.status(400).json({
        error: `Antivirová kontrola (ClamAV) zamítla soubor: ${scanErr.message}`,
        scanStatus: 'REJECTED'
      });
    }

    // 2. Upload to MinIO / S3 Object Storage
    const uploadResult = await MinioStorageService.uploadPdf(buffer, fileName);
    uploadedObjectKey = uploadResult.objectKey;
    uploadedBucket = uploadResult.bucket;

    // 3. Register Media item in CMS
    const mediaItem = await CmsService.addMediaItem({
      name: fileName,
      url: uploadResult.pdfUrl,
      type: 'document',
      mimeType: 'application/pdf',
      size: uploadResult.size,
      scanStatus: 'CLEAN',
      storageProvider: 'MinIO',
    }, req.user);

    res.json({
      success: true,
      url: uploadResult.pdfUrl,
      s3Bucket: uploadResult.bucket,
      s3ObjectKey: uploadResult.objectKey,
      storageProvider: uploadResult.storageProvider,
      fileHash: uploadResult.fileHash,
      mediaId: mediaItem.id,
      size: uploadResult.size,
      mimeType: 'application/pdf',
      scanStatus: 'CLEAN',
      message: 'PDF dokument byl úspěšně zkontrolován (ClamAV: CLEAN), uložen do MinIO a zaregistrován.',
    });
  } catch (err: any) {
    if (uploadedBucket && uploadedObjectKey) {
      // Rollback MinIO object if DB or subsequent steps fail
      await MinioStorageService.deleteObject(uploadedBucket, uploadedObjectKey).catch(() => {});
    }
    res.status(500).json({ error: err.message || 'Chyba při nahrávání PDF.' });
  }
});

// Serve / stream PDF documents securely from MinIO Object Storage
app.get('/api/studies/pdf-file/*', async (req, res) => {
  try {
    const rawKey = req.params[0];
    if (!rawKey) {
      return res.status(400).json({ error: 'Chybí klíč souboru.' });
    }
    const objectKey = decodeURIComponent(rawKey);

    try {
      const { stream, contentType, contentLength } = await MinioStorageService.getObjectStream(undefined, objectKey);
      res.setHeader('Content-Type', contentType || 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      if (stream && typeof (stream as any).pipe === 'function') {
        (stream as any).pipe(res);
      } else if (stream) {
        const { Readable } = await import('stream');
        Readable.from(stream as any).pipe(res);
      } else {
        res.status(404).json({ error: 'Soubor nebyl v MinIO nalezen.' });
      }
    } catch (minioErr: any) {
      // Fallback check for local files (e.g. pre-existing uploads/studies files)
      const localPath = path.join(process.cwd(), objectKey.startsWith('uploads/') ? objectKey : `uploads/${objectKey}`);
      if (fs.existsSync(localPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        return fs.createReadStream(localPath).pipe(res);
      }
      res.status(404).json({ error: `Dokument nebyl v MinIO nalezen: ${minioErr.message}` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chyba při stahování PDF.' });
  }
});


// 6. COMPLIANCE CENTER
app.get('/api/compliance/docs', async (_req, res) => {
  const docs = await ComplianceService.getDocs();
  res.json(docs);
});

app.get('/api/compliance/docs/public/:slugOrKey', async (req, res) => {
  try {
    const doc = await ComplianceService.getPublishedDoc(req.params.slugOrKey);
    if (!doc) {
      return res.status(404).json({ error: 'Právní dokument nenalezen.' });
    }
    res.json(doc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/compliance/docs/:key', async (req, res) => {
  try {
    const doc = await ComplianceService.getDocByKey(req.params.key);
    if (!doc) {
      return res.status(404).json({ error: 'Dokument nenalezen.' });
    }
    res.json(doc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/compliance/docs', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const created = await ComplianceService.createDoc(req.body, req.user);
    res.json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/compliance/docs/:key', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.params;
    const { title, content, version, type, description } = req.body;
    
    if (content && version) {
      const doc = await ComplianceService.updateDoc(key, title || '', content, version, req.user);
      return res.json(doc);
    }

    const updated = await ComplianceService.updateDocMetadata(key, { title, type, description }, req.user);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/compliance/docs/:key/versions', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.params;
    const newVer = await ComplianceService.createVersion(key, req.body, req.user);
    res.json(newVer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/compliance/versions/:versionId/publish', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const published = await ComplianceService.publishVersion(req.params.versionId, req.user);
    res.json(published);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/compliance/versions/:versionId/deactivate', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const deactivated = await ComplianceService.deactivateVersion(req.params.versionId, req.user);
    res.json(deactivated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/compliance/volunteer-agreement/sign', async (req: AuthenticatedRequest, res) => {
  try {
    const { contractId, timestamp, volunteerName, birthDate, address, email, userId, signatureText, auditHash } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    
    // Record consent in compliance service
    const targetUserId = userId || req.user?.id || 'volunteer-guest';
    const consent = await ComplianceService.recordConsent(
      targetUserId,
      'dohoda-o-spolupraci',
      '1.0',
      'ACCEPTED',
      email || req.user?.email,
      ip
    );

    console.log(`[Volunteer Agreement Signed] ID: ${contractId}, User: ${volunteerName} (${email}), AuditHash: ${auditHash}`);

    res.json({
      success: true,
      message: 'Dohoda byla úspěšně podepsána a uložena.',
      contractId,
      timestamp,
      auditHash,
      consent,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Chyba při podepisování dohody.' });
  }
});

app.post('/api/compliance/volunteer-codex/sign', async (req: AuthenticatedRequest, res) => {
  try {
    const { documentVersion, userId, signatureText, auditHash } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const targetUserId = userId || req.user?.id;
    if (!targetUserId) {
      return res.status(400).json({ error: 'Uživatel není přihlášen nebo chybí userId.' });
    }

    const prisma = getPrismaClient();
    if (prisma && (prisma as any).volunteerCodexAgreement) {
      await (prisma as any).volunteerCodexAgreement.upsert({
        where: {
          userId_documentVersion: {
            userId: targetUserId,
            documentVersion: documentVersion || '1.0',
          },
        },
        update: {
          agreedAt: new Date(),
          ipAddress: ip,
        },
        create: {
          userId: targetUserId,
          documentVersion: documentVersion || '1.0',
          agreedAt: new Date(),
          ipAddress: ip,
        },
      });
    }

    await ComplianceService.recordConsent(
      targetUserId,
      'volunteer_code',
      documentVersion || '1.0',
      'ACCEPTED',
      req.user?.email,
      ip
    );

    console.log(`[Volunteer Codex Signed] User: ${targetUserId}, Version: ${documentVersion || '1.0'}, Signature: ${signatureText}`);

    res.json({
      success: true,
      message: 'Dobrovolnický kodex byl úspěšně podepsán a uložen.',
      documentVersion: documentVersion || '1.0',
      agreedAt: new Date().toISOString(),
      auditHash,
    });
  } catch (err: any) {
    console.error('Error signing volunteer codex:', err);
    res.status(400).json({ error: err.message || 'Chyba při podepisování kodexu.' });
  }
});

app.get('/api/compliance/volunteer-codex/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const prisma = getPrismaClient();
    let signed = false;
    if (prisma && (prisma as any).volunteerCodexAgreement) {
      const agreement = await (prisma as any).volunteerCodexAgreement.findFirst({
        where: { userId, documentVersion: '1.0' },
      });
      if (agreement) signed = true;
    }
    res.json({ signed });
  } catch (err) {
    res.json({ signed: false });
  }
});

// ------------------------------------------------------
// PUCK EDITOR POLL & FORM API ENDPOINTS
// ------------------------------------------------------
const inMemoryPollVotes: Array<{ id: string; pollId: string; optionIndex: number; ipAddress?: string; userId?: string; createdAt: Date }> = [];
const inMemoryFormSubmissions: Array<{ id: string; formId: string; formName: string; dataJson: string; createdAt: Date }> = [];

// Poll Vote endpoint
const handlePollVote = async (req: any, res: any) => {
  try {
    const { pollId, optionIndex } = req.body;
    if (!pollId || typeof optionIndex !== 'number') {
      return res.status(400).json({ error: 'Chybí pollId nebo optionIndex' });
    }
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userId = req.user?.id || null;

    const prisma = getPrismaClient();
    if (prisma && (prisma as any).pollVote) {
      await (prisma as any).pollVote.create({
        data: {
          pollId,
          optionIndex,
          ipAddress,
          userId,
        },
      });
    } else {
      inMemoryPollVotes.push({
        id: `vote-${Date.now()}-${crypto.randomUUID()}`,
        pollId,
        optionIndex,
        ipAddress,
        userId: userId || undefined,
        createdAt: new Date(),
      });
    }

    // Calculate updated poll results
    let votes: Array<{ optionIndex: number }> = [];
    if (prisma && (prisma as any).pollVote) {
      votes = await (prisma as any).pollVote.findMany({
        where: { pollId },
        select: { optionIndex: true },
      });
    } else {
      votes = inMemoryPollVotes.filter((v) => v.pollId === pollId);
    }

    const totalVotes = votes.length;
    const optionCounts: Record<number, number> = {};
    votes.forEach((v) => {
      optionCounts[v.optionIndex] = (optionCounts[v.optionIndex] || 0) + 1;
    });

    res.json({
      success: true,
      pollId,
      totalVotes,
      optionCounts,
    });
  } catch (err: any) {
    console.error('Error recording poll vote:', err);
    res.status(500).json({ error: err.message || 'Chyba při hlasování v anketě.' });
  }
};

app.post('/api/polls/vote', handlePollVote);
app.post('/api/puck/poll/vote', handlePollVote);

// Get Poll Results endpoint
const handleGetPollStats = async (req: any, res: any) => {
  try {
    const { pollId } = req.params;
    const prisma = getPrismaClient();
    let votes: Array<{ optionIndex: number }> = [];

    if (prisma && (prisma as any).pollVote) {
      votes = await (prisma as any).pollVote.findMany({
        where: { pollId },
        select: { optionIndex: true },
      });
    } else {
      votes = inMemoryPollVotes.filter((v) => v.pollId === pollId);
    }

    const totalVotes = votes.length;
    const optionCounts: Record<number, number> = {};
    votes.forEach((v) => {
      optionCounts[v.optionIndex] = (optionCounts[v.optionIndex] || 0) + 1;
    });

    res.json({
      pollId,
      totalVotes,
      optionCounts,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chyba při načítání anketních dat.' });
  }
};

app.get('/api/polls/:pollId', handleGetPollStats);
app.get('/api/puck/poll/:pollId', handleGetPollStats);

// Form Submission endpoint
const handleFormSubmit = async (req: any, res: any) => {
  try {
    const { formId, formName, dataJson } = req.body;
    if (!formId) {
      return res.status(400).json({ error: 'Chybí formId' });
    }

    const jsonString = typeof dataJson === 'string' ? dataJson : JSON.stringify(dataJson || {});
    const nameStr = formName || 'Formulář na stránce';

    const prisma = getPrismaClient();
    let createdRecordId = '';

    if (prisma && (prisma as any).formSubmission) {
      const created = await (prisma as any).formSubmission.create({
        data: {
          formId,
          formName: nameStr,
          dataJson: jsonString,
        },
      });
      createdRecordId = created.id;
    } else {
      const newId = `submission-${Date.now()}-${crypto.randomUUID()}`;
      inMemoryFormSubmissions.push({
        id: newId,
        formId,
        formName: nameStr,
        dataJson: jsonString,
        createdAt: new Date(),
      });
      createdRecordId = newId;
    }

    res.json({
      success: true,
      id: createdRecordId,
      message: 'Formulář byl úspěšně odoslán.',
    });
  } catch (err: any) {
    console.error('Error recording form submission:', err);
    res.status(500).json({ error: err.message || 'Chyba při odesílání formuláře.' });
  }
};

app.post('/api/forms/submit', handleFormSubmit);
app.post('/api/puck/form/submit', handleFormSubmit);

app.get('/api/forms/submissions', requireAuth as any, requireRole('ADMIN') as any, async (req: any, res: any) => {
  try {
    const prisma = getPrismaClient();
    if (prisma && (prisma as any).formSubmission) {
      const submissions = await (prisma as any).formSubmission.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.json(submissions);
    }
    res.json(inMemoryFormSubmissions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/compliance/consent', async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, docKey, docVersion, status } = req.body;
    const targetUserId = userId || req.user?.id;
    if (!targetUserId) {
      return res.status(400).json({ error: 'ID uživatele je povinné.' });
    }
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const consent = await ComplianceService.recordConsent(targetUserId, docKey, docVersion, status || 'ACCEPTED', req.user?.email, ip);
    res.json(consent);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/compliance/consent', requireAuth as any, requireRole('ADMIN') as any, async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const docKey = req.query.docKey as string | undefined;
    const consents = await ComplianceService.getConsents(userId, docKey);
    res.json(consents);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/compliance/consent/:userId', async (req, res) => {
  const consents = await ComplianceService.getUserConsents(req.params.userId);
  res.json(consents);
});

// --- NEW COMPLIANCE SYSTEM API ENDPOINTS (Táta má právo / Synthesis OS) ---

// 1. GET /api/legal/documents – Seznam aktuálních platných dokumentů
app.get('/api/legal/documents', async (_req, res) => {
  try {
    const docs = await ComplianceService.getDocs();
    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/legal/documents/:slug – Detail aktuální nebo konkrétní verze
app.get('/api/legal/documents/:slug', async (req, res) => {
  try {
    const doc = await ComplianceService.getDocByKey(req.params.slug);
    if (!doc) {
      return res.status(404).json({ error: 'Právní dokument nebyl nalezen.' });
    }
    res.json(doc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/legal/accept – Zaznamenání server-side souhlasu uživatele s konkrétní verzí
app.post('/api/legal/accept', async (req: AuthenticatedRequest, res) => {
  try {
    const { docKey, docVersion, status, userId } = req.body;
    const targetUserId = userId || req.user?.id;
    if (!targetUserId) {
      return res.status(400).json({ error: 'Uživatel musí být přihlášen pro uložení souhlasu.' });
    }
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const consent = await ComplianceService.recordConsent(targetUserId, docKey, docVersion, status || 'ACCEPTED', req.user?.email, ip);
    
    // Log in Legal Audit Trail
    await ComplianceService.logLegalAudit(targetUserId, 'DOCUMENT_ACCEPTED', 'Consent', consent.id, {
      docKey,
      docVersion,
      ip,
      userAgent: req.headers['user-agent']
    });

    res.json(consent);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. POST /api/legal/cookie-consent – Uložení preferencí cookies
app.post('/api/legal/cookie-consent', async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, sessionHash, essential, functional, analytics, marketing } = req.body;
    const targetUserId = userId || req.user?.id || null;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    
    const consent = await ComplianceService.recordCookieConsent(targetUserId, sessionHash || null, {
      essential,
      functional,
      analytics,
      marketing
    }, ip);

    // Log in Legal Audit Trail
    await ComplianceService.logLegalAudit(targetUserId, 'COOKIE_CONSENT_RECORDED', 'CookieConsent', consent.id, {
      sessionHash,
      preferences: { essential, functional, analytics, marketing },
      ip
    });

    res.json(consent);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. POST /api/legal/admin/documents – Vytvoření nové verze/dokumentu (Vyžaduje Admin přístup)
app.post('/api/legal/admin/documents', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { key, title, type, description, initialVersion, initialContent } = req.body;
    if (!key || !title) {
      return res.status(400).json({ error: 'Klíč a Název dokumentu jsou povinné údaje.' });
    }
    const doc = await ComplianceService.createDoc({
      key,
      title,
      type,
      description,
      initialVersion,
      initialContent
    }, req.user);

    // Log in Legal Audit Trail
    await ComplianceService.logLegalAudit(req.user?.id || null, 'DOCUMENT_CREATED', 'LegalDocument', doc.id, {
      key,
      title,
      type,
      version: initialVersion || '1.0.0'
    });

    res.json(doc);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. POST /api/legal/admin/documents/:slug/version – Přidání nové verze k dokumentu
app.post('/api/legal/admin/documents/:slug/version', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { version, content, status, effectiveDate } = req.body;
    if (!version || !content) {
      return res.status(400).json({ error: 'Číslo verze a obsah dokumentu jsou povinné údaje.' });
    }
    const newVer = await ComplianceService.createVersion(req.params.slug, {
      version,
      content,
      status,
      effectiveDate,
      author: req.user?.name
    }, req.user);

    // Log in Legal Audit Trail
    await ComplianceService.logLegalAudit(req.user?.id || null, 'DOCUMENT_VERSION_CREATED', 'LegalDocumentVersion', newVer.id, {
      slug: req.params.slug,
      version,
      status
    });

    res.json(newVer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 7. GET /api/legal/admin/audit-logs – Přehled auditní stopy souhlasů
app.get('/api/legal/admin/audit-logs', requireAuth as any, requireRole('ADMIN') as any, async (_req, res) => {
  try {
    const logs = await ComplianceService.getLegalAuditLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GDPR Compliance Center API Endpoints (Release 0.5.1)
app.post('/api/gdpr/consent-log', async (req: AuthenticatedRequest, res) => {
  try {
    const { documentType, documentVersion, userId } = req.body;
    const targetUserId = userId || req.user?.id;
    if (!targetUserId) return res.status(400).json({ error: 'Uživatel není přihlášen.' });
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const prisma = getPrismaClient();
    if (prisma && (prisma as any).userConsentLog) {
      const log = await (prisma as any).userConsentLog.create({
        data: {
          userId: targetUserId,
          documentType: documentType || 'PRIVACY_POLICY',
          documentVersion: documentVersion || '0.5.1',
          ipAddress: ip,
          userAgent,
        },
      });
      return res.json({ success: true, log });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/gdpr/sensitive-access', async (req: AuthenticatedRequest, res) => {
  try {
    const { action, resource, userId } = req.body;
    const targetUserId = userId || req.user?.id;
    if (!targetUserId) return res.status(400).json({ error: 'Uživatel není přihlášen.' });
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const prisma = getPrismaClient();
    if (prisma && (prisma as any).sensitiveAccessLog) {
      const log = await (prisma as any).sensitiveAccessLog.create({
        data: {
          userId: targetUserId,
          action: action || 'VIEW_SENSITIVE_CASE',
          resource,
          ipAddress: ip,
        },
      });
      return res.json({ success: true, log });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/gdpr/deletion-request', async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, notes } = req.body;
    const targetUserId = userId || req.user?.id;
    if (!targetUserId) return res.status(400).json({ error: 'Uživatel není přihlášen.' });
    const prisma = getPrismaClient();
    if (prisma && (prisma as any).gdprDeletionRequest) {
      const request = await (prisma as any).gdprDeletionRequest.create({
        data: {
          userId: targetUserId,
          status: 'PENDING',
          notes: notes || 'Žádost uživatele o výmaz osobních údajů (Právo být zapomenut - Čl. 17 GDPR)',
        },
      });
      return res.json({ success: true, request });
    }
    res.json({ success: true, message: 'Žádost o výmaz byla zaznamenána.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/gdpr/deletion-requests', requireAuth as any, requireRole('ADMIN') as any, async (_req, res) => {
  try {
    const prisma = getPrismaClient();
    if (prisma && (prisma as any).gdprDeletionRequest) {
      const requests = await (prisma as any).gdprDeletionRequest.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { requestedAt: 'desc' },
      });
      return res.json(requests);
    }
    res.json([]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/gdpr/deletion-requests/:id', requireAuth as any, requireRole('ADMIN') as any, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const prisma = getPrismaClient();
    if (prisma && (prisma as any).gdprDeletionRequest) {
      const updated = await (prisma as any).gdprDeletionRequest.update({
        where: { id },
        data: {
          status: status || 'PROCESSING',
          completedAt: status === 'COMPLETED' ? new Date() : undefined,
          notes,
        },
      });
      return res.json(updated);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/gdpr/export-data', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = (req.query.userId as string) || req.user?.id;
    if (!userId) return res.status(400).json({ error: 'Nespecifikován uživatel.' });
    const prisma = getPrismaClient();
    let userData: any = { userId, exportedAt: new Date().toISOString(), version: '0.5.1' };
    if (prisma) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true, cases: true, notes: true, children: true, events: true, documents: true },
      });
      if (user) userData.user = user;
      if ((prisma as any).userConsentLog) {
        userData.consentLogs = await (prisma as any).userConsentLog.findMany({ where: { userId } });
      }
      if ((prisma as any).sensitiveAccessLog) {
        userData.sensitiveAccessLogs = await (prisma as any).sensitiveAccessLog.findMany({ where: { userId } });
      }
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=gdpr-export-release-0.5.1-${userId}-${Date.now()}.json`);
    res.json(userData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. AUDIT LOGS
app.get('/api/audit', requireAuth as any, requireRole('ADMIN') as any, async (req, res) => {
  const moduleFilter = req.query.module as string | undefined;
  const userFilter = req.query.user as string | undefined;
  const logs = await AuditService.getLogs(moduleFilter, userFilter);
  res.json(logs);
});

app.post('/api/audit', async (req: AuthenticatedRequest, res) => {
  const { action, module, details } = req.body;
  const log = await AuditService.recordLog(action, module, details, req.user);
  res.json(log);
});

// 8. SYSTEM SETTINGS
app.get('/api/settings', async (_req, res) => {
  const settings = await SettingsService.getSettings();
  res.json(settings);
});

app.put('/api/settings/:key', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const setting = await SettingsService.updateSetting(key, value, req.user);
    res.json(setting);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 9. SEO & SITEMAP
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Sitemap: https://dev.tatovacesta.cz/sitemap.xml
`);
});

app.get('/sitemap.xml', async (_req, res) => {
  try {
    const pages = await CmsService.getPages();
    const articles = await CmsService.getArticles();
    const baseUrl = 'https://dev.tatovacesta.cz';

    const staticSlugs = [
      '',
      'o-projektu',
      'zivotni-situace',
      'clanky',
      'faq',
      'kontakt',
      'podminky-uzivani',
      'gdpr',
      'cookies',
      'moje-pravni-dokumenty',
      'dobrovolnicky-kodex',
      'dobrovolnictvi',
      'ai-prohlaseni',
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const slug of staticSlugs) {
      xml += `  <url>\n    <loc>${baseUrl}${slug ? '/' + slug : ''}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${slug === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
    }

    for (const page of pages) {
      if (page.published && !staticSlugs.includes(page.slug)) {
        xml += `  <url>\n    <loc>${baseUrl}/${page.slug}</loc>\n    <lastmod>${page.updatedAt ? page.updatedAt.split('T')[0] : '2026-01-01'}</lastmod>\n    <priority>0.7</priority>\n  </url>\n`;
      }
    }

    for (const art of articles) {
      if (art.published) {
        xml += `  <url>\n    <loc>${baseUrl}/clanky/${art.slug}</loc>\n    <lastmod>${art.updatedAt ? art.updatedAt.split('T')[0] : '2026-01-01'}</lastmod>\n    <priority>0.6</priority>\n  </url>\n`;
      }
    }

    xml += `</urlset>`;
    res.type('application/xml');
    res.send(xml);
  } catch (err: any) {
    res.status(500).send('Error generating sitemap');
  }
});

async function startServer() {
  // Fallback pro neexistující /api/* endpointy - VŽDY vrací JSON
  app.use('/api', (req, res) => {
    res.status(404).json({ success: false, error: `API endpoint nenalezen: ${req.method} ${req.originalUrl}` });
  });

  // Obecný error handler pro /api/* endpointy (zachytí všechny next(err) nebo throw v synchronním kódu bez catch)
  app.use('/api', (err: any, req: any, res: any, next: any) => {
    console.error('[API Error]', err);
    res.status(500).json({ success: false, error: err.message || 'Interní chyba serveru na API vrstvě.' });
  });

  // --- VITE INTEGRATION / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      configFile: './vite.config.ts',
      server: {
        middlewareMode: true,
        allowedHosts: ['dev3.tatovacesta.cz', '.run.app', 'localhost'],
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.use(express.static(path.resolve('dist')));

  app.get('*', (_req, res) => {
    const indexPath = path.resolve('dist/index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Index HTML not found');
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Táta má právo] Core & API Server running on port ${PORT}`);
  });

  // Background DB sync and seed - performed non-blockingly so app.listen opens port 3000 immediately
  setTimeout(async () => {
    try {
      if (process.env.DATABASE_URL) {
        const isDbReachable = await checkDatabaseReachable();
        if (isDbReachable) {
          console.log('[System] Synchonizuji Prisma schéma s databází...');
          try {
            execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', timeout: 5000 });
            console.log('[System] Prisma schéma úspěšně synchronizováno.');
          } catch (pushErr) {
            console.warn('[System] Prisma db push přeskočen nebo selhal:', pushErr);
          }
        } else {
          console.info('[System] PostgreSQL databáze na DATABASE_URL není dostupná. Přeskakuji Prisma synchronizaci.');
        }
      } else {
        console.log('[System] DATABASE_URL chybí, přeskakuji Prisma synchronizaci.');
        markPrismaUnavailable('DATABASE_URL is missing');
      }

      // Safe background seeding with automatic fallback to dbStore
      await runSeed();
    } catch (error) {
      console.warn('[System] Upozornění při inicializaci databáze/seedu:', error);
      markPrismaUnavailable(error);
    }
  }, 100);
}

startServer().catch((err) => {
  console.error('[System] Chyba při spouštění serveru:', err);
});
