import { prisma } from '../src/db/prisma';
import { dbStore } from '../src/services/dbStore';

export const articleCategories = [
  {
    slug: 'vedecke-myty-vs-fakta',
    name: 'Vědecké mýty vs. fakta',
    description: 'Vědecké studie, mezinárodní konsenzus a fakta vyvracející mýty v opatrovnických sporech.',
    type: 'article',
  },
  {
    slug: 'ceska-praxe-a-judikatura',
    name: 'Česká praxe a judikatura',
    description: 'Analýza rozhodování českých soudů, přístupu OSPOD a sociologických dat z ČR.',
    type: 'article',
  },
  {
    slug: 'dlouhodoby-dopad-na-vyvoj-ditete',
    name: 'Dlouhodobý dopad na vývoj dítěte',
    description: 'Dlouhodobé výzkumy dopadu sdílené noční péče na zdravý vývoj dospívajících.',
    type: 'article',
  },
  {
    slug: 'specialni-formaty',
    name: 'Speciální formáty',
    description: 'Argumentační manuály, praktičtí průvodci a infografiky pro soudní řízení.',
    type: 'article',
  },
  {
    slug: 'partneri-a-sponzori',
    name: 'Partneři a Sponzoři',
    description: 'Podporovatelé projektu Táta má právo, kteří nám pomáhají udržovat systém v chodu.',
    type: 'article',
  },
];

