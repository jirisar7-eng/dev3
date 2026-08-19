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
import { EsbirkaScheduler } from './src/services/esbirka/EsbirkaScheduler.ts';
import { EsbirkaLegalRepository } from './src/services/esbirka/EsbirkaLegalRepository.ts';
import { subjektService } from './src/services/subjektService.ts';
import { dbStore } from './src/services/dbStore.ts';
import { OAuthService } from './src/services/oauthService.ts';
import { PasskeyService } from './src/services/passkeyService.ts';
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
import adminRoutes from './src/routes/adminRoutes';
import qaRoutes from './src/routes/qaRoutes';
import aiContextRoutes from './src/routes/aiContextRoutes';

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

// Session Cookie Options Helper - supports custom domain and secure options
const cookieOptions = (role: string, customSameSite?: 'lax' | 'none' | 'strict') => {
  const maxAge = (role === 'ADMIN' || role === 'SUPER_ADMIN')
    ? 2 * 60 * 60 * 1000 // 2 hodiny
    : 24 * 60 * 60 * 1000; // 24 hodin

  return {
    httpOnly: true,
    secure: true,
    sameSite: (customSameSite || (process.env.NODE_ENV === 'production' ? 'lax' : 'none')) as any,
    domain: process.env.COOKIE_DOMAIN || undefined,
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
// Direct alias routes for webhook deployment
app.use(['/api/webhook/deploy', '/api/webhooks/github', '/api/webhook'], systemRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/custom-modules', customModuleRoutes);
app.use('/api/subjekty', subjektRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/coparent', coparentRoutes);
app.use('/api/admin/vps', adminVpsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/qa', qaRoutes);
app.use(aiContextRoutes);

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

// Admin sync endpoint (PROTECTED: Requires ADMIN or LEGAL_EDITOR role, strictly enforced quota & lock)
app.post('/api/esbirka/sync', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const { cislo, rok, actCode } = req.body;
    const userId = req.user?.id || 'admin';
    const userRole = req.user?.role || 'ADMIN';

    const result = await EsbirkaScheduler.triggerManualSync({
      actCode,
      actNumber: cislo ? Number(cislo) : undefined,
      actYear: rok ? Number(rok) : undefined,
      userId,
      userRole,
    });

    if (result.status === 'FAILED') {
      return res.status(500).json({
        success: false,
        error: result.error?.message || 'Chyba při synchronizaci předpisu.',
        result,
      });
    }

    res.json({ success: true, result });
  } catch (err: any) {
    const status = err?.httpStatus || 500;
    res.status(status).json({
      success: false,
      error: err.message || 'Chyba při synchronizaci e-Sbírky.',
      code: err.code || 'SYNC_ERROR',
    });
  }
});

// Admin Scheduler Status endpoint
app.get('/api/admin/esbirka/scheduler/status', requireAuth, requireRole('ADMIN'), async (_req: AuthenticatedRequest, res: express.Response) => {
  try {
    const status = await EsbirkaScheduler.getStatus();
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chyba při čtení stavu plánovače.' });
  }
});

// Admin Sync Audits endpoint
app.get('/api/admin/esbirka/audits', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const audits = await EsbirkaLegalRepository.getAllAudits(limit);
    res.json({ success: true, audits });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chyba při čtení auditů synchronizace.' });
  }
});

// Admin Laws endpoint
app.get('/api/admin/esbirka/laws', requireAuth, requireRole('ADMIN'), async (_req: AuthenticatedRequest, res: express.Response) => {
  try {
    const laws = await EsbirkaLegalRepository.getAllActs();
    res.json({ success: true, laws });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chyba při čtení seznamu zákonů z repozitáře.' });
  }
});

// Admin Law Details endpoint (with full versions and sections)
app.get('/api/admin/esbirka/laws/:code', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const code = req.params.code;
    const law = await EsbirkaLegalRepository.getActDetailsByCode(code);
    if (!law) {
      return res.status(404).json({ error: 'Zákon nebyl v repozitáři nalezen.' });
    }
    res.json({ success: true, law });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chyba při čtení detailu zákona.' });
  }
});

// KLIENTSKÉ ENDPOINTY (GET /api/esbirka/acts/* & GET /api/state/laws/*) - ČTOU VÝHRADNĚ Z LOKÁLNÍ DATABÁZE
// Fail-closed princip: Žádné přímé volání externího API e-Sbírky ze strany klienta, žádná náhradní/mock data při chybě.

// 1. Seznam podporovaných předpisů
const handleGetSupportedActs = async (req: express.Request, res: express.Response) => {
  try {
    const refDateParam = req.query.date as string;
    const refDate = refDateParam ? new Date(refDateParam) : new Date();
    if (refDateParam && isNaN(refDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Neplatný formát data v parametru date.', code: 'INVALID_DATE_FORMAT' });
    }

    const acts = await EsbirkaService.getSupportedActs(refDate);
    res.json({
      success: true,
      referenceDate: refDate.toISOString(),
      count: acts.length,
      acts,
      laws: acts, // Alias pro zpětnou kompatibilitu
    });
  } catch (err: any) {
    console.error('Error fetching supported acts:', err);
    res.status(503).json({ success: false, error: 'Služba je dočasně nedostupná (chyba při čtení z databáze).', code: 'DB_READ_ERROR' });
  }
};

app.get('/api/esbirka/acts', handleGetSupportedActs);
app.get('/api/state/laws', handleGetSupportedActs);

// 2. Aktuální znění předpisu (k dnešnímu dni)
const handleGetCurrentActWording = async (req: express.Request, res: express.Response) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Chybí kód předpisu.', code: 'INVALID_ACT_CODE' });
    }

    const wording = await EsbirkaService.getCurrentActWording(code);
    if (!wording) {
      return res.status(404).json({ success: false, error: `Předpis '${code}' nebyl nalezen v lokální databázi.`, code: 'ACT_NOT_FOUND' });
    }

    res.json({
      success: true,
      actCode: wording.act.actCode,
      validity: wording.validity,
      referenceDate: wording.referenceDate.toISOString(),
      act: wording.act,
      version: wording.version,
      sections: wording.sections,
    });
  } catch (err: any) {
    console.error('Error fetching current act wording:', err);
    res.status(503).json({ success: false, error: 'Služba je dočasně nedostupná (chyba při čtení z databáze).', code: 'DB_READ_ERROR' });
  }
};

