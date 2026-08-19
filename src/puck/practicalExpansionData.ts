/**
 * Praktické P0 rozšiřující Puck JSON struktury pro fázi 7.2.
 */

// --- SECTION A: CO DĚLAT / CO NEDĚLAT (/co-nedelat) ---

export const DEFAULT_CO_NEDELAT_HUB_PUCK_DATA = {
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-co-nedelat-hub',
        title: 'Co (ne)dělat v opatrovnickém řízení',
        description: 'Praktický průvodce krizovým chováním otce. Každé slovo, čin i zpráva se v opatrovnickém konfliktu stávají důkazem. Zjistěte, jak se vyhnout fatálním procesním chybám.',
        badgeText: 'Krizová deeskalace • Hub',
        ctaText: 'Komunikační pravidla',
        ctaUrl: '/co-nedelat/komunikace',
        secondaryCtaText: 'Zpět na hlavní stranu',
        secondaryCtaUrl: '/',
      },
    },
    {
      type: 'LifeSituationsGridBlock',
      props: {
        id: 'grid-co-nedelat-hub',
        title: 'Klíčové krizové oblasti chování',
        subtitle: 'Vyberte téma, které právě řešíte, a získejte okamžité návody co dělat a co nedělat.',
        situations: [
          { title: 'Komunikace s matkou', description: 'Jak psát zprávy, reagovat na útoky a uplatňovat metodu BIFF u soudu a OSPOD.', ctaText: 'Zobrazit návod', ctaUrl: '/co-nedelat/komunikace', icon: 'MessageSquare', active: 'true' },
          { title: 'Předávání dítěte', description: 'Jak zajistit bezpečné předání bez scén, hádek a provokací před dítětem.', ctaText: 'Zobrazit návod', ctaUrl: '/co-nedelat/predavani', icon: 'Calendar', active: 'true' },
          { title: 'Vztah s dítětem', description: 'Jak chránit dítě před dospělým konfliktem a vyhnout se manipulaci či výslechům.', ctaText: 'Zobrazit návod', ctaUrl: '/co-nedelat/dite', icon: 'Heart', active: 'true' },
          { title: 'Jednání s OSPOD', description: 'Jak mluvit se sociální pracovnicí, jak se chovat při šetření a jak čelit neobjektivitě.', ctaText: 'Zobrazit návod', ctaUrl: '/co-nedelat/osp', icon: 'Shield', active: 'true' },
          { title: 'Soudní řízení', description: 'Jak se chovat v soudní síni, jak předkládat důkazy a vyhnout se emočním výlevům.', ctaText: 'Zobrazit návod', ctaUrl: '/co-nedelat/soud', icon: 'Scale', active: 'true' },
          { title: 'Sociální sítě', description: 'Proč na internet nepatří žádné detaily sporu a jaké hrozí riziko při zveřejňování.', ctaText: 'Zobrazit návod', ctaUrl: '/co-nedelat/socialni-site', icon: 'Share2', active: 'true' },
          { title: 'Využívání AI', description: 'Jak bezpečně pracovat s AI asistenty bez porušení GDPR a halucinací v podáních.', ctaText: 'Zobrazit návod', ctaUrl: '/co-nedelat/ai', icon: 'Sparkles', active: 'true' },
        ],
      },
    },
    {
      type: 'PrincipleSectionBlock',
      props: {
        id: 'principle-co-nedelat-hub',
        title: 'Základní filozofie klidu',
        highlightTitle: 'Chladná hlava vyhrává opatrovnické spory.',
        body: 'Vaše reakce v afektu (křik, urážky v SMS, vyhrožování) jsou pro druhou stranu nejcennějším materiálem u soudu. Jakýkoliv projev hněvu bude prezentován jako důkaz vaší agresivity a neschopnosti se dohodnout.\n\nJednat s rozmyslem, klidně a výhradně v zájmu dítěte není projevem slabosti, ale tou nejlepší procesní strategií.',
      },
    },
  ],
  root: { props: { title: 'Co (ne)dělat v opatrovnickém řízení' } },
};

