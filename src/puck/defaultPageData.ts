/**
 * Výchozí Puck JSON struktury pro všechny veřejné stránky a moduly Krizové pomoci.
 */

export const DEFAULT_HOMEPAGE_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-home',
        title: 'Táta má právo',
        subtitle: 'Pomoc, když se rozpadá rodina. Podpora, když nechcete přijít o své dítě.',
        description: 'Rozchod rodičů nemusí znamenat konec vztahu otce s dítětem.\n\nNa jednom místě získáte přehled, co můžete udělat, jaká máte práva, jak postupovat vůči soudu a OSPOD, jak si připravit podklady a jak si dlouhodobě udržet přehled o péči o své dítě.',
        badgeText: 'Portál pro právní a psychologickou oporu otců v ČR',
        highlightBadge: 'Nejsme proti matkám. Jsme pro dítě a jeho právo mít oba rodiče.',
        ctaText: 'Začít podle mé situace',
        ctaUrl: '/opatrovnicka-agenda',
        secondaryCtaText: 'Prozkoumat portál',
        secondaryCtaUrl: '/sitemap',
      },
    },
    {
      type: 'SituationSelectorBlock',
      props: {
        id: 'situace-home',
        title: 'Nevíte, kde začít?',
        subtitle: 'Vyberte, co právě řešíte.',
        cards: [
          {
            title: 'Jsem po rozchodu',
            description: 'Zjistěte, co řešit jako první, na co nezapomenout a jak si vytvořit stabilní plán péče o dítě.',
            ctaText: 'Průvodce po rozchodu',
            ctaUrl: '/sos-plan',
            icon: 'Compass',
            active: 'true',
          },
          {
            title: 'Řeším soud nebo OSPOD',
            description: 'Zorientujte se v opatrovnickém řízení, důležitých dokumentech, lhůtách, důkazech a jednotlivých krocích.',
            ctaText: 'Průvodce řízením',
            ctaUrl: '/opatrovnicka-agenda',
            icon: 'Scale',
            active: 'true',
          },
          {
            title: 'Chci nastavit péči o dítě',
            description: 'Promyslete praktické uspořádání péče, předávání dítěte, komunikaci rodičů, svátky, prázdniny a běžný režim.',
            ctaText: 'Plán péče',
            ctaUrl: '/plan-pece',
            icon: 'Calendar',
            active: 'true',
          },
          {
            title: 'Potřebuji připravit dokument',
            description: 'Najděte vzory podání, žádostí, návrhů a dalších dokumentů.',
            ctaText: 'Centrum formulářů',
            ctaUrl: '/centrum-formularu',
            icon: 'FileText',
            active: 'true',
          },
          {
            title: 'Potřebuji najít právní oporu',
            description: 'Vyhledejte relevantní zákony, rozhodnutí soudů a judikaturu.',
            ctaText: 'Judikatura a legislativa',
            ctaUrl: '/judikatura',
            icon: 'BookOpen',
            active: 'true',
          },
          {
            title: 'Nevím, jak svůj případ uchopit',
            description: 'AI průvodce vám pomůže uspořádat informace, pracovat s dokumenty a připravit si otázky a podklady.',
            ctaText: 'AI průvodce',
            ctaUrl: '/ai-guide',
            icon: 'Sparkles',
            active: 'true',
          },
        ],
      },
    },
    {
      type: 'ProcessTimelineBlock',
      props: {
        id: 'timeline-home',
        title: 'Vaše dítě. Vaše péče. Vaše práva.',
        subtitle: 'Portál, který spojuje informace, dokumenty a praktickou pomoc.',
        description: 'Táta má právo není jen databáze článků. Je to nástroj, který má otci pomoci projít celou cestou:',
        steps: [
          { stepNumber: '1', title: 'Rozchod', description: 'První krizové kroky a stabilizace' },
          { stepNumber: '2', title: 'Komunikace rodičů', description: 'Pravidla věcné a bezkontaktní komunikace' },
          { stepNumber: '3', title: 'OSPOD', description: 'Příprava na jednání s orgánem péče o děti' },
          { stepNumber: '4', title: 'Soud', description: 'Průběh opatrovnického řízení a důkazy' },
          { stepNumber: '5', title: 'Rozhodnutí', description: 'Rozsudek, vykonatelnost a střídavá péče' },
          { stepNumber: '6', title: 'Každodenní péče', description: 'Praktický režim, svátky a prázdniny' },
          { stepNumber: '7', title: 'Dlouhodobá stabilita', description: 'Udržení vztahu s dítětem v čase' },
        ],
      },
    },
    {
      type: 'FeatureGridBlock',
      props: {
        id: 'features-home',
        title: 'Co můžete na portálu dělat?',
        subtitle: 'Komplexní ekosystém nástrojů pro otce',
        features: [
          {
            title: 'Orientovat se v právu',
            description: 'Srozumitelně vysvětlené informace k opatrovnickému řízení, rodičovské odpovědnosti, péči o dítě, výživnému, styku, bydlišti dítěte a dalším situacím.',
            ctaText: 'Právní přehled',
            ctaUrl: '/prava',
            icon: 'BookOpen',
            active: 'true',
          },
          {
            title: 'Pracovat s judikaturou',
            description: 'Vyhledávat důležitá rozhodnutí českých soudů a hledat jejich význam pro konkrétní problematiku péče o dítě.',
            ctaText: 'Prohledat judikaturu',
            ctaUrl: '/judikatura',
            icon: 'Scale',
            active: 'true',
          },
          {
            title: 'Připravovat dokumenty',
            description: 'Vzory a pomocníci pro přípravu podání, žádostí, vyjádření a dalších dokumentů.',
            ctaText: 'Generovat dokument',
            ctaUrl: '/centrum-formularu',
            icon: 'FileText',
            active: 'true',
          },
          {
            title: 'Vést vlastní případ',
            description: 'Ukládat dokumenty, důležité údaje, události, termíny, důkazy a další informace související s vaším případem.',
            ctaText: 'Otevřít klientskou složku',
            ctaUrl: '/user-portal',
            icon: 'FolderOpen',
            active: 'true',
          },
          {
            title: 'Vytvořit plán péče',
            description: 'Přehled péče o dítě, předávání, školu, kroužky, prázdniny, svátky a další důležité části každodenního života.',
            ctaText: 'Navrhnout plán',
            ctaUrl: '/plan-pece',
            icon: 'Calendar',
            active: 'true',
          },
          {
            title: 'Využít AI jako pomocníka',
            description: 'Nechte AI pomoci s orientací v dokumentech, shrnutím textu, vytvořením přehledu nebo nalezením souvisejících témat.',
            ctaText: 'Aktivovat AI',
            ctaUrl: '/ai-assistant',
            icon: 'Sparkles',
            active: 'true',
          },
        ],
      },
    },
    {
      type: 'LifeSituationsGridBlock',
      props: {
        id: 'situations-grid-home',
        title: 'Řešte svou situaci podle toho, co právě prožíváte',
        subtitle: 'Přímé vstupy do tematických modulů',
        situations: [
          { title: 'Rozchod a první týdny', description: 'První kroky a krizová stabilizace po rozchodu rodičů.', ctaText: 'Detail situace', ctaUrl: '/sos-plan', icon: 'Compass', active: 'true' },
          { title: 'Dítě je u druhého rodiče', description: 'Jak postupovat, když druhý rodič omezuje nebo znemožňuje kontakt s dítětem.', ctaText: 'Detail situace', ctaUrl: '/crisis', icon: 'AlertCircle', active: 'true' },
          { title: 'OSPOD', description: 'Příprava na pohovor na orgánu sociálně-právní ochrany dětí.', ctaText: 'Detail situace', ctaUrl: '/opatrovnicka-agenda', icon: 'Shield', active: 'true' },
          { title: 'Soudní řízení', description: 'Jak funguje opatrovnický soud, lhůty, jednání a dokazování.', ctaText: 'Detail situace', ctaUrl: '/opatrovnicka-agenda', icon: 'Scale', active: 'true' },
          { title: 'Návrh na péči', description: 'Příprava kvalitního návrhu na úpravu poměrů k nezletilému dítěti.', ctaText: 'Detail situace', ctaUrl: '/centrum-formularu', icon: 'FileText', active: 'true' },
          { title: 'Střídavá péče', description: 'Jak argumentovat pro střídavou péči a jak ji prakticky uspořádat.', ctaText: 'Detail situace', ctaUrl: '/plan-pece', icon: 'HeartHandshake', active: 'true' },
          { title: 'Výživné', description: 'Stanovení alimentů podle doporučujících tabulek Ministerstva spravedlnosti.', ctaText: 'Detail situace', ctaUrl: '/plan-pece', icon: 'Calculator', active: 'true' },
          { title: 'Konfliktní komunikace', description: 'Zásady BIFF komunikace pro snížení napětí mezi rodiči.', ctaText: 'Detail situace', ctaUrl: '/forum', icon: 'MessageSquare', active: 'true' },
          { title: 'Předávání dítěte', description: 'Jak zajistit hladké a bezkonfliktní předávání dítěte mezi rodiči.', ctaText: 'Detail situace', ctaUrl: '/coparent-hub', icon: 'Calendar', active: 'true' },
          { title: 'Prázdniny a svátky', description: 'Rozvržení péče o prázdninách, svátcích a významných dnech.', ctaText: 'Detail situace', ctaUrl: '/coparent-hub', icon: 'Sun', active: 'true' },
          { title: 'Stěhování rodiče nebo dítěte', description: 'Řešení situace, kdy se druhý rodič chce s dítětem odstěhovat.', ctaText: 'Detail situace', ctaUrl: '/pravni-poradna', icon: 'Home', active: 'true' },
          { title: 'Nerespektování rozhodnutí', description: 'Výkon rozhodnutí, předběžná opatření a pokuty za bránění ve styku.', ctaText: 'Detail situace', ctaUrl: '/judikatura', icon: 'Gavel', active: 'true' },
        ],
      },
    },
    {
      type: 'GuideSectionBlock',
      props: {
        id: 'guide-home',
        title: 'Nevíte, co řešit jako první?',
        text: 'Použijte našeho průvodce. Odpovězte na několik jednoduchých otázek a portál vám sestaví orientační seznam oblastí, které mohou být pro vaši situaci důležité.',
        ctaText: 'Spustit průvodce',
        ctaUrl: '/ai-guide',
      },
    },
    {
      type: 'WorkspaceSectionBlock',
      props: {
        id: 'workspace-home',
        title: 'Vaše dokumenty nemusí být rozházené',
        subtitle: 'Vytvořte si vlastní opatrovnickou složku',
        itemsText: 'Rozhodnutí soudu\nNávrhy a vyjádření\nKomunikace rodičů\nDůležité události\nDůkazní materiály\nTermíny jednání\nÚdaje o dítěti\nPlán péče\nDůležitá judikatura\nVlastní poznámky',
        note: 'Jednou zadané údaje nemusíte zbytečně přepisovat do dalších částí portálu.',
        ctaText: 'Otevřít Moji pracovnu',
        ctaUrl: '/user-portal',
      },
    },
    {
      type: 'AiSectionBlock',
      props: {
        id: 'ai-home',
        title: 'Nechte si pomoci s orientací',
        subtitle: 'AI průvodce',
        capabilitiesText: 'vytvořit stručné shrnutí rozsudku či podání\nvytáhnout důležité údaje a lhůty\nvytvořit seznam otázek na jednání OSPOD / soudu\nnajít související právní témata\npřipravit věcné podklady pro advokáta\nporovnat informace v různých dokumentech\nvysvětlit složitý právní text srozumitelněji',
        disclaimer: 'AI nenahrazuje advokáta ani soud. Je to nástroj pro orientaci, organizaci informací a přípravu.',
        ctaText: 'Vyzkoušet AI průvodce',
        ctaUrl: '/ai-guide',
      },
    },
    {
      type: 'KnowledgeCenterBlock',
      props: {
        id: 'knowledge-home',
        title: 'Ověřené informace místo chaosu',
        text: 'Cílem je, aby otec nemusel hledat odpověď na deseti různých místech.',
        ctaText: 'Prozkoumat znalostní centrum',
        ctaUrl: '/legal-wiki',
      },
    },
    {
      type: 'PrincipleSectionBlock',
      props: {
        id: 'principle-home',
        title: 'Co je důležité?',
        highlightTitle: 'Dítě není předmět sporu.',
        body: 'Rozchod rodičů je situace dospělých.\n\nPro dítě je ale zásadní, aby mělo bezpečný vztah k oběma rodičům, pokud jsou oba rodiče schopni o něj řádně pečovat.\n\nProto nechceme stavět portál na boji: otec proti matce, ale na principu: dítě + oba rodiče + odpovědná péče.',
      },
    },
    {
      type: 'CtaGridBlock',
      props: {
        id: 'cta-grid-home',
        title: 'Začněte tam, kde právě jste',
        buttons: [
          { text: 'Jsem po rozchodu', url: '/sos-plan' },
          { text: 'Řeším OSPOD', url: '/opatrovnicka-agenda' },
          { text: 'Mám soud', url: '/opatrovnicka-agenda' },
          { text: 'Chci střídavou péči', url: '/plan-pece' },
          { text: 'Nemohu se vídat s dítětem', url: '/crisis' },
          { text: 'Druhý rodič nedodržuje dohodu', url: '/judikatura' },
          { text: 'Potřebuji připravit dokument', url: '/centrum-formularu' },
          { text: 'Chci si vést vlastní případ', url: '/user-portal' },
          { text: 'Nevím, co mám dělat', url: '/ai-guide' },
        ],
      },
    },
    {
      type: 'FooterCtaBlock',
      props: {
        id: 'footer-cta-home',
        title: 'Táta má právo',
        subtitle: 'Informace. Nástroje. Orientace. Podpora.',
        text: 'Projekt vzniká s cílem pomáhat rodičům lépe se orientovat v situacích spojených s rozchodem, péčí o dítě a opatrovnickým řízením.',
        legalDisclaimer: 'Informace na portálu mají informační charakter a nenahrazují individuální právní služby.',
        ctaText: 'Začít',
        ctaUrl: '/sos-plan',
      },
    },
  ],
  root: { props: { title: 'Táta má právo • Hlavní strana' } },
};

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