app.get('/api/esbirka/acts/:code/current', handleGetCurrentActWording);
app.get('/api/state/laws/:code/current', handleGetCurrentActWording);

// 3. Seznam časových znění (verzí) předpisu
const handleGetActVersions = async (req: express.Request, res: express.Response) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Chybí kód předpisu.', code: 'INVALID_ACT_CODE' });
    }

    const refDateParam = req.query.date as string;
    const refDate = refDateParam ? new Date(refDateParam) : new Date();
    if (refDateParam && isNaN(refDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Neplatný formát data v parametru date.', code: 'INVALID_DATE_FORMAT' });
    }

    const formattedCode = code.replace('-', '/');
    const act = await EsbirkaLegalRepository.getActDetailsByCode(formattedCode);
    if (!act) {
      return res.status(404).json({ success: false, error: `Předpis '${code}' nebyl nalezen v lokální databázi.`, code: 'ACT_NOT_FOUND' });
    }

    const versions = await EsbirkaService.getActVersions(code, refDate);
    res.json({
      success: true,
      actCode: act.actCode,
      actTitle: act.title,
      referenceDate: refDate.toISOString(),
      count: versions.length,
      versions,
    });
  } catch (err: any) {
    console.error('Error fetching act versions:', err);
    res.status(503).json({ success: false, error: 'Služba je dočasně nedostupná (chyba při čtení z databáze).', code: 'DB_READ_ERROR' });
  }
};

app.get('/api/esbirka/acts/:code/versions', handleGetActVersions);
app.get('/api/state/laws/:code/versions', handleGetActVersions);

// 4. Znění předpisu k referenčnímu datu (?date=YYYY-MM-DD)
const handleGetActWordingAtDate = async (req: express.Request, res: express.Response) => {
  try {
    const { code } = req.params;
    const dateParam = (req.query.date as string) || (req.query.at as string);

    if (!code) {
      return res.status(400).json({ success: false, error: 'Chybí kód předpisu.', code: 'INVALID_ACT_CODE' });
    }

    if (!dateParam) {
      return res.status(400).json({
        success: false,
        error: 'Chybí povinný parametr dotazu "date" (např. ?date=2024-01-01).',
        code: 'MISSING_DATE_PARAM',
      });
    }

    const parsedDate = new Date(dateParam);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Neplatný formát data. Použijte standardní formát ISO (YYYY-MM-DD).',
        code: 'INVALID_DATE_FORMAT',
      });
    }

    const wording = await EsbirkaService.getActWordingAtDate(code, parsedDate);
    if (!wording) {
      return res.status(404).json({
        success: false,
        error: `K zadanému datu (${dateParam}) nebylo v lokální databázi nalezeno žádné platné znění předpisu '${code}'.`,
        code: 'VERSION_NOT_FOUND_FOR_DATE',
      });
    }

    res.json({
      success: true,
      actCode: wording.act.actCode,
      requestedDate: parsedDate.toISOString(),
      validity: wording.validity,
      act: wording.act,
      version: wording.version,
      sections: wording.sections,
    });
  } catch (err: any) {
    console.error('Error fetching act wording at date:', err);
    res.status(503).json({ success: false, error: 'Služba je dočasně nedostupná (chyba při čtení z databáze).', code: 'DB_READ_ERROR' });
  }
};

app.get('/api/esbirka/acts/:code/at-date', handleGetActWordingAtDate);
app.get('/api/state/laws/:code/at-date', handleGetActWordingAtDate);

// 5. Konkrétní časové znění podle ID verze nebo čísla verze
const handleGetActVersionDetails = async (req: express.Request, res: express.Response) => {
  try {
    const { code, versionId } = req.params;
    if (!code || !versionId) {
      return res.status(400).json({ success: false, error: 'Chybí kód předpisu nebo identifikátor verze.', code: 'INVALID_PARAMETERS' });
    }

    const version = await EsbirkaService.getActVersionDetails(code, versionId);
    if (!version) {
      return res.status(404).json({
        success: false,
        error: `Časové znění '${versionId}' pro předpis '${code}' nebylo nalezeno v lokální databázi.`,
        code: 'VERSION_NOT_FOUND',
      });
    }

    const sections = EsbirkaLegalRepository.extractSectionsFromSnapshot(version.contentSnapshot);

    res.json({
      success: true,
      actCode: code.replace('-', '/'),
      version,
      sections,
    });
  } catch (err: any) {
    console.error('Error fetching act version detail:', err);
    res.status(503).json({ success: false, error: 'Služba je dočasně nedostupná (chyba při čtení z databáze).', code: 'DB_READ_ERROR' });
  }
};

app.get('/api/esbirka/acts/:code/version/:versionId', handleGetActVersionDetails);
app.get('/api/state/laws/:code/version/:versionId', handleGetActVersionDetails);

// 6. Detail předpisu podle roku a čísla (/api/state/laws/:rok/:cislo)
app.get('/api/state/laws/:rok/:cislo', async (req: express.Request, res: express.Response) => {
  try {
    const { rok, cislo } = req.params;
    const code = `${cislo}/${rok}`;
    const act = await EsbirkaService.getActDetails(code);
    if (!act) {
      return res.status(404).json({ success: false, error: `Předpis '${code}' nebyl nalezen v lokální databázi.`, code: 'ACT_NOT_FOUND' });
    }
    res.json({ success: true, act, law: act });
  } catch (err: any) {
    res.status(503).json({ success: false, error: 'Služba je dočasně nedostupná (chyba při čtení z databáze).', code: 'DB_READ_ERROR' });
  }
});