export const PRACTICAL_CO_NEDELAT_PAGES: Record<string, any> = {
  'co-nedelat/komunikace': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-co-nedelat-komunikace',
          title: 'Jak (ne)komunikovat s druhým rodičem',
          description: 'Každá zpráva, SMS nebo e-mail, který napíšete, se může objevit u soudu. Naučte se komunikovat bezpečně a věcně pomocí metody BIFF.',
          badgeText: 'BIFF Komunikace • Krizový návod',
          ctaText: 'Vyzkoušet AI analyzátor',
          ctaUrl: '/ai-case-manager',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-co-nedelat-komunikace-content',
          text: '### 🚨 Hlavní problém\nKomunikace v afektu, psaní útočných, ironických, příliš dlouhých nebo obviňujících zpráv bývalé partnerce v reakci na její provokace.\n\n### ⚖️ Proč je toto jednání rizikové?\nTyto zprávy jsou druhou stranou okamžitě zálohovány a předkládány OSPODu a soudu jako přímý důkaz vaší údajné agresivity, lability a neschopnosti konstruktivně kooperovat při výchově dítěte. Emoce překryjí věcnou stránku a poškodí vaši rodičovskou pověst.\n\n### 💡 Co udělat místo toho\nAplikujte metodu **BIFF** (Brief - stručně, Informative - informačně věcně, Friendly - slušně/neutrálně, Firm - pevně). Na každou zprávu, která ve vás vyvolá hněv, neodpovídejte dříve než za **24 hodin**. Pište výhradně k logistice péče o dítě, nikoliv o minulosti partnerů.\n\n### ✅ Příklad vhodného postupu (BIFF)\n*„Dobrý den, k Vašemu dotazu ohledně nadcházejícího víkendu uvádím, že dceru vyzvednu v pátek v 16:00 před Vaším domem v souladu s platným rozpisem. Děkuji a přeji klidný týden.“*\n\n### ❌ Příklad nevhodného postupu\n*„Zase mi schválně bráníš v kontaktu, ty lhářko a hysterko! Tohle ti u soudu neprojde, karma tě dožene a všichni uvidí, jaká jsi ve skutečnosti matka, když ničíš naše dítě!“*\n\n### 🛠️ Související nástroj portálu\n- **[AI Case Manager spisu](/ai-case-manager)** – využijte pro bezpečnou analýzu a deeskalační přepis vašich zpráv před odesláním.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Jak (ne)komunikovat s druhým rodičem' } },
  },

  'co-nedelat/predavani': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-co-nedelat-predavani',
          title: 'Jak (ne)předávat dítě mezi rodiči',
          description: 'Předávání dítěte je nejčastějším místem konfliktů a provokací. Zjistěte, jak zajistit hladký průběh bez stresu pro dítě.',
          badgeText: 'Předávání dítěte • Krizový návod',
          ctaText: 'Spustit kalendář péče',
          ctaUrl: '/coparent-hub',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-co-nedelat-predavani-content',
          text: '### 🚨 Hlavní problém\nScény, hlasité hádky, vyčítání financí nebo nahrávání druhého rodiče z bezprostřední blízkosti na mobilní telefon na prahu dveří přímo před zraky dítěte.\n\n### ⚖️ Proč je toto jednání rizikové?\nDítě prožívá enormní stres a konflikt loajality. OSPOD i soud vyhodnotí toto chování jako projev extrémně vysoké konfliktnosti a neschopnosti rodičů zajistit dítěti bezpečné zázemí, což často vede k omezení styku otce nebo nařízení asistovaného předávání v krizových centrech.\n\n### 💡 Co udělat místo toho\nPředávání realizujte s úsměvem, rychle a klidně bez jakékoliv verbální diskuse o sporných tématech. Pokud je napětí vysoké, předávejte dítě **asymetricky** (např. otec vyzvedává dítě přímo ze školky/školy a matka ho tam ráno odvádí – rodiče se tak fyzicky vůbec nepotkají) nebo za doprovodu klidného, nestranného svědka.\n\n### ✅ Příklad vhodného postupu\nPříchod na místo v přesný čas, slušný pozdrav matce. Krátké rozloučení s dítětem: *„Užij si krásný čas s maminkou, těším se na tebe v neděli v 18:00.“* Rychlý odchod bez zbytečného prodlužování.\n\n### ❌ Příklad nevhodného postupu\nŘešení dlužného výživného nebo minulých křivd na prahu bytu, strkání se o dveře, ignorování pozdravu, nahrávání matky na mobil před plačícím dítětem s výkřiky: *„Podívej se, jak se maminka chová, natočím si ji k soudu!“*\n\n### 🛠️ Související nástroj portálu\n- **[Co-Parenting centrum & sdílený kalendář](/coparent-hub)** – naplánujte si přesné časy a místa předávání předem a transparentně.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Jak (ne)předávat dítě mezi rodiči' } },
  },

  'co-nedelat/dite': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-co-nedelat-dite',
          title: 'Jak (ne)zatahovat dítě do partnerského sporu',
          description: 'Dítě nesmí být zbraní ani poslíčkem v konfliktu dospělých. Naučte se chránit jeho psychické zdraví a respektovat jeho vazbu k oběma rodičům.',
          badgeText: 'Psychologické bezpečí dítěte',
          ctaText: 'Znalostní báze',
          ctaUrl: '/legal-wiki',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-co-nedelat-dite-content',
          text: '### 🚨 Hlavní problém\nVýslechy dítěte po návratu od matky, očerňování matky a její rodiny před dítětem, nucení dítěte, aby si vybralo jednoho z rodičů.\n\n### ⚖️ Proč je toto jednání rizikové?\nDítě upadá do paralyzujícího **konfliktu loajality**, což se projevuje psychosomatickými potížemi (pomočování, úzkosti, zhoršení školních výsledků). OSPOD a soudní psychologové toto jednání vnímají jako závažné ohrožení duševního vývoje dítěte a neschopnost respektovat roli druhého rodiče, což může vést k dramatickému omezení vaší péče.\n\n### 💡 Co udělat místo toho\nAktivně dítěti dovolte mít rádo druhého rodiče. Vyhněte se jakýmkoliv negativním komentářům na adresu matky. Po návratu dítěte se neptejte na výzvědné otázky, ale nechte ho mluvit spontánně a ubezpečte ho o jeho absolutním bezpečí a nevinně.\n\n### ✅ Příklad vhodného postupu\n*„Jsem moc rád, že sis výlet s maminkou užil. Maminka tě má moc ráda a já jsem šťastný, když se spolu máte dobře. Teď si půjdeme hrát.“*\n\n### ❌ Příklad nevhodného postupu\n*„S kým tam ta tvoje máma byla? Kdo u vás spal? Řekni jí, že je lhářka, když ti nechce koupit ten tablet, přestože jí posílám tolik peněz.“*\n\n### 🛠️ Související nástroj portálu\n- **[Dítě uprostřed konfliktu](/dite-v-konfliktu)** – prostudujte si kompletní psychologická doporučení k ochraně dětí.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Jak (ne)zatahovat dítě do partnerského sporu' } },
  },

  'co-nedelat/osp': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-co-nedelat-osp',
          title: 'Jak (ne)jednat s OSPOD a sociální pracovnicí',
          description: 'OSPOD je kolizním opatrovníkem vašeho dítěte. Zjistěte, jak vystupovat věcně, klidně a vyhnout se neprofesionálním konfrontacím.',
          badgeText: 'Jednání s OSPOD • Krizový návod',
          ctaText: 'Kompletní průvodce OSPOD',
          ctaUrl: '/ospod-a-z',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-co-nedelat-osp-content',
          text: '### 🚨 Hlavní problém\nAgresivní výlevy vůči sociální pracovnici, obviňování úřadu z podjatosti na první schůzce, vyhrožování stížnostmi, nebo ignorování výzev k součinnosti.\n\n### ⚖️ Proč je toto jednání rizikové?\nPracovnice OSPOD sepíše o každém jednání protokol a vypracuje pro soud klíčové doporučení. Jakýkoliv verbální útok, křik či nekonstruktivní chování bude zaneseno do spisu a poslouží jako důkaz vaší emoční instability a nespolupracující povahy.\n\n### 💡 Co udělat místo toho\nVystupujte jako kultivovaný, klidný a spolupracující rodič. Prezentujte výhradně svou rodičovskou kapacitu, kontinuitu své péče a zájem o dítě, nikoliv své spory a stížnosti na matku. Veškeré žádosti a podněty podávejte písemně (ideálně datovou schránkou).\n\n### ✅ Příklad vhodného postupu\n*„Dobrý den, přicházím předložit svůj konkrétní návrh péče o dceru. Mám plně přizpůsobenou pracovní dobu, zajištěný samostatný dětský pokoj a logistiku vyzvedávání. Mým cílem je zachovat kontinuitu péče obou rodičů.“*\n\n### ❌ Příklad nevhodného postupu\n*„Jste podjatá feministická lobby! Matka mě týrá a vy jí nadržujete, napíšu na vás stížnost ministrovi a dám to do médií, pokud mi hned nedáte střídavku!“*\n\n### 🛠️ Související nástroj portálu\n- **[Ucelený průvodce OSPOD od A do Z](/ospod-a-z)** – prostudujte si práva, povinnosti a postupy při jednání s úřadem.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Jak (ne)jednat s OSPOD' } },
  },

  'co-nedelat/soud': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-co-nedelat-soud',
          title: 'Jak se (ne)chovat u opatrovnického soudu',
          description: 'Soudní síň vyžaduje absolutní sebekontrolu. Zjistěte, jak prezentovat fakta, respektovat procesní pravidla a vyhnout se fatálním chybám.',
          badgeText: 'Soudní jednání • Procesní taktika',
          ctaText: 'Vzory soudních podání',
          ctaUrl: '/ke-stazeni',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-co-nedelat-soud-content',
          text: '### 🚨 Hlavní problém\nSkákání do řeči soudci nebo protistraně, hlasité gestikulace, emoční výbuchy, obviňování matky bez důkazů a předkládání setů irelevantních pomluv.\n\n### ⚖️ Proč je toto jednání rizikové?\nOpatrovnický soudce má na rozhodnutí vašeho případu omezený čas. Pokud se prezentujete jako neovladatelný, konfliktní a emočně nestabilní otec, soudce vás okamžitě zařadí do kategorie „rizikových“ a rozhodne ve prospěch stabilnější (byť třeba méně spolupracující) matky.\n\n### 💡 Co udělat místo toho\nDodržujte absolutní klid, mluvte pouze tehdy, když dostanete slovo, a oslovujte výhradně soudce (nikdy protistranu napřímo). Argumentujte stručně, věcně a vždy se odkazujte na písemné listinné důkazy a zájem dítěte.\n\n### ✅ Příklad vhodného postupu\n*„Vážený pane předsedo, s tvrzením protistrany nesouhlasím a odkazuji na přílohu č. 3, ze které vyplývá, že o syna řádně a samostatně pečuji, což potvrzuje i vyjádření třídní učitelky.“*\n\n### ❌ Příklad nevhodného postupu\nKřičet *„Lžeš! Ty jedna lhářko!“* během výpovědi matky, mlátit do stolu nebo ironicky komentovat dotazy soudce či opatrovníka.\n\n### 🛠️ Související nástroj portálu\n- **[Vzory podání a dokumenty ke stažení](/ke-stazeni)** – připravte si strukturované podklady pro soud předem.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Jak se (ne)chovat u opatrovnického soudu' } },
  },

  'co-nedelat/socialni-site': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-co-nedelat-socialni-site',
          title: 'Proč (ne)zveřejňovat detaily sporu na internetu',
          description: 'Veřejné praní špinavého prádla na sociálních sítích je nejrychlejší cestou k omezení rodičovské odpovědnosti. Zjistěte proč.',
          badgeText: 'Sociální sítě • Právní rizika',
          ctaText: 'Zásady ochrany soukromí',
          ctaUrl: '/zasady-ochrany-osobnich-udaju',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-co-nedelat-socialni-site-content',
          text: '### 🚨 Hlavní problém\nZveřejňování videí z předávání, nahrávek hovorů, textů žalob nebo dehonestujících příspěvků o matce a soudcích na Facebooku, TikToku či Instagramu.\n\n### ⚖️ Proč je toto jednání rizikové?\nJedná se o závažné porušení práva na ochranu osobnosti, soukromí dítěte a GDPR. Soudy toto chování vnímají jako extrémní formu psychického nátlaku, zneužití rodičovské odpovědnosti a neschopnost chránit dítě před veřejnou dehonestací, což téměř vždy vede k drastickému omezení styku a vysokým pokutám.\n\n### 💡 Co udělat místo toho\nZachovávejte absolutní diskrétnost a mlčenlivost o všech detailech řízení. Veškeré záznamy a materiály uchovávejte výhradně v zabezpečeném soukromém úložišti a poskytujte je pouze soudu, OSPODu nebo svému právnímu zástupci.\n\n### ✅ Příklad vhodného postupu\n*„Všechny dokumenty a případné důkazní nahrávky držím v soukromém, šifrovaném archivu portálu a nijak je nekomentuji ani nešířím na veřejnosti.“*\n\n### ❌ Příklad nevhodného postupu\nZveřejnění plačícího dítěte u předávání s popiskem: *„Podívejte se, jak tahle psychopatka ničí našeho syna a brání mi v kontaktu! Sdílejte to všude, ať každý vidí, co je to za matku!“*\n\n### 🛠️ Související nástroj portálu\n- **[Můj případ (Osobní složka)](/user-portal)** – bezpečné, neveřejné a šifrované úložiště pro vaše spisy a důkazy.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Proč (ne)zveřejňovat detaily sporu na internetu' } },
  },

  'co-nedelat/ai': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-co-nedelat-ai',
          title: 'Jak bezpečně a odpovědně (ne)využívat AI',
          description: 'AI asistent je skvělý pomocník pro strukturování myšlenek, ale špatný právní zástupce. Naučte se bezpečné hranice využití umělé inteligence.',
          badgeText: 'Technologická etika • AI Compliance',
          ctaText: 'AI Opatrovnický asistent',
          ctaUrl: '/ai-assistant',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-co-nedelat-ai-content',
          text: '### 🚨 Hlavní problém\nSlepé kopírování výstupů z veřejných AI chatů přímo do soudních podání, vkládání citlivých osobních údajů dětí a rodiny do neanonymizovaných veřejných nástrojů.\n\n### ⚖️ Proč je toto jednání rizikové?\nVeřejné AI modely mohou halucinovat (vymýšlet si neexistující judikaturu, paragrafy nebo lhůty). Odeslání takového textu soudu vás okamžitě zdiskredituje. Zároveň nahráním rodných čísel, jmen nebo adres dětí do veřejných chatů porušujete zákon o ochraně osobních údajů (GDPR).\n\n### 💡 Co udělat místo toho\nAI využívejte výhradně jako inteligentní organizátor, korektor gramatiky, analyzátor chronologie nebo tvůrce deeskalujících reakčních osnov. Před odesláním textu **vždy** anonymizujte veškerá jména a citlivá data, věcně zkontrolujte fakta a výsledné vyjádření konzultujte s kvalifikovaným advokátem.\n\n### ✅ Příklad vhodného postupu\n*„Použil jsem AI pro strukturování bodů své obhajoby, vyčistil text od emocí a nechal si doporučit deeskalační fráze. Výsledný text jsem zkontroloval podle platného znění OZ a schválil se svým právníkem.“*\n\n### ❌ Příklad nevhodného postupu\n*„Vygeneruj mi žalobu na střídavou péči se všemi paragrafy a odešli ji rovnou na soud.“* (Podání pak obsahuje vymyšlené rozsudky a neanonymizovaná jména dětí).\n\n### 🛠️ Související nástroj portálu\n- **[AI Opatrovnický asistent](/ai-assistant)** – využijte bezpečné, izolované rozhraní pro rozbory a přípravu podkladů.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Jak bezpečně a odpovědně (ne)využívat AI' } },
  },
};


// --- SECTION B: DÍTĚ UPROSTŘED KONFLIKTU (/dite-v-konfliktu/*) ---

