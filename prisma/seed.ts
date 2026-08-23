import dotenv from 'dotenv';
dotenv.config();

import { prisma, isPrismaAvailable } from '../src/db/prisma';
import { dbStore } from '../src/services/dbStore';
import { ensureSuperAdminAccount } from '../src/services/seedService';
import { runHelpNewsSeed } from "./seed-help-news";
import { runWikiGuidesSeed } from "./seed-wiki-guides";
import { importOspody, syncDbStoreWithOspodDataset } from '../src/scripts/importOspody';
import fs from 'fs';
import path from 'path';

import { nonOspodSubjekty } from '../src/data/nonOspodSubjekty';

export const realSubjektyData = nonOspodSubjekty as any[];

export async function runSeed() {
  console.log('[Prisma Seed] Spouštím kompletaci výchozích CMS a registračních dat...');

  try {
    // 0. Ujistit se o existenci účtu Super Admina a rolí
    await ensureSuperAdminAccount().catch(() => {});

    if (isPrismaAvailable()) {
      // 1. POLOŽKY NAVIGACE (7 kategorií, 33 modulů portálu + Domů)
      console.log('[Prisma Seed] Seedování položek navigace...');
            // Idempotent upsert mechanism
      const categoriesNav = [
        // Category 0: 🏠 Domů & Veřejnost
        {
          id: 'cat-home',
          labelKey: '🏠 Domů & Veřejnost',
          url: '/',
          order: 0,
          subItems: [
            { id: 'sub-home-1', labelKey: 'Domů', url: '/', order: 1 },
            { id: 'sub-home-2', labelKey: 'O projektu & Vize', url: '/o-projektu', order: 2 },
            { id: 'sub-home-3', labelKey: 'Veřejný portál', url: '/verejny-portal', order: 3 },
            { id: 'sub-home-4', labelKey: 'Přihlásit / Registrace', url: '/login', order: 4 },
          ]
        },
        // Category 1: 🚨 Pomoc & Komunita
        {
          id: 'cat-1',
          labelKey: '🚨 Pomoc & Komunita',
          url: '/krizova-pomoc',
          order: 10,
          subItems: [
            { id: 'sub-1-1', labelKey: 'SOS krizový plán', url: '/sos-plan', order: 11 },
            { id: 'sub-1-2', labelKey: 'Krizový rozcestník', url: '/krizova-pomoc', order: 12 },
            { id: 'sub-1-3', labelKey: 'Právní poradna', url: '/pravni-poradna', order: 13 },
            { id: 'sub-1-4', labelKey: 'Fórum / Komunitní podpora', url: '/forum', order: 14 },
            { id: 'sub-1-5', labelKey: 'Memento otců', url: '/memento', order: 15 },
            { id: 'sub-1-6', labelKey: 'Registr subjektů', url: '/registr-subjektu', order: 16 },
            { id: 'sub-1-7', labelKey: 'Mapa subjektů', url: '/mapa-subjektu', order: 17 },
          ]
        },
        // Category 2: ⚖️ Právo & Opatrovnictví
        {
          id: 'cat-2',
          labelKey: '⚖️ Právo & Opatrovnictví',
          url: '/agenda',
          order: 20,
          subItems: [
            { id: 'sub-2-1', labelKey: 'Agenda opatrovnického řízení', url: '/agenda', order: 21 },
            { id: 'sub-2-2', labelKey: 'Práva otců & rodičovská odpovědnost', url: '/prava', order: 22 },
            { id: 'sub-2-3', labelKey: 'Judikatura', url: '/judikatura', order: 23 },
            { id: 'sub-2-4', labelKey: 'Vzory dokumentů & podání', url: '/dokumenty', order: 24 },
            { id: 'sub-2-5', labelKey: 'Odborné články & analýzy', url: '/clanky', order: 25 },
            { id: 'sub-2-6', labelKey: 'Zákony / e-Sbírka', url: '/state-laws', order: 26 },
            { id: 'sub-2-7', labelKey: 'Průvodce OSPOD', url: '/ospod', order: 27 },
            { id: 'sub-2-8', labelKey: 'Průvodce soudním řízením', url: '/soud', order: 28 },
            { id: 'sub-2-9', labelKey: 'Finanční a majetkové vypořádání', url: '/majetek', order: 29 },
          ]
        },
        // Category 3: 👨‍👧 Péče & Spolurodičovství
        {
          id: 'cat-3',
          labelKey: '👨‍👧 Péče & Spolurodičovství',
          url: '/pece',
          order: 30,
          subItems: [
            { id: 'sub-3-1', labelKey: 'Péče o dítě / Care Hub', url: '/pece', order: 31 },
            { id: 'sub-3-2', labelKey: 'CoParent Hub', url: '/portal/coparent', order: 32 },
            { id: 'sub-3-3', labelKey: 'Kalkulačka výživného a nákladů', url: '/kalkulacka-vyzivneho', order: 33 },
            { id: 'sub-3-4', labelKey: 'Psychologická podpora dětí', url: '/psychologie', order: 34 },
          ]
        },
        // Category 4: 💼 Můj případ & Dokumenty
        {
          id: 'cat-4',
          labelKey: '💼 Můj případ & Dokumenty',
          url: '/muj-pripad',
          order: 40,
          subItems: [
            { id: 'sub-4-1', labelKey: 'Osobní spis otce', url: '/muj-pripad', order: 41 },
            { id: 'sub-4-2', labelKey: 'Dokumenty případu & důkazy', url: '/portal/dokumenty', order: 42 },
            { id: 'sub-4-3', labelKey: 'AI Case Manager', url: '/ai-case-manager', order: 43 },
            { id: 'sub-4-4', labelKey: 'Kalendář a důležité lhůty', url: '/kalendar', order: 44 },
          ]
        },
        // Category 5: 🤖 AI Nástroje
        {
          id: 'cat-5',
          labelKey: '🤖 AI Nástroje',
          url: '/ai-asistent',
          order: 50,
          subItems: [
            { id: 'sub-5-1', labelKey: 'AI Právní Asistent', url: '/ai-asistent', order: 51 },
            { id: 'sub-5-2', labelKey: 'AI Průvodce řízením', url: '/ai-pruvodce', order: 52 },
            { id: 'sub-5-3', labelKey: 'Generátor formulářů & podání', url: '/ai-formulare', order: 53 },
            { id: 'sub-5-4', labelKey: 'Simulátor modelů péče', url: '/ai-simulator', order: 54 },
          ]
        },
        // Category 6: 🎓 Akademie & Vzdělávání
        {
          id: 'cat-6',
          labelKey: '🎓 Akademie & Vzdělávání',
          url: '/studia',
          order: 60,
          subItems: [
            { id: 'sub-6-1', labelKey: 'Kurzy pro rodiče', url: '/studia', order: 61 },
            { id: 'sub-6-2', labelKey: 'Videotéka & Webináře', url: '/videoteka', order: 62 },
            { id: 'sub-6-3', labelKey: 'Kvízy', url: '/kvizy', order: 63 },
            { id: 'sub-6-4', labelKey: 'Encyklopedie & Wiki pojmů', url: '/wiki', order: 64 },
            { id: 'sub-6-5', labelKey: 'Katalog odborných studií a výzkumů', url: '/studie', order: 65 },
            { id: 'sub-6-6', labelKey: 'Statistiky a data', url: '/state-statistics', order: 66 },
            { id: 'sub-6-7', labelKey: 'Uživatelský manuál portálu', url: '/user-manual', order: 67 },
          ]
        },
        // Category 7: 📰 Aktuality & Příběhy
        {
          id: 'cat-7',
          labelKey: '📰 Aktuality & Příběhy',
          url: '/novinky',
          order: 70,
          subItems: [
            { id: 'sub-7-1', labelKey: 'Novinky & Zprávy', url: '/novinky', order: 71 },
            { id: 'sub-7-2', labelKey: 'Příběhy otců', url: '/pribehy', order: 72 },
          ]
        },
        // Category 8: 🏛️ O projektu & Podpora
        {
          id: 'cat-8',
          labelKey: '🏛️ O projektu & Podpora',
          url: '/o-projektu',
          order: 80,
          subItems: [
            { id: 'sub-8-1', labelKey: 'O nás & Tvůrci', url: '/o-projektu', order: 81 },
            { id: 'sub-8-2', labelKey: 'Moje cesta zakladatele', url: '/moje-cesta-zakladatele', order: 82 },
            { id: 'sub-8-3', labelKey: 'Podpořte nás / Sponzoři & Partneři', url: '/podporte-nas', order: 83 },
            { id: 'sub-8-4', labelKey: 'Kontakt', url: '/kontakt', order: 84 },
            { id: 'sub-8-5', labelKey: 'Hledáme dobrovolníky', url: '/dobrovolnici', order: 85 },
            { id: 'sub-8-6', labelKey: 'Kodex dobrovolníka', url: '/kodex-dobrovolnika', order: 86 },
            { id: 'sub-8-7', labelKey: 'Mapa stránek', url: '/sitemap', order: 87 },
          ]
        },
        // Category 9: 👤 Můj účet
        {
          id: 'cat-9',
          labelKey: '👤 Můj účet',
          url: '/portal/profil',
          order: 90,
          subItems: [
            { id: 'sub-9-1', labelKey: 'Můj Profil & Nastavení', url: '/portal/profil', order: 91 },
            { id: 'sub-9-2', labelKey: 'Zabezpečení', url: '/portal/zabezpeceni', order: 92 },
            { id: 'sub-9-3', labelKey: 'Administrace', url: '/admin', order: 93 },
            { id: 'sub-9-4', labelKey: 'Uživatelská podpora & Tickety', url: '/portal/tikety', order: 94 },
            { id: 'sub-9-5', labelKey: 'Odhlásit se', url: '/logout', order: 95 },
          ]
        },
      ];

      for (const cat of categoriesNav) {
        const parent = await prisma.navigationItem.upsert({
          where: { id: cat.id },
          update: {
            labelKey: cat.labelKey,
            url: cat.url,
            order: cat.order,
            target: '_self',
            isExternal: false,
          },
          create: {
            id: cat.id,
            labelKey: cat.labelKey,
            url: cat.url,
            order: cat.order,
            target: '_self',
            isExternal: false,
          },
        });

        for (const sub of cat.subItems) {
          await prisma.navigationItem.upsert({
            where: { id: sub.id },
            update: {
              labelKey: sub.labelKey,
              url: sub.url,
              order: sub.order,
              target: '_self',
              isExternal: false,
              parentId: parent.id,
            },
            create: {
              id: sub.id,
              labelKey: sub.labelKey,
              url: sub.url,
              order: sub.order,
              target: '_self',
              isExternal: false,
              parentId: parent.id,
            },
          });
        }
      }
      
      const allNewIds = categoriesNav.flatMap(c => [c.id, ...c.subItems.map(s => s.id)]);
      // Optionally cleanup stale ones that are not in this array if needed, but per prompt:
      // "NEMAŽ plošně současné NavigationItem/Module záznamy." So we leave old ones intact.


      // 2. STRÁNKY (`Page` & `PageSection`)
      console.log('[Prisma Seed] Seedování základních stránek a sekcí...');
      const pagesData = [
        {
          slug: 'domu',
          title: 'Domů',
          content: JSON.stringify({
            heroTitle: 'Táta má právo. Dítě má právo na oba rodiče.',
            heroSubtitle: 'Komplexní opora pro otce v opatrovnických situacích.',
            published: true,
          }),
          sections: [
            {
              sectionKey: 'hero',
              title: 'Hlavní banner',
              content: 'Táta má právo. Dítě má právo na oba rodiče.',
              order: 1,
              config: JSON.stringify({ variant: 'primary' }),
            },
            {
              sectionKey: 'about_summary',
              title: 'O projektu',
              content: 'Všechna doporučení stavíme na nejlepším zájmu dítěte.',
              order: 2,
              config: JSON.stringify({ layout: 'centered' }),
            },
          ],
        },
        {
          slug: 'crisis',
          title: 'Krizová pomoc',
          content: JSON.stringify({
            heroTitle: '🚨 Krizový Akční Plán SOS',
            heroSubtitle: 'Okamžitá pomoc v akutních krizových situacích.',
            published: true,
          }),
          sections: [
            {
              sectionKey: 'sos_banner',
              title: 'Krizový SOS plán',
              content: 'První kroky při zamezení styku nebo krizové situaci s OSPOD.',
              order: 1,
              config: JSON.stringify({ alert: true }),
            },
          ],
        },
        {
          slug: 'opatrovnicka-agenda',
          title: 'Opatrovnictví',
          content: JSON.stringify({
            heroTitle: '⚖️ Opatrovnická agenda krok za krokem',
            heroSubtitle: 'Průvodce soudním řízením a jednáním s OSPOD.',
            published: true,
          }),
          sections: [
            {
              sectionKey: 'agenda_overview',
              title: 'Přehled řízení',
              content: 'Metodické postupy pro otce v opatrovnických sporech.',
              order: 1,
              config: JSON.stringify({ layout: 'grid' }),
            },
          ],
        },
        {
          slug: 'about',
          title: 'O nás',
          content: JSON.stringify({
            heroTitle: 'O projektu Táta má právo',
            heroSubtitle: 'Naše poslání, historie a tým.',
            published: true,
          }),
          sections: [
            {
              sectionKey: 'mission',
              title: 'Naše poslání',
              content: 'Obhajoba práva dítěte na rovnocennou péči obou rodičů.',
              order: 1,
              config: JSON.stringify({ variant: 'default' }),
            },
          ],
        },
        {
          slug: 'o-nas',
          title: 'O nás',
          content: JSON.stringify({
            heroTitle: 'O projektu Táta má právo',
            heroSubtitle: 'Obhajoba rovnocenné péče.',
            published: true,
          }),
          sections: [],
        },
      ];

      for (const p of pagesData) {
        const pageRecord = await prisma.page.upsert({
          where: { slug: p.slug },
          update: {
            title: p.title,
            content: p.content,
          },
          create: {
            title: p.title,
            slug: p.slug,
            content: p.content,
          },
        });

        await prisma.pageSection.deleteMany({ where: { pageId: pageRecord.id } });

        for (const sec of p.sections) {
          await prisma.pageSection.create({
            data: {
              pageId: pageRecord.id,
              sectionKey: sec.sectionKey,
              title: sec.title,
              content: sec.content,
              order: sec.order,
              config: sec.config,
            },
          });
        }
      }

      // 3. ZÁKLADNÍ KATEGORIE A FAQ
      console.log('[Prisma Seed] Seedování kategorií článků a FAQ...');
      const defaultCategories = [
        {
          slug: 'pravo',
          name: 'Právo',
          description: 'Právní výklady, rodinné právo, soudní judikatura a vyjádření.',
          type: 'article',
        },
        {
          slug: 'psychologie',
          name: 'Psychologie',
          description: 'Dětská psychologie, vazba k rodičům, prevence syndromu zavržení.',
          type: 'article',
        },
        {
          slug: 'metodika',
          name: 'Metodika',
          description: 'Metodické návody pro jednání s OSPOD, soudy a znalci.',
          type: 'article',
        },
      ];

      for (const cat of defaultCategories) {
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: {
            name: cat.name,
            description: cat.description,
            type: cat.type,
          },
          create: cat,
        });
      }

      const faqCategory = await prisma.category.findUnique({ where: { slug: 'pravo' } });
      const defaultFaqs = [
        {
          question: 'Co dělat, když mi matka bezdůvodně odpírá styk s dítětem?',
          answer: 'Okamžitě zdokumentujte každý neuskutečněný styk (SMS, e-mail, svědectví). Podejte návrh na vydání předběžného opatření a informujte OSPOD a příslušný okresní soud.',
          categoryName: 'Právo',
          categoryId: faqCategory?.id,
          order: 1,
          published: true,
        },
        {
          question: 'Jak se počítá výživné při střídavé péči?',
          answer: 'Při střídavé péči soud určuje výživné oběma rodičům podle jejich příjmů a rozsahu péče na základě doporučujících tabulek Ministerstva spravedlnosti ČR.',
          categoryName: 'Právo',
          categoryId: faqCategory?.id,
          order: 2,
          published: true,
        },
        {
          question: 'Má otec stejná práva na informace o zdravotním stavu a škole?',
          answer: 'Ano. Pokud nebyl otec zbaven rodičovské odpovědnosti nebo mu nebyla omezená, má plné právo nahlížet do zdravotní dokumentace dítěte a komunikovat se školou.',
          categoryName: 'Právo',
          categoryId: faqCategory?.id,
          order: 3,
          published: true,
        },
      ];

      await prisma.fAQ.deleteMany({});
      for (const f of defaultFaqs) {
        await prisma.fAQ.create({
          data: f,
        });
      }

      // 4. OPATROVNICKÉ SUBJEKTY ČR (Soudy, Krizová centra, Poradny, Znalci, Advokáti)
      console.log('[Prisma Seed] Seedování opatrovnických subjektů ČR (pomocí upsert)...');
      const nonOspodSubjekty = realSubjektyData.filter((s) => s.type !== 'OSPOD');
      for (const s of nonOspodSubjekty) {
        await prisma.subjekt.upsert({
          where: { email: s.email },
          update: {
            type: s.type as any,
            name: s.name,
            titleBefore: s.titleBefore || null,
            position: s.position,
            institution: s.institution,
            city: s.city,
            region: s.region,
            address: s.address,
            phone: s.phone,
            website: s.website,
            isVerified: s.isVerified,
            lat: (s as any).lat,
            lng: (s as any).lng,
            status: 'VERIFIED',
          },
          create: {
            type: s.type as any,
            name: s.name,
            titleBefore: s.titleBefore || null,
            position: s.position,
            institution: s.institution,
            city: s.city,
            region: s.region,
            address: s.address,
            email: s.email,
            phone: s.phone,
            website: s.website,
            isVerified: s.isVerified,
            lat: (s as any).lat,
            lng: (s as any).lng,
            avgRating: 0.0,
            reviewCount: 0,
            status: 'VERIFIED',
          },
        });
      }

      // 5. IMPORT VŠECH 227 PRACOVIŠŤ OSPOD Z DATASETU
      console.log('[Prisma Seed] Importování kompletního registru 227 pracovišť OSPOD...');
      await importOspody();

      await runHelpNewsSeed();
      await runWikiGuidesSeed();
      console.log('[Prisma Seed] Úspěšně naseedován výchozí CMS i Registr Subjektů v PostgreSQL!');
    } else {
      console.log('[Prisma Seed] Databáze není připojena, plním in-memory dbStore.');
    }

    // Synchronizace do in-memory dbStore
    seedInMemoryDbStore();
  } catch (err) {
    console.error('[Prisma Seed Error]:', err);
    seedInMemoryDbStore();
  }
}