export const DEFAULT_ROZCHOD_A_DITE_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-rozchod-a-dite',
        title: 'Průvodce životní cestou otce: Od rozchodu ke stabilní péči',
        description: 'Kompletní životní cesta: Rozchod, Dítě, OSPOD, Soud, Rozhodnutí a stabilní péče. Vše, co potřebujete vědět a udělat v každé fázi opatrovnického procesu.',
        badgeText: 'Životní cesta otce • Průvodce',
        ctaText: 'Spustit SOS Plán',
        ctaUrl: '/sos-plan',
        secondaryCtaText: 'Znalostní báze',
        secondaryCtaUrl: '/legal-wiki',
      },
    },
    {
      type: 'TextBlock',
      props: {
        id: 'text-rozchod-phase-1',
        text: '### 1. Rozchod a stabilizace vztahu s dětmi\n\nRozpad partnerského vztahu je emočně nesmírně náročný, avšak pro zájmy dítěte je nezbytné tyto emoce oddělit od rodičovské role. Dětští psychologové se shodují, že největší zátěží pro dítě není samotný rozchod rodičů, ale dlouhotrvající meziričovský konflikt, ve kterém je dítě zataženo do sporů dospělých.\n\n**Co má otec udělat ihned po rozchodu:**\n- **Aplikovat krizový SOS Plán:** Zachovat klid a jednat s rozmyslem. Na dehonestující nebo agresivní zprávy neodpovídat v afektu (metoda 24 hodin na odpověď).\n- **Navrhnout provizorní písemnou dohodu:** Předložit druhému rodiči písemný návrh na dočasnou péči o dítě tak, aby byl zachován pravidelný kontakt s oběma rodiči.\n- **Zůstat aktivní v každodenním životě dítěte:** Vodit dítě do školky/školy, navštěvovat lékaře, zajišťovat kroužky.\n\n**Čemu se striktně vyhnout:**\n- **Zbrklému odchodu ze společného bydliště:** Pokud odejdete z bytu bez písemné dohody, jak bude probíhat péče o dítě, může být toto chování u soudu dezinterpretováno jako „opuštění rodiny“ nebo ztráta zájmu o každodenní péči.\n- **Konfrontacím před dítětem:** Dítě nikdy nesmí být svědkem hádek, výčitek nebo fyzického napětí.\n- **Zatahování dítěte do sporů:** Nepoužívejte dítě jako poslíčka zpráv ani se ho neptejte na detaily ze soukromí druhého rodiče.\n\n**Doporučené moduly:**\n- **[SOS Plán prvních 72 hodin](/sos-plan)**\n- **[Simulátor a kalkulačka péče](/plan-pece)**',
        align: 'left',
        maxWidth: 'xl',
      },
    },
    {
      type: 'ColumnsBlock',
      props: {
        id: 'cols-rozchod-phases',
        columnsCount: '2',
        ratio: 'equal',
        gap: 'lg',
        col1Title: 'Fáze 2: OSPOD a kolizní opatrovník',
        col1Text: 'Jakmile soud zahájí řízení, jmenuje dítěti kolizního opatrovníka - OSPOD. Ten zkoumá poměry v rodině, mluví s rodiči i dětmi a podává soudu doporučení.\n\n**Co dělat:** Připravit se na jednání klidně, mluvit výhradně o zájmu dítěte a své rodičovské kapacitě, nikoliv o chybách matky.\n\n[Přejít na průvodce OSPOD](/ospod-a-z)',
        col2Title: 'Fáze 3: Soudní řízení a rozsudek',
        col2Text: 'Opatrovnický soud rozhoduje o péči, výživném a styku. Klíčem k úspěchu je věcná argumentace postavená na důkazech o kontinuitě péče a zájmu dítěte.\n\n**Co dělat:** Vést si pečlivou kroniku událostí, shromažďovat věcné důkazy a doložit stabilní zázemí.\n\n[Zobrazit vzory podání](/ke-stazeni)',
      },
    },
    {
      type: 'TextBlock',
      props: {
        id: 'text-rozchod-phase-4',
        text: '### 4. Stabilní péče a dlouhodobý Co-Parenting\n\nVydáním soudního rozhodnutí proces nekončí, ale začíná nová etapa. Dlouhodobě udržitelná péče vyžaduje strukturu, předvídatelnost a deeskalaci komunikace mezi rodiči.\n\n**Zlatá pravidla stabilní péče:**\n- **Sdílený kalendář:** Plánujte prázdniny, svátky, školní akce a lékaře s dostatečným předstihem na jednom sdíleném místě.\n- **Jasná evidence nákladů:** Veškeré mimořádné výdaje (škola, kroužky, tábory) dokumentujte a sdílejte transparentně, aby se předešlo sporům o finance.\n- **Zákonná práva:** Trvejte na svém právu na informace o zdraví a vzdělání dítěte od škol a lékařů.\n\n**Doporučené moduly:**\n- **[Co-Parenting centrum & sdílený kalendář](/coparent-hub)**\n- **[Práva rodičů a dětí](/prava)**',
        align: 'left',
        maxWidth: 'xl',
      },
    },
  ],
  root: { props: { title: 'Průvodce životní cestou otce' } },
};

