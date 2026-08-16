import { getPrismaClient } from '../db/prisma';
import { CRISIS_CARD_SYSTEM_TEMPLATE } from '../puck/systemTemplates';

export interface PageTemplateData {
  id: string;
  name: string;
  category: string; // "LANDING" | "ARTICLE" | "LEGAL" | "FORM" | "CUSTOM"
  description: string | null;
  puckDataJson: string;
  isSystem: boolean;
  thumbnailUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const inMemoryTemplates: PageTemplateData[] = [];

export const SYSTEM_DEFAULT_TEMPLATES = [
  {
    id: 'tpl-landing-1',
    name: 'Hlavní Landing Page (Úvodní prezentace)',
    category: 'LANDING',
    description: 'Reprezentativní úvodní stránka s hlavním bannerem, 3 sloupci výhod, veřejnou anketou a výzvou k akci.',
    isSystem: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=600',
    puckDataJson: JSON.stringify({
      content: [
        {
          type: 'HeroBlock',
          props: {
            title: 'Táta má právo. Dítě má právo na oba rodiče.',
            description: 'Komplexní opora pro otce v opatrovnických situacích. Právní orientace, psychologická podpora a spravedlivá péče zohledňující NEJLEPŠÍ ZÁJEM DÍTĚTE.',
            buttonText: 'Prozkoumat poradnu a moduly',
            buttonUrl: '/advice',
          },
        },
        {
          type: 'ColumnsBlock',
          props: {
            columnsCount: '3',
            ratio: 'equal',
            gap: 'lg',
            col1Title: '⚖️ Právní orientace',
            col1Text: 'Rozbory judikatury, vzory návrhů a přehledná metodika pro opatrovnické řízení a jednání s OSPOD.',
            col2Title: '🧠 Psychologická podpora',
            col2Text: 'Prevence syndromu zavrženého rodiče, zvládání krizového stresu a mentorská síť otců s vlastní zkušeností.',
            col3Title: '🤖 AI Asistent 24/7',
            col3Text: 'Inteligentní generování podání, kontrola dodržování lhůt a analýza soudních rozhodnutí.',
          },
        },
        {
          type: 'PollBlock',
          props: {
            pollId: 'landing-poll-1',
            question: 'Měly by úřady a soudy přednostně rozhodovat ve prospěch střídavé péče?',
            description: 'Hlasujte v naší bleskové anketě a vyjádřete svůj názor.',
            optionsText: 'Ano, jednoznačně\nSpíše ano\nSpíše ne\nNe, vůbec\nNemám vyhraněný názor',
          },
        },
        {
          type: 'CallToAction',
          props: {
            title: 'Potřebujete pomoc s vaší opatrovnickou situací?',
            description: 'Registrujte se a získejte přístup k osobní klientské složce a AI nástrojům.',
            buttonText: 'Zaregistrovat se zdarma',
            buttonUrl: '/profile',
            variant: 'primary',
          },
        },
      ],
      root: { props: { title: 'Hlavní Landing Page' } },
    }),
  },

  {
    id: 'tpl-article-1',
    name: 'Článek / Metodický návod pro otce',
    category: 'ARTICLE',
    description: 'Strukturovaný článek s úvodním nadpisem, ilustračním obrázkem, textem s odrážkami, porovnávacími sloupci a diskusní výzvou.',
    isSystem: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=600',
    puckDataJson: JSON.stringify({
      content: [
        {
          type: 'HeroBlock',
          props: {
            title: 'Jak se efektivně připravit na jednání s OSPOD a soudem',
            description: 'Praktický průvodce klíčovými kroky, na co si dát pozor a jak komunikovat v zájmu dítěte.',
            buttonText: 'Stáhnout vzor záznamu',
            buttonUrl: '/ke-stazeni',
          },
        },
        {
          type: 'ImageBlock',
          props: {
            url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=1200',
            alt: 'Soudní jednání a spravedlnost',
            caption: 'Příprava argumentace a důkazů je klíčová pro ochranu práv vašeho dítěte.',
            aspectRatio: '16/9',
            align: 'center',
            maxWidth: 'lg',
            borderRadius: 'xl',
          },
        },
        {
          type: 'TextBlock',
          props: {
            text: 'První kontakt s orgánem sociálně-právní ochrany dětí (OSPOD) bývá pro většinu otců stresující záležitostí. Je však nesmírně důležité zachovat chladnou hlavu, veškerou komunikaci vést věcně, kultivovaně a s primárním zaměřením na potřeby a nejlepší zájem dítěte.\n\n### 1. Dokumentujte veškerý kontakt\nKaždý rozhovor, předání dítěte či překážku v péči si zaznamenávejte do deníku nebo v naší klientské složce.',
            align: 'left',
          },
        },
        {
          type: 'ColumnsBlock',
          props: {
            columnsCount: '2',
            ratio: 'equal',
            gap: 'md',
            col1Title: 'Co Určitě Dělat ✅',
            col1Text: '• Trvejte na písemném vyhotovení protokolů.\n• Mluvte vřele o svém dítěti a jeho potřebách.\n• Zachovejte klid i v případě provokací.',
            col2Title: 'Čemu se Vyhnout ❌',
            col2Text: '• Neútočte osobně na druhého rodiče.\n• Nepoužívejte dítě jako prostředník komunikace.\n• Nezanedbávejte soudní lhůty a výzvy.',
          },
        },
        {
          type: 'CallToAction',
          props: {
            title: 'Máte doplňující otázky k tomuto tématu?',
            description: 'Zeptejte se v našem komunitním fóru nebo konzultujte s AI Asistentem.',
            buttonText: 'Otevřít Fórum',
            buttonUrl: '/forum',
            variant: 'secondary',
          },
        },
      ],
      root: { props: { title: 'Článek a návod' } },
    }),
  },

  {
    id: 'tpl-legal-1',
    name: 'Právní dokument / Podmínky & GDPR',
    category: 'LEGAL',
    description: 'Přehledná šablona pro právní dokumenty, podmínky užívání, prohlášení a GDPR s kontaktním formulářem pro dotazy.',
    isSystem: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600',
    puckDataJson: JSON.stringify({
      content: [
        {
          type: 'HeroBlock',
          props: {
            title: 'Právní náležitosti a Podmínky užívání portálu',
            description: 'Transparentní pravidla, ochrana osobních údajů a odpovědnost poskytovatele.',
            buttonText: '',
            buttonUrl: '',
          },
        },
        {
          type: 'TextBlock',
          props: {
            text: '## 1. Úvodní ustanovení\nTento dokument upravuje podmínky používání internetového portálu Táta má právo.\n\n## 2. Informativní charakter služeb\nVšechny informace, vzory dokumentů a výstupy generované AI asistentem mají výhradně osvětový a edukativní charakter a nenahrazují poskytování právních služeb ve smyslu zákona o advokacii.\n\n## 3. Ochrana osobních údajů\nZpracování osobních údajů probíhá v souladu s nařízením GDPR a platnou legislativou ČR.',
            align: 'left',
          },
        },
        {
          type: 'FormBlock',
          props: {
            formId: 'legal-questions-form',
            formName: 'Dotaz k právním podmínkám',
            title: 'Máte dotaz k právním podmínkám?',
            description: 'Vyplňte formulář pro náš tým právní compliance.',
            fieldsText: 'Jméno a příjmení | text | true\nE-mailová adresa | email | true\nDetail dotazu nebo připomínky | textarea | true',
            submitButtonText: 'Odeslat dotaz',
            successMessage: 'Váš dotaz k právním podmínkám byl úspěšně zaznamenán.',
          },
        },
      ],
      root: { props: { title: 'Právní dokument' } },
    }),
  },

  {
    id: 'tpl-form-1',
    name: 'Kontaktní & Podnětové centrum',
    category: 'FORM',
    description: 'Stránka zaměřená na sběr podnětů od uživatelů, kontaktní formulář, kontaktní údaje a otevírací dobu.',
    isSystem: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?auto=format&fit=crop&q=80&w=600',
    puckDataJson: JSON.stringify({
      content: [
        {
          type: 'HeroBlock',
          props: {
            title: 'Kontaktní centrum a Bezplatná poradna',
            description: 'Napište nám svůj podnět, dotaz k opatrovnické péči nebo požadavek na asistenci.',
            buttonText: 'Vyplnit formulář',
            buttonUrl: '#form',
          },
        },
        {
          type: 'FormBlock',
          props: {
            formId: 'main-contact-form',
            formName: 'Hlavní kontaktní formulář',
            title: 'Napište nám zprávu',
            description: 'Vyplňte následující pole. Zpráva bude předána odpovídajícímu odborníkovi.',
            fieldsText: 'Jméno a příjmení | text | true\nE-mail | email | true\nTelefonní číslo | tel | false\nTéma podnětu (Střídavá péče / Výživné / OSPOD / Jiné) | text | true\nPodrobný popis vaší situace | textarea | true',
            submitButtonText: 'Odeslat zprávu do poradny',
            successMessage: 'Děkujeme za zprávu. Náš tým se vám ozve nejpozději do 24 hodin.',
          },
        },
        {
          type: 'ColumnsBlock',
          props: {
            columnsCount: '2',
            ratio: 'equal',
            gap: 'md',
            col1Title: '📧 E-mailová podpora',
            col1Text: 'info@tatovacesta.cz\nporadna@tatovacesta.cz',
            col2Title: '⏱️ Provozní doba',
            col2Text: 'Pondělí - Pátek: 8:00 - 18:00\nKrizové linky: Nepřetržitě 24/7',
          },
        },
      ],
      root: { props: { title: 'Kontaktní formulář' } },
    }),
  },

  {
    id: 'tpl-custom-1',
    name: 'Univerzální vlastní stránka',
    category: 'CUSTOM',
    description: 'Flexibilní čistá šablona pro tvorbu zcela nové stránky na míru.',
    isSystem: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=600',
    puckDataJson: JSON.stringify({
      content: [
        {
          type: 'HeroBlock',
          props: {
            title: 'Nová stránka',
            description: 'Přizpůsobte si tuto stránku přidáním libovolných komponent v Puck editoru.',
            buttonText: 'Prozkoumat',
            buttonUrl: '#',
          },
        },
        {
          type: 'TextBlock',
          props: {
            text: 'Zde můžete upravit textový obsah, vložit obrázky, sloupce, formuláře nebo ankety.',
            align: 'left',
          },
        },
      ],
      root: { props: { title: 'Vlastní stránka' } },
    }),
  },

  CRISIS_CARD_SYSTEM_TEMPLATE,
];

export async function seedSystemTemplates(): Promise<void> {
  const prisma = getPrismaClient();

  for (const tpl of SYSTEM_DEFAULT_TEMPLATES) {
    if (prisma && (prisma as any).pageTemplate) {
      try {
        await (prisma as any).pageTemplate.upsert({
          where: { id: tpl.id },
          update: {
            name: tpl.name,
            category: tpl.category,
            description: tpl.description,
            puckDataJson: tpl.puckDataJson,
            thumbnailUrl: tpl.thumbnailUrl,
            isSystem: true,
          },
          create: {
            id: tpl.id,
            name: tpl.name,
            category: tpl.category,
            description: tpl.description,
            puckDataJson: tpl.puckDataJson,
            isSystem: true,
            thumbnailUrl: tpl.thumbnailUrl,
          },
        });
      } catch (err) {
        console.warn(`[Seed Templates] Prisma upsert error pro ${tpl.id}:`, err);
      }
    }

    const idx = inMemoryTemplates.findIndex((t) => t.id === tpl.id);
    const templateObj: PageTemplateData = {
      id: tpl.id,
      name: tpl.name,
      category: tpl.category,
      description: tpl.description,
      puckDataJson: tpl.puckDataJson,
      isSystem: true,
      thumbnailUrl: tpl.thumbnailUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (idx >= 0) {
      inMemoryTemplates[idx] = templateObj;
    } else {
      inMemoryTemplates.push(templateObj);
    }
  }
}

export async function getAllTemplates(category?: string): Promise<PageTemplateData[]> {
  const prisma = getPrismaClient();
  let templates: PageTemplateData[] = [];

  if (prisma && (prisma as any).pageTemplate) {
    try {
      const whereClause = category && category !== 'ALL' ? { category } : {};
      templates = await (prisma as any).pageTemplate.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' },
      });
    } catch (err) {
      console.warn('[getAllTemplates] Prisma error:', err);
    }
  }