export const initialArticles = [
  // --- Série 1: Vědecké mýty vs. fakta (Argumentace pro soudy a OSPOD) ---
  {
    title: 'Přespávání u tátů škodí malým dětem? 110 světových expertů tvrdí opak',
    slug: 'prespavani-u-tatu-skodi-malym-detem-110-expertu-tvrdi-opak',
    category: 'Vědecké mýty vs. fakta',
    summary: 'Přehled mezinárodního vědeckého konsenzu (Richard Warshak). Vysvětlení, že děti mladší 4 let profitují ze sdílené noční péče a že koncept jediného hlavní psychologického rodiče je překonaný.',
    content: `# Přespávání u tátů škodí malým dětem? 110 světových expertů tvrdí opak

V opatrovnické praxi v ČR se stále opakuje přežitý argument, že dětí mladší 3 let by neměly přespávat u otce, protože tím utrpí jejich vazba k matce ("monotropie"). Moderní vývojová psychologie tento názor jednoznačně vyvrátila.

## Mezinárodní konsenzus odborníků (Warshak et al., 2014)

V roce 2014 publikoval profesor **Richard A. Warshak** přelomový konsenzuální dokument podpořený **110 předními světovými experty** na vývoj dětí a attachment z prestižních univerzit (Harvard, Yale, Cambridge a další).

### Klíčové závěry vědecké komunity:
1. **Děti mladší 4 let profitují z noční péče obou rodičů:** Sdílená noční péče posiluje jistotu dítěte a buduje rovnocennou citovou vazbu k otci bez jakéhokoliv poškození vztahu k matce.
2. **Koncept jediného primárního rodiče je překonaný:** Děti jsou neurobiologicky vybaveny k vytvoření silné vazby k více pečujícím osobám současně.
3. **Odepření přespávání oslabuje vztah k otci:** Pokud dítě u otce nepřespává, přichází o klíčové pečovatelské rituály (ukládání ke spánku, uklidnění při nočním probuzení, ranní probouzení), což vede ke zcizení.
4. **Doporučení pro soudy a OSPOD:** Opatrovnická rozhodnutí by měla podporovat nocleh u otců již od nejútlejšího věku, pokud otec vykazuje standardní rodičovskou způsobilost.

> *"Rozhodnutí odepřít malému dítěti přespávání u jednoho z rodičů musí být podloženo jasným důkazem o patologii nebo zanedbávání péče, nikoli pouhým věkem dítěte."* – prof. Richard Warshak`,
    puckContent: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-art-1',
            title: 'Přespávání u tátů škodí malým dětem? 110 světových expertů tvrdí opak',
            description: 'Přehled mezinárodního vědeckého konsenzu prof. Richarda Warshaka. Proč dětí pod 4 roky profitují ze sdílené noční péče.',
            buttonText: 'Stáhnout podklady pro OSPOD',
            buttonUrl: '/argumentacni-manual-do-kapsy',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-art-1-1',
            text: 'V opatrovnické praxi v ČR se stále opakuje přežitý argument, že dětí mladší 3 let by neměly přespávat u otce, protože tím utrpí jejich vazba k matce. Moderní vývojová psychologie tento názor jednoznačně vyvrátila.\n\nV roce 2014 publikoval profesor Richard A. Warshak přelomový konsenzuální dokument podpořený 110 předními světovými experty na vývoj dětí a attachment z prestižních univerzit.',
            align: 'left',
          },
        },
        {
          type: 'CallToAction',
          props: {
            id: 'cta-art-1',
            title: 'Potřebujete tento výzkum citovat u soudu?',
            description: 'Využijte náš přehledný Argumentační manuál do kapsy s přesnými citacemi pro soudní podání.',
            buttonText: 'Otevřít Argumentační manuál',
            buttonUrl: '/argumentacni-manual-do-kapsy',
            variant: 'primary',
          },
        },
      ],
      root: {},
    },
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    title: 'Výzkum z Arizona State University: Přespávání v kojeneckém věku upevňuje vztah k OBA rodičům',
    slug: 'vyzkum-z-arizona-state-university-prespavani-v-kojeneckem-veku',
    category: 'Vědecké mýty vs. fakta',
    summary: 'Detailní rozbor studie Williama Fabricia. Časté přespávání u otce v prvních dvou letech života nenarušuje vazbu k matce, ale posiluje důvěru k oběma rodičům.',
    content: `# Výzkum z Arizona State University: Přespávání v kojeneckém věku upevňuje vztah k OBA rodičům

Reprezentativní dlouhodobá studie profesora **Williama Fabricia** z Arizona State University sledovala děti od kojeneckého věku až do dospělosti a přinesla klíčové empirické důkazy pro opatrovnická řízení.

## Hlavní výsledky studie (Fabricius et al.)

1. **Žádné poškození vztahu k matce:** Časté přespávání u otce v prvních dvou letech života (0–24 měsíců) nijak neoslabilo ani nenarušilo citovou vazbu dětí k matce v pozdějším věku.
2. **Zásadní posílení vztahu k otci:** Děti, které v kojeneckém a batolecím věku u otce pravidelně přespávaly, vykazovaly v dospívání a dospělosti výrazně vyšší míru důvěry, otevřené komunikace a emocionální stability ve vztahu k otci.
3. **Méně úzkostí a lepší zdraví:** Lidé, kterým bylo v dětství umožněno přespávat u obou rodičů od kojeneckého věku, měli v dospělosti nižší výskyt psychosomatických potíží a úzkostných stavů.

## Co z toho vyplývá pro OSPOD a české soudy?

Odpírání noční péče v prvních letech života dítěte na základě nepodložených obav poškozuje dlouhodobý vývoj dítěte. Pravidelné přespávání je nejúčinnější prevencí ztráty kontaktu s otcem.`,
    puckContent: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-art-2',
            title: 'Výzkum Arizona State University: Přespávání v kojeneckém věku',
            description: 'Detailní rozbor studie prof. Williama Fabricia. Časté přespávání u otce v prvních 2 letech posiluje důvěru k oběma rodičům.',
            buttonText: 'Více o výzkumu',
            buttonUrl: '#obsah',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-art-2-1',
            text: 'Dlouhodobá studie prof. Williama Fabricia sledovala děti od kojeneckého věku až do dospělosti. Závěry jsou jednoznačné:\n\n- Časté přespávání u otce v 0-24 měsících nenarušuje vazbu k matce.\n- Výrazně posiluje vztah k otci v dospívání.\n- Snižuje úzkostnost a psychosomatické potíže v dospělosti.',
            align: 'left',
          },
        },
      ],
      root: {},
    },
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    title: 'Věk pod 1 rok není překážka: Proč odkládat přespávání nedává smysl',
    slug: 'vek-pod-1-rok-neni-prekazka-proc-odkladat-prespavani',
    category: 'Vědecké mýty vs. fakta',
    summary: 'Zaměření na data prokazující, že přespávání funguje stejně pozitivně bez ohledu na to, zda začalo před 1. rokem věku nebo ve 2. roce.',
    content: `# Věk pod 1 rok není překážka: Proč odkládat přespávání nedává smysl

Argument "počkáme, až bude dítěti 3 roky" je jedním z nejčastějších mýtů, se kterými se otcové setkávají u OSPOD i u soudních znalců. Empirická data však ukazují přesný opak.

## Proč je odkládání přespávání škodlivé?

- **Ztráta senzitivního období:** V prvním roce života probíhá nejintenzivnější tvorba bazální důvěry. Pokud otec v tomto období chybí při večerní a noční péči, dítě si na jeho nepřítomnost zvykne a pozdější zavedení přespávání bývá náročnější.
- **Srovnávací data:** Výzkumy prokazují, že děti, které začaly přespávat před 1. rokem věku, zvládaly přechody mezi domovy lépe než děti, u kterých se přespávání odložilo na 2. či 3. rok.
- **Kojení není překážkou:** Pokud je dítě kojeno, existují osvědčené postupy (odsávané materské mléko, přikrmování), které umožňují přespávání bez narušení výživy.

Otec není jen "návštěva na odpolední procházku", ale plnohodnotný pečující rodič od prvních dnů života.`,
    puckContent: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-art-3',
            title: 'Věk pod 1 rok není překážka',
            description: 'Proč odkládat přespávání na pozdější věk poškozuje vztah dítěte k otci a co k tomu říká věda.',
            buttonText: 'Číst celý článek',
            buttonUrl: '#obsah',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-art-3-1',
            text: 'V prvním roce života probíhá nejintenzivnější tvorba bazální důvěry. Data prokazují, že přespávání funguje stejně pozitivně bez ohledu na to, zda začalo před 1. rokem věku nebo ve 2. roce.',
            align: 'left',
          },
        },
      ],
      root: {},
    },
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },

  // --- Série 2: Česká praxe a judikatura ---
  {
    title: 'Zastaralé předsudky českých soudů vs. sociologická data z MUNI',
    slug: 'zastarale-predsudky-ceskych-soudu-vs-data-z-muni',
    category: 'Česká praxe a judikatura',
    summary: 'Analýza výzkumu Petra Fučíka z Masarykovy univerzity. Jak trvání na tradičním modelu škodí stabilitě dětí a proč české soudnictví ignoruje sociologická data.',
    content: `# Zastaralé předsudky českých soudů vs. sociologická data z MUNI

Výzkumný tým docenta **Petra Fučíka** z katedry sociologie Masarykovy univerzity (MUNI) realizoval rozsáhlý výzkum zaměřený na uspořádání péče o děti po rozvodu v české společnosti.

## Klíčová zjištění výzkumu MUNI:

1. **Tradiční model "výhradní péče matky s vikendovým stykem otce" poškozuje stabilitu dětí:** Děti v tomto modelu vykazují vyšší míru pocitu ztráty jednoho z rodičů a menší spokojenost.
2. **Střídavá péče a rozsáhlý styk fungují:** Výzkum vyvrátil mýtus o "rozpolceném dítěti se dvěma domovy". Děti ve střídavé péči nebo s rozsáhlou noční péčí u otce mají srovnatelnou subjektivní pohodu jako děti v úplných rodinách.
3. **Setrvačnost české justice:** Přestože sociologická data jednoznačně podporují zapojení obou rodičů, část českých soudů a OSPOD stále podléhá předsudkům z 80. let 20. století.

Otcové mohou tento sociologický výzkum přímo citovat ve svých návrzích k soudu jako odbornou oporu pro rovnocennou péči.`,
    puckContent: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-art-4',
            title: 'Zastaralé předsudky českých soudů vs. data z MUNI',
            description: 'Analýza výzkumu doc. Petra Fučíka z Masarykovy univerzity o porevoluční praxi péče o děti.',
            buttonText: 'Zobrazit argumenty',
            buttonUrl: '#obsah',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-art-4-1',
            text: 'Výzkum Masarykovy univerzity ukazuje, že střídavá péče a rozsáhlá noční péče u otce přináší dětem vyšší stabilitu a spokojenost než přežitý model výhradní péče s občasnými návštěvami.',
            align: 'left',
          },
        },
      ],
      root: {},
    },
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    title: 'Co rozhoduje o úspěšném přespávání? Věk dítěte to není (poznatky z Univerzity Karlovy)',
    slug: 'co-rozhoduje-o-uspesnem-prespavani-vek-ditete-to-neni',
    category: 'Česká praxe a judikatura',
    summary: 'Rozbor prací z repozitáře UK. Klíčovým faktorem pro zvládnutí noční péče je praktická schopnost otce zajistit večerní a ranní rutinu péče.',
    content: `# Co rozhoduje o úspěšném přespávání? Věk dítěte to není (poznatky z Univerzity Karlovy)

Rozbor odborných prací z repozitáře Univerzity Karlovy (Katedra psychologie FF UK a Fakulta humanitních studií UK) ukazuje, jaké faktory jsou z hlediska dětské psychologie skutečně rozhodující pro zvládnutí noční péče.

## Čtyři pilíře úspěšné noční péče u otce:

1. **Praktická kompetence otce:** Schopnost bezpečně nakrmit, vykoupat, utišit a uložit dítě ke spánku. Věk dítěte nehraje roli, rozhoduje dovednost rodiče.
2. **Předvídatelnost a rituály:** Stejné večerní rituály (pohádka, mojkání, světýlko) vytváří u dítěte pocit domova bez ohledu na to, v jaké postýlce spí.
3. **Klid při předávání:** Pokud probíhá předání mezi rodiči bez emocí a konfrontace, dítě přechází do péče otce s pocitem bezpečí.
4. **Respekt k potřebám dítěte:** Schopnost otce pružně reagovat na pláč či noční probuzení.

Pokud otec tyto podmínky splňuje, neexistuje žádný odborný důvod, proč by dítě nemělo přespávat od kojeneckého věku.`,
    puckContent: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-art-5',
            title: 'Co rozhoduje o úspěšném přespávání?',
            description: 'Poznatky z Univerzity Karlovy. Klíčem je praktická schopnost otce zajistit večerní a ranní rituály.',
            buttonText: 'Přečíst návod',
            buttonUrl: '/prakticky-pruvodce-jak-zvladnout-vecerni-a-ranni-cyklus-pece',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-art-5-1',
            text: 'Rozbor prací z UK potvrzuje: Neexistuje věková hranice pro přespávání. Rozhoduje praktická způsobilost otce a stabilita večerní péče.',
            align: 'left',
          },
        },
      ],
      root: {},
    },
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },

  // --- Série 3: Dlouhodobý dopad na vývoj dítěte ---
  {
    title: 'Investice do budoucnosti: Jak přespávání v batolecím věku formuje teenagery',
    slug: 'investice-do-budoucnosti-jak-prespavani-formuje-teenagery',
    category: 'Dlouhodobý dopad na vývoj dítěte',
    summary: 'Závěry z australské národní studie. Dospívající, kteří u otců odmalinka pravidelně přespávali, vykazují výrazně vyšší míru blízkosti a důvěry k oběma rodičům.',
    content: `# Investice do budoucnosti: Jak přespávání v batolecím věku formuje teenagery

Australská národní podélná studie (*Longitudinal Study of Australian Children – LSAC*) dlouhodobě sledovala tisíce dětí od raného dětství až do věku 18 let.

## Dlouhodobé výsledky u dospívajících (15–18 let):

- **Vyšší sebedůvěra a emoční odolnost:** Teenagery, kteří od útlého dětství pravidelně přespávali u otců, vykazují výrazně nižší riziko depresí, úzkostí a problémového chování.
- **Rovnocenná důvěra k oběma rodičům:** Přespávání v raném věku položilo základ pro to, aby se dospívající se svými problémy obracel jak na matku, tak na otce.
- **Lepší školní výsledky a sociální vztahy:** Zapojení otce do běžného denního a nočního chodu posiluje kognitivní a sociální rozvoj dítěte.

Pravidelné přespávání v útlém věku není výhodou jen pro otce, ale především nepostradatelnou investicí do psychického zdraví dítěte na celý život.`,
    puckContent: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-art-6',
            title: 'Investice do budoucnosti: Přespávání v batolecím věku',
            description: 'Závěry z australské národní studie (LSAC). Jak včasná noční péče formuje zdravé dospívající.',
            buttonText: 'Zobrazit studii',
            buttonUrl: '#obsah',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-art-6-1',
            text: 'Dospívající, kteří u otců odmalinka pravidelně přespávali, vykazují v 15–18 letech vyšší sebedůvěru, lepší studijní výsledky a vyrovnané vztahy s oběma rodiči.',
            align: 'left',
          },
        },
      ],
      root: {},
    },
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },

  // --- Speciální formáty ---
  {
    title: 'Argumentační manuál do kapsy (PDF ke stažení)',
    slug: 'argumentacni-manual-do-kapsy',
    category: 'Speciální formáty',
    summary: 'Praktický přehled klíčových argumentů, vědeckých studií a judikátů Ústavního soudu pro jednání s OSPOD a soudem v přehledné formě.',
    content: `# Argumentační manuál do kapsy

Tento manuál slouží jako přehledný tahák pro otce, advokáty a konzultanty při vyjednávání na OSPOD a u soudních jednání.

## 1. Vědecký konsenzus (Warshak 2014, Fabricius 2017)
- **Mýtus:** "Dítě pod 3 roky potřebuje spát výhradně s matkou."
- **Fakt:** 110 světových expertů potvrdilo, že přespávání u otce od kojeneckého věku posiluje vztah k oběma rodičům a nezpůsobuje trauma.

## 2. Judikatura Ústavního soudu ČR
- **Nález I. ÚS 2482/13:** Střídavá péče a rovnocenná péče je výchozím modelem.
- **Nález I. ÚS 3216/13:** Právo dítěte na péči obou rodičů je primární.

## 3. Sociologická data (MUNI Fučík)
- Děti v péči obou rodičů vykazují vyšší spokojenost a stabilitu než v modelu jedné výhradní péče.

*Ke stažení: Vytiskněte si tento manuál nebo jej přiložte jako přílohu k vašemu vyjádření pro OSPOD.*`,
    puckContent: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-spec-1',
            title: 'Argumentační manuál do kapsy',
            description: 'Kompletní přehled argumentů, judikátů ÚS a vědeckých studií pro jednání s OSPOD a soudem.',
            buttonText: 'Stáhnout PDF podklady',
            buttonUrl: '/argumentacni-manual-do-kapsy',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-spec-1',
            text: 'Použijte tento strukturovaný přehled vědeckých faktů a nálezů Ústavního soudu ČR při jednání s orgány sociálně-právní ochrany dětí nebo při koncipování návrhu k soudu.',
            align: 'left',
          },
        },
        {
          type: 'CallToAction',
          props: {
            id: 'cta-spec-1',
            title: 'Potřebujete právní vzor podání k soudu?',
            description: 'Stáhněte si vzory návrhů na úpravu péče a přespávání.',
            buttonText: 'Přejít ke vzorům',
            buttonUrl: '/sluzby',
            variant: 'primary',
          },
        },
      ],
      root: {},
    },
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    title: 'Praktický průvodce: Jak zvládnout večerní a ranní cyklus péče',
    slug: 'prakticky-pruvodce-jak-zvladnout-vecerni-a-ranni-cyklus-pece',
    category: 'Speciální formáty',
    summary: 'Detailní návod krok za krokem pro tátovy první noci s malým dítětem. Jak sestavit uklidňující rituály, řešit spánek, krmení a ranní přípravu.',
    content: `# Praktický průvodce: Jak zvládnout večerní a ranní cyklus péče

Prokázání praktické způsobilosti otce je u OSPOD klíčovým argumentem pro schválení přespávání. Tento průvodce vám pomůže sestavit bezchybný režim.

## Večerní cyklus (18:00 – 20:30)
1. **Večeře a zklidnění:** Lehká večeře, vypnutí divokých hraček a obrazovek 1 hodinu před spánkem.
2. **Koupání a hygiena:** Teplá koupel působí jako signál ke spánku.
3. **Předspánkový rituál:** Pohádka, ukolébavka, tlumené světlo.
4. **Ukládání:** Klidný a jistý přístup rodiče dává dítěti pocit bezpečí.

## Noční péče
- Mějte po ruce přebalovací potřeby, vodu nebo připravené mléko.
- Při nočním probuzení zachovejte klid, mluvte tiše a tlumeným hlasem.

## Ranní cyklus (06:30 – 08:00)
- Společná snídaně, hygiena, klidná příprava do školky či na předání.

*Doporučení: Veďte si deník péče, který můžete předložit OSPOD jako důkaz o zvládání režimu.*`,
    puckContent: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-spec-2',
            title: 'Praktický průvodce: Večerní a ranní cyklus péče',
            description: 'Detailní postup pro táty k zajištění večerních rituálů, spánku a ranní pohody dítěte.',
            buttonText: 'Číst metodiku',
            buttonUrl: '#obsah',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-spec-2',
            text: 'Prokázání praktické způsobilosti je klíčem k úspěchu u OSPOD. Sestavte si předvídatelný večerní a ranní režim podle naší metodiky.',
            align: 'left',
          },
        },
      ],
      root: {},
    },
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
  },
  {
    title: 'Infografika pro sociální sítě: Přespávání a vývoj dítěte',
    slug: 'infografika-pro-socialni-site-prespavani-a-vyvoj-ditete',
    category: 'Speciální formáty',
    summary: 'Přehledná vizuální infografika shrnující fakta o přespávání malých dětí u otce, srovnání mýtů a vědecké reality.',
    content: `# Infografika: Mýty vs. Fakta o přespávání dětí u otce

Sdílejte tyto ověřené vědecké poznatky a pomozte šířit osvětu o právu dítěte na oba rodiče!

## MÝTUS 1: "Malé dítě u tátu nesmí přespávat."
**FAKT:** 110 světových expertů (Warshak consensus) potvrzuje, že přespávání u otce od kojeneckého věku posiluje vazbu k OBA rodičům.

## MÝTUS 2: "Přespávání u tátu naruší vazbu k matce."
**FAKT:** Studie Arizona State University sledovala děti 20 let a prokázala zero poškození vztahu k matce.

## MÝTUS 3: "Dítě ve střídavé péči chudák nemá domov."
**FAKT:** Data z MUNI (Fučík) prokazují, že děti se dvěma pečujícími domovy vykazují vyšší stabilitu a životní spokojenost.

*Stáhněte si infografiku a sdílejte ji ve svých opatrovnických skupinách nebo na sociálních sítích.*`,
    puckContent: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-spec-3',
            title: 'Infografika: Přespávání a vývoj dítěte',
            description: 'Přehledné grafické karty srovnávající mýty české opatrovnické praxe s vědeckou realitou.',
            buttonText: 'Zobrazit karty',
            buttonUrl: '#obsah',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-spec-3',
            text: 'Stáhněte si vizuální karty pro sociální sítě nebo jako přehledný argumentační tahák do kapsy.',
            align: 'center',
          },
        },
      ],
      root: {},
    },
    published: true,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    title: 'Algotech a.s. – Stabilní Cloud VPS infrastruktura pro projekt Táta má právo',
    slug: 'algotech-sponzor-cloud-vps',
    category: 'Partneři a Sponzoři',
    summary: 'Česká společnost Algotech a.s. podporuje náš portál poskytnutím vysoko-výkonného Cloud VPS serveru, který zajišťuje rychlý chod databáze, backendu i AI Asistenta.',
    content: `# Algotech a.s. – Stabilní Cloud VPS pro náš komunitní portál\n\nPro provoz náročných systémů, jako je náš **AI Asistent opatrovnictví**, PostgreSQL databáze rozsudků a komunitní aplikace, je nezbytná nekompromisní rychlost, vysoká dostupnost a maximální bezpečnost dat.\n\nSpolečnost **Algotech a.s.** se stala klíčovým technologickým partnerem projektu *Táta má právo* tím, že nám bezplatně poskytuje špičkový **Cloud VPS server**.\n\n### Co pro náš projekt podpora Algotechu znamená:\n* **Vysoký výkon a bezvýpadkový provoz:** Naše servery zvládají nárazovou návštěvnost i zpracování rozsáhlých dat z e-Sbírky.\n* **Bezpečnost dat:** Veškerá data otců i anonymizované dotazy jsou bezpečně uložena v certifikovaném datovém centru v ČR.\n* **Prostor pro AI moduly:** Algotech nám umožňuje provozovat pokročilé backendové služby a mikroslužby pro vyhledávání v judikatuře.\n\nDěkujeme společnosti **Algotech a.s.** za to, že pomáhá otcům v náročných životních situacích mít neustálý přístup k právním informacím.`,
    puckContent: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-algo',
            title: 'Algotech a.s. – Stabilní Cloud VPS infrastruktura',
            description: 'Díky společnosti Algotech a.s. běží projekt Táta má právo na bezpečné a rychlé cloudové infrastruktuře v ČR.',
            buttonText: 'Přečíst celý článek',
            buttonUrl: '#obsah',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-algo',
            text: 'Algotech bezplatně poskytuje špičkový Cloud VPS server pro bezproblémový běh našich AI modulů a databáze rozsudků.',
            align: 'left',
          },
        },
      ],
      root: {},
    },
    published: true,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'WEDOS Internet, a.s. – Spolehlivý webhosting pro náš portál',
    slug: 'wedos-sponzor-hosting',
    category: 'Partneři a Sponzoři',
    summary: 'Společnost WEDOS Internet, a.s., lídr na českém hostingovém trhu, zajišťuje našemu projektu stabilní hostingové prostředí a ochranu proti kybernetickým hrozbám.',
    content: `# WEDOS Internet, a.s. – Spolehlivý webhosting pro náš portál\n\nZajištění dostupnosti poradenských materiálů, článků a vzorů právních podání 24 hodin denně, 7 dní v týdnu je pro otce v krizových situacích klíčové.\n\nDíky podpoře společnosti **WEDOS Internet, a.s.**, která je lídrem na českém hostingovém trhu, má náš portál *Táta má právo* zajištěno stabilní hostingové prostředí.\n\n### Klíčové přínosy spolupráce s WEDOS:\n* **Špičková infrastruktura:** Webhosting na moderním hardwaru v soukromých datových centrech WEDOS v Hluboké nad Vltavou.\n* **Rychlé načítání stránek:** Nízké odezvy a vysoká propustnost pro všechny návštěvníky z ČR i zahraničí.\n* **Silná ochrana proti útokům:** Pokročilá DDoS ochrana chrání náš portál před výpadky a kybernetickými hrozbami.\n\nVážím si podpory společnosti **WEDOS Internet, a.s.**, díky které můžeme bezplatně rozvíjet prevenci a osvětu v opatrovnických řízeních.`,
    puckContent: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-wedos',
            title: 'WEDOS Internet, a.s. – Spolehlivý webhosting',
            description: 'Díky společnosti WEDOS Internet, a.s. má náš portál zajištěno stabilní hostingové prostředí a špičkovou infrastrukturu.',
            buttonText: 'Přečíst celý článek',
            buttonUrl: '#obsah',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-wedos',
            text: 'WEDOS nám poskytuje spolehlivý webhosting, rychlé načítání a silnou ochranu proti útokům v jejich datových centrech v Hluboké nad Vltavou.',
            align: 'left',
          },
        },
      ],
      root: {},
    },
    published: true,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'FORPSI – Hrdý sponzor domény tatovacesta.cz',
    slug: 'forpsi-partner-domeny',
    category: 'Partneři a Sponzoři',
    summary: 'Renomovaný registrátor FORPSI (INTERNET CZ, a.s.) zastřešuje správu a sponzoring naší hlavní domény tatovacesta.cz.',
    content: `# FORPSI – Hrdý sponzor domény tatovacesta.cz\n\nKaždý významný projekt potřebuje svou jasnou adresu v digitálním světě. Naše doména **tatovacesta.cz** je místem, kde otcové nacházejí zastání, právní orientaci a metodiku pro rovnocennou péči o své děti.\n\nRenomovaný registrátor **FORPSI** (INTERNET CZ, a.s.) zastřešuje správu a sponzoring naší hlavní domény.\n\n### Význam partnerství s FORPSI:\n* **Garance oficiální domény:** Bezpečná správa DNS záznamů a směrování pro doménu \`tatovacesta.cz\` i vývojovou verzi \`dev3.tatovacesta.cz\`.\n* **DNSSEC & Bezpečnost:** Zabezpečení domény proti podvržení IP adresy a zaručení důvěryhodnosti pro naše uživatele.\n* **Dlouhodobá podpora:** Spolehlivé zázemí pro rozvoj značky a komunitní identity *Táta má právo*.\n\nDěkujeme **FORPSI** za podporu myšlenky, že dítě má právo na oba rodiče!`,
    puckContent: {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-forpsi',
            title: 'FORPSI – Hrdý sponzor domény tatovacesta.cz',
            description: 'Spolehlivý registrátor a partner poskytující bezpečné doménové zázemí a DNSSEC ochranu.',
            buttonText: 'Více informací',
            buttonUrl: '#obsah',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-forpsi',
            text: 'FORPSI nám pomáhá udržovat bezpečnou a spolehlivou adresu v digitálním světě.',
            align: 'left',
          },
        },
      ],
      root: {},
    },
    published: true,
    createdAt: new Date().toISOString(),
  }
];