export const DEFAULT_OSPOD_A_Z_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-ospod-a-z',
        title: 'Ucelený průvodce OSPOD od A do Z',
        description: 'Praktická příručka pro jednání s Orgánem sociálně-právní ochrany dětí. Zjistěte, jak se připravit na první schůzku, jak probíhá domácí šetření a jak čelit případné neobjektivitě.',
        badgeText: 'OSPOD • Průvodce pro otce',
        ctaText: 'Spustit AI Průvodce',
        ctaUrl: '/ai-guide',
        secondaryCtaText: 'Vzory stížností',
        secondaryCtaUrl: '/ke-stazeni',
      },
    },
    {
      type: 'TextBlock',
      props: {
        id: 'text-ospod-roles',
        text: '### 1. Kdo je OSPOD a jaká je jeho role?\n\nOrgán sociálně-právní ochrany dětí (OSPOD) je úřad, který v opatrovnickém řízení vystupuje jako **kolizní opatrovník nezletilého dítěte**. Jmenuje ho soud v situaci, kdy hrozí střet zájmů mezi rodiči a dítětem (což je u rozchodu standardní stav). OSPOD nemá rozhodovací pravomoc – nerozhoduje o výživném ani o střídavé péči. Jeho úkolem je nestranně hájit zájmy dítěte, provádět šetření v rodině a podávat soudu doporučení, kterým se soud v drtivé většině případů řídí.\n\n**Zásadní pravidlo:** OSPOD není nepřítel, kterého musíte porazit, ani spojenec, kterého si můžete koupit stížnostmi na druhou stranu. Vaším cílem při komunikaci s OSPOD je prokázat, že jste **stabilní, milující a spolupracující rodič**, který respektuje roli matky a klade zájmy dítěte na první místo.\n\n### 2. Příprava na první jednání a schůzku\n\nPrvní osobní schůzka s opatrovnickou pracovnicí na úřadě určuje tón celého budoucího vztahu. Schůzku doprovází nervozita, proto je nezbytná důsledná věcná příprava.\n\n**Klíčové zásady pro první schůzku:**\n- **Mluvte o dítěti, ne o matce:** Místo stížností typu „matka je psychopatka a brání mi v kontaktu“ formulujte situaci věcně: „Mám s dětmi velmi silný vztah a mým hlavním cílem je zajistit jim kontinuitu otcovské péče, kterou jsem realizoval po celou dobu trvání našeho soužití. Mám k tomu připravené stabilní zázemí a časový rozvrh.“\n- **Připravte si konkrétní režim péče:** Přineste s sebou rozpis péče (např. v režimu střídavé péče), ukažte, jak budete řešit logistiku (vyzvedávání, škola, kroužky).\n- **Doložte rodičovskou kapacitu:** Předložte potvrzení od zaměstnavatele o flexibilní pracovní době nebo možnosti home office a ukažte, že se aktivně zajímáte o potřeby dítěte.',
        align: 'left',
        maxWidth: 'xl',
      },
    },
    {
      type: 'ColumnsBlock',
      props: {
        id: 'cols-ospod-steps',
        columnsCount: '2',
        ratio: 'equal',
        gap: 'lg',
        col1Title: '3. Domácí šetření u otce',
        col1Text: 'Pracovnice OSPOD navštíví vaše bydliště, aby ověřila vhodnost prostředí pro pobyt dítěte.\n\n**Co se hodnotí:**\n- Zda má dítě odpovídající prostor na spaní a učení (dětský koutek, postýlka, stůl podle věku).\n- Přítomnost základních potřeb (hygiena, bezpečí, hračky, věkově odpovídající knížky).\n- Všeobecná čistota a zázemí rodiny.\n\n**Doporučení:** Buďte věcní a klidní. Domácí šetření není domovní prohlídka, ale ověření, že vaše zázemí odpovídá vývojovým potřebám dítěte.',
        col2Title: '4. Práce s protokoly a zápisy',
        col2Text: 'Po každém jednání se sepisuje protokol. Vše, co řeknete, může být zaznamenáno a použito u soudu.\n\n**Co dělat:**\n- Protokol si před podpisem velmi důkladně přečtěte.\n- Pokud zápis překrucuje vaše slova nebo vynechává klíčová fakta, trvejte na okamžité úpravě.\n- Pokud pracovnice odmítne změnu provést, podepište zápis s vlastnoručním dopsáním věcné výhrady (např. „Podepisuji s výhradou k odstavci 3...“).',
      },
    },
    {
      type: 'TextBlock',
      props: {
        id: 'text-ospod-unfairness',
        text: '### 5. Jak čelit neobjektivitě a podjatosti\n\nV praxi se otcové někdy setkávají s předsudky nebo neprofesionálním chováním. Pokud máte důvodné podezření na podjatost nebo závažné pochybení opatrovnické pracovnice, postupujte striktně v právních mezích:\n- **Nezvyšujte hlas a nevyhrožujte:** Jakýkoliv verbální útok či agresivita bude okamžitě zaznamenána v protokolu a použita proti vám u soudu.\n- **Komunikujte výhradně písemně:** Pokud vám pracovnice odmítá vyhovět ústně, veškeré žádosti, podněty a návrhy podávejte písemně (ideálně datovou schránkou) s jasným požadavkem na písemné vyjádření OSPOD.\n- **Podejte stížnost na postup úřadu:** Podle § 175 správního řádu můžete podat věcnou stížnost vedoucímu odboru sociálních věcí příslušného městského úřadu. Stížnost musí být absolutně zbavena emocí a musí poukazovat na konkrétní porušení povinností sociálního pracovníka (např. odmítnutí zapsat vyjádření otce, ignorování důkazů, neuskutečnění domácího šetření u matky při podezření na zanedbání péče).\n- **Požádejte o delegování případu:** V krajních případech lze požádat o delegování případu jinému pracovníkovi z důvodu závažných pochybností o nestrannosti.\n\n**Doporučené moduly:**\n- **[Právní Wiki a pojmovník](/legal-wiki)**\n- **[AI Opatrovnický průvodce](/ai-guide)**',
        align: 'left',
        maxWidth: 'xl',
      },
    },
  ],
  root: { props: { title: 'OSPOD od A do Z' } },
};