  if (!templates || templates.length === 0) {
    templates = inMemoryTemplates;
    if (category && category !== 'ALL') {
      templates = templates.filter((t) => t.category === category);
    }
  }

  // If memory is also empty, re-seed
  if (templates.length === 0) {
    await seedSystemTemplates();
    templates = inMemoryTemplates;
    if (category && category !== 'ALL') {
      templates = templates.filter((t) => t.category === category);
    }
  }

  return templates;
}

export async function getTemplateById(id: string): Promise<PageTemplateData | null> {
  const prisma = getPrismaClient();
  if (prisma && (prisma as any).pageTemplate) {
    try {
      const tpl = await (prisma as any).pageTemplate.findUnique({ where: { id } });
      if (tpl) return tpl;
    } catch (err) {
      console.warn('[getTemplateById] Prisma error:', err);
    }
  }
  return inMemoryTemplates.find((t) => t.id === id) || null;
}

export async function createTemplate(data: {
  name: string;
  category?: string;
  description?: string;
  puckDataJson: string;
  thumbnailUrl?: string;
  isSystem?: boolean;
}): Promise<PageTemplateData> {
  const id = `tpl-custom-${Date.now()}-${crypto.randomUUID()}`;
  const category = data.category || 'CUSTOM';
  const name = data.name || 'Nová šablona';
  const description = data.description || null;
  const thumbnailUrl = data.thumbnailUrl || null;
  const isSystem = data.isSystem || false;

  const prisma = getPrismaClient();
  let created: PageTemplateData | null = null;

  if (prisma && (prisma as any).pageTemplate) {
    try {
      created = await (prisma as any).pageTemplate.create({
        data: {
          id,
          name,
          category,
          description,
          puckDataJson: data.puckDataJson,
          thumbnailUrl,
          isSystem,
        },
      });
    } catch (err) {
      console.warn('[createTemplate] Prisma error:', err);
    }
  }

  if (!created) {
    created = {
      id,
      name,
      category,
      description,
      puckDataJson: data.puckDataJson,
      isSystem,
      thumbnailUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryTemplates.push(created);
  }

  return created;
}

export async function updateTemplate(
  id: string,
  data: {
    name?: string;
    category?: string;
    description?: string;
    puckDataJson?: string;
    thumbnailUrl?: string;
  }
): Promise<PageTemplateData | null> {
  const prisma = getPrismaClient();
  let updated: PageTemplateData | null = null;

  if (prisma && (prisma as any).pageTemplate) {
    try {
      updated = await (prisma as any).pageTemplate.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.category && { category: data.category }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.puckDataJson && { puckDataJson: data.puckDataJson }),
          ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        },
      });
    } catch (err) {
      console.warn('[updateTemplate] Prisma error:', err);
    }
  }

  const idx = inMemoryTemplates.findIndex((t) => t.id === id);
  if (idx >= 0) {
    inMemoryTemplates[idx] = {
      ...inMemoryTemplates[idx],
      ...(data.name && { name: data.name }),
      ...(data.category && { category: data.category }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.puckDataJson && { puckDataJson: data.puckDataJson }),
      ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
      updatedAt: new Date(),
    };
    if (!updated) updated = inMemoryTemplates[idx];
  }

  return updated;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const prisma = getPrismaClient();

  if (prisma && (prisma as any).pageTemplate) {
    try {
      await (prisma as any).pageTemplate.delete({ where: { id } });
    } catch (err) {
      console.warn('[deleteTemplate] Prisma error:', err);
    }
  }

  const initialLength = inMemoryTemplates.length;
  const filtered = inMemoryTemplates.filter((t) => t.id !== id);
  inMemoryTemplates.length = 0;
  inMemoryTemplates.push(...filtered);

  return true;
}