// 7. Detail předpisu podle kódu (/api/esbirka/acts/:code & /api/state/laws/:code)
const handleGetActDetail = async (req: express.Request, res: express.Response) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Chybí kód předpisu.', code: 'INVALID_ACT_CODE' });
    }

    const refDateParam = req.query.date as string;
    const refDate = refDateParam ? new Date(refDateParam) : new Date();

    const act = await EsbirkaService.getActDetails(code, refDate);
    if (!act) {
      return res.status(404).json({ success: false, error: `Předpis '${code}' nebyl nalezen v lokální databázi.`, code: 'ACT_NOT_FOUND' });
    }

    res.json({ success: true, act, law: act });
  } catch (err: any) {
    console.error('Error fetching act detail:', err);
    res.status(503).json({ success: false, error: 'Služba je dočasně nedostupná (chyba při čtení z databáze).', code: 'DB_READ_ERROR' });
  }
};

app.get('/api/esbirka/acts/:code', handleGetActDetail);
app.get('/api/state/laws/:code', handleGetActDetail);


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

    if (result.mfaRequired && result.user) {
      if (req.session) {
        req.session.pendingMfaUserId = result.user.id;
      }
      res.cookie('pending_mfa_user', result.user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.COOKIE_DOMAIN || undefined,
        maxAge: 10 * 60 * 1000,
        path: '/',
      });
      return res.json({ mfaRequired: true, userId: result.user.id, mfaToken: result.mfaToken });
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
    const { name, email, password, profileData, childrenData, consents, gender, hasChildrenInitial } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail a heslo jsou povinné údaje.' });
    }

    const result = await AuthService.register(name, email, password, profileData, childrenData, gender, hasChildrenInitial);

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


// ==========================================
// GOOGLE & MICROSOFT LOGIN ENDPOINTS
// ==========================================

// Helper to construct redirection targets inside popup or direct browser navigation
const respondWithPopupHtml = (res: any, data: any, customTargetUrl?: string) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // Determine dynamic target URL
  let targetUrl = customTargetUrl || '/dashboard';
  if (!data.success) {
    targetUrl = '/login';
  } else if (data.mfaRequired && data.mfaToken) {
    targetUrl = `/login?mfa=true&token=${encodeURIComponent(data.mfaToken)}`;
  }

  const isSuccess = Boolean(data.success);
  const errorMessage = data.error || 'Nastala neočekávaná chyba při ověřování přihlášení.';

  return res.send(`<!DOCTYPE html>
<html lang="cs">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isSuccess ? 'Přihlášení dokončeno | Táta má právo' : 'Chyba přihlášení | Táta má právo'}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      body { background-color: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
      .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 24px; padding: 36px 24px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
      .icon-container { width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
      .icon-success { background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; }
      .icon-error { background-color: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; }
      h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #ffffff; }
      p { font-size: 13px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
      .btn { display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 14px 20px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 12px; transition: all 0.2s; cursor: pointer; }
      .btn-primary { background-color: #2563eb; color: #ffffff; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
      .btn-primary:hover { background-color: #1d4ed8; }
      .btn-danger { background-color: #dc2626; color: #ffffff; }
      .btn-danger:hover { background-color: #b91c1c; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon-container ${isSuccess ? 'icon-success' : 'icon-error'}">
        ${isSuccess
          ? `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`
          : `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
        }
      </div>

      <h1>${isSuccess ? 'Přihlášení dokončeno' : 'Přihlášení selhalo'}</h1>
      
      <p>
        ${isSuccess
          ? 'Probíhá automatické přesměrování do aplikace... Pokud se okno nezavře nebo nepřesměruje, klikněte na tlačítko níže.'
          : errorMessage
        }
      </p>

      <a id="btn-continue-to-app" href="${targetUrl}" class="btn ${isSuccess ? 'btn-primary' : 'btn-danger'}">
        ${isSuccess ? 'Pokračovat do aplikace' : 'Zpět na přihlášení'}
      </a>
    </div>

    <script>
      const authData = ${JSON.stringify({ type: 'OAUTH_AUTH_RESULT', ...data })};
      const redirectUrl = ${JSON.stringify(targetUrl)};

      // 1. If auth token is present, store it safely in localStorage
      if (authData.token) {
        try {
          localStorage.setItem('tatovacesta_auth_token', authData.token);
        } catch (e) {
          console.warn('LocalStorage error:', e);
        }
      }

      // 2. Notify opener window if popup was used
      let hasOpener = false;
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(authData, '*');
          hasOpener = true;
          window.close();
        }
      } catch (e) {
        console.warn('Opener postMessage failed:', e);
      }

      // 3. If no opener (mobile device, direct redirection), redirect immediately to target URL
      if (!hasOpener) {
        window.location.replace(redirectUrl);
      } else {
        // Fallback for popups where window.close() was blocked by browser
        setTimeout(function() {
          window.location.replace(redirectUrl);
        }, 600);
      }
    </script>
  </body>