function seedInMemoryDbStore() {
  dbStore.categories = [
    { id: 'cat-pravo', slug: 'pravo', name: 'Právo', description: 'Právní výklady, rodinné právo', type: 'article' },
    { id: 'cat-psychologie', slug: 'psychologie', name: 'Psychologie', description: 'Dětská psychologie', type: 'article' },
    { id: 'cat-metodika', slug: 'metodika', name: 'Metodika', description: 'Metodické návody pro OSPOD', type: 'article' },
  ];

  dbStore.faqs = [
    {
      id: 'faq-1',
      question: 'Co dělat, když mi matka bezdůvodně odpírá styk s dítětem?',
      answer: 'Okamžitě zdokumentujte každý neuskutečněný styk (SMS, e-mail, svědectví). Podejte návrh na vydání předběžného opatření a informujte OSPOD a příslušný okresní soud.',
      category: 'Právo',
      order: 1,
      published: true,
    },
    {
      id: 'faq-2',
      question: 'Jak se počítá výživné při střídavé péči?',
      answer: 'Při střídavé péči soud určuje výživné oběma rodičům podle jejich příjmů a rozsahu péče na základě doporučujících tabulek Ministerstva spravedlnosti ČR.',
      category: 'Právo',
      order: 2,
      published: true,
    },
    {
      id: 'faq-3',
      question: 'Má otec stejná práva na informace o zdravotním stavu a škole?',
      answer: 'Ano. Pokud nebyl otec zbaven rodičovské odpovědnosti nebo mu nebyla omezená, má plné právo nahlížet do zdravotní dokumentace dítěte a komunikovat se školou.',
      category: 'Právo',
      order: 3,
      published: true,
    },
  ];

  const nonOspodSubjekty = realSubjektyData.filter((s) => s.type !== 'OSPOD');
  for (const s of nonOspodSubjekty) {
    const exists = dbStore.subjekty.some((item) => item.name === s.name && item.city === s.city);
    if (!exists) {
      dbStore.subjekty.push({
        id: 'subj-' + Math.random().toString(36).substring(2, 9),
        type: s.type as any,
        name: s.name,
        titleBefore: s.titleBefore || null,
        position: s.position,
        institution: s.institution,
        city: s.city,
        region: s.region,
        address: s.address,
        email: s.email,
        phone: s.phone,
        website: s.website,
        avgRating: 0.0,
        reviewCount: 0,
        isVerified: s.isVerified,
        lat: (s as any).lat,
        lng: (s as any).lng,
        createdAt: new Date(),
        reviews: [],
      });
    }
  }

  // Load and sync 227 OSPOD records
  const datasetPath = path.join(process.cwd(), 'src/data/ospodDataset.json');
  if (fs.existsSync(datasetPath)) {
    const rawData = fs.readFileSync(datasetPath, 'utf8');
    const dataset = JSON.parse(rawData);
    syncDbStoreWithOspodDataset(dataset);
  }
}

// Podpora přímého spuštění přes CLI (`npx prisma db seed` / `tsx prisma/seed.ts`)
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js') || process.argv[1]?.includes('seed')) {
  runSeed()
    .then(() => {
      console.log('[Prisma Seed CLI] Dokončeno.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Prisma Seed CLI Error]:', err);
      process.exit(1);
    });
}

