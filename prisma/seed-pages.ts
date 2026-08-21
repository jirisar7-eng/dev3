import { prisma } from '../src/db/prisma';
import { dbStore } from '../src/services/dbStore';
import { ensureAllModulePagesExist } from '../src/services/PageService';

export const initialPuckPages = [
  {
    title: 'Táta má právo • Hlavní strana',
    slug: 'domu',
    content: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-home',
            title: 'Táta má právo. Dítě má právo na oba rodiče.',
            description: 'Komplexní opora pro otce v opatrovnických situacích. Právní orientace, psychologická podpora a spravedlivá péče zohledňující NEJLEPŠÍ ZÁJEM DÍTĚTE.',
            buttonText: 'Prozkoumat poradnu',
            buttonUrl: '/zivotni-situace',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-home-1',
            text: 'Všechny naše doporučení, nástroje a metodiky stavíme na nezpochybnitelném právu dítěte mít zdravý a rovnocenný vztah s oběma rodiči.\n\nProjekt Táta má právo pomáhá otcům orientovat se v opatrovnickém soudnictví, efektivně komunikovat s OSPOD a zajistit nejlepší zájem dítěte v rozvodových situacích.',
            align: 'center',
          },
        },
        {
          type: 'CallToAction',
          props: {
            id: 'cta-home',
            title: 'Potřebujete okamžitou pomoc nebo právní vzor?',
            description: 'Využijte naši síť dobrovolníků, kalkulačky výživného nebo vzory právních podání.',
            buttonText: 'Prohlédnout nástroje',
            buttonUrl: '/zivotni-situace',
            variant: 'primary',
          },
        },
      ],
      root: {},
    },
  },
  {
    title: 'Táta má právo • Hlavní strana (Home)',
    slug: 'home',
    content: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-home-alt',
            title: 'Táta má právo. Dítě má právo na oba rodiče.',
            description: 'Komplexní opora pro otce v opatrovnických situacích. Právní orientace, psychologická podpora a spravedlivá péče zohledňující NEJLEPŠÍ ZÁJEM DÍTĚTE.',
            buttonText: 'Prozkoumat poradnu',
            buttonUrl: '/zivotni-situace',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-home-alt',
            text: 'Všechny naše doporučení, nástroje a metodiky stavíme na nezpochybnitelném právu dítěte mít zdravý a rovnocenný vztah s oběma rodiči.',
            align: 'center',
          },
        },
      ],
      root: {},
    },
  },
  {
    title: 'O projektu Táta má právo',
    slug: 'o-nas',
    content: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-about',
            title: 'O projektu Táta má právo',
            description: 'Vznikli jsme jako reakce na systémové nerovnosti v opatrovnickém soudnictví v ČR.',
            buttonText: 'Naše hodnoty',
            buttonUrl: '#hodnoty',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-about-1',
            text: 'Projekt **Táta má právo** vznikl jako reakce na dlouhodobé nerovnosti v opatrovnickém soudnictví. Naším primárním cílem je obhajoba nezpochybnitelného práva každého dítěte na plnohodnotnou výchovu oběma rodiči.\n\nNabízíme odborné informace, vzory právních dokumentů, podporu komunity a poradenství pro táty, kteří procházejí náročným opatrovnickým řízením.',
            align: 'left',
          },
        },
        {
          type: 'CallToAction',
          props: {
            id: 'cta-about',
            title: 'Chcete se zapojit nebo nás podpořit?',
            description: 'Staňte se součástí naší mentorské sítě a pomáhejte dalším otcům.',
            buttonText: 'Zapojit se do komunity',
            buttonUrl: '/dobrovolnictvi',
            variant: 'secondary',
          },
        },
      ],
      root: {},
    },
  },
  {
    title: 'O projektu Táta má právo',
    slug: 'o-projektu',
    content: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-about-proj',
            title: 'O projektu Táta má právo',
            description: 'Obhajoba nezpochybnitelného práva každého dítěte na plnohodnotnou výchovu oběma rodiči.',
            buttonText: 'Kontaktovat nás',
            buttonUrl: '/kontakt',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-about-proj',
            text: 'Projekt **Táta má právo** vznikl jako reakce na dlouhodobé nerovnosti v opatrovnickém soudnictví. Naším primárním cílem je obhajoba nezpochybnitelného práva každého dítěte na plnohodnotnou výchovu oběma rodiči.',
            align: 'left',
          },
        },
      ],
      root: {},
    },
  },
  {
    title: 'Kontakt a bezplatná poradna',
    slug: 'kontakt',
    content: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-contact',
            title: 'Kontakt a bezplatná poradna',
            description: 'Jsme tu pro táty v krizových opatrovnických situacích. Napište nám svůj příběh.',
            buttonText: 'Napište nám e-mail',
            buttonUrl: 'mailto:info@tatovacesta.cz',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-contact-1',
            text: 'E-mail: info@tatovacesta.cz\nInfolinka: +420 800 123 456 (Po–Pá 9:00 – 17:00)\nProvozuje: z.s. Táta má právo, Praha\n\nNapište nám a naši dobrovolníci a poradci se vám ozvou do 24 hodin.',
            align: 'center',
          },
        },
        {
          type: 'CallToAction',
          props: {
            id: 'cta-contact',
            title: 'Potřebujete akutní konzultaci?',
            description: 'Prohlédněte si naše časté dotazy nebo se obraťte na našeho mentora.',
            buttonText: 'Zobrazit časté dotazy (FAQ)',
            buttonUrl: '/faq',
            variant: 'dark',
          },
        },
      ],
      root: {},
    },
  },
  {
    title: 'Služby a životní situace',
    slug: 'sluzby',
    content: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-sluzby',
            title: 'Služby a životní situace otců',
            description: 'Komplexní přehled služeb, kalkulaček a právních nástrojů pro otce.',
            buttonText: 'Spočítat výživné',
            buttonUrl: '/#moduly',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-sluzby',
            text: 'Nabízíme vám kompletní soubor nástrojů:\n- Kalkulačka výživného podle doporučujících tabulek MS ČR\n- Simulátor předávání dítěte a předávací protokoly\n- Generátor právních dokumentů a návrhů k soudu\n- Kalendář péče a plánování střídavé péče',
            align: 'left',
          },
        },
        {
          type: 'CallToAction',
          props: {
            id: 'cta-sluzby',
            title: 'Vyzkoušejte interaktivní moduly',
            description: 'Sestavte si návrh na střídavou péči nebo si propočítejte výživné online.',
            buttonText: 'Přejít k modulům',
            buttonUrl: '/#moduly',
            variant: 'primary',
          },
        },
      ],
      root: {},
    },
  },
  {
    title: 'Životní situace a právní průvodce',
    slug: 'zivotni-situace',
    content: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-zivotni',
            title: 'Životní situace a právní průvodce',
            description: 'Praktičtí průvodci pro klíčové okamžiky opatrovnického řízení.',
            buttonText: 'Zobrazit poradnu',
            buttonUrl: '/kontakt',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-zivotni',
            text: 'Opatrovnické řízení vyžaduje chladnou hlavu, znalost zákona o rodině a aktivní součinnost s OSPOD. Zde naleznete základní metodiku krok za krokem.',
            align: 'left',
          },
        },
      ],
      root: {},
    },
  },
  {
    title: 'Články, judikatura a metodiky',
    slug: 'clanky',
    content: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-clanky',
            title: 'Články, judikatura a metodiky',
            description: 'Odborné články, rozbory soudních rozhodnutí a praktická doporučení pro otce v opatrovnické praxi.',
            buttonText: 'Číst judikaturu',
            buttonUrl: '/clanky',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-clanky',
            text: 'Sledujte aktuální nálezy Ústavního soudu ČR a praktická doporučení pro jednání s OSPOD.',
            align: 'center',
          },
        },
      ],
      root: {},
    },
  },
  {
    title: 'Časté dotazy (FAQ)',
    slug: 'faq',
    content: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-faq',
            title: 'Časté dotazy (FAQ)',
            description: 'Odpovědi na nejčastější otázky otců ohledně střídavé péče, výživného, OSPOD a soudu.',
            buttonText: 'Položit dotaz',
            buttonUrl: '/kontakt',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-faq',
            text: 'Zde naleznete nejčastěji pokládané otazníky od tátů v opatrovnických situacích.',
            align: 'left',
          },
        },
      ],
      root: {},
    },
  },
  {
    title: 'Dobrovolnictví a mentorská síť',
    slug: 'dobrovolnictvi',
    content: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-dobrovolnictvi',
            title: 'Dobrovolnictví a mentorská síť',
            description: 'Propojujeme zkušené otce s táty, kteří jsou na začátku a potřebují lidskou oporu.',
            buttonText: 'Staňte se mentorem',
            buttonUrl: '/kontakt',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-dobrovolnictvi',
            text: 'Pokud jste si sami prošli opatrovnickým řízením a chcete předat zkušenosti dál, přidejte se k našemu týmu dobrovolníků.',
            align: 'center',
          },
        },
      ],
      root: {},
    },
  },
  {
    title: 'Podmínky užívání portálu',
    slug: 'podminky-uzivani',
    content: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-terms',
            title: 'Podmínky užívání portálu',
            description: 'Právní informace o používání webového portálu Táta má právo.',
            buttonText: 'Zpět domů',
            buttonUrl: '/',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-terms',
            text: 'Všechny informace poskytované v rámci portálu Táta má právo mají informativní a osvětový charakter. Nenahrazují individuální právní nebo psychologickou péči poskytovanou advokáty či licencovanými terapeuty.',
            align: 'left',
          },
        },
      ],
      root: {},
    },
  },
  {
    title: 'Ochrana osobních údajů (GDPR)',
    slug: 'gdpr',
    content: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-gdpr',
            title: 'Ochrana osobních údajů (GDPR)',
            description: 'Informace o zpracování a ochraně osobních údajů uživatelů.',
            buttonText: 'Zpět domů',
            buttonUrl: '/',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-gdpr',
            text: 'Portál Táta má právo zpracovává osobní údaje výhradně pro účely správy účtu, posílení bezpečnosti a umožnění využívání modulů. Vaše údaje nejsou předávány třetím stranám bez vášho výslovného souhlasu.',
            align: 'left',
          },
        },
      ],
      root: {},
    },
  },
  {
    title: 'Prohlášení o využití umělé inteligence (AI)',
    slug: 'ai-prohlaseni',
    content: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-ai',
            title: 'Prohlášení o využití AI',
            description: 'Informace o využití a limitech AI nástrojů na portálu.',
            buttonText: 'Zpět domů',
            buttonUrl: '/',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-ai',
            text: 'Výstupy generované AI asistentem jsou automatizovaným rozborem textových podkladů. Výstupy nemají charakter právní rady a vyžadují verifikaci lidským odborníkem.',
            align: 'left',
          },
        },
      ],
      root: {},
    },
  },
];