export async function seedArticles() {
  console.log('Spouštím seedování článků a kategorií...');

  // 1. Seed categories
  for (const cat of articleCategories) {
    try {
      if (prisma) {
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: {
            name: cat.name,
            description: cat.description,
            type: cat.type,
          },
          create: {
            slug: cat.slug,
            name: cat.name,
            description: cat.description,
            type: cat.type,
          },
        });
      }
    } catch (err) {
      console.warn(`Prisma seed selhal pro kategorii ${cat.slug}:`, err);
    }

    // Keep dbStore in sync
    const existingCatIdx = dbStore.categories.findIndex((c) => c.slug === cat.slug);
    if (existingCatIdx >= 0) {
      dbStore.categories[existingCatIdx] = {
        ...dbStore.categories[existingCatIdx],
        name: cat.name,
        description: cat.description,
        type: cat.type,
      };
    } else {
      dbStore.categories.push({
        id: `cat-${cat.slug}`,
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        type: cat.type,
      });
    }
  }

  // 2. Seed articles
  for (const art of initialArticles) {
    try {
      if (prisma) {
        // Upsert into Article table
        await prisma.article.upsert({
          where: { slug: art.slug },
          update: {
            title: art.title,
            summary: art.summary,
            content: art.content,
            categoryName: art.category,
            published: art.published,
          },
          create: {
            title: art.title,
            slug: art.slug,
            summary: art.summary,
            content: art.content,
            categoryName: art.category,
            published: art.published,
            createdAt: new Date(art.createdAt),
          },
        });

        // Also upsert into Page table for Puck / CMS Page availability
        await prisma.page.upsert({
          where: { slug: art.slug },
          update: {
            title: art.title,
            content: art.puckContent,
          },
          create: {
            title: art.title,
            slug: art.slug,
            content: art.puckContent,
            published: true,
            createdAt: new Date(art.createdAt),
          },
        });
      }
    } catch (err) {
      console.warn(`Prisma seed selhal pro článek ${art.slug}, ukládám do in-memory dbStore:`, err);
    }

    // Always keep dbStore in sync for local fallback
    const existingArtIdx = dbStore.articles.findIndex((a) => a.slug === art.slug);
    const articleObj = {
      id: `art-${art.slug}`,
      slug: art.slug,
      title: art.title,
      summary: art.summary,
      content: art.content,
      published: art.published,
      category: art.category,
      createdAt: art.createdAt,
      updatedAt: new Date().toISOString(),
    };

    if (existingArtIdx >= 0) {
      dbStore.articles[existingArtIdx] = {
        ...dbStore.articles[existingArtIdx],
        ...articleObj,
      };
    } else {
      dbStore.articles.push(articleObj);
    }

    // Also sync to dbStore.pages
    const existingPageIdx = dbStore.pages.findIndex((p) => p.slug === art.slug);
    const pageObj = {
      id: `pg-${art.slug}`,
      slug: art.slug,
      title: art.title,
      content: art.puckContent as any,
      published: true,
      updatedAt: new Date().toISOString(),
    };

    if (existingPageIdx >= 0) {
      dbStore.pages[existingPageIdx] = {
        ...dbStore.pages[existingPageIdx],
        ...pageObj,
      };
    } else {
      dbStore.pages.push(pageObj);
    }
  }

  console.log(`[Articles Seed] Úspěšně naseedováno ${initialArticles.length} článků a ${articleCategories.length} kategorií!`);
}

// Pokud je skript spuštěn přímo přes `tsx prisma/seed-articles.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  seedArticles()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Chyba při spuštění seed-articles.ts:', err);
      process.exit(1);
    });
}
