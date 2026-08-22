import React, { useState, useEffect } from 'react';
import {
  BookMarked,
  Search,
  Filter,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Tag,
  ExternalLink,
  ShieldCheck,
  Scale,
  RefreshCw
} from 'lucide-react';
import { SeoHead } from '../SeoHead';
import { WikiTerm } from '../../../types';

interface WikiViewProps {
  onNavigate?: (path: string) => void;
}

interface TermItem {
  id: string;
  term: string;
  firstLetter: string;
  category: 'pravo' | 'ospod' | 'soud' | 'finance';
  categoryLabel: string;
  citation?: string;
  definition: string;
  practicalTips: string[];
  relatedTerms?: string[];
}

const WIKI_TERMS: TermItem[] = [
  {
    id: 'asistovane-predavani',
    term: 'Asistované předávání',
    firstLetter: 'A',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    citation: '§ 908 o.z.',
    definition: 'Předávání dítěte mezi rodiči za účasti odborného pracovníka (např. v krizovém nebo rodinném centru) nebo jiné určené nezávislé osoby s cílem zabránit verbálním i fyzickým konfliktům před zraky dětí.',
    practicalTips: [
      'Využívá se tam, kde jsou předávání provázena vysoce konfliktním chováním rodičů.',
      'Můžete jej navrhnout sami, nebo ho nařídí soud předběžným opatřením.'
    ],
    relatedTerms: ['Asistovaný styk', 'Předběžné opatření']
  },
  {
    id: 'asistovany-styk',
    term: 'Asistovaný styk (Setkávání s dohledem)',
    firstLetter: 'A',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    citation: '§ 891 odst. 2 o.z.',
    definition: 'Setkávání rodiče s dítětem za přítomnosti odborného pracovníka (psychologa, sociálního pracovníka), nejčastěji v neutrálním prostředí specializovaného centra (např. APERIO, krizová centra).',
    practicalTips: [
      'Slouží k obnovení narušeného kontaktu po dlouhé odluce nebo při traumatech.',
      'Je to dočasné opatření s cílem přejít k běžnému neřízenému styku.'
    ],
    relatedTerms: ['Asistované předávání', 'OSPOD']
  },
  {
    id: 'aktivni-otcovstvi',
    term: 'Aktivní otcovství po rozchodu',
    firstLetter: 'A',
    category: 'ospod',
    categoryLabel: 'Komunikace & Psychologie',
    definition: 'Koncept plnohodnotné, přímé a každodenní péče otce o dítě i po rozpadu rodiny. Otec se podílí nejen na zábavě, ale i na povinnostech (výchova, lékaři, škola, kroužky).',
    practicalTips: [
      'Prokazujte aktivní otcovství doložením e-mailové komunikace se školou, přihláškami na kroužky a lékařskými zprávami.',
      'Nezaměřujte se u soudu pouze na volnočasové aktivity.'
    ],
    relatedTerms: ['Střídavá péče', 'Rodičovská odpovědnost']
  },
  {
    id: 'biff',
    term: 'BIFF Komunikace',
    firstLetter: 'B',
    category: 'ospod',
    categoryLabel: 'Komunikace & Psychologie',
    definition: 'Metoda písemné komunikace s vysoce konfliktním druhým rodičem vyvinutá High Conflict Institute. Zkratka znamená Brief (Stručná), Informative (Informativní), Friendly (Přátelská), Firm (Pevná).',
    practicalTips: [
      'Eliminuje emoce, obvinění a dlouhé slohové práce.',
      'Služba pro bezpečný výkaz pro opatrovnický soud.'
    ],
    relatedTerms: ['PAS (Syndrom zavrženého rodiče)', 'OSPOD']
  },
  {
    id: 'bezplatny-advokat',
    term: 'Bezplatný advokát (Určení ČAK)',
    firstLetter: 'B',
    category: 'pravo',
    categoryLabel: 'Právní pojmy',
    citation: '§ 18a zákona o advokacii',
    definition: 'Rozhodnutí České advokátní komory o bezplatném určení zástupce pro osoby, které doloží nízké příjmy a písemné odmítnutí zastupování alespoň dvěma advokáty.',
    practicalTips: [
      'Formulář žádosti je k dispozici na webu cak.cz.',
      'Je třeba přiložit čestné prohlášení o příjmech a dvě písemná odmítnutí od advokátů.'
    ],
    relatedTerms: ['Životní minimum', 'Soudní řízení']
  },
  {
    id: 'cochemska-praxe',
    term: 'Cochemská praxe (Cochemský model)',
    firstLetter: 'C',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    definition: 'Interdisciplinární přístup v opatrovnickém soudnictví pocházející z německého Cochemu. Spojuje soudce, OSPOD, mediátory a psychology s cílem přimět rodiče k dohodě bez zbytečných znaleckých posudků.',
    practicalTips: [
      'Jednání probíhá do několika týdnů od podání návrhu.',
      'Rodičovská dohoda má přednost před rozhodnutím autority.'
    ],
    relatedTerms: ['Kolizní opatrovník', 'Soudní smír']
  },
  {
    id: 'cochemsky-smir',
    term: 'Cochemský smír',
    firstLetter: 'C',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    definition: 'Dohoda rodičů uzavřená v průběhu opatrovnického řízení za interdisciplinární podpory soudce, OSPOD a mediátora, která je následně schválena rozsudkem.',
    practicalTips: [
      'Cochemský smír eliminuje potřebu psychologických znaleckých posudků.',
      'Zajišťuje vysokou míru dodržování dohody v budoucnu.'
    ],
    relatedTerms: ['Cochemská praxe', 'Soudní smír']
  },
  {
    id: 'dolozka-pravni-moci',
    term: 'Doložka právní moci',
    firstLetter: 'D',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    citation: '§ 160 o.s.ř.',
    definition: 'Oficiální razítko a potvrzení soudu na písemném vyhotovení rozsudku nebo usnesení, které osvědčuje, že rozhodnutí je konečné, nelze proti němu podat řádný opravný prostředek (odvolání) a je právně závazné a vykonatelné.',
    practicalTips: [
      'Bez doložky právní moci nelze vymáhat plnění exekučně.',
      'Vyžádejte si vyznačení doložky na kanceláři soudu po uplynutí odvolací lhůty (15 dní).'
    ],
    relatedTerms: ['Vykonatelnost', 'Petit']
  },
  {
    id: 'dohoda-o-vyzivnem',
    term: 'Dohoda o výživném',
    firstLetter: 'D',
    category: 'finance',
    categoryLabel: 'Finance & Výživné',
    citation: '§ 910 o.z.',
    definition: 'Písemné ujednání rodičů o výši, splatnosti a způsobu hrazení výživného na nezletilé dítě, které pro svou vykonatelnost vyžaduje schválení opatrovnickým soudem.',
    practicalTips: [
      'Dohoda musí být vždy v zájmu dítěte a odpovídat možnostem obou rodičů.',
      'Soud zkoumá, zda výše výživného není diskriminační.'
    ],
    relatedTerms: ['Životní minimum', 'Soudní smír']
  },
  {
    id: 'exekuce-styku',
    term: 'Exekuce styku (Výkon rozhodnutí)',
    firstLetter: 'E',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    citation: '§ 500 z.ř.s.',
    definition: 'Soudní postup uplatňovaný v případech, kdy jeden z rodičů svévolně a opakovaně maří styk druhého rodiče s dítětem určený vykonatelným rozsudkem nebo předběžným opatřením.',
    practicalTips: [
      'Soud nejprve ukládá výzvu a pokutu do 50 000 Kč.',
      'Při přetrvávajícím maření může soud přistoupit k odnětí dítěte nebo změně péče.'
    ],
    relatedTerms: ['Předběžné opatření', 'Doložka právní moci']
  },
  {
    id: 'informacni-povinnost',
    term: 'Informační povinnost rodičů',
    firstLetter: 'I',
    category: 'pravo',
    categoryLabel: 'Právní pojmy',
    citation: '§ 890 o.z.',
    definition: 'Zákonná povinnost obou rodičů se vzájemně informovat o všem důležitém, co se týká dítěte – zejména o jeho zdravotním stavu, studijních výsledcích, mimořádných událostech a zájmové činnosti.',
    practicalTips: [
      'Záměrné zatajování informací o škole nebo zdraví dítěte je porušením rodičovské odpovědnosti.',
      'Komunikujte tyto informace písemně (např. e-mailem nebo přes sdílenou aplikaci).'
    ],
    relatedTerms: ['Rodičovská odpovědnost', 'Společná odpovědnost rodičů']
  },
  {
    id: 'kolizni-opatrovnik',
    term: 'Kolizní opatrovník',
    firstLetter: 'K',
    category: 'ospod',
    categoryLabel: 'OSPOD & Postupy',
    citation: '§ 892 odst. 3 o.z.',
    definition: 'Zástupce jmenovaný soudem pro nezletilé dítě v řízení, kde by mohlo dojít ke střetu zájmů mezi rodiči a dítětem (zpravidla Orgán sociálně-právní ochrany dětí - OSPOD).',
    practicalTips: [
      'Kolizní opatrovník má zastupovat nezávisle zájem dítěte, nikoliv zájem matky či otce.',
      'Máte právo předkládat opatrovníkovi své návrhy a důkazy.'
    ],
    relatedTerms: ['OSPOD', 'Předběžné opatření']
  },
  {
    id: 'kolizni-opatrovnik-extended',
    term: 'Kolizní opatrovník (Pravomoci)',
    firstLetter: 'K',
    category: 'ospod',
    categoryLabel: 'OSPOD & Postupy',
    citation: '§ 469 z.ř.s.',
    definition: 'Soudem jmenovaný opatrovník (typicky OSPOD), který v opatrovnickém řízení zastupuje zájmy dítěte, podává soudu zprávy o poměrech a navrhuje rozhodnutí.',
    practicalTips: [
      'Opatrovník je samostatným účastníkem řízení s právem podávat odvolání.',
      'Můžete nahlížet do jeho spisu vedeného o dítěti.'
    ],
    relatedTerms: ['Kolizní opatrovník', 'Nestrannost OSPOD']
  },
  {
    id: 'nahliceni-do-spisu',
    term: 'Nahlížení do soudního spisu',
    firstLetter: 'N',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    citation: '§ 44 o.s.ř.',
    definition: 'Zákonné právo každého účastníka řízení (rodiče) prostudovat celý soudní spis vedený ve věci jeho dětí (spisová značka „Nc“), pořizovat si z něj výpisky a fotokopie.',
    practicalTips: [
      'Před každým soudním jednáním doporučujeme nahlédnout do spisu na infocentru soudu, zda protistrana či OSPOD nezaslali nová vyjádření.',
      'S sebou si vezměte mobilní telefon a veškeré nově vložené listy si vyfoťte.'
    ],
    relatedTerms: ['Doložka právní moci', 'Soudní řízení']
  },
  {
    id: 'nestrannost-ospod',
    term: 'Nestrannost OSPOD',
    firstLetter: 'N',
    category: 'ospod',
    categoryLabel: 'OSPOD & Postupy',
    definition: 'Povinnost orgánu sociálně-právní ochrany dětí přistupovat k oběma rodičům bez předsudků, zjišťovat objektivně poměry a chránit zájmy nezletilého dítěte, nikoli zájmy matky nebo otce.',
    practicalTips: [
      'Pokud se setkáte s nerovným přístupem (např. pracovník mluví pouze s matkou), písemně na to upozorněte vedoucího odboru.',
      'Požadujte, aby byla do spisu zaznamenána všechna vaše vyjádření.'
    ],
    relatedTerms: ['Podjatost sociálního pracovníka', 'OSPOD']
  },
  {
    id: 'ospod',
    term: 'OSPOD (Orgán sociálně-právní ochrany dětí)',
    firstLetter: 'O',
    category: 'ospod',
    categoryLabel: 'OSPOD & Postupy',
    citation: 'Zákon č. 359/1999 Sb.',
    definition: 'Státní orgán působící při obecních úřadech s rozšířenou působností. V opatrovnickém řízení plní funkci kolizního opatrovníka a provádí sociální šetření v rodinách.',
    practicalTips: [
      'Máte právo nahlížet do spisu Om vedeného u OSPODu (§ 38 správního řádu).',
      'Vystupujte vždy věcně, klidně a bez emocí.'
    ],
    relatedTerms: ['Kolizní opatrovník', 'BIFF Komunikace']
  },
  {
    id: 'odvolani-proti-rozsudku',
    term: 'Odvolání proti rozsudku',
    firstLetter: 'O',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    citation: '§ 201 o.s.ř.',
    definition: 'Řádný opravný prostředek proti nepravomocnému rozhodnutí opatrovnického soudu prvního stupně, o kterém rozhoduje nadřízený Krajský úřad nebo Krajský soud.',
    practicalTips: [
      'Lhůta pro podání odvolání je 15 dnů od doručení písemného vyhotovení rozsudku.',
      'Podává se u soudu, který rozsudek vydal.'
    ],
    relatedTerms: ['Soudní řízení', 'Doložka právní moci']
  },
  {
    id: 'pas',
    term: 'PAS (Syndrom zavrženého rodiče)',
    firstLetter: 'P',
    category: 'ospod',
    categoryLabel: 'Komunikace & Psychologie',
    definition: 'Stav, kdy jedno dítě bez racionálního důvodu odmítá a nenávidí jednoho z rodičů v důsledku systematické psychické manipulace a programování ze strany druhého pečujícího rodiče.',
    practicalTips: [
      'Důležité je včasné podání návrhu na soud k zamezení odcizení.',
      'Vyžaduje odborný psychologický posudek a krizovou terapii.'
    ],
    relatedTerms: ['BIFF Komunikace', 'Programování dítěte']
  },
  {
    id: 'programovani-ditete',
    term: 'Programování dítěte',
    firstLetter: 'P',
    category: 'ospod',
    categoryLabel: 'Komunikace & Psychologie',
    definition: 'Systematické očerňování a manipulace dítěte jedním z rodičů s cílem vytvořit u dítěte odpor, strach a nenávist vůči druhému rodiči.',
    practicalTips: [
      'Dokumentujte projevy programování (např. naučené fráze dítěte, odmítání bez reálného důvodu).',
      'Požádejte soud o nařízení rodinné terapie nebo krizové intervence.'
    ],
    relatedTerms: ['PAS (Syndrom zavrženého rodiče)', 'BIFF Komunikace']
  },
  {
    id: 'podjatost-pracovnika',
    term: 'Podjatost sociálního pracovníka',
    firstLetter: 'P',
    category: 'ospod',
    categoryLabel: 'OSPOD & Postupy',
    citation: '§ 14 správního řádu',
    definition: 'Stav, kdy u sociálního pracovníka OSPOD existují důvodné pochybnosti o jeho nestrannosti z důvodu poměru k věci, k účastníkům (rodičům) nebo jejich zástupcům.',
    practicalTips: [
      'Názorový nesouhlas s doporučením OSPOD není sám o sobě důvodem pro podjatost.',
      'Důvodem je osobní nebo příbuzenský vztah pracovníka s druhým rodičem, případně prokazatelné přátelství či nepřátelství.'
    ],
    relatedTerms: ['Nestrannost OSPOD', 'OSPOD']
  },
  {
    id: 'predbezna-vykonatelnost',
    term: 'Předběžná vykonatelnost rozsudku',
    firstLetter: 'P',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    citation: '§ 162 o.s.ř.',
    definition: 'Právní status, kdy rozhodnutí ve věcech péče o nezletilé a výživného nabývá vykonatelnosti bez ohledu na to, zda bylo podáno odvolání – stává se závazným okamžikem doručení účastníkům.',
    practicalTips: [
      'Odvolání proti rozsudku o péči o dítě nemá odkladný účinek.',
      'Pravidla v něm určená musíte dodržovat ihned po doručení písemného vyhotovení.'
    ],
    relatedTerms: ['Doložka právní moci', 'Odvolání proti rozsudku']
  },
  {
    id: 'petit',
    term: 'Petit (Soudní návrh)',
    firstLetter: 'P',
    category: 'pravo',
    categoryLabel: 'Právní pojmy',
    citation: '§ 79 o.s.ř.',
    definition: 'Závěrečná a zcela zásadní část soudního návrhu, ve které žalobce/navrhovatel přesně formuluje, jaké rozhodnutí má soud vynést.',
    practicalTips: [
      'Petit must be naprosto přesný, určitý a vykonatelný (dny, hodiny, místo předání).',
      'Soud je petitem v opatrovnickém řízení vázán z hlediska vykonatelnosti.'
    ],
    relatedTerms: ['Předběžné opatření', 'Doložka právní moci']
  },
  {
    id: 'predbezne-opatreni',
    term: 'Předběžné opatření (§ 452 z.ř.s.)',
    firstLetter: 'P',
    category: 'pravo',
    categoryLabel: 'Právní pojmy',
    citation: '§ 452 z.ř.s.',
    definition: 'Krizové rozhodnutí soudu vydávané ve zrychleném režimu (do 24 hodin u zvláštního nebo do 7 dnů u obecného), které zatímně upravuje poměry dítěte v situacích bezprostředního ohrožení nebo zamezení styku.',
    practicalTips: [
      'Slouží k okamžitému obnovení zamezeného styku s dítětem.',
      'Rozhodnutí je vykonatelné okamžikem doručení.'
    ],
    relatedTerms: ['Exekuce styku', 'Petit']
  },
  {
    id: 'rodinna-mediace',
    term: 'Rodinná mediace',
    firstLetter: 'M',
    category: 'pravo',
    categoryLabel: 'Právní pojmy',
    citation: 'Zákon č. 202/2012 Sb.',
    definition: 'Mimosoudní metoda řešení sporů za účasti zapsaného akreditovaného mediátora, která pomáhá oběma rodičům najít kompromis a uzavřít udržitelnou rodičovskou dohodu.',
    practicalTips: [
      'Soud může nařídit první setkání s mediátorem v rozsahu 3 hodin.',
      'Dohoda dosažená v mediaci může být následně schválena soudem jako rozsudek.'
    ],
    relatedTerms: ['Soudní smír', 'Cochemská praxe']
  },
  {
    id: 'rodicovska-odpovednost',
    term: 'Rodičovská odpovědnost',
    firstLetter: 'R',
    category: 'pravo',
    categoryLabel: 'Právní pojmy',
    citation: '§ 858 o.z.',
    definition: 'Soubor práv a povinností rodiče, který zahrnuje péči o dítě, ochranu jeho zdraví, jeho tělesný, citový, rozumový a mravní vývoj, jeho zastupování a správu jeho jmění.',
    practicalTips: [
      'Rodičovská odpovědnost náleží oběma rodičům stejně, ledaže ji soud omezil nebo jí rodiče zbavil.',
      'Rozchodem rodičů odpovědnost nezaniká ani se nemění.'
    ],
    relatedTerms: ['Společná odpovědnost rodičů', 'Informační povinnost rodičů']
  },
  {
    id: 'status-quo',
    term: 'Status Quo',
    firstLetter: 'S',
    category: 'pravo',
    categoryLabel: 'Právní pojmy',
    definition: 'Stávající faktický stav věcí. V opatrovnickém řízení soudy často zkoumají faktické uspořádání péče a prostředí, ve kterém dítě reálně vyrůstá a žije.',
    practicalTips: [
      'Svévolná změna status quo jedním rodičem (únos dítěte, přestěhování) má být soudem okamžitě korigována předběžným opatřením.'
    ],
    relatedTerms: ['Předběžné opatření', 'OSPOD']
  },
  {
    id: 'socialni-setreni',
    term: 'Sociální šetření OSPOD',
    firstLetter: 'S',
    category: 'ospod',
    categoryLabel: 'OSPOD & Postupy',
    citation: '§ 15 zákona o SPOD',
    definition: 'Návštěva sociálního pracovníka v obydlí rodiče za účelem zjištění bytových, materiálních, hygienických a rodinných poměrů, v nichž dítě vyrůstá nebo má vyrůstat.',
    practicalTips: [
      'Pracovník posuzuje, zda má dítě vlastní postel, klidné místo na učení, dostatek jídla a bezpečné prostředí.',
      'Buďte připraveni, vystupujte klidně a ukažte připravené zázemí pro dítě.'
    ],
    relatedTerms: ['OSPOD', 'Nestrannost OSPOD']
  },
  {
    id: 'stridava-pece',
    term: 'Střídavá péče (Shared Residency)',
    firstLetter: 'S',
    category: 'pravo',
    categoryLabel: 'Právní pojmy',
    citation: '§ 907 o.z. (po novele č. 268/2025 Sb. řešeno obecně jako rozsah péče)',
    definition: 'Smluvní státy uznávají právo dítěte udržovat pravidelné osobní styky a spojení s oběma rodiči. Novela 268/2025 Sb. od 1. 1. 2026 ruší formální nálepku střídavé péče; soudy určují přesný časový "rozsah péče". V praxi a judikatuře se pojem nadále užívá.',
    practicalTips: [
      'Ústavní soud ČR judikoval, že střídavá péče je prioritní volbou, pokud jsou oba rodiče způsobilí a mají o péči zájem.',
      'Soudy zkoumají komunikaci rodičů a blízkost bydliště / školských zařízení.'
    ],
    relatedTerms: ['Společná péče obou rodičů', 'Rodičovská odpovědnost']
  },
  {
    id: 'spolecna-odpovednost',
    term: 'Společná odpovědnost rodičů',
    firstLetter: 'S',
    category: 'pravo',
    categoryLabel: 'Právní pojmy',
    citation: 'čl. 18 Úmluvy o právech dítěte',
    definition: 'Mezinárodněprávní princip, podle kterého mají oba rodiče společnou a prvotní odpovědnost za výchovu a vývoj dítěte.',
    practicalTips: [
      'Tento princip brání tomu, aby jeden z rodičů po rozpadu vztahu svévolně rozhodoval o dítěti bez vědomí druhého.',
      'Je základem pro střídavou a společnou péči.'
    ],
    relatedTerms: ['Rodičovská odpovědnost', 'Informační povinnost rodičů']
  },
  {
    id: 'spolecna-pece',
    term: 'Společná péče obou rodičů',
    firstLetter: 'S',
    category: 'pravo',
    categoryLabel: 'Právní pojmy',
    citation: '§ 907 o.z. (po novele č. 268/2025 Sb. řešeno jako dohoda o péči bez formálních nálepek)',
    definition: 'Od roku 2026 výchozí přístup u dohodnutých rodičů, kdy soud formálně nevyjmenovává typ péče, ale potvrdí společnou odpovědnost a dohodu rodičů. Vyžaduje plnou shodu a nadstandardní komunikaci bez pevných rozsudkových harmonogramů.',
    practicalTips: [
      'Tato forma je vhodná, pokud rodiče i po rozchodu žijí v těsné blízkosti (nebo ve společném domě) a jsou schopni se na všem dohodnout bez pevných rozsudků.',
      'Je nejméně formalizovaná.'
    ],
    relatedTerms: ['Střídavá péče', 'Rodičovská odpovědnost']
  },
  {
    id: 'soudni-smir',
    term: 'Soudní smír',
    firstLetter: 'S',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    citation: '§ 99 o.s.ř.',
    definition: 'Dohoda účastníků řízení (rodičů) uzavřená před soudem a schválená usnesením, která má účinky pravomocného rozsudku.',
    practicalTips: [
      'Soud se má vždy pokusit o smírné vyřešení sporu.',
      'Smír šetří čas, náklady a minimalizuje psychické trauma dětí.'
    ],
    relatedTerms: ['Cochemský smír', 'Rodinná mediace']
  },
  {
    id: 'vyjadreni-ditete',
    term: 'Vyjádření názoru dítěte',
    firstLetter: 'V',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    citation: '§ 867 o.z.',
    definition: 'Právo dítěte vyjádřit se ke všem otázkám, které se ho v opatrovnickém řízení týkají. Soud a OSPOD musí názoru dítěte věnovat patřičnou pozornost odpovídající jeho věku a rozumové vyspělosti.',
    practicalTips: [
      'U dětí starších 12 let se předpokládá, že jsou schopné svůj názor formulovat samy.',
      'Názor dítěte může soud zjišťovat přímo u výslechu bez přítomnosti rodičů, nebo prostřednictvím OSPODu.'
    ],
    relatedTerms: ['Zájem dítěte (Best Interests of the Child)', 'Kolizní opatrovník']
  },
  {
    id: 'vymahani-rozhodnuti',
    term: 'Vymáhání soudního rozhodnutí',
    firstLetter: 'V',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    citation: '§ 500 z.ř.s.',
    definition: 'Nástroj soudu k vynucení plnění rozsudku o styku s dítětem, zejména ukládáním opakovaných pokut do výše 50 000 Kč rodiči, který styk maří.',
    practicalTips: [
      'Při každém maření styku podejte písemný návrh na výkon rozhodnutí k opatrovnickému soudu.',
      'Dokumentujte každé neúspěšné předání.'
    ],
    relatedTerms: ['Exekuce styku', 'Předběžné opatření']
  },
  {
    id: 'zajem-ditete',
    term: 'Zájem dítěte (Best Interests of the Child)',
    firstLetter: 'Z',
    category: 'pravo',
    categoryLabel: 'Právní pojmy',
    citation: 'čl. 3 Úmluvy o právech dítěte',
    definition: 'Přední hledisko pro jakékoli rozhodování týkající se dětí, ať už prováděné veřejnými institucemi, soudy nebo rodiči. Jde o komplexní posouzení bezpečnosti, stability, citových vazeb a vývoje dítěte.',
    practicalTips: [
      'Argumentace u soudu musí být vždy postavena na tom, proč je váš návrh v zájmu dítěte, nikoli ve vašem osobním zájmu.',
      'Pojem zájem dítěte nesmí být zneužíván k svévolnému vylučování otce z výchovy.'
    ],
    relatedTerms: ['Vyjádření názoru dítěte', 'Rodičovská odpovědnost']
  },
  {
    id: 'znalecky-posudek',
    term: 'Znalecký posudek',
    firstLetter: 'Z',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    citation: '§ 127 o.s.ř.',
    definition: 'Odborné posouzení psychického stavu rodičů, dětské osobnosti, rodičovských kompetencí a citových vazeb vypracované soudním znalcem v oboru psychologie/psychiatrie.',
    practicalTips: [
      'Máte právo klást znalci otázky u soudního jednání.',
      'Výhrady k posudku je nutné podat písemně v zákonné lhůtě.'
    ],
    relatedTerms: ['Cochemská praxe', 'PAS (Syndrom zavrženého rodiče)']
  },
  {
    id: 'zivotni-minimum',
    term: 'Životní minimum',
    firstLetter: 'Z',
    category: 'finance',
    categoryLabel: 'Finance & Výživné',
    citation: 'Zákon č. 110/2006 Sb.',
    definition: 'Společensky uznaná minimální hranice peněžních příjmů k zajištění výživy a ostatních základních osobních potřeb. Je zásadním limitem pro výpočet výživného a posouzení nároku na bezplatnou právní pomoc (ČAK).',
    practicalTips: [
      'Bezplatný advokát od ČAK se určuje, pokud příjem rodiny nepřesahuje 3násobek životního minima.',
      'Aktuální výši životního minima najdete na stránkách MPSV ČR.'
    ],
    relatedTerms: ['Bezplatný advokát (Určení ČAK)', 'Dohoda o výživném']
  }
];