export const PRACTICAL_DITE_V_KONFLIKTU_PAGES: Record<string, any> = {
  'dite-v-konfliktu/konflikt-loajality': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-conflict-loajality',
          title: 'Jak chránit dítě před konfliktem loajality',
          description: 'Konflikt loajality je největší tichou hrozbou pro dětskou psychiku při rozchodu rodičů. Zjistěte, jak mu aktivně předcházet.',
          badgeText: 'Psychologie dítěte • Krizová opora',
          ctaText: 'Knihovna studií',
          ctaUrl: '/knihovna-studii',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-conflict-loajality-content',
          text: '### 1. Co je to konflikt loajality?\nJedná se o extrémně zatěžující psychologický stav, kdy má dítě pocit, že projev lásky, náklonnosti nebo radosti s jedním rodičem znamená **zradu** druhého rodiče. Dítě se ocitá v kleštích mezi dvěma milovanými osobami a začíná maskovat své skutečné pocity, což vede k psychosomatickým potížím (bolesti hlavy, břicha, úzkosti, pomožování).\n\n### 2. Co není vhodné dělat\n- Nutit dítě, aby si vybralo, u koho chce bydlet nebo s kým chce trávit čas.\n- Tvářit se smutně, naštvaně nebo uraženě, když dítě vypráví o hezkých zážitcích s matkou.\n- Používat dítě jako poslíčka nebo prostředníka pro předávání informací (např. *„řekni mámě, že...“*).\n\n### 3. Jak reagovat věcně a psychologicky bezpečně\nAktivně a verbálně dejte dítěti **povolení** mít rádo druhého rodiče. Ubezpečte ho, že vaše láska k němu je bezpodmínečná a nezávisí na tom, jak moc miluje svou maminku. Komunikační logistiku řešte výhradně napřímo s druhým rodičem.\n\n### 4. Příklad vhodného postupu (Co říkat)\n*„Jsem moc rád, že ses měl u maminky o víkendu tak hezky. Maminka tě má moc ráda a já jsem šťastný, když jsi spokojený a veselý u ní i u mě.“*\n\n### 5. Příklad nevhodného postupu\n*„Takže u mámy to bylo super a se mnou se nudíš? Kdyby máma neukradla naše peníze, mohli jsme jet taky do aquaparku.“*\n\n### 🛠️ Související nástroj portálu\n- **[Dítě uprostřed konfliktu](/dite-v-konfliktu)** – prostudujte si kompletní přehled psychosociálních dopadů a doporučení.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Jak chránit dítě před konfliktem loajality' } },
  },

  'dite-v-konfliktu/co-rikat': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-co-rikat',
          title: 'Co aktivně říkat dítěti během rozchodu',
          description: 'Slovní ujištění o bezpečí, lásce a nevinně jsou pro dětskou psychiku klíčová. Naučte se konkrétní věty, které dítěti pomohou.',
          badgeText: 'Komunikační vzory • Psychologie',
          ctaText: 'Komunitní fórum',
          ctaUrl: '/forum',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-co-rikat-content',
          text: '### 1. Proč na slovech záleží?\nDěti mají přirozenou tendenci dávat rozpad rodiny za vinu sobě (např. *„kdybych nezlobil, táta by neodešel“*). Potřebují slyšet jasná, srozumitelná a opakovaná ujištění, která je zbaví pocitu viny a dají jim jistotu stabilní budoucnosti.\n\n### 2. Co je vhodné říkat a zdůrazňovat:\n- **Ujištění o nevinně:** Rozchod je záležitost dospělých, děti za něj nijak nemohou.\n- **Ujištění o kontinuitě lásky:** Oba rodiče ho budou milovat navždy, bez ohledu na to, kde bydlí.\n- **Povolení mít rád oba:** Dítě má plné právo milovat maminku i tátu.\n- **Jasný plán:** Dítě musí vědět, kdy a jak se bude s kým vídat, aby mělo pocit předvídatelnosti.\n\n### 3. Příklady vhodných formulací (Co říkat)\n- *„My dospělí jsme se rozhodli, že už spolu nebudeme bydlet, protože se naše cesty rozešly. Ale ty za to vůbec, ale vůbec nemůžeš. Je to naše věc.“*\n- *„Maminka i já jsme tvoji rodiče napořád. Oba tě moc milujeme a budeme se o tebe starat. Vždycky tu pro tebe budu.“*\n- *„V pondělí tě vyzvednu ze školky, budeme spolu stavět lego, pak se vyspíš u mě a v úterý tě zase zavedu do školky.“*\n\n### 🛠️ Související nástroj portálu\n- **[Podpora a mentorská síť](/podpora)** – sdílejte své zkušenosti a získejte podporu od ostatních otců a odborníků.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Co aktivně říkat dítěti během rozchodu' } },
  },

  'dite-v-konfliktu/co-nerikat': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-co-nerikat',
          title: 'Co nikdy neříkat před dítětem',
          description: 'Slova mohou zraňovat a deformovat vývoj dítěte. Zjistěte, které fráze a témata jsou absolutním tabu.',
          badgeText: 'Psychologické tabu • Prevence traumat',
          ctaText: 'Memento chyb',
          ctaUrl: '/memento',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-co-nerikat-content',
          text: '### 1. Největší komunikační fauly\nKritika druhého rodiče před dítětem je útokem na polovinu jeho vlastní identity. Dítě vnímá odsouzení matky jako odsouzení sebe sama, což drasticky poškozuje jeho sebeúctu a vytváří dlouhodobá traumata.\n\n### 2. Absolutní komunikační tabu (Co nikdy neříkat):\n- **Kritika charakteru matky:** *„Máma je hysterka, lhářka, zničila naši rodinu.“*\n- **Zatahování do financí:** *„Kdyby máma nechtěla tolik peněz na alimentech, koupil bych ti to.“*\n- **Zatahování do soudního řízení:** *„Musíš u soudu říct, že chceš být se mnou. Soudce se tě bude ptát.“*\n- **Citové vydírání:** *„Bude se mi hrozně stýskat, budu doma sám plakat, když budeš u mámy.“*\n- **Tajemství před druhým rodičem:** *„Hlavně neříkej mámě, že jsme tam byli/že jsem si koupil...“*\n\n### 3. Jak reagovat správně při provokaci\nPokud dítě přijde s informací, že o vás matka mluví špatně, nereagujte protiútokem. Uklidněte ho věcně: *„Mě to mrzí, že to maminka takhle vidí, ale ty se tím netrap. My dospělí si to vyřešíme sami. Ty jsi v bezpečí.“*\n\n### 🛠️ Související nástroj portálu\n- **[Memento a zkušenosti otců](/memento)** – prostudujte si nejčastější chyby, kterých se otcové v komunikaci dopouštějí.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Co nikdy neříkat před dítětem' } },
  },

  'dite-v-konfliktu/predavani': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-conflict-predavani',
          title: 'Jak zvládat tranzitní stres při předávání',
          description: 'Neklid a pláč při předávání dětí je přirozeným psychologickým jevem. Zjistěte, jak minimalizovat napětí a zajistit bezpečný přechod.',
          badgeText: 'Předávání dítěte • Tranzitní stres',
          ctaText: 'Plánovač a kalendář',
          ctaUrl: '/coparent-hub',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-conflict-predavani-content',
          text: '### 1. Co je tranzitní stres?\nMírný neklid, pláč nebo odtažitost dítěte bezprostředně před předáváním nebo těsně po něm není známkou toho, že by u jednoho z rodičů strádalo. Jedná se o přirozenou reakci na přechod mezi dvěma zcela odlišnými světy, pravidly a rodinnými systémy.\n\n### 2. Co není vhodné dělat\n- Interpretovat pláč jako neochotu jít k druhému rodiči a odmítat kvůli tomu předání.\n- Vyvolávat na místě scény a obviňovat matku ze špatného chování dětí.\n- Prodlužovat loučení na desítky minut plné emocí.\n\n### 3. Jak předcházet tranzitnímu stresu\n- **Asymetrické předávání:** Nejlepší deeskalací je eliminace přímého střetu rodičů. Jeden rodič ráno odvede dítě do školy/školky, druhý ho odpoledne vyzvedne. Přechod probíhá přirozeně přes neutrální instituci.\n- **Rychlé a věcné loučení:** Dlouhé a uplakané loučení v dítěti posiluje pocit, že odchází do nebezpečí.\n- **Klidová zóna:** Po převzetí dítěte mu dopřejte čas na aklimatizaci. Netlačte na okamžitou aktivitu ani výslechy, buďte klidným přístavem.\n\n### 🛠️ Související nástroj portálu\n- **[Co-Parenting centrum & sdílený kalendář](/coparent-hub)** – evidujte časy a optimalizujte logistiku předávání bezkontaktně.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Jak zvládat tranzitní stres při předávání' } },
  },

  'dite-v-konfliktu/dite-odmita-jit': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-dite-odmita-jit',
          title: 'Co dělat, když dítě odmítá jít k otci',
          description: 'Akutní odpor dítěte při předávání vyžaduje citlivou deeskalaci, klid a právní opatrnost. Zjistěte, jak správně reagovat.',
          badgeText: 'Krizová situace • Deeskalace',
          ctaText: 'AI Opatrovnický průvodce',
          ctaUrl: '/ai-guide',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-dite-odmita-jit-content',
          text: '### 1. Jak situaci správně vyhodnotit?\nPokud dítě při předávání pláče a odmítá nastoupit, zachovejte absolutní klid. Často se jedná o projev loajality k matce (dítě se bojí ukázat radost z táty, aby máma nebyla smutná) nebo o naučené chování pod vlivem manipulace. Agresivní reakce nebo násilné tahání situaci jen zhorší a dají protistraně důkaz o vašem hrubém chování.\n\n### 2. Co není vhodné dělat\n- Tahat dítě násilím z náruče matky nebo auta.\n- Křičet na matku a obviňovat ji z manipulace na místě před dítětem.\n- Odejít s hněvem a slovem: *„Tak si mě nepřejte, uvidíme se u soudu!“*\n\n### 3. Jak reagovat věcně, bezpečně a správně\n- **Snížit napětí:** Klekněte si k dítěti na jeho úroveň, mluvte tichým a klidným hlasem.\n- **Nabídnout deeskalaci:** Navrhněte matce krátkou procházku nebo předání za půl hodiny v klidu.\n- **Dokumentovat věcně:** Pokud k předání nedojde, pořiďte si v klidu stručný předávací protokol, zašlete matce BIFF zprávu s náhradním termínem a písemně informujte OSPOD bez urážek a s popisem snahy o deeskalaci.\n\n### 4. Příklad vhodného postupu u předání\n*„Ahoj Danečku, vidím, že se ti teď nechce. To je úplně v pořádku, že ti bude maminka chybět. Mám pro tebe nachystané to nové lego a slibuji, že mamince budeme večer volat, abys jí mohl popřát dobrou noc.“*\n\n### 🛠️ Související nástroj portálu\n- **[SOS Krizový plán a linky](/crisis)** – v případě opakovaného maření vyhledejte právní oporu a metodickou pomoc.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Co dělat, když dítě odmítá jít k otci' } },
  },

  'dite-v-konfliktu/skola': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-conflict-skola',
          title: 'Komunikace se školou, školkou a kroužky',
          description: 'Rodičovská odpovědnost zaniká pouze rozhodnutím soudu. Zjistěte, jak uplatnit svá práva na informace ve vzdělávacích institucích.',
          badgeText: 'Škola a vzdělávání • Práva otce',
          ctaText: 'Vzory dopisů pro školy',
          ctaUrl: '/ke-stazeni',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-conflict-skola-content',
          text: '### 1. Zákonná práva rodiče (§ 855–§ 889 o.z.)\nPokud nebyla vaše rodičovská odpovědnost soudně omezena (což se děje pouze v extrémních trestněprávních případech), máte **plné právo** na informace o vzdělání, prospěchu, absencích a chování vašeho dítěte. Školy jsou povinny vám tyto informace poskytovat bez ohledu na to, zda má dítě v péči matka.\n\n### 2. Co není vhodné dělat\n- Hádat se s učitelkami nebo ředitelkou a obviňovat je z nadržování matce.\n- Vynechávat třídní schůzky s odůvodněním, že tam chodí bývalá partnerka.\n- Zatahovat učitele do partnerského konfliktu a nutit je, aby psali posudky na matku.\n\n### 3. Jak postupovat věcně a efektivně\n- **Písemná žádost:** Zašlete řediteli školy písemnou žádost (ideálně datovou schránkou) o zřízení vlastního přístupu do elektronického systému (Bakaláři, EduPage apod.) a o zasílání všech klíčových informací o školních akcích a schůzkách.\n- **Aktivní účast:** Navštěvujte třídní schůzky (pokud je napětí vysoké, požádejte o individuální konzultaci s třídní učitelkou v jiný čas).\n- **Respekt k neutralitě:** Škola musí zůstat neutrálním územím. Nevyvolávejte zde žádné konflikty.\n\n### 🛠️ Související nástroj portálu\n- **[Vzory podání a dokumenty ke stažení](/ke-stazeni)** – najdete zde oficiální šablonu „Žádost otce o poskytování informací školou / školkou“.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Komunikace se školou a kroužky' } },
  },

  'dite-v-konfliktu/psycholog': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-conflict-psycholog',
          title: 'Kdy a jak zapojit dětského psychologa',
          description: 'Psychologická pomoc může stabilizovat dítě v krizi, ale nesmí sloužit jako zbraň v soudní bitvě. Zjistěte, jak vybrat odborníka a uplatnit souhlas rodičů.',
          badgeText: 'Psychologická péče • Odborná pomoc',
          ctaText: 'Právní Wiki',
          ctaUrl: '/legal-wiki',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-conflict-psycholog-content',
          text: '### 1. Kdy vyhledat pomoc?\nZapojení dětského psychologa je vhodné, pokud dítě vykazuje dlouhodobé varovné signály (skokové zhoršení prospěchu, noční pomočování, sociální ústraní, agresivita, sebepoškozování, výrazná změna chování). Psycholog slouží jako bezpečný prostor pro dítě, kde může ventilovat své úzkosti z rozchodu rodičů.\n\n### 2. Právní podmínka: Souhlas obou rodičů\nPodle občanského zákoníku je poskytnutí zdravotní a psychologické péče dítěti záležitostí **významnou**, u které je vyžadován **souhlas obou rodičů**. Jednostranné objednání dítěte k psychologovi bez vědomí druhého rodiče je porušením zákona a protistrana ho u soudu snadno napadne.\n\n### 3. Co není vhodné dělat\n- Využívat soukromého psychologa k tomu, aby napsal „posudek na zakázku“ potvrzující manipulaci ze strany matky.\n- Blokovat psychologickou péči pro dítě z trucu, pokud ji navrhne matka nebo OSPOD.\n\n### 4. Jak postupovat věcně a správně\n- **Písemná dohoda:** Navrhněte matce zapojení nezávislého dětského psychologa (ideálně doporučeného OSPODem nebo klinického psychologa) a požádejte o její písemný souhlas.\n- **Soudní cesta v nouzi:** Pokud matka péči bezdůvodně blokuje a dítě prokazatelně trpí, podejte k soudu návrh na nahrazení souhlasu rodiče s poskytnutím psychologické péče.\n\n### 🛠️ Související nástroj portálu\n- **[Osobní klientská složka otce](/user-portal)** – ukládejte si zprávy z psychologických vyšetření bezpečně do lékařské složky vašeho spisu.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Kdy a jak zapojit dětského psychologa' } },
  },
};


