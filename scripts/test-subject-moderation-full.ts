import express from 'express';
import http from 'http';
import { prisma, isPrismaAvailable, checkDatabaseReachable } from '../src/db/prisma';
import { subjektService } from '../src/services/subjektService';
import { AuthService } from '../src/services/authService';
import { dbStore } from '../src/services/dbStore';
import subjektRoutes from '../src/routes/subjektRoutes';
import { parseAuthToken } from '../src/middleware/authMiddleware';
import { User } from '../types';

async function runFullSubjectModerationTest() {
  console.log('===============================================================');
  console.log('  KOMPLETNÍ FUNKČNÍ TEST: REGISTR SUBJEKTŮ & MODERACE (DEV3)  ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;
  const testResults: { name: string; status: 'PASS' | 'FAIL'; details?: string }[] = [];

  function assert(condition: boolean, testName: string, failureDetails?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
      testResults.push({ name: testName, status: 'PASS' });
    } else {
      console.error(`  [FAIL] ${testName}${failureDetails ? ' -> ' + failureDetails : ''}`);
      failed++;
      testResults.push({ name: testName, status: 'FAIL', details: failureDetails });
    }
  }

  // Setup express test app
  const app = express();
  app.use(express.json());
  app.use(parseAuthToken as any);
  app.use('/api/subjekty', subjektRoutes);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  async function apiRequest(path: string, options: { method?: string; body?: any; token?: string } = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }
    const res = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, body: data };
  }

  let testUserId = `usr-test-submitter-${Date.now()}`;
  let testUser2Id = `usr-test-other-${Date.now()}`;
  let testModId = `usr-test-mod-${Date.now()}`;
  let userToken = '';
  let user2Token = '';
  let modToken = '';

  let createdSubject1Id = '';
  let createdSubject2Id = '';
  let createdSubject3Id = '';

  try {
    const isDbReachable = await checkDatabaseReachable();
    console.log(`[Database Status] DB Reachable: ${isDbReachable}, Prisma Available: ${isPrismaAvailable()}\n`);

    // -------------------------------------------------------------
    // KROK 0: Příprava testovacích identit a JWT tokenů
    // -------------------------------------------------------------
    console.log('--- FÁZE 1: Příprava uživatelských účtů a autentizace ---');
    
    const user1Obj: User = {
      id: testUserId,
      email: `test-submitter-${Date.now()}@tatamapravo.cz`,
      name: 'Jan Testovací Otec',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const user2Obj: User = {
      id: testUser2Id,
      email: `test-other-user-${Date.now()}@tatamapravo.cz`,
      name: 'Petr Druhý Uživatel',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const modObj: User = {
      id: testModId,
      email: `test-moderator-${Date.now()}@tatamapravo.cz`,
      name: 'Alena Moderátorka',
      role: 'MODERATOR',
      status: 'ACTIVE',
      totpEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isPrismaAvailable()) {
      try {
        await prisma.user.createMany({
          data: [
            { id: user1Obj.id, email: user1Obj.email, name: user1Obj.name, role: user1Obj.role },
            { id: user2Obj.id, email: user2Obj.email, name: user2Obj.name, role: user2Obj.role },
            { id: modObj.id, email: modObj.email, name: modObj.name, role: modObj.role, totpEnabled: true },
          ],
        });
      } catch (err) {
        console.warn('Prisma user creation notice:', err);
      }
    }

    dbStore.users.push(user1Obj, user2Obj, modObj);

    userToken = AuthService.generateToken({ id: user1Obj.id, role: 'USER' }, false);
    user2Token = AuthService.generateToken({ id: user2Obj.id, role: 'USER' }, false);
    modToken = AuthService.generateToken({ id: modObj.id, role: 'MODERATOR' }, true);

    assert(!!testUserId && !!testModId, 'Testovací uživatel (USER) a moderátor (MODERATOR) byli úspěšně inicializováni');

    // -------------------------------------------------------------
    // KROK 1: Přidání subjektu běžným uživatelem (POST /api/subjekty/submit)
    // -------------------------------------------------------------
    console.log('\n--- FÁZE 2: Přidání návrhu subjektu uživatelem → NEOVĚŘENO ---');

    // Pokus bez přihlášení -> 401
    const unauthSubmitRes = await apiRequest('/api/subjekty/submit', {
      method: 'POST',
      body: {
        type: 'SOUD',
        name: 'Okresní soud v Testovicích',
        city: 'Testovice',
        region: 'Středočeský kraj',
      },
    });
    assert(unauthSubmitRes.status === 401, 'Nepřihlášený uživatel nemůže navrhnout subjekt (HTTP 401)');

    // Přihlášený uživatel odešle návrh
    const submitPayload = {
      type: 'SOUD',
      name: 'Okresní soud v Testovicích',
      titleBefore: 'Mgr.',
      position: 'Předseda opatrovnického senátu',
      institution: 'Okresní soud',
      city: 'Testovice',
      region: 'Středočeský kraj',
      address: 'Soudní 123/4',
      email: 'podatelna@os-testovice.justice.cz',
      phone: '+420 123 456 789',
      website: 'https://os-testovice.justice.cz',
      lat: 50.0878,
      lng: 14.4205,
    };

    const submitRes = await apiRequest('/api/subjekty/submit', {
      method: 'POST',
      token: userToken,
      body: submitPayload,
    });

    assert(submitRes.status === 201, 'Odeslání návrhu přihlášeným uživatelem proběhlo úspěšně (HTTP 201)');
    const createdSubj = submitRes.body;
    createdSubject1Id = createdSubj?.id;

    assert(createdSubj?.status === 'PENDING_VERIFICATION', 'Nový návrh má automaticky stav PENDING_VERIFICATION (NEOVĚŘENO)');
    assert(createdSubj?.isVerified === false, 'Nový návrh má isVerified === false');
    assert(createdSubj?.createdById === testUserId, 'Auditní stopa zaznamenala ID navrhovatele (createdById)');
    assert(createdSubj?.lat === 50.0878 && createdSubj?.lng === 14.4205, 'Zeměpisné souřadnice GPS (lat, lng) byly správně uloženy');

    // -------------------------------------------------------------
    // KROK 2: Ověření neveřejnosti - veřejná mapa a registr nesmí vidět NEOVĚŘENO
    // -------------------------------------------------------------
    console.log('\n--- FÁZE 3: Kontrola veřejného registru a mapy (NEOVĚŘENO nesmí být viditelné) ---');

    const publicListRes = await apiRequest('/api/subjekty?city=Testovice');
    assert(publicListRes.status === 200, 'Veřejný endpoint GET /api/subjekty vrací HTTP 200');
    const publicItems = publicListRes.body;
    const isLeakedInPublic = Array.isArray(publicItems) && publicItems.some((s: any) => s.id === createdSubject1Id);
    assert(!isLeakedInPublic, 'Neověřený návrh (PENDING_VERIFICATION) se NEZOBRAZUJE ve veřejném registru/mapě');

    // -------------------------------------------------------------
    // KROK 3: Uživatelský profil - navrhovatel vidí svůj návrh, jiný uživatel ne
    // -------------------------------------------------------------
    console.log('\n--- FÁZE 4: Sledování návrhů v profilu uživatele (/api/subjekty/my/submissions) ---');

    const mySubmissionsRes = await apiRequest('/api/subjekty/my/submissions', {
      token: userToken,
    });

    assert(mySubmissionsRes.status === 200, 'Uživatel může načíst své návrhy (HTTP 200)');
    const mySubmissions = mySubmissionsRes.body;
    const hasMySubmission = Array.isArray(mySubmissions) && mySubmissions.some((s: any) => s.id === createdSubject1Id && s.status === 'PENDING_VERIFICATION');
    assert(hasMySubmission, 'Navrhovatel vidí svůj odeslaný návrh ve svém profilu se stavem PENDING_VERIFICATION');

    // Jiný uživatel nesmí vidět návrhy prvního uživatele
    const otherUserSubmissionsRes = await apiRequest('/api/subjekty/my/submissions', {
      token: user2Token,
    });
    const otherSubmissions = otherUserSubmissionsRes.body;
    const leakedToOther = Array.isArray(otherSubmissions) && otherSubmissions.some((s: any) => s.id === createdSubject1Id);
    assert(!leakedToOther, 'Jiný přihlášený uživatel NEVIDÍ cizí neověřené návrhy');

    // -------------------------------------------------------------
    // KROK 4: Bezpečnostní kontrola - Běžný uživatel ani autor nemůže schválit
    // -------------------------------------------------------------
    console.log('\n--- FÁZE 5: Bezpečnostní autorizace & Ochrana proti self-approval ---');

    // Pokus běžného uživatele o schválení -> 403 (není moderátor)
    const userApproveRes = await apiRequest(`/api/subjekty/${createdSubject1Id}/approve`, {
      method: 'PUT',
      token: userToken,
      body: {},
    });
    assert(userApproveRes.status === 403, 'Běžný uživatel bez role MODERATOR nemůže schválit návrh (HTTP 403)');

    // Vytvoříme návrh moderátorem, aby se otestoval zákaz self-approval
    const modOwnProposal = await subjektService.createSubjekt({
      type: 'OSPOD',
      name: 'Návrh vytvořený přímo moderátorem',
      city: 'Praha',
      region: 'Hlavní město Praha',
      status: 'PENDING_VERIFICATION',
      isVerified: false,
      createdById: testModId,
    } as any);
    createdSubject3Id = modOwnProposal.id;

    const selfApproveRes = await apiRequest(`/api/subjekty/${createdSubject3Id}/approve`, {
      method: 'PUT',
      token: modToken,
      body: {},
    });
    assert(selfApproveRes.status === 403, 'Moderátor NEMŮŽE schválit svůj vlastní návrh - self-approval blocked (HTTP 403)');

    // -------------------------------------------------------------
    // KROK 5: Moderátorská fronta
    // -------------------------------------------------------------
    console.log('\n--- FÁZE 6: Moderátorská fronta (/api/subjekty/queue/pending) ---');

    const queueRes = await apiRequest('/api/subjekty/queue/pending', {
      token: modToken,
    });

    assert(queueRes.status === 200, 'Moderátor úspěšně načte čekající frontu (HTTP 200)');
    const queueItems = queueRes.body;
    const isInQueue = Array.isArray(queueItems) && queueItems.some((s: any) => s.id === createdSubject1Id);
    assert(isInQueue, 'Nový návrh se správně nachází v moderátorské frontě čekajících návrhů');

    // -------------------------------------------------------------
    // KROK 6: Schválení moderátorem (PUT /api/subjekty/:id/approve)
    // -------------------------------------------------------------
    console.log('\n--- FÁZE 7: Schválení subjektu moderátorem → OVĚŘENO ---');

    const approveRes = await apiRequest(`/api/subjekty/${createdSubject1Id}/approve`, {
      method: 'PUT',
      token: modToken,
      body: {
        position: 'Předseda senátu (aktualizováno moderátorem)',
      },
    });

    assert(approveRes.status === 200, 'Moderátor úspěšně schválil návrh (HTTP 200)');
    const approvedData = approveRes.body;
    assert(approvedData?.status === 'VERIFIED', 'Stav subjektu po schválení je VERIFIED');
    assert(approvedData?.isVerified === true, 'Příznak isVerified je po schválení true');
    assert(approvedData?.verifiedById === testModId, 'Auditní stopa zaznamenala ID schvalovatele (verifiedById)');
    assert(!!approvedData?.verifiedAt, 'Auditní stopa zaznamenala časové razítko schválení (verifiedAt)');

    // -------------------------------------------------------------
    // KROK 7: Kontrola viditelnosti po schválení (Registr a Mapa)
    // -------------------------------------------------------------
    console.log('\n--- FÁZE 8: Ověření zobrazení na veřejné mapě a v registru po schválení ---');

    const publicAfterApprovalRes = await apiRequest('/api/subjekty?city=Testovice');
    assert(publicAfterApprovalRes.status === 200, 'Veřejné vyhledávání vrací HTTP 200');
    const foundApproved = Array.isArray(publicAfterApprovalRes.body) && publicAfterApprovalRes.body.find((s: any) => s.id === createdSubject1Id);
    assert(!!foundApproved, 'Schválený subjekt (VERIFIED) je nyní OKAMŽITĚ dostupný ve veřejném registru');
    assert(
      foundApproved?.lat === 50.0878 && foundApproved?.lng === 14.4205,
      'Schválený subjekt obsahuje přesné GPS souřadnice pro zobrazení markeru na mapě'
    );

    // -------------------------------------------------------------
    // KROK 8: Zamítnutí nevhodného návrhu (PUT /api/subjekty/:id/reject)
    // -------------------------------------------------------------
    console.log('\n--- FÁZE 9: Scénář zamítnutí nevhodného návrhu → ZAMÍTNUTO ---');

    // Uživatel odešle nevhodný/duplicitní návrh
    const rejectSubmitRes = await apiRequest('/api/subjekty/submit', {
      method: 'POST',
      token: userToken,
      body: {
        type: 'OSPOD',
        name: 'Neexistující OSPOD Fiktiv',
        city: 'Fiktivov',
        region: 'Plzeňský kraj',
      },
    });
    assert(rejectSubmitRes.status === 201, 'Druhý návrh k zamítnutí byl vytvořen (HTTP 201)');
    const rejectSubj = rejectSubmitRes.body;
    createdSubject2Id = rejectSubj?.id;

    // Pokus o zamítnutí bez důvodu -> 400
    const rejectNoReasonRes = await apiRequest(`/api/subjekty/${createdSubject2Id}/reject`, {
      method: 'PUT',
      token: modToken,
      body: {},
    });
    assert(rejectNoReasonRes.status === 400, 'Zamítnutí bez uvedení důvodu je odmítnuto (HTTP 400 - validation required)');

    // Zamítnutí s platným důvodem
    const rejectValidRes = await apiRequest(`/api/subjekty/${createdSubject2Id}/reject`, {
      method: 'PUT',
      token: modToken,
      body: {
        rejectionReason: 'Subjekt se nepodařilo ověřit v oficiálních zdrojích, fiktivní adresa.',
      },
    });

    assert(rejectValidRes.status === 200, 'Zamítnutí moderátorem proběhlo úspěšně (HTTP 200)');
    const rejectedData = rejectValidRes.body;
    assert(rejectedData?.status === 'REJECTED', 'Stav subjektu po zamítnutí je REJECTED');
    assert(rejectedData?.isVerified === false, 'Příznak isVerified je false');
    assert(rejectedData?.rejectedById === testModId, 'Auditní stopa zaznamenala ID moderátora, který zamítl (rejectedById)');
    assert(!!rejectedData?.rejectedAt, 'Auditní stopa zaznamenala časové razítko zamítnutí (rejectedAt)');
    assert(
      rejectedData?.rejectionReason === 'Subjekt se nepodařilo ověřit v oficiálních zdrojích, fiktivní adresa.',
      'Důvod zamítnutí (rejectionReason) je správně zaznamenán'
    );

    // Zamítnutý subjekt nesmí být ve veřejném registru
    const publicRejectCheck = await apiRequest('/api/subjekty?city=Fiktivov');
    const isRejectInPublic = Array.isArray(publicRejectCheck.body) && publicRejectCheck.body.some((s: any) => s.id === createdSubject2Id);
    assert(!isRejectInPublic, 'Zamítnutý subjekt (REJECTED) se NEZOBRAZUJE ve veřejném registru ani na mapě');

    // Navrhovatel vidí důvod zamítnutí ve svém profilu
    const userSubmissionsAfterReject = await apiRequest('/api/subjekty/my/submissions', {
      token: userToken,
    });
    const foundRejectedInProfile = Array.isArray(userSubmissionsAfterReject.body) && userSubmissionsAfterReject.body.find((s: any) => s.id === createdSubject2Id);
    assert(foundRejectedInProfile?.status === 'REJECTED', 'Uživatel vidí zamítnutý stav ve svém profilu');
    assert(
      foundRejectedInProfile?.rejectionReason === 'Subjekt se nepodařilo ověřit v oficiálních zdrojích, fiktivní adresa.',
      'Uživatel má ve svém profilu k dispozici vysvětlení zamítnutí'
    );

  } catch (err: any) {
    console.error('\n[FATAL TEST ERROR]:', err);
    assert(false, 'Neočekávaná výjimka během testu', err?.message || String(err));
  } finally {
    // -------------------------------------------------------------
    // KROK 9: Úklid testovacích dat (Data Cleanup)
    // -------------------------------------------------------------
    console.log('\n--- FÁZE 10: Úklid testovacích dat a zachování integrity DB ---');
    try {
      const userIds = [testUserId, testUser2Id, testModId].filter(Boolean);
      const subIds = [createdSubject1Id, createdSubject2Id, createdSubject3Id].filter(Boolean);
      
      if (isPrismaAvailable()) {
        if (subIds.length > 0) {
          await prisma.subjekt.deleteMany({
            where: { id: { in: subIds } },
          });
        }
        if (userIds.length > 0) {
          await prisma.user.deleteMany({
            where: { id: { in: userIds } },
          });
        }
      }

      dbStore.subjekty = dbStore.subjekty.filter(s => !subIds.includes(s.id));
      dbStore.users = dbStore.users.filter(u => !userIds.includes(u.id));
      console.log('  [CLEANUP] Testovací subjekty a uživatelské účty byly bezpečně odstraněny.');
    } catch (cleanupErr) {
      console.warn('  [CLEANUP WARNING]:', cleanupErr);
    }

    server.close();
  }

  console.log('\n===============================================================');
  console.log(`VÝSLEDKY TESTU: ${passed} PASS / ${failed} FAIL (Celkem: ${passed + failed})`);
  console.log('===============================================================');

  if (failed > 0) {
    console.error('❌ Některé testy selhaly!');
    process.exit(1);
  } else {
    console.log('✅ VŠECHNY FUNKČNÍ TESTY REGISTRU A MODERACE PROŠLY NA 100%!');
    process.exit(0);
  }
}

runFullSubjectModerationTest();
