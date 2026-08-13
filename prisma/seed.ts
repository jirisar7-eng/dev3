import dotenv from 'dotenv';
dotenv.config();

import { prisma, isPrismaAvailable } from '../src/db/prisma';
import { dbStore } from '../src/services/dbStore';
import { ensureSuperAdminAccount } from '../src/services/seedService';

export async function runSeed() {
  console.log('[Prisma Seed] Spouštím kompletaci výchozích CMS dat...');

  try {
    // 0. Ujistit se o existenci účtu Super Admina a rolí
    await ensureSuperAdminAccount().catch(() => {});

    if (isPrismaAvailable()) {
      // 1. POLOŽKY NAVIGACE (7 kategorií, 33 modulů portálu + Domů)
      console.log('[Prisma Seed] Seedování položek navigace...');
      await prisma.navigationItem.deleteMany({}); // Vyčištění staré navigace

      // Samostatné tlačítko Domů
      await prisma.navigationItem.create({
        data: { id: 'nav-1', labelKey: 'Domů', url: '/', order: 1, target: '_self', isExternal: false },
      });

    const categoriesNav = [
      {
        id: 'cat-1',
        labelKey: '🚨 Krizová pomoc & Komunita',
        url: '#',
        order: 10,
        subItems: [
          { id: 'sub-1-1', labelKey: 'SOS plán', url: '/crisis', order: 11 },
          { id: 'sub-1-2', labelKey: 'Fórum', url: '/forum', order: 12 },
          { id: 'sub-1-3', labelKey: 'Příběhy', url: '/stories', order: 13 },
          { id: 'sub-1-4', labelKey: 'Memento', url: '/memento', order: 14 },
          { id: 'sub-1-5', labelKey: 'Právní poradna', url: '/advice', order: 15 },
          { id: 'sub-1-6', labelKey: 'Podpora', url: '/support', order: 16 },
        ],
      },
      {
        id: 'cat-2',
        labelKey: '⚖️ Opatrovnictví & Právo',
        url: '#',
        order: 20,
        subItems: [
          { id: 'sub-2-1', labelKey: 'Agenda', url: '/opatrovnicka-agenda', order: 21 },
          { id: 'sub-2-2', labelKey: 'Práva', url: '/rights', order: 22 },
          { id: 'sub-2-3', labelKey: 'Judikatura', url: '/judikatura', order: 23 },
          { id: 'sub-2-4', labelKey: 'Dokumenty', url: '/ke-stazeni', order: 24 },
        ],
      },
      {
        id: 'cat-3',
        labelKey: '🏛️ Státní data',
        url: '#',
        order: 30,
        subItems: [
          { id: 'sub-3-1', labelKey: 'e-Sbírka', url: '/state-laws', order: 31 },
          { id: 'sub-3-2', labelKey: 'Statistiky', url: '/state-statistics', order: 32 },
          { id: 'sub-3-3', labelKey: 'Databáze', url: '/pripadova-databaze', order: 33 },
        ],
      },
      {
        id: 'cat-4',
        labelKey: '🎓 Akademie',
        url: '#',
        order: 40,
        subItems: [
          { id: 'sub-4-1', labelKey: 'Studia', url: '/knihovna-studii', order: 41 },
          { id: 'sub-4-2', labelKey: 'Videotéka', url: '/videoteka', order: 42 },
          { id: 'sub-4-3', labelKey: 'Kvízy', url: '/vzdelavani', order: 43 },
          { id: 'sub-4-4', labelKey: 'Wiki', url: '/legal-wiki', order: 44 },
          { id: 'sub-4-5', labelKey: 'Zakladatel', url: '/cesta-zakladatele', order: 45 },
        ],
      },
      {
        id: 'cat-5',
        labelKey: '📂 Pracovna',
        url: '#',
        order: 50,
        subItems: [
          { id: 'sub-5-1', labelKey: 'Složka', url: '/user-portal', order: 51 },
          { id: 'sub-5-2', labelKey: 'Profil', url: '/profile', order: 52 },
          { id: 'sub-5-3', labelKey: 'CoParent', url: '/coparent-hub', order: 53 },
        ],
      },
      {
        id: 'cat-6',
        labelKey: '🤖 AI nástroje',
        url: '#',
        order: 60,
        subItems: [
          { id: 'sub-6-1', labelKey: 'Asistent', url: '/ai-assistant', order: 61 },
          { id: 'sub-6-2', labelKey: 'Průvodce', url: '/ai-guide', order: 62 },
          { id: 'sub-6-3', labelKey: 'Case manager', url: '/ai-case-manager', order: 63 },
          { id: 'sub-6-4', labelKey: 'Simulátor', url: '/plan-pece', order: 64 },
          { id: 'sub-6-5', labelKey: 'Formuláře', url: '/centrum-formularu', order: 65 },
        ],
      },
      {
        id: 'cat-7',
        labelKey: '🛠️ Systém',
        url: '#',
        order: 70,
        subItems: [
          { id: 'sub-7-1', labelKey: 'Novinky', url: '/news', order: 71 },
          { id: 'sub-7-2', labelKey: 'Hub', url: '/synthesis-hub', order: 72 },
          { id: 'sub-7-3', labelKey: 'AI admin', url: '/ai-admin', order: 73 },
          { id: 'sub-7-4', labelKey: 'Admin', url: '/admin', order: 74 },
          { id: 'sub-7-5', labelKey: 'Context', url: '/ai-context', order: 75 },
          { id: 'sub-7-6', labelKey: 'Nápověda', url: '/user-manual', order: 76 },
          { id: 'sub-7-7', labelKey: 'Architektura', url: '/sitemap', order: 77 },
        ],
      },
    ];

    for (const cat of categoriesNav) {
      const parent = await prisma.navigationItem.create({
        data: {
          id: cat.id,
          labelKey: cat.labelKey,
          url: cat.url,
          order: cat.order,
          target: '_self',
          isExternal: false,
        },
      });

      for (const sub of cat.subItems) {
        await prisma.navigationItem.create({
          data: {
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
      // Kanonická mapování cest / aliasy
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

      // Vyčistit staré sekce pro danou stránku
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

    // FAQ položky
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

      await prisma.fAQ.deleteMany({}); // Vyčištění starých FAQ
      for (const f of defaultFaqs) {
        await prisma.fAQ.create({
          data: f,
        });
      }
      console.log('[Prisma Seed] Úspěšně naseedován výchozí CMS obsah v PostgreSQL (Navigace, Stránky, Kategorie, FAQ)!');
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
}

// Podpora přímého spuštění přes CLI (`npx prisma db seed` / `tsx prisma/seed.ts`)
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.ts')) {
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