// --- SECTION C: TVRZENÍ DRUHÉHO RODIČE (/tvrzeni-druheho-rodice/*) ---

export const PRACTICAL_TVRZENI_PAGES: Record<string, any> = {
  'tvrzeni-druheho-rodice/dite-nechce-k-otci': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-tvrzeni-nechce',
          title: 'Tvrzení: „Dítě k otci samo nechce“',
          description: 'Jak deeskalovat a věcně reagovat na tvrzení, že dítě odmítá styk s otcem z vlastní vůle.',
          badgeText: 'Reakční matice • Scénář 1',
          ctaText: 'Spustit Case Manager',
          ctaUrl: '/ai-case-manager',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-tvrzeni-nechce-content',
          text: '### 1. Co toto tvrzení znamená\nMatka tvrdí soudu a OSPODu, že styk s otcem neblokuje, ale dítě k otci samo odmítá jít, pláče, schovává se a ona ho přece nemůže nutit násilím.\n\n### 2. Co není vhodné dělat\n- Křičet na matku a obviňovat ji z programování dítěte přímo před zraky sociální pracovnice.\n- Rezignovat, odejít a styk neuskutečnit bez jakéhokoliv věcného záznamu.\n- Tahat plačící dítě z náruče matky hrubou silou.\n\n### 3. Jak reagovat věcně u soudu a OSPOD\nPoukažte na to, že rodičovská odpovědnost zahrnuje povinnost dítě pozitivně motivovat a připravit na kontakt s druhým rodičem. Odmítání styku je projevem tranzitního stresu nebo konfliktu loajality, nikoliv ztráty vztahu k otci.\n\n### 4. Jaké skutečnosti může být vhodné doložit\n- Záznamy (fotografie, deník) z předchozích pobytů, které prokazují, že jakmile tranzitní stres opadne, dítě je u otce spokojené, klidné a veselé.\n- Vyjádření nezávislých svědků (učitelé, kroužky), kteří potvrzují bezproblémový vztah otce s dítětem.\n\n### 5. Jak dokumentovat\n- Pořiďte si stručný, věcný písemný záznam o průběhu předávání (kdo byl přítomen, jak se choval, co přesně říkal) bez emočního hodnocení.\n- Zašlete matce bezprostředně poté BIFF zprávu s žádostí o náhradní termín a s dotazem, jak hodlá dítě k příštímu styku pozitivně motivovat.\n\n### 6. Kdy využít odbornou/právní pomoc\nPokud se situace opakuje déle než 3 předávací cykly, požádejte písemně OSPOD o nařízení asistovaného předávání nebo rodinné terapie a podejte k soudu Návrh na výkon rozhodnutí (uložení pokuty za maření styku podle § 501 z.ř.s.).\n\n### 7. Související obsah\n- **[Dítě odmítá jít k otci - krizová doporučení](/dite-v-konfliktu/dite-odmita-jit)**\n\n### 8. Související nástroj portálu\n- **[AI Case Manager spisu](/ai-case-manager)** – pro analýzu a tvorbu deeskalujících vyjádření k soudu.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Tvrzení: „Dítě k otci samo nechce“' } },
  },

  'tvrzeni-druheho-rodice/otec-se-nestara': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-tvrzeni-nestara',
          title: 'Tvrzení: „Otec se o dítě dříve nestaral“',
          description: 'Jak obhájit svou rodičovskou roli a doložit kontinuitu otcovské péče u soudu.',
          badgeText: 'Reakční matice • Scénář 2',
          ctaText: 'Spustit Case Manager',
          ctaUrl: '/ai-case-manager',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-tvrzeni-nestara-content',
          text: '### 1. Co toto tvrzení znamená\nMatka tvrdí, že otec se během společného soužití věnoval výhradně kariéře, o dítě se nikdy samostatně nestaral, neumí uvařit, nezná jeho režim a péči nezvládne.\n\n### 2. Co není vhodné dělat\n- Útočit na matku, že byla na mateřské „na dovolené“ a nic nedělala.\n- Ignorovat toto tvrzení s pocitem, že je to nesmysl. Soud zkoumá kontinuitu péče velmi vážně.\n\n### 3. Jak reagovat věcně u soudu a OSPOD\nVysvětlete, že rozdělení rolí v rodině (ekonomické zajištění vs. celodenní péče) bylo společným rozhodnutím rodičů a nijak nesnižuje rodičovskou způsobilost otce. Zdůrazněte, že s denním režimem, stravováním i potřebami dítěte jste plně obeznámen a od rozchodu o něj řádně pečujete.\n\n### 4. Jaké skutečnosti může být vhodné doložit\n- Doklad o návštěvách dětského lékaře v doprovodu otce.\n- Potvrzení o komunikaci se školou/školkou (třídní schůzky, zápisy).\n- Doklad o nákupu dětského vybavení, hraček a oblečení.\n\n### 5. Jak dokumentovat\nVezměte si s sebou k jednání konkrétní písemný rozpis dne dítěte (v kolik vstává, co jí, jaké léky bere, kdy spí), abyste prokázal detailní znalost jeho potřeb.\n\n### 6. Kdy využít odbornou/právní pomoc\nPokud matka na základě tohoto tvrzení odmítá styk a tvrdí, že dítě u vás nesmí přespat, vyhledejte právní pomoc k podání Návrhu na předběžné opatření k úpravě styku včetně přespávání.\n\n### 7. Související obsah\n- **[Práva rodičů a dětí u soudu](/prava)**\n\n### 8. Související nástroj portálu\n- **[Simulátor a kalkulačka péče](/plan-pece)** – vytvořte si přesný plán péče pro doložení vaší kapacity.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Tvrzení: „Otec se o dítě dříve nestaral“' } },
  },

  'tvrzeni-druheho-rodice/otec-nema-cas': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-tvrzeni-nemacas',
          title: 'Tvrzení: „Otec nemá čas na péči“',
          description: 'Jak doložit časovou kapacitu a flexibilitu pro plnohodnotné opatrovnictví.',
          badgeText: 'Reakční matice • Scénář 3',
          ctaText: 'Vytvořit časový plán',
          ctaUrl: '/coparent-hub',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-tvrzeni-nemacas-content',
          text: '### 1. Co toto tvrzení znamená\nProtistrana tvrdí, že otec pracuje dlouho do večera, často cestuje na služební cesty a péči o dítě by stejně musel delegovat na třetí osoby (chůvy, babičky), proto střídavá péče není možná.\n\n### 2. Co není vhodné dělat\n- Tvrdit, že matka taky pracuje a nemá čas.\n- Předložit pracovní smlouvu s fixní dobou do 18:00 bez vysvětlení logistiky.\n\n### 3. Jak reagovat věcně u soudu a OSPOD\nDeklarujte plnou rodičovskou vůli i kapacitu. Uveďte, že jste své pracovní povinnosti plně přizpůsobil potřebám dětí v týdnech, kdy je máte v péči.\n\n### 4. Jaké skutečnosti může být vhodné doložit\n- **Potvrzení zaměstnavatele:** Oficiální písemné vyjádření o možnosti flexibilní pracovní doby, zkráceného úvazku, home office nebo úpravy směn v týdnech péče.\n- **Logistický plán:** Časový rozvrh dne doložený v návrhu (kdo dítě vodí do školy, kdo vyzvedává, jak fungují kroužky).\n\n### 5. Jak dokumentovat\nVést si v klientské složce přesnou evidenci odpracovaných hodin a časů strávených s dětmi u kroužků a úkolů.\n\n### 6. Kdy využít odbornou/právní pomoc\nPokud soudce vyjadřuje pochybnosti o vaší časové kapacitě, nechte si právním zástupcem zformulovat formální vyjádření s detailním logistickým schématem včetně záložního plánu (např. pomoc babičky při akutní pracovní cestě).\n\n### 7. Související obsah\n- **[Průvodce životní cestou otce: Rozchod a stabilizace](/rozchod-a-dite)**\n\n### 8. Související nástroj portálu\n- **[Co-Parenting centrum & sdílený kalendář](/coparent-hub)** – pro přehledné naplánování logistických tras a předávání dětí.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Tvrzení: „Otec nemá čas na péči“' } },
  },

  'tvrzeni-druheho-rodice/otec-nema-bydleni': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-tvrzeni-bydleni',
          title: 'Tvrzení: „Otec nemá vhodné bydlení“',
          description: 'Jak doložit materiální zázemí a připravit se na domácí šetření OSPOD.',
          badgeText: 'Reakční matice • Scénář 4',
          ctaText: 'Checklist pro šetření',
          ctaUrl: '/ospod-a-z',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-tvrzeni-bydleni-content',
          text: '### 1. Co toto tvrzení znamená\nMatka tvrdí, že otec po rozchodu bydlí v provizorním podnájmu, na ubytovně, u kamaráda nebo v garsonce, kde dítě nemá vlastní prostor, soukromí ani klid na učení.\n\n### 2. Co není vhodné dělat\n- Tvrdit, že dítěti stačí matrace na zemi.\n- Blokovat domácí šetření OSPOD v novém bydlišti.\n\n### 3. Jak reagovat věcně u soudu a OSPOD\nUveďte, že máte zajištěné stabilní, bezpečné a hygienicky odpovídající bydlení, které plně vyhovuje vývojovým potřebám dítěte daného věku. Zdůrazněte, že dítě má u vás vyhrazený svůj vlastní prostor.\n\n### 4. Jaké skutečnosti může být vhodné doložit\n- **Nájemní smlouvu** nebo list vlastnictví k nemovitosti.\n- **Fotodokumentaci** připraveného dětského pokoje (nebo dětského koutku) s postelí, psacím stolem, skříní na věci a věkově odpovídajícími hračkami a knihami.\n\n### 5. Jak dokumentovat\nPožádejte OSPOD o provedení domácího šetření u vás. Do protokolu nechte zapsat všechny pozitivní aspekty bydlení (blízkost hřiště, školy, čistota, vybavenost).\n\n### 6. Kdy využít odbornou/právní pomoc\nPokud OSPOD odmítá provést šetření ve vašem novém bydlišti a opírá se pouze o jednostranné tvrzení matky, požádejte písemně vedoucího odboru o nápravu a doložte fotodokumentaci přímo soudu.\n\n### 7. Související obsah\n- **[Domácí šetření OSPOD u otce](/ospod-a-z/co-si-pripravit)**\n\n### 8. Související nástroj portálu\n- **[Osobní klientská složka otce](/user-portal)** – nahrajte nájemní smlouvu a fotky pokojíčku do složky Dokumenty k případu.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Tvrzení: „Otec nemá vhodné bydlení“' } },
  },

  'tvrzeni-druheho-rodice/stridava-pece-skodi': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-tvrzeni-stridavka',
          title: 'Tvrzení: „Střídavá péče dítěti škodí“',
          description: 'Jak argumentovat vědeckými studiemi a judikaturou Ústavního soudu ve prospěch společné péče.',
          badgeText: 'Reakční matice • Scénář 5',
          ctaText: 'Knihovna studií',
          ctaUrl: '/knihovna-studii',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-tvrzeni-stridavka-content',
          text: '### 1. Co toto tvrzení znamená\nMatka tvrdí, že střídavá péče dítě traumatizuje, střídání dvou domovů (tzv. „baťůžkářství“) vyvolává u dítěte chaos, nejistotu a poškozuje jeho psychický vývoj.\n\n### 2. Co není vhodné dělat\n- Tvrdit, že matka chce dítě jen pro peníze.\n- Rezignovat na střídavou péči a přistoupit na asymetrický styk (např. jednou za 14 dní na víkend) z obavy před soudem.\n\n### 3. Jak reagovat věcně u soudu a OSPOD\nOkažte na moderní výzkumy dětské psychologie a závaznou judikaturu Ústavního soudu (např. nález I. ÚS 2482/13), podle kterých je střídavá péče prioritním uspořádáním, pokud jsou oba rodiče způsobilí o dítě pečovat. Zdůrazněte, že pro dítě není traumatem střídání domovů, ale absence otcovské péče a meziričovský konflikt.\n\n### 4. Jaké skutečnosti může být vhodné doložit\n- **Vědecká fakta:** Odkazy na mezinárodní konsenzuální studie (např. prof. Warshak, dr. Nielsen), které dokazují, že děti ve společné péči vykazují lepší psychosociální zdraví než děti ve výhradní péči.\n- **Návrh deeskalace:** Předložte plán předávání přes školské instituce, aby se minimalizoval přímý střet rodičů a eliminoval tranzitní stres.\n\n### 5. Jak dokumentovat\nUchovávejte si deník adaptace dítěte u vás, který prokazuje, že syn/dcera se v průběhu vaší péče chová klidně, plní školní povinnosti a prospívá.\n\n### 6. Kdy využít odbornou/právní pomoc\nPokud soudní znalec vykazuje zaujatost vůči střídavé péči na základě zastaralých dogmat, nechte si advokátem připravit odborné oponentní vyjádření s odkazem na aktuální vědecké studie.\n\n### 7. Související obsah\n- **[Závazná opatrovnická judikatura Ústavního soudu](/judikatura)**\n\n### 8. Související nástroj portálu\n- **[Knihovna vědeckých studií](/knihovna-studii)** – stáhněte si kompletní recenzované studie a přiložte je k soudnímu vyjádření.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Tvrzení: „Střídavá péče dítěti škodí“' } },
  },

  'tvrzeni-druheho-rodice/otec-manipuluje-dite': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-tvrzeni-manipulace',
          title: 'Tvrzení: „Otec manipuluje a navádí dítě“',
          description: 'Jak věcně vyvrátit nařčení z manipulace dítěte a prokázat svou podporu vztahu k matce.',
          badgeText: 'Reakční matice • Scénář 6',
          ctaText: 'Deeskalační rady',
          ctaUrl: '/dite-v-konfliktu',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-tvrzeni-manipulace-content',
          text: '### 1. Co toto tvrzení znamená\nMatka tvrdí, že otec systematicky navádí dítě proti ní, rozmazluje ho drahými dárky, slibuje mu hory doly a podrývá její mateřskou autoritu.\n\n### 2. Co není vhodné dělat\n- Vrátit úder obviňováním matky ze stejného chování bez důkazů.\n- Zakazovat dítěti kontakt s matkou v době, kdy je s vámi.\n\n### 3. Jak reagovat věcně u soudu a OSPOD\nUveďte, že plně respektujete roli matky v životě dítěte a v žádném případě syna/dceru nenavádíte. Zdůrazněte, že vaše péče je vedena principem neutrality, klidu a důrazu na výchovné standardy.\n\n### 4. Jaké skutečnosti může být vhodné doložit\n- **Písemná komunikace (BIFF):** SMS a e-maily, kde aktivně nabízíte matce součinnost, informujete ji o zdraví a školních výsledcích dítěte a vyzýváte ji k dohodě.\n- **Svědectví:** Vyjádření nezávislých osob o tom, že se před dítětem vyjadřujete o matce neutrálně či pozitivně.\n\n### 5. Jak dokumentovat\nVeďte si v Mém případu deník, kde zaznamenáváte klíčové situace a momenty, kdy jste dítěti aktivně umožnil telefonát s matkou nebo podpořil nákup dárku pro ni (např. k narozeninám, Dni matek).\n\n### 6. Kdy využít odbornou/právní pomoc\nPokud matka na základě tohoto nařčení podá návrh na asistovaný styk, vyhledejte okamžitě právní pomoc k vypracování formálního odporu a navrhněte vyšetření nezávislým dětským psychologem.\n\n### 7. Související obsah\n- **[Syndrom odcizení rodiče a jak mu čelit](/dite-v-konfliktu/konflikt-loajality)**\n\n### 8. Související nástroj portálu\n- **[AI Opatrovnický asistent](/ai-assistant)** – zanalyzujte si text žaloby a nechte si vygenerovat deeskalující reakční osnovu.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Tvrzení: „Otec manipuluje a navádí dítě“' } },
  },

  'tvrzeni-druheho-rodice/otec-neplati-vyzivne': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-tvrzeni-neplati',
          title: 'Tvrzení: „Otec neplatí výživné“',
          description: 'Jak bezpečně dokumentovat finanční platby a prokázat plnění vyživovací povinnosti.',
          badgeText: 'Reakční matice • Scénář 7',
          ctaText: 'Spustit evidenci výloh',
          ctaUrl: '/coparent-hub',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-tvrzeni-neplati-content',
          text: '### 1. Co toto tvrzení znamená\nMatka tvrdí soudu, že otec neplatí výživné včas, v plné výši, nebo se vyhýbá hrazení mimořádných výdajů na kroužky, školu a lékařskou péči.\n\n### 2. Co není vhodné dělat\n- Platit výživné v hotovosti „z ruky do ruky“ bez písemného potvrzení protistrany.\n- Ignorovat hrazení mimořádných výloh a tvrdit, že to má matka platit ze základního výživného.\n- Posílat platby s urážlivými poznámkami v bankovním příkazu.\n\n### 3. Jak reagovat věcně u soudu a OSPOD\nDoložte, že vyživovací povinnost plníte řádně, včas a v plné výši v souladu se soudním rozhodnutím či dohodou. Prezentujte bankovní výpisy a evidenci všech plateb.\n\n### 4. Jaké skutečnosti může být vhodné doložit\n- **Bankovní výpisy:** Jasně označené a pravidelné měsíční platby s popiskem *„Výživné na [Jméno dítěte] za měsíc/rok“*.\n- **Doklady o dalších úhradách:** Účtenky za nákupy oblečení, školních pomůcek, léků, úhrady kroužků a táborů realizované otcem nad rámec běžného výživného.\n\n### 5. Jak dokumentovat\nVeškeré finanční transfery provádějte **výhradně bezhotovostně** na bankovní účet matky. Každý mimořádný výdaj schvalujte písemně (BIFF SMS/e-mail) předem.\n\n### 6. Kdy využít odbornou/právní pomoc\nPokud matka podá exekuční návrh pro domnělý dluh na výživném, vyhledejte okamžitě advokáta k podání Návrhu na zastavení exekuce a doložte všechny bankovní příkazy.\n\n### 7. Související obsah\n- **[Výpočet výživného podle doporučujících tabulek MS ČR](/plan-pece)**\n\n### 8. Související nástroj portálu\n- **[Co-Parenting centrum & sdílený kalendář](/coparent-hub)** – využijte integrovaný modul evidence společných výloh a vyrovnání nákladů.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Tvrzení: „Otec neplati výživné“' } },
  },
};