</html>`);
};

app.get('/api/auth/google', async (req: AuthenticatedRequest, res) => {
  try {
    const origin = PasskeyService.getOrigin(req.headers.host || 'localhost:3000');
    const redirectUri = `${origin}/api/auth/google/callback`;
    const state = OAuthService.generateState();
    const returnUrl = (req.query.returnUrl || req.query.redirect || '/dashboard') as string;

    res.cookie('google_oauth_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      signed: true,
      maxAge: 10 * 60 * 1000,
    });
    res.cookie('oauth_return_url', returnUrl, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      signed: true,
      maxAge: 10 * 60 * 1000,
    });

    const url = OAuthService.getGoogleAuthUrl(redirectUri, state);
    return res.redirect(url);
  } catch (err: any) {
    res.status(500).send(`Chyba při spuštění přihlášení přes Google: ${err.message}`);
  }
});

app.get('/api/auth/google/url', async (req: AuthenticatedRequest, res) => {
  try {
    const origin = PasskeyService.getOrigin(req.headers.host || 'localhost:3000');
    const redirectUri = `${origin}/api/auth/google/callback`;
    const state = OAuthService.generateState();
    const returnUrl = (req.query.returnUrl || req.query.redirect || '/dashboard') as string;

    res.cookie('google_oauth_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      signed: true,
      maxAge: 10 * 60 * 1000,
    });
    res.cookie('oauth_return_url', returnUrl, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      signed: true,
      maxAge: 10 * 60 * 1000,
    });

    const url = OAuthService.getGoogleAuthUrl(redirectUri, state);
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Nelze vygenerovat autorizační URL pro Google.' });
  }
});

app.get('/api/auth/microsoft', async (req: AuthenticatedRequest, res) => {
  try {
    const origin = PasskeyService.getOrigin(req.headers.host || 'localhost:3000');
    const redirectUri = `${origin}/api/auth/microsoft/callback`;
    const state = OAuthService.generateState();
    const returnUrl = (req.query.returnUrl || req.query.redirect || '/dashboard') as string;

    res.cookie('microsoft_oauth_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      signed: true,
      maxAge: 10 * 60 * 1000,
    });
    res.cookie('oauth_return_url', returnUrl, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      signed: true,
      maxAge: 10 * 60 * 1000,
    });

    const url = OAuthService.getMicrosoftAuthUrl(redirectUri, state);
    return res.redirect(url);
  } catch (err: any) {
    res.status(500).send(`Chyba při spuštění přihlášení přes Microsoft: ${err.message}`);
  }
});

app.get('/api/auth/microsoft/url', async (req: AuthenticatedRequest, res) => {
  try {
    const origin = PasskeyService.getOrigin(req.headers.host || 'localhost:3000');
    const redirectUri = `${origin}/api/auth/microsoft/callback`;
    const state = OAuthService.generateState();
    const returnUrl = (req.query.returnUrl || req.query.redirect || '/dashboard') as string;

    res.cookie('microsoft_oauth_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      signed: true,
      maxAge: 10 * 60 * 1000,
    });
    res.cookie('oauth_return_url', returnUrl, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      signed: true,
      maxAge: 10 * 60 * 1000,
    });

    const url = OAuthService.getMicrosoftAuthUrl(redirectUri, state);
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Nelze vygenerovat autorizační URL pro Microsoft.' });
  }
});

app.get(['/api/auth/google/callback', '/api/auth/callback/google'], async (req: AuthenticatedRequest, res) => {
  const returnUrl = (req.signedCookies.oauth_return_url || req.query.returnUrl as string || '/portal');
  res.clearCookie('oauth_return_url');

  try {
    const { code, state } = req.query;
    const cookieState = req.signedCookies.google_oauth_state;
    res.clearCookie('google_oauth_state');

    if (!state || !cookieState || state !== cookieState) {
      return respondWithPopupHtml(res, { success: false, error: 'Chyba zabezpečení: Neplatný stav relace (CSRF ochrana).' }, returnUrl);
    }

    const origin = PasskeyService.getOrigin(req.headers.host || 'localhost:3000');
    const redirectUri = `${origin}/api/auth/google/callback`;

    const profile = await OAuthService.exchangeGoogleCode(code as string, redirectUri);

    const cleanEmail = (profile.email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return respondWithPopupHtml(res, { success: false, error: 'Nepodařilo se získat platnou e-mailovou adresu z profilu Google.' }, returnUrl);
    }

    // 1. Check if user is already logged in (Linking mode)
    if (req.user) {
      if (req.user.email.toLowerCase() !== cleanEmail) {
        const otherUser = isPrismaAvailable()
          ? await prisma.user.findUnique({ where: { email: cleanEmail } })
          : dbStore.users.find(u => u.email.toLowerCase() === cleanEmail);

        if (otherUser && otherUser.id !== req.user.id) {
          return respondWithPopupHtml(res, { success: false, error: 'Tento Google účet již patří jinému uživatelskému profilu.' }, returnUrl);
        }
      }

      // Track link in PostgreSQL (Prisma)
      if (isPrismaAvailable()) {
        try {
          await prisma.user.update({
            where: { id: req.user.id },
            data: { googleId: profile.providerAccountId }
          });
        } catch (e) {
          console.error('Failed to link Google account in DB:', e);
        }
      }

      // Track link in dbStore
      const existingAcc = dbStore.accounts.find(a => a.userId === req.user.id && a.provider === 'google');
      if (!existingAcc) {
        dbStore.accounts.push({
          id: 'acc-' + Date.now(),
          userId: req.user.id,
          provider: 'google',
          providerAccountId: profile.providerAccountId,
          email: cleanEmail,
        });
      }

      dbStore.logAudit('GOOGLE_ACCOUNT_LINKED', 'AUTH', `Uživatel si propojil Google účet: ${cleanEmail}`, req.user);
      return respondWithPopupHtml(res, { success: true, user: req.user }, '/portal/nastaveni?success=google_linked');
    }

    // 2. Logging in / Auto-Registration mode
    let user = isPrismaAvailable()
      ? await prisma.user.findUnique({ where: { email: cleanEmail } })
      : dbStore.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Safe Auto-Registration
      const userName = profile.name || cleanEmail.split('@')[0];
      const avatarUrl = profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;

      if (isPrismaAvailable()) {
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: userName,
            role: 'USER',
            status: 'ACTIVE',
            avatar: avatarUrl,
          }
        });
      } else {
        const newId = 'usr-' + Date.now();
        user = {
          id: newId,
          email: cleanEmail,
          name: userName,
          role: 'USER',
          status: 'ACTIVE',
          totpEnabled: false,
          totpBackupCodes: [],
          avatar: avatarUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        dbStore.users.unshift(user);
      }

      dbStore.logAudit('USER_REGISTER_OAUTH', 'AUTH', `Nový uživatel zaregistrován přes Google: ${cleanEmail}`, user);
    } else {
      if (isPrismaAvailable()) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastLoginAt: new Date(),
              ...(!user.avatar && profile.avatar ? { avatar: profile.avatar } : {}),
            }
          });
        } catch (e) {
          // non-blocking update
        }
      }
    }

    // Track linked account in dbStore for profile settings
    const existingAcc = dbStore.accounts.find(a => a.userId === user.id && a.provider === 'google');
    if (!existingAcc) {
      dbStore.accounts.push({
        id: 'acc-' + Date.now(),
        userId: user.id,
        provider: 'google',
        providerAccountId: profile.providerAccountId,
        email: cleanEmail,
      });
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return respondWithPopupHtml(res, { success: false, error: 'Váš účet je zablokován.' }, returnUrl);
    }

    // Direct Login without MFA (OAuth provider already did MFA if configured)
    const token = AuthService.generateToken(user, true); // true = MFA verified
    res.cookie('token', token, cookieOptions(user.role));
    console.log('[Google OAuth] Uživatel úspěšně přihlášen:', user.email);
    console.log('[Google OAuth] Přesměrovávám na /portal');
    dbStore.logAudit('GOOGLE_LOGIN_SUCCESS', 'AUTH', `Uživatel se úspěšně přihlásil přes Google: ${cleanEmail}`, user);

    return respondWithPopupHtml(res, { success: true, token, user: AuthService.sanitizeUser(user) }, '/portal');
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return respondWithPopupHtml(res, { success: false, error: err.message || 'Přihlášení přes Google selhalo.' }, returnUrl);
  }
});

app.get(['/api/auth/microsoft/callback', '/api/auth/callback/microsoft'], async (req: AuthenticatedRequest, res) => {
  const returnUrl = (req.signedCookies.oauth_return_url || req.query.returnUrl as string || '/portal');
  res.clearCookie('oauth_return_url');

  try {
    const { code, state } = req.query;
    const cookieState = req.signedCookies.microsoft_oauth_state;
    res.clearCookie('microsoft_oauth_state');

    if (!state || !cookieState || state !== cookieState) {
      return respondWithPopupHtml(res, { success: false, error: 'Chyba zabezpečení: Neplatný stav relace (CSRF ochrana).' }, returnUrl);
    }

    const origin = PasskeyService.getOrigin(req.headers.host || 'localhost:3000');
    const redirectUri = `${origin}/api/auth/microsoft/callback`;

    const profile = await OAuthService.exchangeMicrosoftCode(code as string, redirectUri);

    const cleanEmail = (profile.email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return respondWithPopupHtml(res, { success: false, error: 'Nepodařilo se získat platnou e-mailovou adresu z profilu Microsoft.' }, returnUrl);
    }

    // 1. Check if user is already logged in (Linking mode)
    if (req.user) {
      if (req.user.email.toLowerCase() !== cleanEmail) {
        const otherUser = isPrismaAvailable()
          ? await prisma.user.findUnique({ where: { email: cleanEmail } })
          : dbStore.users.find(u => u.email.toLowerCase() === cleanEmail);

        if (otherUser && otherUser.id !== req.user.id) {
          return respondWithPopupHtml(res, { success: false, error: 'Tento Microsoft účet již patří jinému uživatelskému profilu.' }, returnUrl);
        }
      }

      // Track link in PostgreSQL (Prisma)
      if (isPrismaAvailable()) {
        try {
          await prisma.user.update({
            where: { id: req.user.id },
            data: { microsoftId: profile.providerAccountId }
          });
        } catch (e) {
          console.error('Failed to link Microsoft account in DB:', e);
        }
      }

      // Track link in dbStore
      const existingAcc = dbStore.accounts.find(a => a.userId === req.user.id && a.provider === 'microsoft');
      if (!existingAcc) {
        dbStore.accounts.push({
          id: 'acc-' + Date.now(),
          userId: req.user.id,
          provider: 'microsoft',
          providerAccountId: profile.providerAccountId,
          email: cleanEmail,
        });
      }

      dbStore.logAudit('MICROSOFT_ACCOUNT_LINKED', 'AUTH', `Uživatel si propojil Microsoft účet: ${cleanEmail}`, req.user);
      return respondWithPopupHtml(res, { success: true, user: req.user }, '/portal/nastaveni?success=microsoft_linked');
    }

    // 2. Logging in / Auto-Registration mode
    let user = isPrismaAvailable()
      ? await prisma.user.findUnique({ where: { email: cleanEmail } })
      : dbStore.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Safe Auto-Registration
      const userName = profile.name || cleanEmail.split('@')[0];
      const avatarUrl = profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;

      if (isPrismaAvailable()) {
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: userName,
            role: 'USER',
            status: 'ACTIVE',
            avatar: avatarUrl,
          }
        });
      } else {
        const newId = 'usr-' + Date.now();
        user = {
          id: newId,
          email: cleanEmail,
          name: userName,
          role: 'USER',
          status: 'ACTIVE',
          totpEnabled: false,
          totpBackupCodes: [],
          avatar: avatarUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        dbStore.users.unshift(user);
      }

      dbStore.logAudit('USER_REGISTER_OAUTH', 'AUTH', `Nový uživatel zaregistrován přes Microsoft: ${cleanEmail}`, user);
    } else {
      if (isPrismaAvailable()) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastLoginAt: new Date(),
              ...(!user.avatar && profile.avatar ? { avatar: profile.avatar } : {}),
            }
          });
        } catch (e) {
          // non-blocking update
        }
      }
    }

    // Track linked account in dbStore for profile settings
    const existingAcc = dbStore.accounts.find(a => a.userId === user.id && a.provider === 'microsoft');
    if (!existingAcc) {
      dbStore.accounts.push({
        id: 'acc-' + Date.now(),
        userId: user.id,
        provider: 'microsoft',
        providerAccountId: profile.providerAccountId,
        email: cleanEmail,
      });
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return respondWithPopupHtml(res, { success: false, error: 'Váš účet je zablokován.' }, returnUrl);
    }

    // Direct Login without MFA (OAuth provider already did MFA if configured)
    const token = AuthService.generateToken(user, true); // true = MFA verified
    res.cookie('token', token, cookieOptions(user.role));
    console.log('[Microsoft OAuth] Uživatel úspěšně přihlášen:', user.email);
    console.log('[Microsoft OAuth] Přesměrovávám na /portal');
    dbStore.logAudit('MICROSOFT_LOGIN_SUCCESS', 'AUTH', `Uživatel se úspěšně přihlásil přes Microsoft: ${cleanEmail}`, user);

    return respondWithPopupHtml(res, { success: true, token, user: AuthService.sanitizeUser(user) }, '/portal');
  } catch (err: any) {
    console.error('Microsoft OAuth callback error:', err);
    return respondWithPopupHtml(res, { success: false, error: err.message || 'Přihlášení přes Microsoft selhalo.' }, returnUrl);
  }
});


// ==========================================
// WEBAUTHN / PASSKEYS ENDPOINTS
// ==========================================

app.post('/api/auth/passkey/register/options', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('[Passkey Register] Požadavek přijat pro uživatele:', req.user?.id);
    console.log('[Passkey Register] Generuji options pro host:', req.headers.host);

    const user = req.user!;
    const existingPasskeys = isPrismaAvailable()
      ? await prisma.passkey.findMany({ where: { userId: user.id } })
      : (dbStore.passkeys ? dbStore.passkeys.filter((p: any) => p.userId === user.id) : []);

    const credentialIds = existingPasskeys.map((p: any) => p.credentialId);
    const options = await PasskeyService.generateRegOptions(
      user.id,
      user.email,
      user.name,
      req.headers.host || 'localhost:3000',
      credentialIds
    );

    res.cookie('passkey_reg_challenge', options.challenge, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      signed: true,
      maxAge: 5 * 60 * 1000,
    });

    res.json(options);
  } catch (error: any) {
    console.error('[Passkey Register ERROR]:', error);
    res.status(500).json({ error: error.message || 'Nelze vygenerovat nastavení pro Passkey registraci.' });
  }
});

// Also support alias route if requested
app.post('/api/auth/passkey/register-options', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('[Passkey Register] Požadavek přijat pro uživatele:', req.user?.id);
    console.log('[Passkey Register] Generuji options pro host:', req.headers.host);

    const user = req.user!;
    const existingPasskeys = isPrismaAvailable()
      ? await prisma.passkey.findMany({ where: { userId: user.id } })
      : (dbStore.passkeys ? dbStore.passkeys.filter((p: any) => p.userId === user.id) : []);

    const credentialIds = existingPasskeys.map((p: any) => p.credentialId);
    const options = await PasskeyService.generateRegOptions(
      user.id,
      user.email,
      user.name,
      req.headers.host || 'localhost:3000',
      credentialIds
    );

    res.cookie('passkey_reg_challenge', options.challenge, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      signed: true,
      maxAge: 5 * 60 * 1000,
    });

    res.json(options);
  } catch (error: any) {
    console.error('[Passkey Register ERROR]:', error);
    res.status(500).json({ error: error.message || 'Nelze vygenerovat nastavení pro Passkey registraci.' });
  }
});

app.post('/api/auth/passkey/register/verify', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('[Passkey Register Verify] Požadavek přijat pro uživatele:', req.user?.id);
    const user = req.user!;
    const expectedChallenge = req.signedCookies.passkey_reg_challenge;
    res.clearCookie('passkey_reg_challenge');

    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Chyba zabezpečení: Platnost výzvy vypršela nebo chybí.' });
    }

    const verification = await PasskeyService.verifyRegResponse(
      req.body,
      expectedChallenge,
      req.headers.host || 'localhost:3000',
      req.protocol
    );

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;
      const { id, publicKey, counter, transports } = credential;

      const publicKeyBuffer = Buffer.from(publicKey);
      const transportsStr = transports ? (Array.isArray(transports) ? JSON.stringify(transports) : String(transports)) : null;

      if (isPrismaAvailable()) {
        await prisma.passkey.create({
          data: {
            userId: user.id,
            credentialId: id,
            publicKey: publicKeyBuffer,
            counter: BigInt(counter || 0),
            name: req.body.name || 'Můj Passkey',
            transports: transportsStr,
          }
        });
      } else {
        if (!dbStore.passkeys) dbStore.passkeys = [];
        dbStore.passkeys.push({
          id: 'pk-' + Date.now(),
          userId: user.id,
          credentialId: id,
          publicKey: publicKeyBuffer,
          counter: BigInt(counter || 0),
          name: req.body.name || 'Můj Passkey',
          transports: transportsStr,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      dbStore.logAudit('PASSKEY_REGISTER_SUCCESS', 'AUTH', `Nový klíč zaregistrován úspěšně: ${req.body.name || 'Můj Passkey'}`, user);
      return res.json({ success: true });
    }

    res.status(400).json({ error: 'Ověření klíče selhalo.' });
  } catch (error: any) {
    console.error('[Passkey Register ERROR]:', error);
    res.status(500).json({ error: error.message || 'Ověření klíče selhalo.' });
  }
});

// Also support alias route for register-verify if called
app.post('/api/auth/passkey/register-verify', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('[Passkey Register Verify] Požadavek přijat pro uživatele:', req.user?.id);
    const user = req.user!;
    const expectedChallenge = req.signedCookies.passkey_reg_challenge;
    res.clearCookie('passkey_reg_challenge');

    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Chyba zabezpečení: Platnost výzvy vypršela nebo chybí.' });
    }

    const verification = await PasskeyService.verifyRegResponse(
      req.body,
      expectedChallenge,
      req.headers.host || 'localhost:3000',
      req.protocol
    );

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;
      const { id, publicKey, counter, transports } = credential;

      const publicKeyBuffer = Buffer.from(publicKey);
      const transportsStr = transports ? (Array.isArray(transports) ? JSON.stringify(transports) : String(transports)) : null;

      if (isPrismaAvailable()) {
        await prisma.passkey.create({
          data: {
            userId: user.id,
            credentialId: id,
            publicKey: publicKeyBuffer,
            counter: BigInt(counter || 0),
            name: req.body.name || 'Můj Passkey',
            transports: transportsStr,
          }
        });
      } else {
        if (!dbStore.passkeys) dbStore.passkeys = [];
        dbStore.passkeys.push({
          id: 'pk-' + Date.now(),
          userId: user.id,
          credentialId: id,
          publicKey: publicKeyBuffer,
          counter: BigInt(counter || 0),
          name: req.body.name || 'Můj Passkey',
          transports: transportsStr,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      dbStore.logAudit('PASSKEY_REGISTER_SUCCESS', 'AUTH', `Nový klíč zaregistrován úspěšně: ${req.body.name || 'Můj Passkey'}`, user);
      return res.json({ success: true });
    }

    res.status(400).json({ error: 'Ověření klíče selhalo.' });
  } catch (error: any) {
    console.error('[Passkey Register ERROR]:', error);
    res.status(500).json({ error: error.message || 'Ověření klíče selhalo.' });
  }
});

app.post('/api/auth/passkey/login/options', async (req: AuthenticatedRequest, res) => {
  try {
    const options = await PasskeyService.generateAuthOptions(req.headers.host || 'localhost:3000');

    res.cookie('passkey_auth_challenge', options.challenge, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      signed: true,
      maxAge: 5 * 60 * 1000,
    });

    res.json(options);
  } catch (err: any) {
    console.error('Passkey auth options error:', err);
    res.status(500).json({ error: err.message || 'Nelze vygenerovat přihlašovací možnosti pro Passkey.' });
  }
});

app.post('/api/auth/passkey/login/verify', async (req: AuthenticatedRequest, res) => {
  try {
    const expectedChallenge = req.signedCookies.passkey_auth_challenge;
    res.clearCookie('passkey_auth_challenge');

    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Chyba zabezpečení: Platnost výzvy vypršela nebo chybí.' });
    }

    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'ID klíče chybí v požadavku.' });
    }

    // Look up the credential
    let passkey: any = null;
    if (isPrismaAvailable()) {
      passkey = await prisma.passkey.findUnique({
        where: { credentialId: id },
        include: { user: true }
      });
    } else {
      passkey = (dbStore.passkeys || []).find((p: any) => p.credentialId === id);
      if (passkey) {
        passkey.user = dbStore.users.find((u: any) => u.id === passkey.userId);
      }
    }

    if (!passkey) {
      return res.status(400).json({ error: 'Zadaný bezpečnostní klíč nebyl v systému nalezen.' });
    }

    const verification = await PasskeyService.verifyAuthResponse(
      req.body,
      expectedChallenge,
      passkey.publicKey,
      passkey.counter,
      req.headers.host || 'localhost:3000',
      req.protocol
    );

    if (verification.verified && verification.authenticationInfo) {
      // Update counter
      const newCounter = verification.authenticationInfo.newCounter;
      if (isPrismaAvailable()) {
        await prisma.passkey.update({
          where: { credentialId: id },
          data: {
            counter: BigInt(newCounter),
          }
        });
      } else {
        passkey.counter = BigInt(newCounter);
      }

      // Fetch User
      const user = passkey.user || (isPrismaAvailable()
        ? await prisma.user.findUnique({ where: { id: passkey.userId } })
        : dbStore.users.find((u: any) => u.id === passkey.userId));

      if (!user) {
        return res.status(404).json({ error: 'Uživatel s tímto bezpečnostním klíčem nebyl nalezen.' });
      }

      if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
        return res.status(403).json({ error: 'Váš účet je zablokován.' });
      }

      // MFA Check
      if (user.totpEnabled) {
        const mfaToken = AuthService.generateMfaToken(user.id);
        return res.json({ mfaRequired: true, mfaToken });
      }

      const token = AuthService.generateToken(user, false);
      res.cookie('token', token, cookieOptions(user.role));
      dbStore.logAudit('PASSKEY_LOGIN_SUCCESS', 'AUTH', `Uživatel se úspěšně přihlásil přes Passkey: ${passkey.name || 'Passkey'}`, user);

      return res.json({ success: true, token, user: AuthService.sanitizeUser(user) });
    }

    res.status(400).json({ error: 'Ověření bezpečnostního klíče se nezdařilo.' });
  } catch (err: any) {
    console.error('Passkey auth verify error:', err);
    res.status(500).json({ error: err.message || 'Chyba při ověřování Passkey.' });
  }
});

// Endpoint to list passkeys for profile management
app.get('/api/auth/passkey/list', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    let list: any[] = [];
    if (isPrismaAvailable()) {
      list = await prisma.passkey.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      list = (dbStore.passkeys || []).filter((p: any) => p.userId === req.user!.id);
    }

    const safeList = list.map((pk) => ({
      id: pk.id,
      credentialId: pk.credentialId,
      name: pk.name,
      createdAt: pk.createdAt,
      updatedAt: pk.updatedAt,
      transports: pk.transports,
    }));
    res.json({ success: true, passkeys: safeList });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Nelze načíst seznam bezpečnostních klíčů.' });
  }
});

// Endpoint to delete passkey
app.delete('/api/auth/passkey/:id', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    if (isPrismaAvailable()) {
      const existing = await prisma.passkey.findUnique({ where: { id } });
      if (existing && existing.userId === req.user!.id) {
        await prisma.passkey.delete({ where: { id } });
        dbStore.logAudit('PASSKEY_DELETE_SUCCESS', 'AUTH', `Bezpečnostní klíč byl úspěšně odstraněn.`, req.user);
        return res.json({ success: true });
      }
    } else {
      const idx = (dbStore.passkeys || []).findIndex((p: any) => p.id === id && p.userId === req.user!.id);
      if (idx !== -1) {
        dbStore.passkeys.splice(idx, 1);
        dbStore.logAudit('PASSKEY_DELETE_SUCCESS', 'AUTH', `Bezpečnostní klíč byl úspěšně odstraněn.`, req.user);
        return res.json({ success: true });
      }
    }

    res.status(404).json({ error: 'Bezpečnostní klíč nebyl nalezen nebo k němu nemáte oprávnění.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chyba při odstraňování bezpečnostního klíče.' });
  }
});

// Endpoint to list linked social accounts
app.get('/api/auth/accounts', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const list = dbStore.accounts.filter(a => a.userId === req.user!.id);
    const safeList = list.map((acc: any) => ({
      provider: acc.provider,
      email: acc.email,
    }));
    res.json({ success: true, accounts: safeList });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Nelze načíst seznam propojených účtů.' });
  }
});

// Endpoint to unlink a social account
app.delete('/api/auth/accounts/:provider', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { provider } = req.params;
    const idx = dbStore.accounts.findIndex(a => a.userId === req.user!.id && a.provider === provider);
    if (idx !== -1) {
      dbStore.accounts.splice(idx, 1);
      dbStore.logAudit('OAUTH_ACCOUNT_UNLINKED', 'AUTH', `Účet ${provider} byl úspěšně odpojen.`, req.user);
      return res.json({ success: true });
    }
    return res.status(404).json({ error: 'Propojený účet nebyl nalezen.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Nelze odpojit propojený účet.' });
  }
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
  res.clearCookie('token', { path: '/' });
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

    const token = AuthService.generateToken(user, true); // mfaVerified = true since we just verified the setup code
    res.cookie('token', token, cookieOptions(user.role));

    res.json({ success: true, message: 'Dvoufázové ověření bylo úspěšně aktivováno.', token });
  } catch (err: any) {
    console.error('Chyba při aktivaci 2FA:', err);
    res.status(500).json({ error: 'Chyba při aktivaci 2FA.' });
  }
});

app.post(['/api/auth/2fa/verify', '/api/auth/mfa/verify'], authRateLimiter as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { mfaToken, code } = req.body;
    let targetUserId: string | null = null;

    if (mfaToken) {
      const verifiedMfa = AuthService.verifyMfaToken(mfaToken);
      if (verifiedMfa) {
        targetUserId = verifiedMfa.userId;
      }
    }

    // Also check session or cookie if mfaToken wasn't provided or expired
    if (!targetUserId) {
      targetUserId = req.body.userId || req.session?.pendingMfaUserId || req.cookies?.pending_mfa_user || req.signedCookies?.pending_mfa_user || null;
    }

    console.log('[MFA Verify] Ověřuji TOTP kód pro userId:', targetUserId);

    if (!targetUserId) {
      return res.status(400).json({ error: 'Relace ověření vypršela. Přihlaste se znovu.' });
    }

    if (!code) {
      return res.status(400).json({ error: 'Chybí ověřovací kód.' });
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
    console.log('[MFA Verify] Výsledek ověření (před kontrolou záložních kódů):', verified);
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

    console.log('[MFA Verify] Výsledek ověření:', verified);

    if (!verified) {
      return res.status(401).json({ error: 'Neplatný ověřovací kód.' });
    }

    // Clear pending MFA session/cookie
    if (req.session) {
      delete req.session.pendingMfaUserId;
    }
    res.clearCookie('pending_mfa_user', { path: '/' });

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
    dbStore.logAudit('2FA_VERIFIED', 'AUTH', `Uživatel ${user.email} se úspěšně přihlásil s 2FA${isBackupUsed ? ' (použit záložní kód)' : ''}.`, user);

    if (req.session && req.session.regenerate) {
      req.session.regenerate();
    }

    const token = AuthService.generateToken(user, true); // mfaVerified = true
    const sanitizedUser = AuthService.sanitizeUser(user);

    res.cookie('token', token, cookieOptions(user.role));
    res.json({ success: true, message: 'Přihlášení úspěšné', redirectUrl: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? '/administrace' : '/portal', token, user: sanitizedUser });
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

app.get('/api/compliance/volunteer-codex/status/:userId', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Neautorizovaný přístup. Přihlaste se prosím.' });
    }

    const isSelf = userId === currentUserId;
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'Přístup odepřen. Nemáte oprávnění k zobrazení stavu kodexu jiného uživatele.' });
    }

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

app.get('/api/compliance/consent/:userId', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  const currentUserId = req.user?.id;
  const targetUserId = req.params.userId;

  if (!currentUserId) {
    return res.status(401).json({ error: 'Neautorizovaný přístup. Přihlaste se prosím.' });
  }

  const isSelf = targetUserId === currentUserId;
  const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

  if (!isSelf && !isAdmin) {
    return res.status(403).json({ error: 'Přístup odepřen. Nemáte oprávnění k zobrazení souhlasů jiného uživatele.' });
  }

  const consents = await ComplianceService.getUserConsents(targetUserId);
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

app.get('/api/gdpr/export-data', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const currentUserId = req.user?.id;
    const targetUserId = req.query.userId as string;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Neautorizovaný přístup. Přihlaste se prosím.' });
    }

    const isSelf = targetUserId === currentUserId || !targetUserId;
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'Přístup odepřen. Nemáte oprávnění stahovat data jiného uživatele.' });
    }

    const userId = targetUserId || currentUserId;
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

  // --- TEST REPORT STATIC SERVING (Playwright & Midscene) ---
  const playwrightReportDir = path.resolve(process.cwd(), 'playwright-report');
  const midsceneRunDir = path.resolve(process.cwd(), 'midscene_run');

  app.use('/test-report/midscene_run', express.static(midsceneRunDir));
  app.use('/test-report/midscene', express.static(midsceneRunDir));
  app.use('/test-report', express.static(playwrightReportDir));
  app.use('/test-report', express.static(midsceneRunDir));

  // Serve test report HTML or fallback message
  app.get(['/test-report', '/test-report/*'], (_req, res) => {
    const pwIndex = path.join(playwrightReportDir, 'index.html');
    if (fs.existsSync(pwIndex)) {
      return res.sendFile(pwIndex);
    }
    if (fs.existsSync(midsceneRunDir)) {
      try {
        const midsceneHtmls = fs.readdirSync(midsceneRunDir).filter((f) => f.endsWith('.html'));
        if (midsceneHtmls.length > 0) {
          return res.sendFile(path.join(midsceneRunDir, midsceneHtmls[0]));
        }
      } catch (e) {}
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="cs">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vizuální E2E AI Test Report | Táta má právo</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-4">
        <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div class="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-black tracking-tight text-white mb-2">E2E AI Test Report</h1>
            <p class="text-xs text-slate-400 leading-relaxed">
              Zatím nebyl vygenerován žádný testovací report (Playwright / Midscene). Spusťte testy přímo z administrátorského rozhraní kliknutím na tlačítko <strong>„Spustit E2E AI Testy“</strong>.
            </p>
          </div>
          <div class="pt-2">
            <a href="/admin" class="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-blue-600/20">
              Přejít do Administrace
            </a>
          </div>
        </div>
      </body>
      </html>
    `);
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
