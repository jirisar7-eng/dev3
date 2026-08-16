/**
 * Výchozí Puck JSON struktury pro všechny veřejné stránky a moduly Krizové pomoci.
 */

export const DEFAULT_CRISIS_COMMUNITY_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-krizova-pomoc',
        title: 'Krizová pomoc & Komunita Otců',
        description: 'Okamžitá krizová opora, praktické postupy, komunitní sdílení a právní jistota pro otce v opatrovnických situacích.',
        buttonText: 'Otevřít SOS plán (72h)',
        buttonUrl: '/sos-plan',
      },
    },
    {
      type: 'ColumnsBlock',
      props: {
        id: 'cols-krizova-pomoc',
        columnsCount: '3',
        ratio: 'equal',
        gap: 'lg',
        col1Title: '🚨 SOS Plán (72h)',
        col1Text: '4-kroký algoritmus krizového postupu. Emoční STOP, BIFF komunikace, evidence a právní obrana.',
        col2Title: '💬 Komunitní Fórum',
        col2Text: 'Bezpečný diskuzní prostor v 5 kategoriích s přísnou anonymizací dětí a rodičů.',
        col3Title: '⚖️ Právní Poradna',
        col3Text: 'Nálezy Ústavního soudu, propojení s AI Synthesis OS a vzory podání ke stažení.',
      },
    },
    {
      type: 'CallToAction',
      props: {
        id: 'cta-krizova-pomoc',
        title: 'Jste v akutním stresu nebo krizové situaci?',
        description: 'Anonymní a bezplatná krizová linka první psychické pomoci je dostupná 24/7 na čísle 116 123.',
        buttonText: 'Volat 116 123',
        buttonUrl: 'tel:116123',
        variant: 'primary',
      },
    },
  ],
  root: { props: { title: 'Krizová pomoc & Komunita' } },
};

export const DEFAULT_SOS_PLAN_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-sos-plan',
        title: 'SOS Plán: Prvních 72 hodin opatrovnického konfliktu',
        description: '4-kroký krizový algoritmus. Zachovejte chladnou hlavu, aplikujte BIFF komunikaci a zabezpečte důkazy.',
        buttonText: 'Zobrazit Checklist',
        buttonUrl: '#checklist',
      },
    },
    {
      type: 'TextBlock',
      props: {
        id: 'text-sos-plan-1',
        text: '### Krok 1: Emoční STOP & Pravidlo 24h\nNikdy neodpovídejte v afektu. Aplikujte pravidlo BIFF (Brief, Informative, Friendly, Firm) a odpověď odložte o 24 hodin.\n\n### Krok 2: Okamžitá evidence & Archiv\nZálohujte všechny SMS, e-maily a WhatsApp konverzace. Při nepředání dítěte pořiďte věcný záznam v klidu.\n\n### Krok 3: Věcný podnět na OSPOD\nKontaktujte OSPOD písemně bez očerňování druhého rodiče a zaměřte se výhradně na zájem dítěte.\n\n### Krok 4: Kvalifikovaná právní obrana\nVyhodnoťte potřebu podání Předběžného opatření (§ 452 z.ř.s.) nebo standardního návrhu na úpravu péče.',
        align: 'left',
      },
    },
  ],
  root: { props: { title: 'SOS Plán 72 hodin' } },
};

export const DEFAULT_FORUM_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-forum',
        title: 'Komunitní Fórum a Diskuse Otců',
        description: 'Bezpečné a anonymizované prostředí pro sdílení zkušeností z opatrovnických řízení v 5 kategoriích.',
        buttonText: 'Založit nové téma',
        buttonUrl: '/forum',
      },
    },
    {
      type: 'PollBlock',
      props: {
        id: 'poll-forum-1',
        question: 'Považujete podporu ze strany OSPOD ve vaší lokalitě za vyváženou?',
        description: 'Hlasování v anonymní komunitní anketě.',
        optionsText: 'Ano, plně vyvážená\nSpíše vyvážená\nSpíše nestranná či neaktivní\nNe, spíše zaujatá\nNe, výrazně diskriminační',
      },
    },
  ],
  root: { props: { title: 'Komunitní Fórum' } },
};

export const DEFAULT_CASE_STORIES_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-pribehy',
        title: 'Příběhy a Kazuistiky z Opatrovnické Praxe',
        description: 'Reálné anonymizované příběhy otců, kteří obhájili práva svých dětí u soudů.',
        buttonText: 'Číst kazuistiky',
        buttonUrl: '/pribehy',
      },
    },
  ],
  root: { props: { title: 'Příběhy z praxe' } },
};

