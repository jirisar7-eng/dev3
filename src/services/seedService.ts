import { legalDocumentsContent } from '../data/legalDocuments';
import { NAVIGATION_ITEMS } from '../config/navigation';
import { prisma, isPrismaAvailable } from '../db/prisma.ts';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { hash as argonHash } from '@node-rs/argon2';
import { ensureAllModulePagesExist } from './PageService.ts';

export { ensureAllModulePagesExist };

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function ensureSuperAdminAccount(): Promise<{ action: 'created' | 'updated' | 'skipped' | 'error'; email: string; details: string }> {
  const targetEmail = process.env.ADMIN_INITIAL_EMAIL || process.env.SUPERADMIN_EMAIL || 'superadmin@tatovacesta.cz';
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!prisma || !isPrismaAvailable()) {
    return { action: 'skipped', email: targetEmail, details: 'Prisma klient není k dispozici.' };
  }

  try {
    // 1. Ensure Roles exist in DB so FK constraints work
    const rolesData = [
      { key: 'SUPER_ADMIN', name: 'Super Admin', description: 'Plný systémový přístup do všech vrstev (P0)', requiresMfa: true },
      { key: 'SYSTEM_ADMIN', name: 'System Admin', description: 'Správa systému a technické logy (P1)', requiresMfa: true },
      { key: 'CONTENT_MANAGER', name: 'Content Manager', description: 'Správa článků, navigace a CMS obsahu (P2)', requiresMfa: true },
      { key: 'LEGAL_EDITOR', name: 'Legal Editor', description: 'Úprava a verzování právních dokumentů (P2)', requiresMfa: true },
      { key: 'MODERATOR', name: 'Moderátor', description: 'Moderace příspěvků a poradny (P2)', requiresMfa: true },
      { key: 'VERIFIED_CONTRIBUTOR', name: 'Verified Contributor', description: 'Ověřený přispěvatel komunitního obsahu (P3)', requiresMfa: false },
      { key: 'REGISTERED_USER', name: 'Registered User', description: 'Běžný registrovaný uživatel (P4)', requiresMfa: false },
      { key: 'VERIFIED_USER', name: 'Verified User', description: 'Ověřený registrovaný uživatel (P4)', requiresMfa: false },
      { key: 'ADMIN', name: 'Administrátor', description: 'Správa obsahu, uživatelů a nastavení', requiresMfa: true },
      { key: 'VOLUNTEER', name: 'Dobrovolník', description: 'Mentoring a pomoc tátům', requiresMfa: false },
      { key: 'USER', name: 'Uživatel', description: 'Běžný registrovaný uživatel', requiresMfa: false },
    ];
    for (const r of rolesData) {
      await prisma.role.upsert({
        where: { key: r.key },
        update: { requiresMfa: r.requiresMfa, name: r.name, description: r.description },
        create: r,
      });
    }

    // Check if ANY super admin user already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'SUPER_ADMIN' },
          { email: targetEmail },
        ]
      },
    });

    // If super admin exists, DO NOT overwrite password or reset 2FA upon restart.
    if (existingSuperAdmin) {
      let roleUpdated = false;

      // Ensure role is set to SUPER_ADMIN if email matched
      if (existingSuperAdmin.role !== 'SUPER_ADMIN') {
        await prisma.user.update({
          where: { id: existingSuperAdmin.id },
          data: { role: 'SUPER_ADMIN' },
        });
        roleUpdated = true;
      }

      // Ensure UserRole relation exists
      const superAdminRole = await prisma.role.findUnique({ where: { key: 'SUPER_ADMIN' } });
      if (superAdminRole) {
        await prisma.userRole.upsert({
          where: { userId_roleId: { userId: existingSuperAdmin.id, roleId: superAdminRole.id } },
          update: {},
          create: { userId: existingSuperAdmin.id, roleId: superAdminRole.id },
        });
      }

      const msg = `Super admin účet (${existingSuperAdmin.email}) již existuje. Heslo a 2FA zachovány bez úprav. (Role aktualizována: ${roleUpdated ? 'ano' : 'ne'}).`;
      console.log(`[Admin Seed] ${msg}`);
      return { action: 'updated', email: existingSuperAdmin.email, details: msg };
    } else {
      // User does NOT exist yet - bootstrap only if ADMIN_INITIAL_PASSWORD is explicitly set
      if (!initialPassword || initialPassword.trim().length === 0) {
        const warning = `Super admin neexistuje a ADMIN_INITIAL_PASSWORD není v env nastaveno. Účet nebyl vytvořen.`;
        console.warn(`[Admin Seed] ${warning}`);
        return { action: 'skipped', email: targetEmail, details: warning };
      }

      const passwordHash = await hashPassword(initialPassword.trim());
      const newUserId = `usr-superadmin-${crypto.randomUUID()}`;
      const newUser = await prisma.user.create({
        data: {
          id: newUserId,
          email: targetEmail,
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
          passwordHash,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin',
        },
      });

      // Link UserRole mapping table
      const superAdminRole = await prisma.role.findUnique({ where: { key: 'SUPER_ADMIN' } });
      if (superAdminRole) {
        await prisma.userRole.create({
          data: { userId: newUser.id, roleId: superAdminRole.id },
        });
      }

      // Create UserProfile
      try {
        await (prisma as any).userProfile.create({
          data: {
            userId: newUser.id,
            firstName: 'Super',
            lastName: 'Admin',
            autoFillDocs: true,
          },
        });
      } catch (pErr) {
        // profile already exists or optional
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: newUser.id,
          userEmail: newUser.email,
          action: 'SUPERADMIN_INITIALIZED',
          module: 'AUTH',
          details: `Vytvořen nový SUPER_ADMIN účet ${targetEmail} přes inicializaci.`,
        },
      });

      const msg = `Úspěšně vytvořen nový SUPER_ADMIN účet ${targetEmail} v databázi.`;
      console.log(`[Admin Seed] ${msg}`);
      return { action: 'created', email: targetEmail, details: msg };
    }
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    const errorCode = err?.code || '';
    const isConnError = 
      errorCode === 'EAI_AGAIN' ||
      errorCode === 'ENOTFOUND' ||
      errorCode === 'ECONNREFUSED' ||
      errorCode === 'P1001' ||
      errorMsg.includes('getaddrinfo') ||
      errorMsg.includes("Can't reach database server") ||
      errorMsg.includes('connection failed') ||
      errorMsg.includes('unreachable') ||
      errorMsg.includes('timeout');

    if (isConnError) {
      console.info(`[Admin Seed Info] Databáze není dostupná (${errorCode || 'EAI_AGAIN'}). Seeding přeskočen, aplikace běží v režimu in-memory fallback.`);
      return { action: 'skipped', email: targetEmail, details: 'Database connection failed, falling back to local memory.' };
    }

    console.error(`[Admin Seed Error]:`, err);
    return { action: 'error', email: targetEmail, details: errorMsg };
  }
}

