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
        ctaUrl: '#situace',
        secondaryCtaText: 'Prozkoumat portál',
        secondaryCtaUrl: '#sekce',
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

export const LEGAL_PAGES_PUCK_DATA: Record<string, any> = {
  'domu': DEFAULT_HOMEPAGE_PUCK_DATA,
  'home': DEFAULT_HOMEPAGE_PUCK_DATA,
  'agenda': DEFAULT_AGENDA_PUCK_DATA,
  'opatrovnicka-agenda': DEFAULT_AGENDA_PUCK_DATA,
  'prava': DEFAULT_RIGHTS_PUCK_DATA,
  'rights': DEFAULT_RIGHTS_PUCK_DATA,
  'judikatura': DEFAULT_CASE_LAW_PUCK_DATA,
  'pripadova-databaze': DEFAULT_CASE_LAW_PUCK_DATA,
  'dokumenty': DEFAULT_DOCUMENTS_PUCK_DATA,
  'ke-stazeni': DEFAULT_DOCUMENTS_PUCK_DATA,
};