// --- SECTION D: OSPOD – PRAKTICKÉ SCÉNÁŘE (/ospod-a-z/*) ---

export const PRACTICAL_OSPOD_PAGES: Record<string, any> = {
  'ospod-a-z/prvni-jednani': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-ospod-prvni',
          title: 'První schůzka na OSPOD: Jak udělat správný dojem',
          description: 'První osobní kontakt s opatrovnickou pracovnicí určuje tón celého budoucího vztahu. Zjistěte, jak se připravit.',
          badgeText: 'OSPOD • První schůzka',
          ctaText: 'Spustit AI Průvodce',
          ctaUrl: '/ai-guide',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-ospod-prvni-content',
          text: '### 🚨 Hlavní cíl\nUkázat, že jste **stabilní, milující, klidný a spolupracující rodič**, který má jasný plán péče a respektuje mateřskou roli druhé strany. První schůzka doprovází nervozitu, proto je nezbytná důsledná věcná příprava.\n\n### ❌ Co nikdy nedělat\n- Přijít na schůzku rozzlobený, křičet a stěžovat si na chování matky.\n- Používat výrazy typu *„matka je psychopatka, lhářka, zničila rodinu“*.\n- Vyhrožovat sociální pracovnici soudem, médii nebo stížnostmi.\n\n### 💡 Jak se chovat a co říkat\n- **Mluvte o dítěti, ne o matce:** Každou větu formulujte přes zájem dítěte. Místo *„chci střídavku, protože na ni mám právo“* řekněte *„mým cílem je zajistit synovi kontinuitu péče obou milujících rodičů, na kterou byl zvyklý během celého našeho soužití“*.\n- **Předložte fakta:** Přineste si vytištěný návrh péče a doložte svou rodičovskou kapacitu.\n- **Naslouchejte:** Nechte pracovnici mluvit, dělejte si klidné poznámky a odpovídejte s rozmyslem.\n\n### 🛠️ Související nástroj portálu\n- **[Ucelený průvodce OSPOD od A do Z](/ospod-a-z)** – prostudujte si klíčové kroky a práva před první schůzkou.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'První schůzka na OSPOD' } },
  },

  'ospod-a-z/co-si-pripravit': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-ospod-pripravit',
          title: 'Co si připravit na jednání s OSPOD',
          description: 'Přijďte na úřad připraven jako profesionál. Zde je kompletní checklist dokumentů a podkladů, které zvýší vaši důvěryhodnost.',
          badgeText: 'OSPOD • Checklist přípravy',
          ctaText: 'Stáhnout vzory podání',
          ctaUrl: '/ke-stazeni',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-ospod-pripravit-content',
          text: '### 📋 Checklist podkladů pro schůzku na OSPOD:\n\n1. **Návrh úpravy péče:** Přehledně zpracovaný rozpis (např. model střídavé péče), logistika, předávání a pokrytí prázdnin.\n2. **Důkaz rodičovské kapacity:**\n   - **Potvrzení zaměstnavatele** o flexibilní pracovní době nebo možnosti home office v týdnech péče.\n   - **Fotodokumentace** připraveného zázemí pro dítě ve vašem bydlišti (dětský pokoj, postel, hračky, studijní koutek).\n3. **Doklady o kontinuitě péče:** Výpis e-mailů o vaší komunikaci se školou, lékaři, kroužky, potvrzení o úhradách obědů či kroužků.\n4. **Komunikační deeskalace:** Vytištěná ukázka vaší klidné, věcné a deeskalující komunikace s matkou (BIFF styl) jako důkaz vaší vůle k dohodě.\n\n### ❌ Co s sebou rozhodně nebrat\n- Nahrávky hádek s matkou (pokud nejde o akutní verbální agresi matky před dítětem).\n- Stovky stran nepřehledných chatů plných osobních urážek mezi partnery.\n- Anonymní dehonestující dopisy o bývalé partnerce.\n\n### 🛠️ Související nástroj portálu\n- **[AI Case Manager spisu](/ai-case-manager)** – zorganizujte si podklady a dokumenty přehledně do jednoho PDF pro úřad.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Co si připravit na jednání s OSPOD' } },
  },

  'ospod-a-z/co-rict': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-ospod-corict',
          title: 'Co aktivně říkat na OSPOD',
          description: 'Naučte se formulovat své věcné argumenty tak, aby rezonovaly s metodikou zájmu dítěte, kterou úřad uplatňuje.',
          badgeText: 'Slovník argumentů • OSPOD',
          ctaText: 'AI Průvodce',
          ctaUrl: '/ai-guide',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-ospod-corict-content',
          text: '### 💡 Jak formulovat své postoje na OSPOD\n\nPracovnice OSPOD hodnotí rodiče podle toho, jak moc dokáží upřednostnit zájem dítěte před svým vlastním hněvem. Používejte tyto prověřené konstrukce:\n\n- **K rovnocenné péči:** *„Mám k synovi hluboký vztah, od narození jsem se podílel na jeho každodenní péči a mým cílem je zajistit mu stabilní vývoj za přítomnosti obou rodičů. Nabízím flexibilní časovou kapacitu a stabilní zázemí.“*\n- **K roli matky:** *„Plně respektuji roli matky v životě dcery a považuji za klíčové, aby s ní dcera měla zdravý, bezpečný a častý vztah. Chci, abychom se jako rodiče dokázali domluvit.“*\n- **K dohodě:** *„Předkládám písemný návrh dohody o péči a výživném, který jsem zaslal matce k diskuzi. Jsem připraven jednat o kompromisech v zájmu dítěte.“*\n- **K řešení konfliktů:** *„Pokud panuje napětí, navrhuji předávání dcery přímo přes mateřskou školu, abychom ji ušetřili jakéhokoliv stresu z našich setkání.“*\n\n### 🛠️ Související nástroj portálu\n- **[AI Průvodce opatrovnickým řízením](/ai-guide)** – nechte si nasimulovat schůzku na OSPOD a natrénujte své odpovědi.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Co aktivně říkat na OSPOD' } },
  },

  'ospod-a-z/co-nerikat': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-ospod-conerikat',
          title: 'Co nikdy neříkat na OSPOD',
          description: 'Slova pronesená v hněvu na úřadě se okamžitě stávají součástí spisu. Vyhněte se těmto fatálním výrokům.',
          badgeText: 'Komunikační tabu • OSPOD',
          ctaText: 'Memento chyb',
          ctaUrl: '/memento',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-ospod-conerikat-content',
          text: '### ❌ Fatální komunikační chyby na OSPOD:\n\n- **Útoky na matku:** *„Matka je psychopatka, lhářka, manipuluje s dítětem a krade moje peníze.“* (Vyhodnoceno jako extrémní konfliktnost otce).\n- **Právní dogmatismus:** *„Střídavá péče je moje ústavní právo a já na ní trvám, i kdyby syn plakal.“* (Vyhodnoceno jako bezohlednost vůči individuálním potřebám dítěte).\n- **Vyhrožování úřadu:** *„Vím, jak to tady u vás chodí, nadržujete ženám. Pokud mi nevyhovíte, podám stížnost a dám to k soudu.“* (Vyhodnoceno jako neochota spolupracovat a agresivita).\n- **Zatahování dětí:** *„Sám jsem se syna ptal a on mi potvrdil, že chce raději bydlet u mě.“* (Vyhodnoceno jako nepřípustné zatahování dítěte do sporů a možná manipulace ze strany otce).\n\n### 🛠️ Související nástroj portálu\n- **[Memento procesních chyb otců](/memento)** – prostudujte si skutečné případy, kdy nevhodné výroky na úřadě zmařily šance na střídavou péči.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Co nikdy neříkat na OSPOD' } },
  },

  'ospod-a-z/zapis-a-protokol': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-ospod-protokol',
          title: 'Jak správně pracovat s protokoly a zápisy',
          description: 'Každé jednání na OSPOD končí podpisem zápisu. Zjistěte, jak kontrolovat text, uplatňovat výhrady a chránit svá slova.',
          badgeText: 'Protokoly • Správní řád',
          ctaText: 'Znalostní Wiki',
          ctaUrl: '/legal-wiki',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-ospod-protokol-content',
          text: '### 1. Právní význam protokolu u soudu\nProtokol z jednání na OSPOD (nebo záznam o telefonickém hovoru) je **veřejnou listinou**. Soud k němu přistupuje s vysokou mírou důvěry. Pokud v zápisu stojí, že otec souhlasil s omezeným stykem nebo se vyjadřoval agresivně, bude nesmírně těžké to u soudu vyvrátit.\n\n### 2. Zásady pro práci s protokoly před podpisem:\n- **Důkladné čtení:** Nikdy nepodepisujte protokol ve spěchu. Přečtěte si každé slovo, větu i odstavec.\n- **Oprava překroucených slov:** Pokud zápis interpretuje vaše vyjádření nepřesně (např. místo *„otec má obavu o zdraví dcery“* napíše *„otec obviňuje matku ze zanedbání lékařské péče“*), trvejte na okamžité nápravě.\n- **Podpis s výhradou:** Pokud pracovnice odmítne zápis opravit, **máte právo** ho podepsat s vlastnoručně dopsanou věcnou výhradou: *„Podepisuji s výhradou k odstavci 3 – moje vyjádření bylo...“*.\n- **Kopie zápisu:** Vždy si vyžádejte kopii podepsaného zápisu přímo na místě.\n\n### 🛠️ Související nástroj portálu\n- **[AI Opatrovnický asistent](/ai-assistant)** – nahrajte naskenovaný protokol z OSPODu a nechte si zanalyzovat jeho rizika a navrhnout případné písemné doplnění.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Práce s protokoly na OSPOD' } },
  },

  'ospod-a-z/jak-reagovat': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-ospod-jakreagovat',
          title: 'Jak reagovat na neobjektivitu a předsudky',
          description: 'Pokud se setkáte s neprofesionálním chováním sociální pracovnice, postupujte striktně v mezích zákona. Zde je bezpečný procesní návod.',
          badgeText: 'Obrana otce • Správní právo',
          ctaText: 'Vzory stížností',
          ctaUrl: '/ke-stazeni',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-ospod-jakreagovat-content',
          text: '### 1. Emoční STOP: Klid za každou cenu\nSetkání s předsudkem (např. *„dítě patří k matce, otec má jen platit“*) vyvolá hněv. Jakýkoliv křik nebo verbální útok však pracovnice okamžitě zapíše do protokolu jako důkaz vaší agresivity. Zachovejte absolutní, ledový klid.\n\n### 2. Bezpečný procesní postup obrany:\n- **Komunikujte výhradně písemně:** Pokud vám pracovnice odmítá vyhovět ústně (např. odmítá provést domácí šetření), podávejte veškeré žádosti písemně přes datovou schránku s požadavkem na písemnou odpověď.\n- **Věcná stížnost (§ 175 správního řádu):** Podejte stížnost k vedoucímu odboru sociálních věcí městského úřadu. Stížnost musí být naprosto věcná, bez emocí a musí poukazovat na konkrétní pochybení (např. ignorování důkazů, odmítnutí zapsat vyjádření otce do protokolu).\n- **Podnět k delegování spisu:** V závažných případech prokázané podjatosti lze podat podnět k delegování případu jinému sociálnímu pracovníkovi.\n\n### 🛠️ Související nástroj portálu\n- **[Vzory podání a dokumenty ke stažení](/ke-stazeni)** – najdete zde oficiální, deeskalující šablonu „Stížnost na postup sociálního pracovníka podle § 175 správního řádu“.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Jak reagovat na neobjektivitu OSPOD' } },
  },

  'ospod-a-z/kolizni-opatrovnik': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-ospod-kolizni',
          title: 'Úloha OSPOD jako kolizního opatrovníka',
          description: 'Pochopte procesní postavení OSPODu u soudu a zjistěte, jak se připravit na jeho závěrečné doporučení.',
          badgeText: 'Procesní postavení • OSPOD',
          ctaText: 'Judikatura k OSPOD',
          ctaUrl: '/judikatura',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-ospod-kolizni-content',
          text: '### 1. Kdo je kolizní opatrovník?\nKolizní opatrovník je ustanoven soudem podle § 469 z.ř.s. v situaci, kdy hrozí střet zájmů dětí a rodičů. OSPOD nemá rozhodovací pravomoc – nerozhoduje o výživném ani o střídavé péči. Jeho úkolem je nestranně hájit zájmy dítěte, provádět šetření v rodině a podávat soudu doporučení, kterým se soud v drtivé většině případů řídí.\n\n### 2. Jak probíhá proces šetření OSPOD:\n- **Pohovory s rodiči:** Samostatná jednání na úřadě k vyjasnění stanovisek.\n- **Pohovor s dítětem:** Pracovnice mluví s dítětem (bez přítomnosti rodičů) s ohledem na jeho věk a rozumovou vyspělost, aby zjistila jeho přání.\n- **Zprávy od institucí:** Vyžaduje si zprávy od dětského lékaře, školy/školky a případně psychologů.\n- **Domácí šetření:** Ověření vhodnosti bytového zázemí u obou rodičů.\n- **Závěrečný návrh:** Opatrovník předloží soudu písemnou zprávu s konkrétním doporučením úpravy péče.\n\n### 🛠️ Související nástroj portálu\n- **[Přehled judikatury a nálezů](/judikatura)** – prostudujte si nálezy Ústavního soudu vymezující mantinely chování a povinností kolizního opatrovníka.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Úloha OSPOD jako kolizního opatrovníka' } },
  },
};