export async function seedDatabaseIfEmpty() {
  if (!prisma || !isPrismaAvailable()) {
    console.log('[Prisma Seed] Databáze není dostupná, přeskakuji seeding.');
    return;
  }

  try {
    // 0. Ensure Super Admin is present or updated
    const adminResult = await ensureSuperAdminAccount();
    if (adminResult.action === 'error' || !isPrismaAvailable()) {
      console.log('[Prisma Seed] Nastala chyba při inicializaci databáze nebo připojení selhalo, přeskakuji seeding.');
      return;
    }

    const userCount = await prisma.user.count().catch(() => 0);
    const navCount = await prisma.navigationItem.count().catch(() => 0);
    const pageCount = await prisma.page.count().catch(() => 0);
    const catCount = await prisma.category.count().catch(() => 0);
    const faqCount = await prisma.fAQ.count().catch(() => 0);

    if (userCount > 1 && navCount > 0 && pageCount > 0 && catCount > 0 && faqCount > 0) {
      console.log('[Prisma Seed] Databáze již obsahuje uživatele i kompletní CMS data. Kontroluji stránky modulů...');
      await ensureAllModulePagesExist();
      return;
    }

    console.log('[Prisma Seed] Seeding databáze inicializačními daty...');

    // 1. Roles
    const rolesData = [
      { key: 'SUPER_ADMIN', name: 'Super Admin', description: 'Plný systémový přístup do všech vrstev (P0)', requiresMfa: true },
      { key: 'SYSTEM_ADMIN', name: 'System Admin', description: 'Správa systému a technické logy (P1)', requiresMfa: true },
      { key: 'CONTENT_MANAGER', name: 'Content Manager', description: 'Správa článků, navigace a CMS obsahu (P2)', requiresMfa: true },
      { key: 'LEGAL_EDITOR', name: 'Legal Editor', description: 'Úprava a verzování právních dokumentů (P2)', requiresMfa: true },
      { key: 'MODERATOR', name: 'Moderátor', description: 'Moderace příspěvků a poradny (P2)', requiresMfa: true },
      { key: 'VERIFIED_CONTRIBUTOR', name: 'Verified Contributor', description: 'Ověřený přispěvatel komunitního obsahu (P3)', requiresMfa: false },
      { key: 'REGISTERED_USER', name: 'Registered User', description: 'Běžný registrovaný uživatel (P4)', requiresMfa: false },
      { key: 'VERIFIED_USER', name: 'Verified User', description: 'Ověřený registrovaný uživatel (P4)', requiresMfa: false },
      { key: 'ADMIN', name: 'Administrátor', description: 'Správa obsahu, uživatelů a nastavení', requiresMfa: true },
      { key: 'VOLUNTEER', name: 'Dobrovolník', description: 'Mentoring a pomoc tátům', requiresMfa: false },
      { key: 'USER', name: 'Uživatel', description: 'Běžný registrovaný uživatel', requiresMfa: false },
    ];

    for (const r of rolesData) {
      await prisma.role.upsert({
        where: { key: r.key },
        update: { requiresMfa: r.requiresMfa, name: r.name, description: r.description },
        create: r,
      });
    }

    // 2. Permissions
    const permissionsData = [
      { key: 'users.manage', name: 'Správa uživatelů', category: 'AUTH', description: 'Změny rolí a správa účtů' },
      { key: 'content.publish', name: 'Publikování obsahu', category: 'CMS', description: 'Vytváření a úprava stránek a článků' },
      { key: 'legal.edit', name: 'Úprava právních dokumentů', category: 'COMPLIANCE', description: 'Verzování právních dokumentů a compliance' },
      { key: 'system.logs', name: 'Systémové logy', category: 'SYSTEM', description: 'Sledování technických logů a stavu systému' },
      { key: 'moderator.moderate', name: 'Moderace', category: 'MODERATION', description: 'Moderování komunitního obsahu' },
      { key: 'system.github.publish', name: 'Publikování na GitHub', category: 'SYSTEM', description: 'Nástroj pro přímé publikování zdrojového kódu na GitHub' },
    ];

    for (const p of permissionsData) {
      await prisma.permission.upsert({
        where: { key: p.key },
        update: { name: p.name, category: p.category, description: p.description },
        create: p,
      });
    }

    // Link Roles with Permissions
    const rolePermissionMap: Record<string, string[]> = {
      SUPER_ADMIN: ['users.manage', 'content.publish', 'legal.edit', 'system.logs', 'moderator.moderate', 'system.github.publish'],
      SYSTEM_ADMIN: ['users.manage', 'content.publish', 'legal.edit', 'system.logs'],
      CONTENT_MANAGER: ['content.publish'],
      LEGAL_EDITOR: ['legal.edit'],
      MODERATOR: ['moderator.moderate'],
      ADMIN: ['users.manage', 'content.publish', 'legal.edit'],
    };

    for (const [roleKey, permKeys] of Object.entries(rolePermissionMap)) {
      const role = await prisma.role.findUnique({ where: { key: roleKey } });
      if (role) {
        for (const permKey of permKeys) {
          const perm = await prisma.permission.findUnique({ where: { key: permKey } });
          if (perm) {
            await prisma.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: role.id,
                  permissionId: perm.id,
                },
              },
              update: {},
              create: {
                roleId: role.id,
                permissionId: perm.id,
              },
            });
          }
        }
      }
    }

    // 3. Default Users
    const defaultPasswordHash = await hashPassword('Heslo123!');
    const usersData = [
      {
        id: 'usr-superadmin',
        email: 'superadmin@tatovacesta.cz',
        name: 'Hlavní Správce (Super Admin)',
        role: 'SUPER_ADMIN' as const,
        passwordHash: defaultPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      }
    ];

    for (const u of usersData) {
      const existingUser = await prisma.user.findUnique({ where: { email: u.email } });
      if (!existingUser) {
        await prisma.user.create({ data: u });
      }
    }

    // 4. Default ContentStrings
    const textData = [
      { key: 'home.hero.title', category: 'home', valueCzech: 'Táta má právo. Dítě má právo na oba rodiče.', valueEnglish: 'Dad Has a Right. Child Has a Right to Both Parents.', description: 'Hlavní nadpis na úvodní stránce', active: true },
      { key: 'home.hero.subtitle', category: 'home', valueCzech: 'Komplexní opora pro otce v opatrovnických situacích. Právní orientace, psychologická podpora a spravedlivá péče zohledňující NEJLEPŠÍ ZÁJEM DÍTĚTE.', valueEnglish: 'Comprehensive support for fathers in custody situations.', description: 'Podnadpis v hlavním banneru', active: true },
      { key: 'home.hero.cta', category: 'home', valueCzech: 'Prozkoumat poradnu', valueEnglish: 'Explore Advice', description: 'Tlačítko v hlavním banneru', active: true },
      { key: 'nav.home', category: 'nav', valueCzech: 'Domů', valueEnglish: 'Home', description: 'Položka menu Domů', active: true },
      { key: 'nav.about', category: 'nav', valueCzech: 'O projektu', valueEnglish: 'About', description: 'Položka menu O projektu', active: true },
      { key: 'nav.legal', category: 'nav', valueCzech: 'Právní poradna', valueEnglish: 'Legal Advice', description: 'Položka menu Právní poradna', active: true },
      { key: 'nav.modules', category: 'nav', valueCzech: 'Moduly & Nástroje', valueEnglish: 'Modules & Tools', description: 'Položka menu Moduly', active: true },
      { key: 'nav.compliance', category: 'nav', valueCzech: 'Dokumenty & Práva', valueEnglish: 'Documents & Compliance', description: 'Položka menu Compliance', active: true },
      { key: 'login.title', category: 'login', valueCzech: 'Přihlášení do portálu', valueEnglish: 'Portal Login', description: 'Nadpis přihlašovacího formuláře', active: true },
      { key: 'login.email', category: 'login', valueCzech: 'E-mailová adresa', valueEnglish: 'Email Address', description: 'Štítek pro emailové pole', active: true },
      { key: 'footer.copyright', category: 'footer', valueCzech: '© 2026 Táta má právo • Všechna práva vyhrazena', valueEnglish: '© 2026 Dad Has a Right • All rights reserved', description: 'Patička copyright', active: true },
      { key: 'core.principle.title', category: 'core', valueCzech: 'NEJLEPŠÍ ZÁJEM DÍTĚTE', valueEnglish: 'BEST INTERESTS OF THE CHILD', description: 'Hlavní princip portálu', active: true },
      { key: 'core.principle.desc', category: 'core', valueCzech: 'Všechna doporučení, nástroje a metodiky stavíme na nezpochybnitelném právu dítěte mít zdravý a rovnocenný vztah s oběma rodiči.', valueEnglish: 'All recommendations are built on the child\'s right to both parents.', description: 'Popis hlavního principu', active: true },
    ];

    for (const txt of textData) {
      await prisma.contentString.upsert({
        where: { key: txt.key },
        update: {},
        create: txt,
      });
    }

    // 5. Default Themes & Variables
    const defaultTheme = await prisma.theme.upsert({
      where: { key: 'default' },
      update: {},
      create: {
        key: 'default',
        name: 'Výchozí Světlý Vzhled',
        description: 'Oficiální barevný profil portálu Táta má právo',
        isDefault: true,
        active: true,
        context: 'GLOBAL',
      },
    });

    const themeVars = [
      { key: 'primary', value: '#1e3a8a', label: 'Hlavní (Primary)', category: 'color' },
      { key: 'secondary', value: '#0284c7', label: 'Sekundární (Secondary)', category: 'color' },
      { key: 'background', value: '#f8fafc', label: 'Pozadí (Background)', category: 'color' },
      { key: 'surface', value: '#ffffff', label: 'Povrch karet (Surface)', category: 'color' },
      { key: 'text', value: '#1e293b', label: 'Text těla (Text)', category: 'color' },
      { key: 'textMuted', value: '#64748b', label: 'Tlumený text (Text Muted)', category: 'color' },
      { key: 'heading', value: '#0f172a', label: 'Text nadpisů (Heading)', category: 'color' },
      { key: 'link', value: '#2563eb', label: 'Odkazy (Link)', category: 'color' },
      { key: 'border', value: '#e2e8f0', label: 'Rámečky (Border)', category: 'color' },
      { key: 'button', value: '#1e3a8a', label: 'Tlačítko (Button)', category: 'color' },
      { key: 'buttonHover', value: '#0f172a', label: 'Tlačítko Hover (Button Hover)', category: 'color' },
      { key: 'success', value: '#16a34a', label: 'Úspěch (Success)', category: 'color' },
      { key: 'warning', value: '#d97706', label: 'Varování (Warning)', category: 'color' },
      { key: 'error', value: '#dc2626', label: 'Chyba (Error)', category: 'color' },
    ];

    if (defaultTheme && defaultTheme.id) {
      for (const tv of themeVars) {
        const existing = await prisma.themeVariable.findFirst({
          where: { themeId: defaultTheme.id, key: tv.key },
        });
        if (!existing) {
          await prisma.themeVariable.create({
            data: {
              themeId: defaultTheme.id,
              key: tv.key,
              value: tv.value,
              label: tv.label,
              category: tv.category,
            },
          });
        }
      }
    }

    // 6. Default Modules
    const modulesData = [
      {
        key: 'system-test-module',
        name: 'System Test Module (Technický Test)',
        version: '1.0.0',
        enabled: true,
        public: false,
        config: JSON.stringify({ maxRequestsPerMin: 100, debugMode: true, apiEndpointUrl: 'https://test.api' }),
        description: 'Demonstrační technický modul pro verifikaci funkčnosti Module Engine, RBAC a konfigurací.',
        icon: 'TestTube',
      },
      {
        key: 'child_support_calc',
        name: 'Kalkulačka výživného',
        version: '1.0.0',
        enabled: true,
        public: true,
        config: JSON.stringify({ minSalary: 20000, maxChildren: 5, useDoporučenéTabulkyMSP: true }),
        description: 'Orientační výpočet výživného dle doporučujících tabulek Ministerstva spravedlnosti ČR.',
        icon: 'Calculator',
      },
      {
        key: 'handover_simulator',
        name: 'Simulátor předávání dítěte',
        version: '1.0.0',
        enabled: true,
        public: true,
        config: JSON.stringify({ enableProtocolGenerator: true, requireGPSVerification: false }),
        description: 'Nástroj pro evidenci a bezpečné předávání dítěte včetně předávacích protokolů.',
        icon: 'RefreshCw',
      },
      {
        key: 'care_calendar',
        name: 'Kalendář péče',
        version: '1.0.0',
        enabled: true,
        public: true,
        config: JSON.stringify({ defaultRotationWeeks: 2, syncWithGoogleCalendar: true }),
        description: 'Plánovač střídavé péče, prázdnin a svátků pro bezkonfliktní organizaci času.',
        icon: 'Calendar',
      },
      {
        key: 'document_templates',
        name: 'Právní dokumenty a vzory',
        version: '1.0.0',
        enabled: true,
        public: true,
        config: JSON.stringify({ allowPDFDownload: true, enableCustomFields: true }),
        description: 'Generátor návrhů na úpravu poměrů k nezletilému dítěti, dohod a odvolání.',
        icon: 'FileText',
      },
      {
        key: 'volunteering',
        name: 'Dobrovolnictví a mentoring',
        version: '1.0.0',
        enabled: true,
        public: true,
        config: JSON.stringify({ requireApproval: true, allowPeerChat: true }),
        description: 'Spojení zkušených otců (mentorů) s táty v krizových opatrovnických situacích.',
        icon: 'Users',
      },
      {
        key: 'ai_assistant',
        name: 'AI Právní & Psychologický Asistent',
        version: '0.9.0',
        enabled: false,
        public: false,
        config: JSON.stringify({ model: 'gemini-2.5-flash', disclaimerNoticeRequired: true }),
        description: 'Inteligentní asistent navržený pro rychlou analýzu podání a přípravu na jednání OSPOD.',
        icon: 'Bot',
      },
    ];

    for (const mod of modulesData) {
      await prisma.module.upsert({
        where: { key: mod.key },
        update: {},
        create: mod,
      });
    }

    // 7. Categories & CMS Pages / Articles / FAQ
    const catJudikatura = await prisma.category.upsert({
      where: { slug: 'judikatura' },
      update: {},
      create: { slug: 'judikatura', name: 'Judikatura', description: 'Nálezy Ústavního a Nejvyššího soudu ČR' },
    });

    const catRady = await prisma.category.upsert({
      where: { slug: 'prakticke-rady' },
      update: {},
      create: { slug: 'prakticke-rady', name: 'Praktické rady', description: 'Metodiky pro komunikaci a postup' },
    });

    const catPsychologie = await prisma.category.upsert({
      where: { slug: 'psychologie' },
      update: {},
      create: { slug: 'psychologie', name: 'Psychologie', description: 'Dopady na zájem a zdraví dítěte' },
    });

    const catPartneri = await prisma.category.upsert({
      where: { slug: 'partneri-a-sponzori' },
      update: {},
      create: { slug: 'partneri-a-sponzori', name: 'Partneři a Sponzoři', description: 'Podporovatelé našeho projektu' },
    });

    // Pages
    const pagesToSeed = [
      {
        slug: 'domu',
        title: 'Táta má právo • Hlavní strana',
        content: 'Komplexní opora pro otce v opatrovnických situacích. Právní orientace, psychologická podpora a spravedlivá péče zohledňující NEJLEPŠÍ ZÁJEM DÍTĚTE.',
        published: true,
        seoTitle: 'Táta má právo | Opatrovnictví & Dítě v rozvodu',
        seoDescription: 'Komplexní podpora otců v opatrovnickém řízení se zaměřením na nejlepší zájem dítěte.',
      },
      {
        slug: 'o-projektu',
        title: 'O projektu Táta má právo',
        content: 'Projekt **Táta má právo** vznikl jako reakce na dlouhodobé nerovnosti v opatrovnickém soudnictví. Naším primárním cílem je obhajoba nezpochybnitelného práva každého dítěte na plnohodnotnou výchovu oběma rodiči.',
        published: true,
        seoTitle: 'O nás a našem poslání | Táta má právo',
        seoDescription: 'Informace o projektu Táta má právo, našem poslání, hodnotách a týmu.',
      },
      {
        slug: 'zivotni-situace',
        title: 'Životní situace a právní průvodce',
        content: 'Opatrovnické řízení vyžaduje chladnou hlavu, znalost zákona o rodině (občanského zákoníku) a aktivní součinnost s OSPOD. Zde naleznete základní metodiku krok za krokem.',
        published: true,
        seoTitle: 'Životní situace otců v opatrovnickém řízení | Táta má právo',
        seoDescription: 'Průvodce opatrovnickým řízením, součinnost s OSPOD a soudní praxe v ČR.',
      },
      {
        slug: 'clanky',
        title: 'Články, judikatura a metodiky',
        content: 'Odborné články, rozbory soudních rozhodnutí a praktická doporučení pro otce v opatrovnické praxi.',
        published: true,
        seoTitle: 'Články a judikatura k opatrovnictví | Táta má právo',
        seoDescription: 'Aktuální judikáty Ústavního soudu, návody k OSPOD a odborná doporučení.',
      },
      {
        slug: 'faq',
        title: 'Časté dotazy (FAQ)',
        content: 'Odpovědi na nejčastější otázky otců ohledně střídavé péče, výživného, OSPOD a soudu.',
        published: true,
        seoTitle: 'Časté otázky a odpovědi | Táta má právo',
        seoDescription: 'Časté dotazy týkající se opatrovnického řízení, OSPOD a práv dětí.',
      },
      {
        slug: 'kontakt',
        title: 'Kontakt a bezplatná poradna',
        content: 'Máte dotaz nebo potřebujete poradit? Napište nám přes náš kontaktní formulář nebo na info@tatovacesta.cz.',
        published: true,
        seoTitle: 'Kontaktujte nás | Táta má právo',
        seoDescription: 'Kontaktní údaje a bezplatná poradna pro otce v krizové situaci.',
      },
      {
        slug: 'podminky-uzivani',
        title: 'Podmínky užívání portálu',
        content: 'Všechny informace poskytované v rámci portálu Táta má právo mají informativní a osvětový charakter. Nenahrazují individuální právní nebo psychologickou péči poskytovanou advokáty či licencovanými terapeuty.',
        published: true,
        seoTitle: 'Podmínky užívání portálu | Táta má právo',
        seoDescription: 'Právní informace o používání webového portálu Táta má právo.',
      },
      {
        slug: 'gdpr',
        title: 'Ochrana osobních údajů (GDPR)',
        content: 'Portál Táta má právo zpracovává osobní údaje výhradně pro účely správy účtu, posílení bezpečnosti a umožnění využívání modulů. Vaše údaje nejsou předávány třetím stranám bez vašeho výslovného souhlasu.',
        published: true,
        seoTitle: 'Ochrana osobních údajů (GDPR) | Táta má právo',
        seoDescription: 'Informace o zpracování a ochraně osobních údajů uživatelů.',
      },
      {
        slug: 'dobrovolnictvi',
        title: 'Dobrovolnictví a mentorská síť',
        content: 'Propojujeme zkušené otce, kteří úspěšně prošli opatrovnickým řízením, s táty, kteří jsou na začátku a potřebují lidskou oporu a sdílení zkušeností.',
        published: true,
        seoTitle: 'Zapojte se do dobrovolnictví a mentoringu | Táta má právo',
        seoDescription: 'Staňte se mentorem nebo požádejte o pomoc zkušeného otce.',
      },
      {
        slug: 'ai-prohlaseni',
        title: 'Prohlášení o využití umělé inteligence (AI)',
        content: 'Výstupy generované AI asistentem jsou automatizovaným rozborem textových podkladů. Výstupy nemají charakter právní rady a vyžadují verifikaci lidským odborníkem.',
        published: true,
        seoTitle: 'Prohlášení o AI technologiích | Táta má právo',
        seoDescription: 'Informace o využití a limitech AI nástrojů na portálu.',
      },
      {
        slug: 'crisis',
        title: 'Krizový Akční Plán SOS',
        content: '# Krizový Akční Plán SOS\n\n**Kategorie:** 🚨 KRIZOVÁ POMOC & KOMUNITA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Krizový Akční Plán SOS | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'forum',
        title: 'Komunitní Diskuzní Fórum',
        content: '# Komunitní Diskuzní Fórum\n\n**Kategorie:** 🚨 KRIZOVÁ POMOC & KOMUNITA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Komunitní Diskuzní Fórum | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'stories',
        title: 'Osobní Příběhy Tátů',
        content: '# Osobní Příběhy Tátů\n\n**Kategorie:** 🚨 KRIZOVÁ POMOC & KOMUNITA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Osobní Příběhy Tátů | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'memento',
        title: 'Memento Opatrovnických Bojů',
        content: '# Memento Opatrovnických Bojů\n\n**Kategorie:** 🚨 KRIZOVÁ POMOC & KOMUNITA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Memento Opatrovnických Bojů | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'advice',
        title: 'Právní Poradna & Zodpovězené Dotazy',
        content: '# Právní Poradna & Zodpovězené Dotazy\n\n**Kategorie:** 🚨 KRIZOVÁ POMOC & KOMUNITA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Právní Poradna & Zodpovězené Dotazy | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'support',
        title: 'Podpora Projektu & Transparentní Dary',
        content: '# Podpora Projektu & Transparentní Dary\n\n**Kategorie:** 🚨 KRIZOVÁ POMOC & KOMUNITA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Podpora Projektu & Transparentní Dary | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'opatrovnicka-agenda',
        title: 'Opatrovnická agenda krok za krokem',
        content: '# Opatrovnická agenda krok za krokem\n\n**Kategorie:** ⚖️ OPATROVNICTVÍ, PRÁVO & JUDIKATURA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Opatrovnická agenda krok za krokem | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'rights',
        title: 'Práva Otců & Ústava ČR (LZPS)',
        content: '# Práva Otců & Ústava ČR (LZPS)\n\n**Kategorie:** ⚖️ OPATROVNICTVÍ, PRÁVO & JUDIKATURA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Práva Otců & Ústava ČR (LZPS) | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'judikatura',
        title: 'Precedenty & Judikatura ÚS/NS ČR',
        content: '# Precedenty & Judikatura ÚS/NS ČR\n\n**Kategorie:** ⚖️ OPATROVNICTVÍ, PRÁVO & JUDIKATURA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Precedenty & Judikatura ÚS/NS ČR | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'ke-stazeni',
        title: 'Ke Stažení & Oficiální Dokumenty',
        content: '# Ke Stažení & Oficiální Dokumenty\n\n**Kategorie:** ⚖️ OPATROVNICTVÍ, PRÁVO & JUDIKATURA\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Ke Stažení & Oficiální Dokumenty | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'state-laws',
        title: 'e-Sbírka & e-Legislativa REST API Portal',
        content: '# e-Sbírka & e-Legislativa REST API Portal\n\n**Kategorie:** 🏛️ STÁTNÍ DATA & REGISTRY\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'e-Sbírka & e-Legislativa REST API Portal | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'state-statistics',
        title: 'ČSÚ & MPSV Demografické & Soudní Statistiky',
        content: '# ČSÚ & MPSV Demografické & Soudní Statistiky\n\n**Kategorie:** 🏛️ STÁTNÍ DATA & REGISTRY\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'ČSÚ & MPSV Demografické & Soudní Statistiky | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'pripadova-databaze',
        title: 'Případová Databáze Rozsudků',
        content: '# Případová Databáze Rozsudků\n\n**Kategorie:** 🏛️ STÁTNÍ DATA & REGISTRY\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Případová Databáze Rozsudků | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'knihovna-studii',
        title: 'Knihovna Vědeckých Studií & Psychologie',
        content: '# Knihovna Vědeckých Studií & Psychologie\n\n**Kategorie:** 🎓 EDUKAČNÍ AKADEMIE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Knihovna Vědeckých Studií & Psychologie | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'videoteka',
        title: 'Edukační Videotéka & SmartVideoEmbed',
        content: '# Edukační Videotéka & SmartVideoEmbed\n\n**Kategorie:** 🎓 EDUKAČNÍ AKADEMIE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Edukační Videotéka & SmartVideoEmbed | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'vzdelavani',
        title: 'Akademie Tátů & Interaktivní Kvízy',
        content: '# Akademie Tátů & Interaktivní Kvízy\n\n**Kategorie:** 🎓 EDUKAČNÍ AKADEMIE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Akademie Tátů & Interaktivní Kvízy | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'legal-wiki',
        title: 'Právní Wiki & Slovník Pojmů',
        content: '# Právní Wiki & Slovník Pojmů\n\n**Kategorie:** 🎓 EDUKAČNÍ AKADEMIE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Právní Wiki & Slovník Pojmů | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'cesta-zakladatele',
        title: 'Příběh Zakladatele Synthesis OS',
        content: '# Příběh Zakladatele Synthesis OS\n\n**Kategorie:** 🎓 EDUKAČNÍ AKADEMIE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Příběh Zakladatele Synthesis OS | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'user-portal',
        title: 'Moje Pracovna & Osobní Složka',
        content: '# Moje Pracovna & Osobní Složka\n\n**Kategorie:** 📂 OSOBNÍ PRACOVNA & SPRÁVA PŘÍPADU\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Moje Pracovna & Osobní Složka | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'profile',
        title: 'Profil Hráče / Uživatele & Identity Hub',
        content: '# Profil Hráče / Uživatele & Identity Hub\n\n**Kategorie:** 📂 OSOBNÍ PRACOVNA & SPRÁVA PŘÍPADU\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Profil Hráče / Uživatele & Identity Hub | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'coparent-hub',
        title: 'Spolurodičovský Hub (CoParent)',
        content: '# Spolurodičovský Hub (CoParent)\n\n**Kategorie:** 📂 OSOBNÍ PRACOVNA & SPRÁVA PŘÍPADU\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Spolurodičovský Hub (CoParent) | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'ai-assistant',
        title: 'AI Právní Asistent',
        content: '# AI Právní Asistent\n\n**Kategorie:** 🤖 CHYTRÉ AI NÁSTROJE & VALIDACE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'AI Právní Asistent | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'ai-guide',
        title: 'Sémantický AI Průvodce Řízením',
        content: '# Sémantický AI Průvodce Řízením\n\n**Kategorie:** 🤖 CHYTRÉ AI NÁSTROJE & VALIDACE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Sémantický AI Průvodce Řízením | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'ai-case-manager',
        title: 'Osobní Složka Případu & AI Strategický Asistent',
        content: '# Osobní Složka Případu & AI Strategický Asistent\n\n**Kategorie:** 🤖 CHYTRÉ AI NÁSTROJE & VALIDACE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Osobní Složka Případu & AI Strategický Asistent | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'plan-pece',
        title: 'Simulátor Péče & Sourozenecké Soudržnosti',
        content: '# Simulátor Péče & Sourozenecké Soudržnosti\n\n**Kategorie:** 🤖 CHYTRÉ AI NÁSTROJE & VALIDACE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Simulátor Péče & Sourozenecké Soudržnosti | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'centrum-formularu',
        title: 'Centrum Formulářů & Chytrý Editor',
        content: '# Centrum Formulářů & Chytrý Editor\n\n**Kategorie:** 🤖 CHYTRÉ AI NÁSTROJE & VALIDACE\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Centrum Formulářů & Chytrý Editor | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'news',
        title: 'Novinky & Systémové Aktualizace',
        content: '# Novinky & Systémové Aktualizace\n\n**Kategorie:** 🛠️ ADMINISTRACE & SYSTÉM\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Novinky & Systémové Aktualizace | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'synthesis-hub',
        title: 'Synthesis OS Rozcestník & Central Hub',
        content: '# Synthesis OS Rozcestník & Central Hub\n\n**Kategorie:** 🛠️ ADMINISTRACE & SYSTÉM\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Synthesis OS Rozcestník & Central Hub | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'ai-admin',
        title: 'Autonomní AI Admin & Moderátor',
        content: '# Autonomní AI Admin & Moderátor\n\n**Kategorie:** 🛠️ ADMINISTRACE & SYSTÉM\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Autonomní AI Admin & Moderátor | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'admin',
        title: 'Administrace & Systémový Monitoring',
        content: '# Administrace & Systémový Monitoring\n\n**Kategorie:** 🛠️ ADMINISTRACE & SYSTÉM\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Administrace & Systémový Monitoring | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'ai-context',
        title: 'AI Context & Strojový Index',
        content: '# AI Context & Strojový Index\n\n**Kategorie:** 🛠️ ADMINISTRACE & SYSTÉM\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'AI Context & Strojový Index | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'user-manual',
        title: 'Nápověda & Uživatelský manuál',
        content: '# Nápověda & Uživatelský manuál\n\n**Kategorie:** 🛠️ ADMINISTRACE & SYSTÉM\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Nápověda & Uživatelský manuál | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
      {
        slug: 'sitemap',
        title: 'Architektura & Vývoj Synthesis OS (Sitemap)',
        content: '# Architektura & Vývoj Synthesis OS (Sitemap)\n\n**Kategorie:** 🛠️ ADMINISTRACE & SYSTÉM\n\n---\n\n### 📥 Stránka je připravena pro budoucí obsah.\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
        published: true,
        seoTitle: 'Architektura & Vývoj Synthesis OS (Sitemap) | Táta má právo',
        seoDescription: 'Stránka je připravena pro budoucí obsah.',
      },
    ];

    for (const p of pagesToSeed) {
      await prisma.page.upsert({
        where: { slug: p.slug },
        update: {},
        create: p,
      });
    }

    // Articles
    await prisma.article.upsert({
      where: { slug: 'stridava-pece-v-praxi' },
      update: {},
      create: {
        slug: 'stridava-pece-v-praxi',
        title: 'Střídavá péče v judikatuře Ústavního soudu',
        summary: 'Ústavní soud opakovaně potvrdil, že střídavá péče by měla být pravidlem, pokud jsou oba rodiče způsobilí dítě vychovávat.',
        content: 'Při rozhodování o opatrovnictví je prioritním hlediskem nejlepší zájem dítěte. Dle nálezů Ústavního soudu ČR (např. I. ÚS 2482/13) je střídavá péče výchozím modelem, ze kterého by měly obecné soudy vycházet, pokud oba rodiče projevují o dítě opravdový zájem a mají k jeho výchově odpovídající předpoklady.',
        published: true,
        categoryName: 'Judikatura',
        categoryId: catJudikatura.id,
      },
    });

    await prisma.article.upsert({
      where: { slug: 'jak-jednat-s-ospod' },
      update: {},
      create: {
        slug: 'jak-jednat-s-ospod',
        title: 'Jak efektivně komunikovat s OSPOD',
        summary: 'Orgán sociálně-právní ochrany dětí hraje u soudu klíčovou roli kolizního opatrovníka. Jak s ním jednat profesionálně?',
        content: '1. Vždy komunikujte věcně, písemně a slušně.\n2. Zdůrazňujte výhradně zájem dítěte, nikoli spory s bývalou partnerkou.\n3. Umožněte pracovníkům OSPOD nahlédnout do prostředí, ve kterém bude dítě pobývat.\n4. Záznamy ze schůzek si vyžadujte v písemné podobě.',
        published: true,
        categoryName: 'Praktické rady',
        categoryId: catRady.id,
      },
    });

    // FAQs
    await prisma.fAQ.createMany({
      data: [
        {
          question: 'Co dělat, když mi matka bezdůvodně odpírá styk s dítětem?',
          answer: 'Okamžitě zdokumentujte každý neuskutečněný styk (SMS, e-mail, svědectví, přítomnost na místě). Podejte návrh na vydání předběžného opatření a informujte OSPOD a příslušný okresní soud.',
          categoryName: 'Právní dotazy',
          order: 1,
          published: true,
        },
        {
          question: 'Jak se počítá výživné při střídavé péči?',
          answer: 'Při střídavé péči soud určuje výživné oběma rodičům podle jejich příjmů a rozsahu péče. Používají se doporučující tabulky Ministerstva spravedlnosti.',
          categoryName: 'Finance & Výživné',
          order: 2,
          published: true,
        },
        {
          question: 'Má otec stejná práva na informace o zdravotním stavu a škole?',
          answer: 'Ano. Pokud nebyl otec zbaven rodičovské odpovědnosti nebo mu nebyla omezená, má plné právo nahlížet do zdravotní dokumentace dítěte a komunikovat se školou.',
          categoryName: 'Rodičovská práva',
          order: 3,
          published: true,
        },
      ],
    });

    // Navigation Items
    await prisma.navigationItem.deleteMany({}); // clear any stale nav items
    
    const parents = NAVIGATION_ITEMS.filter((item) => !item.parentId);
    const children = NAVIGATION_ITEMS.filter((item) => item.parentId);

    for (const parent of parents) {
      await prisma.navigationItem.create({
        data: {
          id: parent.id,
          labelKey: parent.labelKey,
          url: parent.url,
          order: parent.order,
          target: parent.target || '_self',
          isExternal: parent.isExternal || false,
        },
      });
    }

    for (const child of children) {
      await prisma.navigationItem.create({
        data: {
          id: child.id,
          labelKey: child.labelKey,
          url: child.url,
          order: child.order,
          target: child.target || '_self',
          isExternal: child.isExternal || false,
          parentId: child.parentId,
        },
      });
    }

    // 8. Legal Documents
    const complianceDocsData = [
      {
        key: 'terms',
        title: 'Podmínky užívání portálu',
        type: 'TERMS',
        description: 'Právní vymezení informativní povahy portálu a zřeknutí se odpovědnosti za právní rady',
        content: legalDocumentsContent.terms,
        version: '1.0.0',
      },
      {
        key: 'gdpr',
        title: 'Ochrana osobních údajů (GDPR)',
        type: 'PRIVACY',
        description: 'Pravidla zpracování a ochrany osobních údajů uživatelů dle nařízení GDPR',
        content: legalDocumentsContent.gdpr,
        version: '1.0.0',
      },
      {
        key: 'cookies',
        title: 'Zásady používání souborů cookie',
        type: 'COOKIES',
        description: 'Informace o používání technických a preferenčních souborů cookie',
        content: legalDocumentsContent.cookies,
        version: '1.0.0',
      },
      {
        key: 'legal',
        title: 'Moje právní dokumenty & Právní výhrada',
        type: 'LEGAL',
        description: 'Právní výhrada k vygenerovaným návrhům na úpravu poměrů a vzorům podání',
        content: legalDocumentsContent.legal,
        version: '1.0.0',
      },
      {
        key: 'volunteer_code',
        title: 'DOBROVOLNICKÝ KODEX • Táta má právo / Synthesis OS',
        type: 'VOLUNTEER_CODE',
        description: 'Etická pravidla, zásady komunikace a odpovědného jednání dobrovolníků projektu Táta má právo / Synthesis OS',
        content: legalDocumentsContent.volunteer_code,
        version: '1.0.0',
      },
      {
        key: 'ai_statement',
        title: 'Prohlášení o využití umělé inteligence (AI)',
        type: 'AI_STATEMENT',
        description: 'Prohlášení o vývoji portálu svépomocí s využitím AI, odborných zdrojů a právní výhradě',
        content: legalDocumentsContent.ai_statement,
        version: '1.0.0',
      },
      {
        key: 'dohoda-o-spolupraci',
        title: 'Dohoda o dobrovolné spolupráci (e-Smlouva)',
        type: 'VOLUNTEER_CODE',
        description: 'Dohoda o dobrovolné spolupráci, mlčenlivosti (NDA), ochraně informací, licenci k výstupům a GDPR',
        content: legalDocumentsContent.volunteer_agreement,
        version: '1.0.0',
      },
    ];

    for (const c of complianceDocsData) {
      const doc = await prisma.legalDocument.upsert({
        where: { key: c.key },
        update: {
          title: c.title,
          type: c.type,
          description: c.description,
        },
        create: {
          key: c.key,
          title: c.title,
          type: c.type,
          description: c.description,
        },
      });

      await prisma.legalDocumentVersion.upsert({
        where: { documentId_version: { documentId: doc.id, version: c.version } },
        update: {
          content: c.content,
          status: 'PUBLISHED',
        },
        create: {
          documentId: doc.id,
          version: c.version,
          content: c.content,
          status: 'PUBLISHED',
          author: 'Hlavní Správce (Super Admin)',
        },
      });
    }

    // 9. System Settings
    const systemSettingsData = [
      { key: 'site_title', value: 'Táta má právo', category: 'general', description: 'Název portálu' },
      { key: 'contact_email', value: 'info@tatovacesta.cz', category: 'general', description: 'Kontaktní email' },
      { key: 'maintenance_mode', value: 'false', category: 'system', description: 'Stav údržby' },
      { key: 'allow_registration', value: 'true', category: 'auth', description: 'Povolení registraci' },
    ];

    for (const s of systemSettingsData) {
      await prisma.systemSetting.upsert({
        where: { key: s.key },
        update: {},
        create: s,
      });
    }

    // 10. State Statistics & Court Cases (Státní data)
    console.log('[Prisma Seed] Seedování Státních dat (Statistiky, Judikatura, e-Sbírka)...');

    const defaultStateStatisticsData = [
      {
        id: 'stat-1',
        category: 'Péče o děti',
        title: 'Podíl střídavé péče schválené soudy',
        description: 'Procento dětí svěřených do střídavé péče obou rodičů po rozchodu rodičů v ČR.',
        value: '32 %',
        unit: '%',
        period: '2024/2025',
        source: 'Ministerstvo spravedlnosti ČR / ČSÚ',
        chartData: {
          labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
          datasets: [{ label: 'Střídavá péče (%)', data: [18, 21, 24, 27, 30, 32] }],
        },
      },
      {
        id: 'stat-2',
        category: 'Péče o děti',
        title: 'Péče jednoho rodiče (výhradní péče matky)',
        description: 'Podíl rozhodnutí, kde bylo dítě svěřeno do výhradní péče matky.',
        value: '58 %',
        unit: '%',
        period: '2024/2025',
        source: 'Ministerstvo spravedlnosti ČR',
        chartData: {
          labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
          datasets: [{ label: 'Výhradní péče matky (%)', data: [72, 68, 65, 62, 60, 58] }],
        },
      },
      {
        id: 'stat-3',
        category: 'Délka řízení',
        title: 'Průměrná délka opatrovnického řízení u okresních soudů',
        description: 'Průměrný počet dnů od podání návrhu na úpravu poměrů do vydání prvostupňového rozsudku.',
        value: '215',
        unit: 'dní',
        period: '2024/2025',
        source: 'Ministerstvo spravedlnosti ČR - Statistická ročenka',
        chartData: {
          labels: ['2021', '2022', '2023', '2024', '2025'],
          datasets: [{ label: 'Délka řízení (dny)', data: [245, 238, 225, 220, 215] }],
        },
      },
      {
        id: 'stat-4',
        category: 'Délka řízení',
        title: 'Průměrná doba rozhodování o předběžném opatření (§ 452 ZVR)',
        description: 'Doba rozhodování soudů o akutních návrzích na předběžnou úpravu poměrů dítěte.',
        value: '7',
        unit: 'dní',
        period: '2025',
        source: 'Ministerstvo spravedlnosti ČR',
        chartData: {
          labels: ['Zákonná lhůta', 'Průměrná praxe soudů'],
          datasets: [{ label: 'Dny', data: [7, 6.8] }],
        },
      },
      {
        id: 'stat-5',
        category: 'Výživné',
        title: 'Průměrná stanovená výše výživného na jedno dítě',
        description: 'Průměrné měsíční výživné určované soudy ČR podle věkových kategorií.',
        value: '3 850',
        unit: 'Kč',
        period: '2024/2025',
        source: 'Český statistický úřad (ČSÚ) / MS ČR',
        chartData: {
          labels: ['0-5 let', '6-11 let', '12-15 let', '16-26 let'],
          datasets: [{ label: 'Průměrné výživné (Kč)', data: [2800, 3500, 4200, 4900] }],
        },
      },
      {
        id: 'stat-6',
        category: 'Výživné',
        title: 'Míra plnění vyživovací povinnosti a náhradní výživné',
        description: 'Procento povinných rodičů hradících stanovené výživné řádně a včas.',
        value: '84 %',
        unit: '%',
        period: '2024/2025',
        source: 'Úřad práce ČR / Ministerstvo práce a sociálních věcí',
        chartData: {
          labels: ['Řádně placeno', 'Částečně placeno', 'Neplaceno'],
          datasets: [{ label: 'Podíl (%)', data: [84, 10, 6] }],
        },
      },
    ];

    for (const stat of defaultStateStatisticsData) {
      await prisma.stateStatistic.upsert({
        where: { id: stat.id },
        update: stat,
        create: stat,
      });
    }

    const defaultCourtCasesData = [
      {
        id: 'case-us-1506-23',
        fileNumber: 'I. ÚS 1506/23',
        court: 'Ústavní soud',
        title: 'Právo dítěte na péči obou rodičů a presumpce střídavé péče',
        summary: 'Stěžovatel (otec) se domáhal střídavé péče o nezletilého syna. Obecné soudy ji zamítly s odkazem na pracovní vytížení otce a nesouhlas matky. Ústavní soud rozhodnutí zrušil pro porušení článku 32 odst. 4 Listiny základních práv a svobod.',
        legalRatio: 'Svěření dítěte do střídavé péče by mělo být pravidlem, pokud jsou oba rodiče způsobilí dítě vychovávat a mají o jeho výchovu zájem. Nesouhlas jednoho z rodičů nebo jeho subjektivní výhrady samy o sobě nemohou být důvodem pro vyloučení střídavé péče.',
        tags: ['střídavá péče', 'základní práva', 'nesouhlas matky', 'rovnoprávnost rodičů'],
        fullTextUrl: 'https://nalus.usoud.cz/Search/GetText.aspx?sz=1-1506-23',
        publishedAt: new Date('2023-10-18'),
      },
      {
        id: 'case-us-3242-22',
        fileNumber: 'II. ÚS 3242/22',
        court: 'Ústavní soud',
        title: 'Předběžná opatření v opatrovnických věcech a bezdůvodné maření styku',
        summary: 'Matka opakovaně znemožňovala otci styk s dcerou pod záminkou onemocnění bez lékařského potvrzení. Otec požádal o předběžné opatření k úpravě styku, které krajský soud zamítl.',
        legalRatio: 'Pokud jeden z rodičů systematicky a bezdůvodně maří styk druhého rodiče s dítětem, je povinností obecných soudů zakročit pomocí předběžného opatření a zajistit obnovení a udržení rodičovské vazby bez zbytečného prodlení.',
        tags: ['předběžné opatření', 'maření styku', 'vynutitelnost práva', 'rychlost řízení'],
        fullTextUrl: 'https://nalus.usoud.cz/Search/GetText.aspx?sz=2-3242-22',
        publishedAt: new Date('2023-03-14'),
      },
      {
        id: 'case-us-1200-21',
        fileNumber: 'III. ÚS 1200/21',
        court: 'Ústavní soud',
        title: 'Zjišťování názoru nezletilého dítěte a role OSPOD',
        summary: 'Obecný soud neprovedl výslech 10letého dítěte ani nepřihlédl k jeho přání střídavé péče, přičemž se spolehl výhradně na stanovisko OSPOD, který střídavou péči nedoporučil.',
        legalRatio: 'OSPOD je pouze kolizním opatrovníkem, jehož názor nezavazuje soud. Soud je povinen zjišťovat názor dítěte odpovídajícím způsobem vzhledem k jeho věku a rozvojové úrovni a přihlížet k němu.',
        tags: ['názor dítěte', 'OSPOD', 'dokazování', 'vyslechnutí nezletilého'],
        fullTextUrl: 'https://nalus.usoud.cz/Search/GetText.aspx?sz=3-1200-21',
        publishedAt: new Date('2021-11-02'),
      },
      {
        id: 'case-ns-1890-22',
        fileNumber: '21 Cdo 1890/2022',
        court: 'Nejvyšší soud',
        title: 'Kritéria pro stanovení výživného při změně poměrů a střídavé péči',
        summary: 'Přezkum rozhodnutí o výši výživného při přechodu z výhradní péče matky na střídavou péči s ohledem na odlišné příjmy rodičů a úhradu mimořádných nákladů.',
        legalRatio: 'Při střídavé péči se výživné určuje oběma rodičům vzájemně tak, aby byla zajištěna srovnatelná životní úroveň dítěte u obou rodičů. Samotný fakt střídavé péče nevylučuje stanovení výživného rodiči s výrazně vyššími příjmy.',
        tags: ['výživné', 'změna poměrů', 'životní úroveň', 'příjmy rodičů'],
        fullTextUrl: 'https://www.nsoud.cz/Judikatura/judikatura_ns.nsf/WebSearch/21Cdo1890-2022',
        publishedAt: new Date('2022-08-25'),
      },
      {
        id: 'case-us-2482-24',
        fileNumber: 'I. ÚS 2482/24',
        court: 'Ústavní soud',
        title: 'Vzdálenost bydlišť rodičů a střídavá péče při nástupu do školy',
        summary: 'Matka se bez souhlasu otce odstěhovala s dítětem do vzdálenosti 120 km a tvrdila, že střídavá péče již není z důvodu vzdálenosti možná.',
        legalRatio: 'Jednostranné odstěhování jednoho z rodičů bez souhlasu druhého rodiče či rozhodnutí soudu nemůže jít k tíži rodiče, který změnu nezpůsobil. Soudy musí zkoumat motivaci k odstěhování a možnost zachování střídavé péče či úpravy širšího styku.',
        tags: ['odstěhování', 'vzdálenost bydlišť', 'školní docházka', 'střídavá péče'],
        fullTextUrl: 'https://nalus.usoud.cz/Search/GetText.aspx?sz=1-2482-24',
        publishedAt: new Date('2024-05-10'),
      },
    ];

    for (const c of defaultCourtCasesData) {
      await prisma.courtCase.upsert({
        where: { fileNumber: c.fileNumber },
        update: c,
        create: c,
      });
    }

    const defaultLawsData = [
      {
        code: '89/2012',
        title: 'Zákon č. 89/2012 Sb., občanský zákoník',
        content: JSON.stringify({ summary: 'Občanský zákoník upravuje osobnostní práva, rodinné právo, opatrovnictví a věcná práva.' }),
      },
      {
        code: '359/1999',
        title: 'Zákon č. 359/1999 Sb., o sociálně-právní ochraně dětí (zOSPOD)',
        content: JSON.stringify({ summary: 'Zákon o sociálně-právní ochraně dětí upravuje ochranu práv dětí, OSPOD a pěstounskou péči.' }),
      },
      {
        code: '292/2013',
        title: 'Zákon č. 292/2013 Sb., o zvláštních řízeních soudních',
        content: JSON.stringify({ summary: 'Zákon o zvláštních řízeních soudních upravuje opatrovnické řízení a péči soudu o nezletilé.' }),
      },
      {
        code: '99/1963',
        title: 'Zákon č. 99/1963 Sb., občanský soudní řád',
        content: JSON.stringify({ summary: 'Občanský soudní řád upravuje postupy soudů v občanském soudním řízení a dokazování.' }),
      },
    ];

    for (const law of defaultLawsData) {
      await prisma.law.upsert({
        where: { code: law.code },
        update: law,
        create: law,
      });
    }

    // 12. Partners
    const defaultPartnersData = [
      {
        id: 'partner-1',
        name: 'ALGOTECH a.s.',
        description: 'Přední poskytovatel cloudových VPS, IT služeb a podnikových systémů.',
        logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=128&auto=format&fit=crop&q=60',
        websiteUrl: 'https://www.algotech.cz',
        type: 'SPONSOR',
        order: 1,
        isActive: true,
      },
      {
        id: 'partner-2',
        name: 'WEDOS Internet, a.s.',
        description: 'Největší poskytovatel webhostingu v ČR.',
        logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&auto=format&fit=crop&q=60',
        websiteUrl: 'https://www.wedos.cz',
        type: 'SPONSOR',
        order: 2,
        isActive: true,
      },
      {
        id: 'partner-3',
        name: 'FORPSI',
        description: 'Tradiční poskytovatel internetových služeb.',
        logoUrl: 'https://images.unsplash.com/photo-1425421598808-4a22ce59cc97?w=128&auto=format&fit=crop&q=60',
        websiteUrl: 'https://www.forpsi.com',
        type: 'PARTNER',
        order: 3,
        isActive: true,
      },
    ];

    for (const partner of defaultPartnersData) {
      // @ts-ignore
      await prisma.partner.upsert({
        where: { id: partner.id },
        update: partner,
        create: partner,
      });
    }

    // 11. Audit Log Initial Entry
    await prisma.auditLog.create({
      data: {
        userId: 'usr-superadmin',
        userEmail: 'superadmin@tatovacesta.cz',
        action: 'SYSTEM_INIT',
        module: 'CORE',
        details: 'PostgreSQL + Prisma architektura úspěšně inicializována.',
      },
    });

    console.log('[Prisma Seed] Seeding dokončen úspěšně!');
  } catch (error) {
    console.error('[Prisma Seed Error]:', error);
  }
}
