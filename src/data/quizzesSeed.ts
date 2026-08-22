import { Quiz } from '../types';

export const DEFAULT_QUIZZES: Quiz[] = [
  {
    id: 'kviz-ospod',
    slug: 'kviz-prav-a-povinnosti-u-ospodu',
    title: '1. Kvíz práv a povinností u OSPODu',
    category: 'Právní povědomí',
    badge: '10 Otázek',
    icon: 'ShieldCheck',
    description: 'Otestujte si znalosti svých práv v roli rodiče při jednání s kolizním opatrovníkem (OSPOD) a nahlížení do spisu Om.',
    recommendedStudyPath: '/studia',
    difficulty: 'MEDIUM',
    order: 1,
    status: 'PUBLISHED',
    seoTitle: 'Kvíz práv a povinností u OSPODu • Test znalostí',
    seoDescription: 'Interaktivní kvíz ověřující znalosti práv účastníka opatrovnického řízení při kontaktu se sociální pracovnicí OSPOD.',
    questions: [
      {
        id: 'q1',
        quizId: 'kviz-ospod',
        questionText: 'Máte právo nahlížet do spisu Om vedeného na OSPOD a pořizovat si z něj kopie?',
        options: [
          'Ne, spis OSPOD je přísně tajný a slouží pouze pro potřeby soudu.',
          'Ano, podle § 38 správního řádu jako účastník řízení máte právo do spisu nahlížet a dělat si z něj kopie.',
          'Pouze pokud k tomu dá výslovný písemný souhlas druhý rodič.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Podle § 38 správního řádu má každý účastník správního řízení (rodič) právo nahlížet do spisu, pořizovat si fotokopie a výpisy.',
        order: 1
      },
      {
        id: 'q2',
        quizId: 'kviz-ospod',
        questionText: 'Může sociální pracovnice OSPODu zakázat otci účastnit se sociálního šetření v jeho bytě?',
        options: [
          'Ano, sociální pracovnice může rozhodnout podle vlastního uvážení.',
          'Ne, sociální šetření v místě bydliště rodiče vyžaduje jeho součinnost a má právo být přítomen.',
          'Pouze v případě, že je přítomen policista.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Sociální šetření v bytě rodiče je prováděno za jeho přítomnosti a součinnosti. Rodič má právo ukázat své zázemí.',
        order: 2
      },
      {
        id: 'q3',
        quizId: 'kviz-ospod',
        questionText: 'Jaká je hlavní role OSPODu před opatrovnickým soudem?',
        options: [
          'Hájit zájmy a požadavky matky dítěte.',
          'Zastupovat nezletilé dítě jako jeho kolizní opatrovník nezávisle na obou rodičích.',
          'Vynášet rozsudky namísto soudce.'
        ],
        correctAnswerIndex: 1,
        explanation: 'OSPOD je jmenován kolizním opatrovníkem, aby zastupoval výhradně nejlepší zájem dítěte.',
        order: 3
      }
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z'
  },
  {
    id: 'kviz-biff',
    slug: 'biff-trenazer-deeskalace-komunikace',
    title: '2. BIFF Trenažér deeskalace komunikace',
    category: 'Komunikace',
    badge: 'Interaktivní Scénáře',
    icon: 'MessageSquare',
    description: 'Procvičte si správný výběr reakcí na provokativní SMS a e-maily od protistrany podle metody BIFF.',
    recommendedStudyPath: '/studia',
    difficulty: 'EASY',
    order: 2,
    status: 'PUBLISHED',
    seoTitle: 'BIFF Trenažér deeskalace komunikace • Interaktivní test',
    seoDescription: 'Procvičování věcné komunikace s bývalým partnerem podle pravidel BIFF (Brief, Informative, Friendly, Firm).',
    questions: [
      {
        id: 'q-biff-1',
        quizId: 'kviz-biff',
        questionText: 'Druhý rodič vám napíše: "Jsi neschopný otec, dítěti jsi zase zapomněl dát čepici a nevěnuješ se mu! Nic o výchově nevíš!" Jak má vypadat BIFF odpověď?',
        options: [
          '"Ty mi nemáš co vyčítat, sama jsi minule zapomněla přibalit boty a staráš se hrozně!"',
          '"Ahoj, dítě čepici mělo. Na víkend je vše připraveno. Děkuji a přeji hezký den."',
          'Ignorovat SMS zcela a poslat ji s urážkami na OSPOD.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Správná BIFF odpověď je stručná (Brief), věcná (Informative), zdvořilá (Friendly) a jasná (Firm) bez zapojování se do osobních útoků.',
        order: 1
      },
      {
        id: 'q-biff-2',
        quizId: 'kviz-biff',
        questionText: 'Protistrana napíše: "Pokud mi okamžitě nepošleš 2000 Kč na kroužek, dítě ti v patek nepředám!" Jak reagovat?',
        options: [
          '"Ahoj. Úhrada kroužků probíhá dle dohody z výživného. Předání dítěte v patek v 16:00 platí dle rozsudku. S pozdravem."',
          '"Jsi vyděračka! Zase porušuješ rozsudek, hned na tebe podávám exekuci!"',
          'Okamžitě peníze poslat na účet bez dalšího komentáře.'
        ],
        correctAnswerIndex: 0,
        explanation: 'Odpověď odkazuje věcně na rozsudek a dohodu bez ustupování vydírání nebo emocionálního výbuchu.',
        order: 2
      }
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z'
  },
  {
    id: 'kviz-stridavka',
    slug: 'test-pripravenosti-na-stridavou-pecu',
    title: '3. Test připravenosti na střídavou péči',
    category: 'Péče & Zázemí',
    badge: 'Diagnostický Test',
    icon: 'Home',
    description: 'Hodnocení kritérií, které opatrovnické soudy posuzují při rozhodování o rovnocenné střídavé péči obou rodičů.',
    recommendedStudyPath: '/judikatura',
    difficulty: 'HARD',
    order: 3,
    status: 'PUBLISHED',
    seoTitle: 'Test připravenosti na střídavou péči • Opatrovnický kvíz',
    seoDescription: 'Ověření zákonných kritérií a judikatury Ústavního soudu pro nařízení rovnocenné střídavé péče.',
    questions: [
      {
        id: 'q-s-1',
        quizId: 'kviz-stridavka',
        questionText: 'Je podle judikatury Ústavního soudu vzdálenost domovů rodičů automatickou překážkou pro střídavou péči?',
        options: [
          'Ano, pokud rodiče bydlí ve vzdálenosti větší než 10 km, střídavá péče je vyloučena.',
          'Ne, vyšší vzdálenost vyžaduje úpravu logistiky (např. střídání po týdnech), ale sama o sobě střídavou péči nevylučuje.',
          'Záleží pouze na přání matky.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Ústavní soud opakovaně judikoval, že vzdálenost bydlišť není sama o sobě důvodem pro vyloučení střídavé péče.',
        order: 1
      },
      {
        id: 'q-s-2',
        quizId: 'kviz-stridavka',
        questionText: 'Co je podle § 888 o.z. povinností rodiče, který má dítě zrovna u sebe?',
        options: [
          'Umožnit a usnadnit styk dítěte s druhým rodičem a nepomlouvat ho.',
          'Informovat druhého rodiče o každé minutě dne.',
          'Kontrolovat e-maily a telefony dítěte.'
        ],
        correctAnswerIndex: 0,
        explanation: 'Rodiče mají zákonnou povinnost styk s druhým rodičem podporovat a spolupracovat v zájmu dítěte.',
        order: 2
      }
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z'
  }
];