// --- SECTION E: DOKUMENTACE A DŮKAZY (/dokumentace-a-dokazy/*) ---

export const PRACTICAL_DOKUMENTACE_PAGES: Record<string, any> = {
  'dokumentace-a-dokazy/komunikace': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-dokazy-komunikace',
          title: 'Jak správně dokumentovat komunikaci',
          description: 'Zálohování a přehledná archivace zpráv je základem opatrovnického spisu. Zjistěte, jak strukturovat chaty pro soud.',
          badgeText: 'Metodika důkazů • Komunikace',
          ctaText: 'Spustit Case Manager',
          ctaUrl: '/ai-case-manager',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-dokazy-komunikace-content',
          text: '### 🚨 Zásadní bezpečnostní pravidlo: „Důkaz ≠ pomsta“\nCílem dokumentace komunikace je doložit vaši snahu o dohodu, klidný tón a kontinuitu péče, případně doložit věcné překážky kladené druhou stranou. Nesmí jít o stalking, tajné sledování, nabourávání se do cizích účtů nebo sběr dehonestujícího materiálu za účelem pomsty.\n\n### 📋 Jak komunikaci správně zálohovat a strukturovat:\n- **Nemažte historii:** Uchovávejte kompletní chaty (SMS, WhatsApp, e-maily). Nikdy nemažte své vlastní zprávy, abyste nebyli nařčeni z manipulace s historií.\n- **Exporty a screenshoty:** Klíčové pasáže si pravidelně zálohujte (exportujte chaty do PDF).\n- **Přehlednost pro soudce:** Soudce nebude číst 500 stran chatu. Vytvořte pro soud **stručnou chronologickou tabulku** (datum, o co šlo, jaká byla reakce otce v BIFF stylu, jak reagovala matka, odkaz na přílohu se screenshotem).\n\n### ✅ Příklad vhodné dokumentace tabulkou\n- *Datum: 12. 8. 2026*\n- *Událost: Žádost otce o dřívější vyzvednutí dcery kvůli rodinné oslavě.*\n- *Reakce otce: Slušný BIFF e-mail s nabídkou náhradního termínu.*\n- *Reakce matky: Odmítnutí s vulgárním napadáním otce.*\n- *Důkaz: Příloha č. 1 (Screenshot e-mailu).*\n\n### 🛠️ Související nástroj portálu\n- **[AI Case Manager spisu](/ai-case-manager)** – nahrajte screenshoty a nechte si vygenerovat přehledný, očíslovaný chronologický přehled komunikace pro soudce.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Jak správně dokumentovat komunikaci' } },
  },

  'dokumentace-a-dokazy/predavani': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-dokazy-predavani',
          title: 'Jak dokumentovat maření a průběh předávání',
          description: 'Pokud dochází k maření styku nebo nestandardnímu chování při předávání, dokumentujte ho věcně a v klidu.',
          badgeText: 'Metodika důkazů • Předávání',
          ctaText: 'Spustit klientskou složku',
          ctaUrl: '/user-portal',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-dokazy-predavani-content',
          text: '### 🚨 Zásadní bezpečnostní pravidlo: „Důkaz ≠ pomsta“\nDokumentace slouží k doložení systémových překážek, nikoliv k vyvolávání konfliktů. Pořizování nahrávek bez vědomí osoby je obecně zakázáno. Judikatura opatrovnických soudů připouští audio/video záznam jako důkaz pouze v krajním případě (např. verbální agrese matky před dítětem), pokud zájem dítěte nelze chránit jinak. Nahrávka nesmí být nikdy zveřejněna na internetu!\n\n### 📋 Jak správně dokumentovat předávání:\n- **Deník událostí:** Po každém předání si zapište přesný čas, místo, kdo byl přítomen a jak předání proběhlo.\n- **Písemná vyjádření:** Pokud k předání nedojde z důvodu nemoci dítěte, požádejte o doložení lékařské zprávy a ihned písemně navrhněte náhradní termín.\n- **Nestranní svědci:** Pokud očekáváte konflikt, vezměte s sebou klidného svědka (kamaráda, mentora), který může u soudu dosvědčit váš klidný přístup.\n\n### 🛠️ Související nástroj portálu\n- **[Co-Parenting centrum & sdílený kalendář](/coparent-hub)** – zaznamenávejte přesné časy, neuskutečněná předávání a důvody bezpečně na jednom sdíleném místě.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Jak dokumentovat maření a průběh předávání' } },
  },

  'dokumentace-a-dokazy/udalosti': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-dokazy-udalosti',
          title: 'Vedení chronologie a kroniky událostí',
          description: 'Kronika událostí je nejúčinnějším nástrojem pro obhájení střídavé péče. Zjistěte, jak ji správně strukturovat.',
          badgeText: 'Metodika důkazů • Kronika spisu',
          ctaText: 'Spustit Case Manager',
          ctaUrl: '/ai-case-manager',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-dokazy-udalosti-content',
          text: '### 1. Proč si vést kroniku událostí?\nU soudního jednání si nebudete pamatovat, co se stalo před půl rokem v úterý v 15:00. Přehledná, věcná kronika událostí (deník péče) ukáže soudci a OSPODu, že jste systematický a odpovědný rodič a odhalí případné opakující se vzorce chování protistrany.\n\n### 2. Jak strukturovat každý záznam kroniky:\n- **Fakticita:** Uvádějte pouze holá fakta (kdo, co, kdy, kde, jak).\n- **Absence emocí:** Vyhněte se hodnotícím adjektivům (např. místo *„matka hystericky řvala“* napište *„matka zvýšeným hlasem uvedla, že dítě nepředá“*).\n- **Provázanost na důkazy:** Každý záznam doplňte o odkaz na SMS, e-mail, předávací protokol nebo svědecké vyjádření.\n\n### 3. Příklad správného zápisu kroniky\n*„15. 8. 2026, 16:00, vyzvednutí ze školky. Syn měl špinavé tričko a stěžoval si na mírnou bolest bříška. Doma podán čaj, syn se uklidnil a hrál si s legem. O zdravotním stavu odeslána informační BIFF zpráva matce v 18:30 (viz Příloha č. 4).“*\n\n### 🛠️ Související nástroj portálu\n- **[AI Case Manager spisu](/ai-case-manager)** – zadejte své denní záznamy a nechte si vygenerovat chronologický přehled pro advokáta.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Vedení chronologie a kroniky událostí' } },
  },

  'dokumentace-a-dokazy/platby': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-dokazy-platby',
          title: 'Dokumentace finančních plateb a nákladů',
          description: 'Zamezte sporům o peníze. Zjistěte, jak bezpečně evidovat alimenty, mimořádné výdaje a doložit plnění vyživovací povinnosti.',
          badgeText: 'Finanční bezpečnost • Evidence',
          ctaText: 'Spustit evidenci výloh',
          ctaUrl: '/coparent-hub',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-dokazy-platby-content',
          text: '### 🚨 Zásadní bezpečnostní pravidlo: „Důkaz ≠ pomsta“\nPlatba výživného a výloh slouží k zajištění potřeb dítěte, ne jako nástroj pro trestání matky. Evidence slouží k vaší ochraně před exekucí a nepravdivým nařčením z neplacení.\n\n### 📋 Pravidla pro bezpečnou finanční evidenci:\n- **Absolutní zákaz hotovosti:** Nikdy neplaťte výživné ani mimořádné výdaje v hotovosti „z ruky do ruky“, i kdyby vás o to matka prosila. Všechny finanční transfery realizujte **výhradně bankovním převodem**.\n- **Popisky bankovních příkazů:** U každé platby uveďte jasný, slušný a věcný popisek, např. *„Výživné na [Jméno dítěte] za měsíc/rok“*.\n- **Schvalování mimořádných výdajů:** Pokud matka požaduje úhradu mimořádného výdaje (např. školní tábor, rovnátka), vyžádejte si nejprve písemně (e-mail, SMS) kalkulaci a vyjádřete svůj písemný souhlas/nesouhlas před samotnou platbou.\n\n### 🛠️ Související nástroj portálu\n- **[Co-Parenting centrum (Evidence výloh)](/coparent-hub)** – ukládejte účtenky, schvalujte mimořádné výdaje a vyrovnávejte společné náklady na děti transparentně a bezpečně.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Dokumentace finančních plateb a nákladů' } },
  },

  'dokumentace-a-dokazy/skola-a-lekar': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-dokazy-skola',
          title: 'Dokumentace komunikace se školou a lékaři',
          description: 'Záznamy ze školních portálů a lékařské zprávy jsou u soudu nejstabilnějšími důkazy o kontinuitě vaší péče.',
          badgeText: 'Metodika důkazů • Škola & Lékař',
          ctaText: 'Vzory dopisů',
          ctaUrl: '/ke-stazeni',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-dokazy-skola-content',
          text: '### 1. Proč jsou tyto zprávy klíčové?\nUčitelské posudky a lékařské zprávy jsou vypracovány nezávislými profesionály. Jsou pro soudce a OSPOD řádově důvěryhodnější než subjektivní tvrzení rodičů. Prokazují váš aktivní, dlouhodobý zájem o vzdělání a zdraví dítěte.\n\n### 2. Co a jak dokumentovat:\n- **Školní portály:** Ukládejte si screenshoty vaší aktivity v Bakalářích (zobrazení známek, omlouvání absencí, komunikace s třídním učitelem).\n- **Návštěvy lékaře:** Zaznamenávejte, kdy jste byl s dítětem u pediatra, vyžádejte si kopii lékařské zprávy s vaším jménem jako doprovázející osoby.\n- **Úhrady obědů a kroužků:** Uchovávejte potvrzení o bankovních platbách za kroužky, školní výlety, obědy a učebnice.\n\n### 🛠️ Související nástroj portálu\n- **[Osobní klientská složka otce](/user-portal)** – nahrajte naskenované lékařské zprávy a vysvědčení do zabezpečené složky Dokumenty k případu.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Dokumentace komunikace se školou a lékaři' } },
  },

  'dokumentace-a-dokazy/svedci': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-dokazy-svedci',
          title: 'Jak správně pracovat se svědeckými výpověďmi',
          description: 'Svědectví třetích osob může u soudu podpořit vaše tvrzení. Zjistěte, jak vybrat vhodné svědky a jak připravit jejich čestná prohlášení.',
          badgeText: 'Svědci • Čestná prohlášení',
          ctaText: 'Znalostní Wiki',
          ctaUrl: '/legal-wiki',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-dokazy-svedci-content',
          text: '### 1. Kdo je vhodným svědkem?\nSvědek u opatrovnického soudu musí být věrohodný a ideálně nestranný. Příbuzní (babičky, noví partneři) jsou soudem často vnímáni jako podjatí. Nejvyšší váhu mají svědectví učitelů, kroužkových vedoucích, dětských psychologů, pediatrů nebo sousedů, kteří vidí váš každodenní vztah s dítětem.\n\n### 2. Jak svědectví předložit soudu:\n- **Písemné čestné prohlášení:** Nechte svědka sepsat stručné, věcné prohlášení o tom, co sám osobně viděl a zažil (např. *„byl jsem přítomen předávání, otec se choval klidně, dcera ho s radostí objala“*). Prohlášení musí obsahovat jméno, datum narození, podpis svědka a ideálně úřední ověření podpisu.\n- **Návrh na výslech svědka:** V soudním vyjádření můžete navrhnout osobní výslech svědka při jednání.\n\n### 🛠️ Související nástroj portálu\n- **[Knihovna vzorů ke stažení](/ke-stazeni)** – stáhněte si vzor čestného prohlášení svědka a poskytněte ho k vyplnění.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Jak správně pracovat se svědky u soudu' } },
  },

  'dokumentace-a-dokazy/chronologie': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-dokazy-chronologie',
          title: 'Jak vytvořit neprůstřelnou chronologii případu',
          description: 'Strukturovaná časová osa událostí je nejlepším podkladem pro vašeho advokáta i soudce. Zjistěte, jak ji zkompilovat.',
          badgeText: 'Časová osa • Právní příprava',
          ctaText: 'Spustit Case Manager',
          ctaUrl: '/ai-case-manager',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-dokazy-chronologie-content',
          text: '### 1. Co je chronologie případu?\nJedná se o přehledný, tabulkový seznam všech klíčových událostí vašeho případu od rozchodu po současnost. Slouží k tomu, aby se soudce nebo váš nový advokát dokázal v případu zorientovat během 10 minut bez čtení stovek stran chaosu.\n\n### 2. Jak chronologii správně sestavit:\n- **Sloupce:** Používejte strukturu: Datum/Čas | Událost | Věcný popis | Důkaz (Příloha č.).\n- **Výběr klíčových událostí:** Nezanášejte chronologii drobnostmi. Uvádějte pouze zásadní milníky (data podání návrhů, schůzky OSPOD, maření styku s lékařským doložením, významné zdravotní události dítěte).\n- **Absolutní pravdivost:** Nikdy nezkreslujte fakta. Pokud jste na předávání přišel pozdě, uveďte to pravdivě a vysvětlete logistický důvod.\n\n### 🛠️ Související nástroj portálu\n- **[AI Case Manager spisu](/ai-case-manager)** – využijte pro automatické seřazení a kompilaci vašich deníkových záznamů do přehledné chronologické tabulky.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Jak vytvořit chronologii případu' } },
  },

  'dokumentace-a-dokazy/co-nedelat': {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-dokazy-co-nedelat',
          title: 'Čeho se vyvarovat při shromažďování důkazů',
          description: 'Některé způsoby získávání důkazů jsou trestným činem nebo spolehlivě zničí vaše šance u soudu. Poznejte nebezpečné hranice.',
          badgeText: 'Právní limity • Prevence chyb',
          ctaText: 'Zpět na metodiku',
          ctaUrl: '/dokumentace-a-dokazy',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-dokazy-co-nedelat-content',
          text: '### 🚨 ZÁPAZNÝ SEZNAM ZAKÁZANÝCH CHOVÁNÍ (Zero Tolerance):\n\nObsah portálu ani vaše jednání **nesmí nikdy** nabádat k následujícím nezákonným nebo neetickým činnostem:\n\n1. **Stalking a sledování:** Tajné sledování matky v jejím volném čase, instalace GPS lokátorů do jejího auta, najímání soukromých detektivů k monitorování jejího soukromí.\n2. **Manipulace dítěte:** Navádění dítěte k tajnému nahrávání matky na diktafon u ní doma, podplácení dítěte dárky výměnou za informace.\n3. **Nelegální nahrávání:** Instalace štěnic, odposlechů nebo skrytých kamer do bytu matky.\n4. **Neoprávněné získávání osobních údajů:** Nabourávání se do e-mailových účtů matky, jejího telefonu, sociálních sítí (porušení tajemství dopravovaných zpráv podle § 182 trestního zákoníku).\n5. **Provokování konfliktů:** Vyvolávání hádek při předávání dětí s cílem natočit si matčinu rozzlobenou reakci.\n6. **Výroba falešných důkazů:** Falšování lékařských zpráv, předávacích protokolů nebo čestných prohlášení.\n\n### ⚖️ Právní dopady protiprávního dokazování:\nPokud předložíte soudu nelegálně získaný důkaz (např. e-maily stažené z nabouraného účtu matky), soud k němu nejen nepřihlédne, ale matka na vás okamžitě podá trestní oznámení. Poškodíte zájem dítěte, svou vlastní rodičovskou pověst a hrozí vám trestní stíhání.\n\n### 🛠️ Související nástroj portálu\n- **[Zásady ochrany osobních údajů (GDPR)](/zasady-ochrany-osobnich-udaju)** – dodržujte přísné standardy bezpečnosti a ochrany soukromí rodiny.',
          align: 'left',
          maxWidth: 'xl',
        },
      },
    ],
    root: { props: { title: 'Čeho se vyvarovat při shromažďování důkazů' } },
  },
};