export const DEFAULT_DOKUMENTACE_A_DOKAZY_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-dokumentace',
        title: 'Metodika dokumentace a důkazů v opatrovnickém řízení',
        description: 'Praktický návod, jak bezpečně, legálně a účinně shromažďovat, strukturovat a předkládat důkazní materiály u soudu a OSPOD v zájmu obhájení otcovské péče.',
        badgeText: 'Metodika • Důkazní břemeno',
        ctaText: 'Spustit Case Manager',
        ctaUrl: '/ai-case-manager',
        secondaryCtaText: 'Šablony podání',
        secondaryCtaUrl: '/ke-stazeni',
      },
    },
    {
      type: 'TextBlock',
      props: {
        id: 'text-docs-philosophy',
        text: '### 1. Zásadní princip: Důkaz slouží k ochraně dítěte, ne k pomstě\n\nJednou z nejčastějších chyb otců v opatrovnickém konfliktu je shromažďování enormního množství irelevantních, emočně zabarvených nahrávek, SMS zpráv a screenshotů s cílem „zničit“ druhého rodiče a dokázat jeho domnělou neschopnost. Tento postup se téměř vždy obrací proti otci – soudy i OSPOD takové jednání vnímají jako projev vysoké míry konfliktnosti a neschopnosti se s druhým rodičem konstruktivně dohodnout.\n\n**Správná filozofie dokazování:**\n- **Dokazujte svou rodičovskou kapacitu:** Důkazy mají prokazovat vaše stabilní zázemí, kontinuitu vaší péče, váš aktivní zájem o školní prospěch, zdraví a volný čas dítěte.\n- **Dokazujte ochotu ke spolupráci:** Prezentujte důkazy o tom, že se aktivně snažíte o dohodu, komunikujete klidně, deeskalujete konflikty a respektujete roli matky v životě dítěte.\n- **Dokazujte systémové překážky v péči:** Pokud dochází k maření styku nebo poškozování zájmů dítěte, dokumentujte tyto události věcně, systematicky a bez osobních urážek.\n\n### 2. Co přesně v opatrovnickém řízení dokumentovat?\n- **Deník péče a předávání:** Zaznamenávejte datum, přesný čas, místo a průběh každého předání dítěte. Pokud předání neproběhlo, uveďte důvod sdělený druhým rodičem (nemoc, odmítnutí) a přiložte související SMS/e-mail.\n- **Zdravotní péče:** Evidujte návštěvy u pediatrů a specialistů (kdo tam s dítětem byl, jaké byly závěry), nákupy léků, zdravotních pomůcek a plnění léčebných režimů.\n- **Vzdělávání a volný čas:** Dokumentujte komunikaci se školou/školkou (třídní schůzky, nahlížení do žákovské knížky, omlouvání absencí), úhrady kroužků, táborů a školních výletů.\n- **Písemná komunikace:** Uchovávejte e-maily a SMS zprávy. Nikdy nemažte historii zpráv. Komunikujte striktně podle BIFF metody (Brief, Informative, Friendly, Firm).',
        align: 'left',
        maxWidth: 'xl',
      },
    },
    {
      type: 'ColumnsBlock',
      props: {
        id: 'cols-docs-rules',
        columnsCount: '2',
        ratio: 'equal',
        gap: 'lg',
        col1Title: '3. Právní limity nahrávání hovorů',
        col1Text: 'Záznamy rozhovorů (audio/video) jsou citlivým tématem.\n\n**Zákonný rámec:**\n- Podle občanského zákoníku je pořizování nahrávek bez vědomí osoby obecně zakázáno.\n- **Výjimka pro opatrovnické soudy:** Judikatura Nejvyššího i Ústavního soudu připouští tajné nahrávky jako důkaz u soudu, pokud jimi nelze chránit slabší stranu (dítě) jiným způsobem (např. při verbální agresi matky před dítětem, přiznání k maření styku).\n- **Varování:** Nahrávky nesmí být nikdy zveřejněny na sociálních sítích, jinak hrozí žaloba na ochranu osobnosti.',
        col2Title: '4. Jak strukturovat záznam události',
        col2Text: 'Pro záznam do vašeho spisu v modulu Můj případ uplatňujte tuto metodiku:\n\n- **Fakticita:** Uvádějte pouze holá fakta (kdo, co, kdy, kde).\n- **Absence emocí:** Vyhněte se adjektivům hodnotícím charakter druhého rodiče (např. místo „matka hystericky řvala“ napište „matka zvýšeným hlasem uvedla, že dítě nepředá“).\n- **Provázanost na důkazy:** Každý záznam doplňte o odkaz na SMS, e-mail, předávací protokol nebo svědecké vyjádření.',
      },
    },
    {
      type: 'TextBlock',
      props: {
        id: 'text-docs-step-by-step',
        text: '### 5. Jak předložit důkazy soudu\n\nPři sepisování soudních vyjádření nebo návrhů dbejte na přehlednost:\n- **Chronologický přehled:** Pokud prokazujete opakované maření styku, vytvořte pro soud přehlednou tabulku s daty maření, odkazem na příslušnou SMS omluvu/neomluvu a dopadem na dítě.\n- **Číslování příloh:** Každý důkaz označte jako přílohu (např. *Příloha č. 1: E-mailová komunikace ze dne 12. 8. 2026*).\n- **Stručnost a čitelnost:** Soudce nemá čas číst stovky stran nesourodých chatů. Vyberte pouze ty nejzásadnější zprávy, které jednoznačně prokazují vaše tvrzení, a klíčové pasáže zvýrazněte.\n\n**Doporučené moduly:**\n- **[Osobní klientská složka otce](/user-portal)**\n- **[AI Case Manager spisu](/ai-case-manager)**',
        align: 'left',
        maxWidth: 'xl',
      },
    },
  ],
  root: { props: { title: 'Metodika dokumentace a důkazů' } },
};