const ALPHABET = ['Vše', 'A', 'B', 'C', 'D', 'E', 'I', 'K', 'M', 'N', 'O', 'P', 'R', 'S', 'V', 'Z'];

export const WikiView: React.FC<WikiViewProps> = ({ onNavigate }) => {
  const [terms, setTerms] = useState<TermItem[]>(WIKI_TERMS);
  const [loading, setLoading] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<string>('Vše');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchWikiTerms();
  }, []);

  const fetchWikiTerms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cms/wiki');
      if (res.ok) {
        const data: WikiTerm[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: TermItem[] = data.map((item) => {
            const firstLetter = item.firstLetter || (item.term.trim().charAt(0).toUpperCase());
            const cat = (item.category as any) || 'pravo';
            return {
              id: item.id,
              term: item.term,
              firstLetter,
              category: cat,
              categoryLabel: item.categoryLabel || (cat === 'soud' ? 'Soudní řízení' : cat === 'ospod' ? 'OSPOD & Postupy' : cat === 'finance' ? 'Finance & Výživné' : 'Právní pojmy'),
              citation: item.citation,
              definition: item.definition,
              practicalTips: item.practicalTips || [],
              relatedTerms: item.relatedTerms || []
            };
          });
          setTerms(mapped);
        }
      }
    } catch (err) {
      console.warn('Používám výchozí Wiki data:', err);
    } finally {
      setLoading(false);
    }
  };

  const dynamicAlphabet = ['Vše', ...Array.from(new Set(terms.map((t) => t.firstLetter.toUpperCase()))).sort()];

  const filteredTerms = terms.filter((t) => {
    const matchesLetter = selectedLetter === 'Vše' || t.firstLetter.toUpperCase() === selectedLetter.toUpperCase();
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.citation && t.citation.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLetter && matchesCategory && matchesQuery;
  });

  const handleCopyTerm = (term: TermItem) => {
    const textToCopy = `${term.term} ${term.citation ? `(${term.citation})` : ''}: ${term.definition}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(term.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Opatrovnická Právní Wiki & Slovník Pojmů • Táta má právo"
        description="Prohledatelný abecední a tematický slovník opatrovnických pojmů: OSPOD, BIFF komunikace, Předběžné opatření, Status Quo, Znalecký posudek, Exekuce styku."
        canonicalPath="/wiki"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-400/30 mb-3">
              <BookMarked className="w-3.5 h-3.5 text-indigo-400" /> Právní Wiki & Slovník
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Slovník Opatrovnických Pojmů
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Přezkoumané výklady právních institutů, postupů OSPOD, Cochemské praxe a psychologických termínů se zákonnými citacemi a praktickými tipy.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Vyhledat pojem (např. OSPOD, BIFF, § 452)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Všechny kategorie
            </button>
            <button
              onClick={() => setSelectedCategory('pravo')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'pravo' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Právní pojmy
            </button>
            <button
              onClick={() => setSelectedCategory('ospod')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'ospod' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              OSPOD & Psychologie
            </button>
            <button
              onClick={() => setSelectedCategory('soud')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'soud' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Soudní řízení
            </button>
            <button
              onClick={() => setSelectedCategory('finance')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'finance' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Finance & Výživné
            </button>
          </div>
        </div>

        {/* Alphabet Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[10px] font-black uppercase text-slate-400 mr-2 shrink-0">Abeceda:</span>
          {dynamicAlphabet.map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold shrink-0 transition-all cursor-pointer ${
                selectedLetter === letter
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTerms.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-slate-200">
                  {item.categoryLabel}
                </span>
                {item.citation && (
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                    {item.citation}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-black text-slate-900 leading-tight">
                {item.term}
              </h3>

              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {item.definition}
              </p>

              {/* Practical Tips */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <strong className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  💡 Praktické doporučení:
                </strong>
                <ul className="space-y-1">
                  {item.practicalTips.map((tip, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <span>Heslo v kódexu</span>
              </div>

              <button
                onClick={() => handleCopyTerm(item)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedId === item.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Zkopírováno</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Kopírovat pojem</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