export const DEFAULT_MEMENTO_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-memento',
        title: 'Memento: 4 Osudové Procesní Chyby Otců u Soudu',
        description: 'Poučení z chyb. Jak se vyhnout zprávám v afektu, zbytečnému ustupování, pomstě a útokům na internetu.',
        buttonText: 'Studovat chyby',
        buttonUrl: '/memento',
      },
    },
  ],
  root: { props: { title: 'Memento procesních chyb' } },
};

export const DEFAULT_LEGAL_HELP_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-pravni-poradna',
        title: 'Právní Poradna & Judikatura Ústavního Soudu',
        description: 'Klíčové nálezy garantující střídavou péči a přespávání dětí útlého věku u obou rodičů.',
        buttonText: 'Spustit AI Synthesis OS',
        buttonUrl: '/ai-assistant',
      },
    },
  ],
  root: { props: { title: 'Právní poradna' } },
};

export const DEFAULT_SUPPORT_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-podpora',
        title: 'Podpora & Vrstevnický Mentoring Táta-Parťák',
        description: 'Nonstop krizové linky, propojení se zkušeným mentorem a dobrovolnická síť.',
        buttonText: 'Požádat o mentorství',
        buttonUrl: '/podpora',
      },
    },
  ],
  root: { props: { title: 'Podpora a mentoring' } },
};

export const CRISIS_COMMUNITY_PAGES_PUCK_DATA: Record<string, any> = {
  'krizova-pomoc': DEFAULT_CRISIS_COMMUNITY_PUCK_DATA,
  'sos-plan': DEFAULT_SOS_PLAN_PUCK_DATA,
  'crisis': DEFAULT_SOS_PLAN_PUCK_DATA,
  'forum': DEFAULT_FORUM_PUCK_DATA,
  'pribehy': DEFAULT_CASE_STORIES_PUCK_DATA,
  'stories': DEFAULT_CASE_STORIES_PUCK_DATA,
  'memento': DEFAULT_MEMENTO_PUCK_DATA,
  'pravni-poradna': DEFAULT_LEGAL_HELP_PUCK_DATA,
  'advice': DEFAULT_LEGAL_HELP_PUCK_DATA,
  'podpora': DEFAULT_SUPPORT_PUCK_DATA,
  'support': DEFAULT_SUPPORT_PUCK_DATA,
};

export const DEFAULT_AGENDA_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-agenda',
        title: '4 Fáze Opatrovnického Řízení v ČR',
        description: 'Praktická časová osa opatrovnické agendy. Od krizové stabilizace na OSPOD po vyhlášení rozsudku a uplatňování pokut za maření styku.',
        buttonText: 'Otevřít Generátor Podání',
        buttonUrl: '/ai-formulare',
      },
    },
  ],
  root: { props: { title: 'Opatrovnická agenda' } },
};

export const DEFAULT_RIGHTS_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-prava',
        title: 'Práva Rodiče a Dítěte (§ 855–§ 889 o.z.)',
        description: 'Zákonný přehled garantující rovnocennost péče, nahlížení do školních portálů a ochranu před bráněním ve styku.',
        buttonText: 'Studovať paragrafy',
        buttonUrl: '/prava',
      },
    },
  ],
  root: { props: { title: 'Práva rodiče a dítěte' } },
};

export const DEFAULT_CASE_LAW_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-judikatura',
        title: 'Databáze Nálezů Ústavního Soudu ČR',
        description: 'Závazná judikatura k střídavé péči, péči o kojence, bezdůvodnému nesouhlasu matky a povinnostem OSPOD.',
        buttonText: 'Prohledávat judikaturu',
        buttonUrl: '/judikatura',
      },
    },
  ],
  root: { props: { title: 'Judikatura Ústavního soudu' } },
};

export const DEFAULT_DOCUMENTS_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-dokumenty',
        title: 'Oficiální Vzory Podání a Žádostí MS ČR',
        description: 'Právní šablony pro opatrovnický soud, OSPOD, školy a lékaře propojené s AI automatickým generátorem.',
        buttonText: 'Vygenerovat návrh',
        buttonUrl: '/ai-formulare',
      },
    },
  ],
  root: { props: { title: 'Knihovna právních vzorů' } },
};

export const LEGAL_PAGES_PUCK_DATA: Record<string, any> = {
  'agenda': DEFAULT_AGENDA_PUCK_DATA,
  'opatrovnicka-agenda': DEFAULT_AGENDA_PUCK_DATA,
  'prava': DEFAULT_RIGHTS_PUCK_DATA,
  'rights': DEFAULT_RIGHTS_PUCK_DATA,
  'judikatura': DEFAULT_CASE_LAW_PUCK_DATA,
  'pripadova-databaze': DEFAULT_CASE_LAW_PUCK_DATA,
  'dokumenty': DEFAULT_DOCUMENTS_PUCK_DATA,
  'ke-stazeni': DEFAULT_DOCUMENTS_PUCK_DATA,
};