export const DEFAULT_TVRZENI_DRUHEHO_RODICE_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-tvrzeni',
        title: 'Reakční matice na nepravdivá tvrzení druhého rodiče',
        description: 'Jak věcně, deeskalačně, bez hněvu a s neprůstřelnými důkazy reagovat u soudu a OSPOD na typické argumenty namířené proti otcovské péči.',
        badgeText: 'Reakční matice • Deeskalace',
        ctaText: 'Rozbor vyjádření',
        ctaUrl: '/ai-case-manager',
        secondaryCtaText: 'Právní poradna',
        secondaryCtaUrl: '/pravni-poradna',
      },
    },
    {
      type: 'TextBlock',
      props: {
        id: 'text-tvrzeni-strategy',
        text: '### 1. Jak pracovat s tvrzeními v opatrovnickém sporu?\n\nVypjatá opatrovnická řízení často přinášejí tvrzení, která mohou otce zaskočit, zranit nebo vyprovokovat k hněvu. Reakce v afektu (křik u soudu, útočné SMS zprávy) však druhé straně slouží jako potvrzení pravdivosti jejich slov o vaší konfliktní povaze.\n\n**Zlatá pravidla deeskalační reakce:**\n- **Princip ledového klidu:** Na každé nepravdivé tvrzení reagujte věcně, stručně a výhradně pomocí faktů a listinných důkazů.\n- **Neútočte na charakter:** Místo obviňování „matka lže, protože mě chce zničit“ zvolte procesní formulaci: „Tvrzení matky neodpovídá skutečnosti, což dokládám níže uvedenými věcnými důkazy.“\n- **Zájem dítěte:** Každou reakci propojte s potřebami vašeho syna či dcery. Ukazujte, že vám jde o stabilní vývoj dítěte, nikoliv o osobní spor s bývalou partnerkou.',
        align: 'left',
        maxWidth: 'xl',
      },
    },
    {
      type: 'ColumnsBlock',
      props: {
        id: 'cols-tvrzeni-matrix-1',
        columnsCount: '2',
        ratio: 'equal',
        gap: 'lg',
        col1Title: 'Tvrzení A: Otec nemá čas na péči kvůli zaměstnání',
        col1Text: '### Častý argument matky:\n„Otec pracuje dlouho do večera, často cestuje, péči by stejně musel delegovat na babičky nebo chůvy, proto střídavá péče není možná.“\n\n### Správná deeskalační reakce:\n„Mám plnou rodičovskou kapacitu i vůli o dítě pečovat. Své pracovní povinnosti jsem plně přizpůsobil potřebám dětí. Způsob zajištění péče dokládám potvrzením od zaměstnavatele o flexibilní pracovní době a možnosti práce z domova (home office) v týdnech, kdy mám děti v péči.“\n\n### Věcné důkazy:\n- Potvrzení zaměstnavatele o úpravě pracovní doby.\n- Detailní časový rozvrh dne (vyzvedávání ze školy, kroužky, příprava do školy).',
        col2Title: 'Tvrzení B: Dítě je po návratu od otce neklidné, plačtivé a pomožuje se',
        col2Text: '### Častý argument matky:\n„Dítě pobyt u otce psychicky nezvládá. Po návratu pláče, je agresivní nebo se pomočuje, což dokazuje, že u něj trpí.“\n\n### Správná deeskalační reakce:\n„Dítě miluje oba rodiče. Mírný neklid či pláč při předávání nebo bezprostředně po něm je podle dětské psychologie přirozeným projevem tzv. tranzitního stresu – tedy reakce na přechod mezi dvěma odlišnými rodinnými prostředími, nikoliv důsledkem špatné péče na mé straně. U mě doma se dítě chová klidně, má nastavený pravidelný režim a spánek, což doložím deníkem adaptace.“\n\n### Věcné důkazy:\n- Deník adaptace s fotografiemi dítěte v klidném stavu.\n- Odkaz na psychologické studie o tranzitním stresu v naší knihovně.\n- Návrh na deeskalaci předávání (např. předávání přímo přes školu/školku bez přímého střetu rodičů).',
      },
    },
    {
      type: 'ColumnsBlock',
      props: {
        id: 'cols-tvrzeni-matrix-2',
        columnsCount: '2',
        ratio: 'equal',
        gap: 'lg',
        col1Title: 'Tvrzení C: Dítě je příliš malé (kojenec/batole) na střídání',
        col1Text: '### Častý argument matky:\n„U takto malého dítěte je střídavá péče vyloučena, dítě je fixováno výhradně na matku a nocování u otce by narušilo jeho zdravý vývoj.“\n\n### Správná deeskalační reakce:\n„Podle moderních výzkumů dětské psychologie (např. konsenzuální studie prof. Warshaka podepsaná 110 mezinárodními odborníky) je pro zdravý vývoj dítěte klíčové budování bezpečné citové vazby (attachmentu) k oběma rodičům od útlého věku. To vyžaduje pravidelný, častý kontakt včetně přenocování, aby otec nebyl vnímán jen jako víkendový návštěvník. Navrhuji asymetrický model péče s postupným rozšiřováním styku podle věku dítěte.“\n\n### Věcné důkazy:\n- Odkaz na odborné studie o péči o nejmenší děti.\n- Návrh schématu postupného rozšiřování péče (např. 2-2-3 dny, postupné navyšování nocí).',
        col2Title: 'Tvrzení D: Otec se o dítě dříve nestaral, dělala vše matka',
        col2Text: '### Častý argument matky:\n„Celou dobu se o dítě starala výhradně matka, otec se věnoval kariéře a s dítětem neumí zacházet, neumí uvařit, nezná jeho režim.“\n\n### Správná deeskalační reakce:\n„Během společného soužití jsme měli s partnerkou rozdělené role pro ekonomické zajištění rodiny, což bylo naším společným rozhodnutím. To však nijak nesnižuje mou rodičovskou způsobilost. S potřebami, stravováním i denním režimem dítěte jsem plně obeznámen. Od rozchodu o dítě samostatně a řádně pečuji, což dokládají zprávy z pediatrie a školy.“\n\n### Věcné důkazy:\n- Doklad o návštěvě lékaře s dítětem v mé péči.\n- Potvrzení o zaplacení obědů, kroužků či nákupu školních potřeb.\n- Svědectví učitelů, kroužkových vedoucích o komunikaci s otcem.',
      },
    },
    {
      type: 'CallToAction',
      props: {
        id: 'cta-tvrzeni-ai',
        title: 'Máte před sebou vyjádření plné nepravdivých tvrzení?',
        description: 'Vložte text vyjádření do AI Case Managera. Systém zanalyzuje jednotlivá tvrzení a připraví vám věcnou, strukturovanou a deeskalující reakční osnovu podloženou judikaturou a psychologickými argumenty.',
        buttonText: 'Spustit analýzu vyjádření',
        buttonUrl: '/ai-case-manager',
        variant: 'primary',
      },
    },
  ],
  root: { props: { title: 'Reakční matice na tvrzení' } },
};