export async function seedPages() {
  console.log('Spouštím seedování Puck stránek...');

  for (const page of initialPuckPages) {
    try {
      if (prisma) {
        await prisma.page.upsert({
          where: { slug: page.slug },
          update: {
            title: page.title,
            content: page.content,
          },
          create: {
            title: page.title,
            slug: page.slug,
            content: page.content,
          },
        });
      }
    } catch (err) {
      console.warn(`Prisma seed selhal pro ${page.slug}, ukládám do in-memory dbStore:`, err);
    }

    // Always keep dbStore in sync as fallback
    const existingIndex = dbStore.pages.findIndex((p) => p.slug === page.slug);
    if (existingIndex >= 0) {
      dbStore.pages[existingIndex] = {
        ...dbStore.pages[existingIndex],
        title: page.title,
        content: page.content as any,
        updatedAt: new Date().toISOString(),
      };
    } else {
      dbStore.pages.push({
        id: `pg-puck-${page.slug}`,
        slug: page.slug,
        title: page.title,
        content: page.content as any,
        published: true,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  console.log(`[Puck Seed] Úspěšně naseedováno/aktualizováno ${initialPuckPages.length} základních stránek pro Puck editor!`);

  // Synchronizace všech 33 modulů z hlavního menu
  await ensureAllModulePagesExist();
}

// Pokud je skript spuštěn přímo přes `tsx prisma/seed-pages.ts`
if (false) {
  seedPages()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Chyba při spuštění seed-pages.ts:', err);
      process.exit(1);
    });
}