export const DEFAULT_DITE_V_KONFLIKTU_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-dite-v-konfliktu',
        title: 'Dítě uprostřed rodičovského konfliktu',
        description: 'Psychologická doporučení a procesní postupy pro ochranu vašeho dítěte před syndromem zavrženého rodiče, konfliktem loajality a dopady rozchodu na jeho psychiku.',
        badgeText: 'Psychologie dítěte • Zájem nezletilého',
        ctaText: 'Studie o střídavé péči',
        ctaUrl: '/knihovna-studii',
        secondaryCtaText: 'Komunitní podpora',
        secondaryCtaUrl: '/podpora',
      },
    },
    {
      type: 'TextBlock',
      props: {
        id: 'text-dite-conflict-types',
        text: '### 1. Konflikt loajality — největší tichá hrozba\n\nKonflikt loajality je psychologický stav, do kterého je dítě uvrženo, když má pocit, že projev lásky, náklonnosti nebo radosti s jedním rodičem znamená zradu druhého rodiče. Tento stav je pro dětskou psychiku extrémně zatěžující a je hlavním zdrojem psychosomatických potíží dětí po rozchodu (bolesti hlavy, bříška, noční pomočování, zhoršení školního prospěchu, sociální úzkosti).\n\n**Jak chránit dítě před konfliktem loajality:**\n- **Aktivně dítěti dovolte mít rádo druhého rodiče:** Říkejte mu věty jako: „Jsem moc rád, že ses měl u maminky hezky. Maminka tě má moc ráda a já jsem rád, když jste spolu šťastní.“ Dítě potřebuje slyšet, že jeho láska k matce vás nezraní.\n- **Nikdy nekritizujte matku před dítětem:** Vyhněte se jakýmkoliv negativním komentářům, povzdechům nebo ironickým narážkám na adresu druhého rodiče. Dítě vnímá kritiku matky jako kritiku poloviny své vlastní identity, což vede k hlubokému narušení sebeúcty.\n- **Nepoužívejte dítě jako komunikační kanál:** Nedomlouvejte předávání, platby ani soudní záležitosti skrze dítě (např. „řekni mámě, že...“). Komunikujte výhradně přímo s matkou.\n\n### 2. Jak s dětmi bezpečně mluvit o rozchodu a soudu?\n- **Odpovídejte pravdivě, ale přiměřeně věku:** Děti nepotřebují a nesmí znát detaily o nevěře, financích, rozdělení majetku nebo o tom, kdo podal jakou žalobu. Stačí ubezpečení: „My dospělí už spolu nebudeme bydlet, protože se naše životní cesty rozešly, ale oba tě máme nejvíc na světě rádi a na tom se nikdy nic nezmění.“\n- **Netlačte na informace:** Po návratu dítěte od druhého rodiče se vyhněte výslechům typu „Co jste dělali? S kým tam máma byla? Kdo u vás spal?“. Nechte dítě vyprávět samovolně. Pokud vyprávět nechce, respektujte to. Dítě se nesmí cítit jako vyzvědač.\n- **Ujistěte dítě o jeho nevinně:** Děti mají často sklon dávat rozpad rodiny za vinu sobě (např. „kdybych nezlobil, táta by neodešel“). Opakovaně jim zdůrazňujte, že rozchod je záležitost dospělých a ony za nic nemohou.',
        align: 'left',
        maxWidth: 'xl',
      },
    },
    {
      type: 'ColumnsBlock',
      props: {
        id: 'cols-dite-alienation',
        columnsCount: '2',
        ratio: 'equal',
        gap: 'lg',
        col1Title: '3. Syndrom odcizení rodiče (PAS)',
        col1Text: 'Syndrom odcizení rodiče (Parental Alienation Syndrome) nastává při systematickém programování dítěte jedním rodičem proti druhému.\n\n**Varovné signály:**\n- Dítě používá nepřirozený, dospělý jazyk k popisu chyb otce.\n- Bezprecedentní, skoková změna chování z láskyplného vztahu na absolutní odmítání.\n- Dítě vykazuje tzv. „fenomén nezávislého myslitele“ (tvrdí, že otce nechce vidět ze své vlastní vůle, ale nedokáže uvést žádný konkrétní důvod).\n\n**Jak reagovat:** Vyhledejte okamžitě pomoc dětského psychologa se specializací na opatrovnické spory a informujte písemně OSPOD.',
        col2Title: '4. Komunikace se školou a lékaři',
        col2Text: 'Nezapomínejte, že jako rodič máte plná rodičovská práva (pokud nebyla soudem omezena, což je extrémně vzácné).\n\n**Co uplatnit v praxi:**\n- **Škola:** Písemně požádejte vedení školy o zřízení vlastního přístupu do elektronického systému (Bakaláři apod.) a o zasílání informací o prospěchu a chování.\n- **Pediatr:** Zašlete dětskému lékaři dopis s informací, že požadujete být informován o všech zdravotních prohlídkách, očkováních a plánovaných zákrocích vašeho dítěte.\n- **Účast:** Choďte na třídní schůzky a doprovázejte dítě k lékaři osobně.',
      },
    },
    {
      type: 'TextBlock',
      props: {
        id: 'text-dite-scientific-basis',
        text: '### 5. Vědecky podložená fakta o střídavé péči\n\nDesítky let výzkumů v oblasti vývojové psychologie potvrzují, že střídavá péče (pokud jsou oba rodiče způsobilí a bydliště nejsou extrémně vzdálená) přináší dětem nejlepší dlouhodobé výsledky. Děti ve střídavé péči vykazují srovnatelnou úroveň psychosociálního zdraví, sebevědomí a školních výsledků jako děti z úplných rodin, a výrazně lepší než děti ve výhradní péči jednoho rodiče.\n\n**Klíčové studie k prostudování:**\n- **Warshak (2014) - Nocování nejmenších dětí:** Analýza potvrzující, že nocování u otce je bezpečné a prospěšné i pro kojence a batolata, neboť posiluje citovou vazbu k obou rodičům.\n- **Nielsen (2018) - Analýza 60 studií:** Komplexní přehled dokládající, že děti ve společné péči mají lepší vztahy s oběma rodiči a méně psychických potíží bez ohledu na úroveň meziričovského konfliktu.\n\n**Doporučené moduly:**\n- **[Knihovna vědeckých studií](/knihovna-studii)**\n- **[Vzdelavací sekce a kvízy](/vzdelavani)**',
        align: 'left',
        maxWidth: 'xl',
      },
    },
  ],
  root: { props: { title: 'Dítě uprostřed konfliktu' } },
};

export const LEGAL_PAGES_PUCK_DATA: Record<string, any> = {
  'home': DEFAULT_HOMEPAGE_PUCK_DATA,
  'agenda': DEFAULT_AGENDA_PUCK_DATA,
  'opatrovnicka-agenda': DEFAULT_AGENDA_PUCK_DATA,
  'prava': DEFAULT_RIGHTS_PUCK_DATA,
  'rights': DEFAULT_RIGHTS_PUCK_DATA,
  'judikatura': DEFAULT_CASE_LAW_PUCK_DATA,
  'pripadova-databaze': DEFAULT_CASE_LAW_PUCK_DATA,
  'dokumenty': DEFAULT_DOCUMENTS_PUCK_DATA,
  'ke-stazeni': DEFAULT_DOCUMENTS_PUCK_DATA,
  'rozchod-a-dite': DEFAULT_ROZCHOD_A_DITE_PUCK_DATA,
  'ospod-a-z': DEFAULT_OSPOD_A_Z_PUCK_DATA,
  'dokumentace-a-dokazy': DEFAULT_DOKUMENTACE_A_DOKAZY_PUCK_DATA,
  'tvrzeni-druheho-rodice': DEFAULT_TVRZENI_DRUHEHO_RODICE_PUCK_DATA,
  'dite-v-konfliktu': DEFAULT_DITE_V_KONFLIKTU_PUCK_DATA,
};

