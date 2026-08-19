import { getPrismaClient, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import { DEFAULT_HOMEPAGE_PUCK_DATA, LEGAL_PAGES_PUCK_DATA, CRISIS_COMMUNITY_PAGES_PUCK_DATA } from '../puck/defaultPageData';

export interface ModulePageDef {
  slug: string;
  title: string;
  description: string;
  category?: string;
}

export const MENU_MODULE_PAGES: ModulePageDef[] = [
  // 1. 🚨 Krizová pomoc & Komunita
  { slug: 'krizova-pomoc', title: 'Krizová pomoc & Komunita', description: 'Okamžitá krizová opora, praktické postupy, komunitní sdílení a právní jistota pro otce.', category: 'Krizová pomoc & Komunita' },
  { slug: 'sos-plan', title: 'SOS Plán prvních 72 hodin', description: '4-kroký krizový algoritmus prvních 72 hodin opatrovnického konfliktu.', category: 'Krizová pomoc & Komunita' },
  { slug: 'crisis', title: 'SOS Krizový plán a linky', description: 'Okamžitá krizová intervence, kontakty na linky pomoci a kroky při krizových situacích.', category: 'Krizová pomoc & Komunita' },
  { slug: 'forum', title: 'Komunitní fórum a diskuse', description: 'Diskuzní prostor pro sdílení zkušeností otců v opatrovnických řízeních.', category: 'Krizová pomoc & Komunita' },
  { slug: 'pribehy', title: 'Příběhy z opatrovnické praxe', description: 'Reálné příběhy a zkušenosti otců při boji o péči a kontakt s dětmi.', category: 'Krizová pomoc & Komunita' },
  { slug: 'stories', title: 'Příběhy z opatrovnické praxe (EN)', description: 'Reálné příběhy a zkušenosti otců při boji o péči a kontakt s dětmi.', category: 'Krizová pomoc & Komunita' },
  { slug: 'memento', title: 'Memento a zkušenosti otců', description: 'Svědectví, poučení a prevence systémového odcizení rodiče.', category: 'Krizová pomoc & Komunita' },
  { slug: 'pravni-poradna', title: 'Právní poradna pro otce', description: 'Odborná právní poradna a odpovědi na specifické opatrovnické otázky.', category: 'Krizová pomoc & Komunita' },
  { slug: 'advice', title: 'Právní poradna pro otce (EN)', description: 'Odborná právní poradna a odpovědi na specifické opatrovnické otázky.', category: 'Krizová pomoc & Komunita' },
  { slug: 'podpora', title: 'Podpora a mentorská síť', description: 'Síť dobrovolníků, mentorů a vrstevnické podpory pro otce.', category: 'Krizová pomoc & Komunita' },
  { slug: 'support', title: 'Podpora a mentorská síť (EN)', description: 'Síť dobrovolníků, mentorů a vrstevnické podpory pro otce.', category: 'Krizová pomoc & Komunita' },

  // 2. ⚖️ Opatrovnictví & Právo
  { slug: 'opatrovnicka-agenda', title: 'Opatrovnická agenda a kroky', description: 'Kompletní průvodce opatrovnickou agendou od podání návrhu po rozsudek.', category: 'Opatrovnictví & Právo' },
  { slug: 'prava', title: 'Práva rodičů a dětí', description: 'Přehled ústavních a zákonných práv dítěte na oboustrannou rodičovskou péči.', category: 'Opatrovnictví & Právo' },
  { slug: 'rights', title: 'Práva rodičů a dětí (EN)', description: 'Přehled ústavních a zákonných práv dítěte na oboustrannou rodičovskou péči.', category: 'Opatrovnictví & Právo' },
  { slug: 'judikatura', title: 'Přehled judikatury a judikátů', description: 'Klíčové nálezy Ústavního soudu a judikáty k opatrovnické péči a výživnému.', category: 'Opatrovnictví & Právo' },
  { slug: 'ke-stazeni', title: 'Vzory podání a dokumenty ke stažení', description: 'Praktické vzory žádostí, návrhů, odvolání a dokumentů pro opatrovnické soudy.', category: 'Opatrovnictví & Právo' },
  { slug: 'rozchod-a-dite', title: 'Průvodce životní cestou otce', description: 'Kompletní životní cesta: Rozchod, Dítě, OSPOD, Soud, Rozhodnutí a stabilní péče.', category: 'Opatrovnictví & Právo' },
  { slug: 'ospod-a-z', title: 'Ucelený průvodce OSPOD od A do Z', description: 'Kompletní praktická příručka pro jednání s orgánem sociálně-právní ochrany dětí.', category: 'Opatrovnictví & Právo' },
  { slug: 'dokumentace-a-dokazy', title: 'Metodika dokumentace a důkazů', description: 'Praktický návod na bezpečné a legální shromažďování důkazních materiálů.', category: 'Opatrovnictví & Právo' },
  { slug: 'tvrzeni-druheho-rodice', title: 'Reakční matice na nepravdivá tvrzení', description: 'Jak věcně, deeskalačně a s důkazy reagovat na nepravdivá tvrzení u soudu a OSPOD.', category: 'Opatrovnictví & Právo' },
  { slug: 'dite-v-konfliktu', title: 'Dítě uprostřed konfliktu', description: 'Psychologická a procesní doporučení pro ochranu dítěte před partnerským konfliktem.', category: 'Opatrovnictví & Právo' },

  // 2.1 🚨 Co dělat / Co nedělat
  { slug: 'co-nedelat', title: 'Co (ne)dělat v řízení', description: 'Praktický průvodce krizovým chováním otce v opatrovnickém konfliktu.', category: 'Opatrovnictví & Právo' },
  { slug: 'co-nedelat/komunikace', title: 'Jak (ne)komunikovat', description: 'Metodika bezpečné a věcné komunikace s bývalou partnerkou.', category: 'Opatrovnictví & Právo' },
  { slug: 'co-nedelat/predavani', title: 'Jak (ne)předávat dítě', description: 'Bezpečné a klidné předávání dítěte bez partnerských střetů.', category: 'Opatrovnictví & Právo' },
  { slug: 'co-nedelat/dite', title: 'Jak (ne)jednat před dítětem', description: 'Ochrana dětského bezpečí a psychiky před partnerským sporem.', category: 'Opatrovnictví & Právo' },
  { slug: 'co-nedelat/osp', title: 'Jak (ne)jednat s OSPOD', description: 'Jak se chovat na úřadě a prokázat svou rodičovskou kapacitu.', category: 'Opatrovnictví & Právo' },
  { slug: 'co-nedelat/soud', title: 'Jak se (ne)chovat u soudu', description: 'Procesní taktika, sebekontrola a věcné vystupování v soudní síni.', category: 'Opatrovnictví & Právo' },
  { slug: 'co-nedelat/socialni-site', title: 'Co (ne)dávat na internet', description: 'Právní rizika a dopady veřejného komentování sporu.', category: 'Opatrovnictví & Právo' },
  { slug: 'co-nedelat/ai', title: 'Jak (ne)využívat AI', description: 'Zásady odpovědné a bezpečné práce s AI asistenty bez chyb.', category: 'Opatrovnictví & Právo' },

  // 2.2 👶 Dítě v konfliktu sub-pages
  { slug: 'dite-v-konfliktu/konflikt-loajality', title: 'Konflikt loajality dětí', description: 'Jak chránit dítě před pocitem viny a zrady jednoho z rodičů.', category: 'Opatrovnictví & Právo' },
  { slug: 'dite-v-konfliktu/predavani', title: 'Tranzitní stres dětí', description: 'Jak zvládat pláč a nervozitu dítěte při přechodu mezi rodiči.', category: 'Opatrovnictví & Právo' },
  { slug: 'dite-v-konfliktu/dite-odmita-jit', title: 'Když dítě odmítá jít k otci', description: 'Krizová doporučení a deeskalační postup při odporu dítěte.', category: 'Opatrovnictví & Právo' },
  { slug: 'dite-v-konfliktu/skola', title: 'Komunikace se školou', description: 'Jak uplatnit svá rodičovská práva na informace ve škole.', category: 'Opatrovnictví & Právo' },
  { slug: 'dite-v-konfliktu/psycholog', title: 'Zapojení psychologa', description: 'Kdy vyhledat odbornou psychologickou pomoc a jak s ní pracovat.', category: 'Opatrovnictví & Právo' },

  // 2.3 ⚖️ Reakční matice (Tvrzení druhého rodiče)
  { slug: 'tvrzeni-druheho-rodice/dite-nechce-k-otci', title: 'Tvrzení: „Dítě k otci nechce“', description: 'Jak reagovat na argumenty, že dítě odmítá styk z vlastní vůle.', category: 'Opatrovnictví & Právo' },
  { slug: 'tvrzeni-druheho-rodice/otec-se-nestara', title: 'Tvrzení: „Otec se dříve nestaral“', description: 'Jak doložit kontinuitu své péče a rodičovskou způsobilost.', category: 'Opatrovnictví & Právo' },
  { slug: 'tvrzeni-druheho-rodice/otec-nema-cas', title: 'Tvrzení: „Otec nemá čas“', description: 'Jak obhájit pracovní flexibilitu a časovou kapacitu pro péči.', category: 'Opatrovnictví & Právo' },
  { slug: 'tvrzeni-druheho-rodice/otec-nema-bydleni', title: 'Tvrzení: „Otec nemá bydlení“', description: 'Jak doložit materiální zázemí a připravit se na šetření.', category: 'Opatrovnictví & Právo' },
  { slug: 'tvrzeni-druheho-rodice/stridava-pece-skodi', title: 'Tvrzení: „Střídavka dítěti škodí“', description: 'Jak argumentovat vědeckými studiemi ve prospěch střídavé péče.', category: 'Opatrovnictví & Právo' },
  { slug: 'tvrzeni-druheho-rodice/dite-je-prilis-male', title: 'Tvrzení: „Dítě je příliš malé“', description: 'Jak obhájit nocování u nejmenších dětí podle studií.', category: 'Opatrovnictví & Právo' },
  { slug: 'tvrzeni-druheho-rodice/rodice-se-nedomluvi', title: 'Tvrzení: „Rodiče se nedomluví“', description: 'Jak ukázat snahu o dohodu a deeskalovat mezirodičovský konflikt.', category: 'Opatrovnictví & Právo' },
  { slug: 'tvrzeni-druheho-rodice/otec-je-agresor', title: 'Tvrzení: „Otec je agresor“', description: 'Jak reagovat na nepravdivá obvinění z verbálního násilí.', category: 'Opatrovnictví & Právo' },
  { slug: 'tvrzeni-druheho-rodice/otec-neplati-alimenty', title: 'Tvrzení: „Otec neplatí výživné“', description: 'Jak doložit úhrady nákladů a plnění vyživovací povinnosti.', category: 'Opatrovnictví & Právo' },
  { slug: 'tvrzeni-druheho-rodice/dite-ma-krouzky', title: 'Tvrzení: „Péče brání kroužkům“', description: 'Jak zajistit zájmy dítěte bez ohledu na střídání domovů.', category: 'Opatrovnictví & Právo' },
  { slug: 'tvrzeni-druheho-rodice/otec-chce-stridavku-pro-penize', title: 'Tvrzení: „Chce střídavku pro peníze“', description: 'Jak vyvrátit finanční spekulace o motivaci k péči.', category: 'Opatrovnictví & Právo' },
  { slug: 'tvrzeni-druheho-rodice/dite-je-nemocne', title: 'Tvrzení: „Dítě je příliš nemocné“', description: 'Jak zajistit plnění léčebného režimu v obou domácnostech.', category: 'Opatrovnictví & Právo' },
  { slug: 'tvrzeni-druheho-rodice/otec-nema-zkusenosti', title: 'Tvrzení: „Otec nemá zkušenosti“', description: 'Jak doložit péči o kojence a batolata bez předsudků.', category: 'Opatrovnictví & Právo' },
  { slug: 'tvrzeni-druheho-rodice/soudni-znalec-nedoporucil', title: 'Tvrzení: „Soudní znalec nedoporučil“', description: 'Jak reagovat na nepříznivý znalecký posudek věcně a odborně.', category: 'Opatrovnictví & Právo' },

  // 2.4 🏛️ OSPOD od A do Z sub-pages
  { slug: 'ospod-a-z/prvni-jednani', title: 'První jednání na OSPOD', description: 'Jak se chovat na úvodní schůzce a vytvořit dobrý dojem.', category: 'Opatrovnictví & Právo' },
  { slug: 'ospod-a-z/co-si-pripravit', title: 'Co si připravit na OSPOD', description: 'Kompletní checklist dokumentů a podkladů na schůzku.', category: 'Opatrovnictví & Právo' },
  { slug: 'ospod-a-z/domaci-setreni', title: 'Domácí šetření OSPOD', description: 'Jak připravit domácnost na návštěvu sociální pracovnice.', category: 'Opatrovnictví & Právo' },
  { slug: 'ospod-a-z/zapis-a-protokol', title: 'Zápis a protokol na OSPOD', description: 'Jak pracovat s protokolem, kontrolovat text a uplatňovat výhrady.', category: 'Opatrovnictví & Právo' },
  { slug: 'ospod-a-z/co-aktivne-rikat', title: 'Co aktivně říkat na OSPOD', description: 'Vhodné věcné formulace zaměřené na zájem nezletilého dítěte.', category: 'Opatrovnictví & Právo' },
  { slug: 'ospod-a-z/co-nerikat', title: 'Co nikdy neříkat na OSPOD', description: 'Komunikační tabu, která spolehlivě poškodí vaši pozici.', category: 'Opatrovnictví & Právo' },
  { slug: 'ospod-a-z/jak-reagovat', title: 'Jak reagovat na podjatost OSPOD', description: 'Jak čelit případné neobjektivitě a postupovat v mezích zákona.', category: 'Opatrovnictví & Právo' },
  { slug: 'ospod-a-z/kolizni-opatrovnik', title: 'Kolizní opatrovník u soudu', description: 'Pochopte procesní úlohu a vliv OSPODu na soudní rozhodnutí.', category: 'Opatrovnictví & Právo' },
  { slug: 'ospod-a-z/stiznost-175', title: 'Stížnost na postup OSPOD', description: 'Metodika podání věcné stížnosti podle správního řádu.', category: 'Opatrovnictví & Právo' },

  // 2.5 📂 Metodika dokumentace sub-pages
  { slug: 'dokumentace-a-dokazy/jak-dokumentovat', title: 'Jak správně dokumentovat', description: 'Jak vést deník péče, evidovat předávání, školu a lékaře.', category: 'Opatrovnictví & Právo' },
  { slug: 'dokumentace-a-dokazy/nahravky', title: 'Právní limity nahrávání hovorů', description: 'Kdy a jak lze legálně použít tajné nahrávky u soudu.', category: 'Opatrovnictví & Právo' },
  { slug: 'dokumentace-a-dokazy/komunikace', title: 'Dokumentace zpráv a chatu', description: 'Jak strukturovat a předkládat písemnou komunikaci jako důkaz.', category: 'Opatrovnictví & Právo' },
  { slug: 'dokumentace-a-dokazy/svedci', title: 'Svědectví třetích osob', description: 'Jak zapojit svědky, učitele, lékaře a sousedy do dokazování.', category: 'Opatrovnictví & Právo' },
  { slug: 'dokumentace-a-dokazy/chronologie', title: 'Vytvoření chronologie případu', description: 'Návod na sestavení přehledné časové osy událostí pro soud.', category: 'Opatrovnictví & Právo' },
  { slug: 'dokumentace-a-dokazy/co-nedelat', title: 'Čeho se vyvarovat u důkazů', description: 'Zákonné hranice dokazování – ochrana před trestním stíháním.', category: 'Opatrovnictví & Právo' },

  // 3. 🏛️ Státní data
  { slug: 'state-laws', title: 'e-Sbírka • Opatrovnická e-Legislativa', description: 'Interaktivní paragrafové znění OZ, ZSPOD a o.s.ř. s citacemi pro soudní podání.', category: 'Státní data' },
  { slug: 'state-statistics', title: 'Statistiky opatrovnické praxe', description: 'Analýza dat Ministerstva spravedlnosti o délkách řízení a typech péče v ČR.', category: 'Státní data' },
  { slug: 'pripadova-databaze', title: 'Případová databáze rozsudků', description: 'Rejstřík rozsudků a judikátů s vyhledáváním a právními větami.', category: 'Státní data' },

  // 4. 🎓 Akademie
  { slug: 'knihovna-studii', title: 'Knihovna vědeckých studií', description: 'Vědecké studie a recenzované výzkumy o střídavé péči a vývoji dětí.', category: 'Akademie' },
  { slug: 'videoteka', title: 'Videotéka a rozhovory', description: 'Odborná videa, přednášky a rozhovory s psychology a právníky.', category: 'Akademie' },
  { slug: 'vzdelavani', title: 'Edukativní kvízy a testy', description: 'Interaktivní testy právního vědomí a opatrovnické metodiky.', category: 'Akademie' },
  { slug: 'legal-wiki', title: 'Právní Wiki a pojmovník', description: 'Slovník pojmů z opatrovnického práva, OSPODu a soudního řízení.', category: 'Akademie' },
  { slug: 'cesta-zakladatele', title: 'Cesta zakladatele projektu', description: 'Příběh a motivace stojící za vznikem platformy Táta má právo.', category: 'Akademie' },

  // 5. 📂 Pracovna
  { slug: 'user-portal', title: 'Osobní klientská složka otce', description: 'Správa osobního spisu, termínů a důkazů pro opatrovnické řízení.', category: 'Pracovna' },
  { slug: 'profile', title: 'Uživatelský profil', description: 'Nastavení klientského účtu, rolí a kontaktních údajů.', category: 'Pracovna' },
  { slug: 'coparent-hub', title: 'Co-Parenting centrum & sdílený kalendář', description: 'Plánování péče, sdílený kalendář a evidence výloh mezi rodiči.', category: 'Pracovna' },

  // 6. 🤖 AI nástroje
  { slug: 'ai-assistant', title: 'AI Opatrovnický asistent', description: 'Inteligentní asistent pro rozbor soudních dokumentů a přípravu podání.', category: 'AI nástroje' },
  { slug: 'ai-guide', title: 'AI Průvodce opatrovnickým řízením', description: 'Krok za krokem průvodce strategií v soudním řízení a při komunikaci s OSPOD.', category: 'AI nástroje' },
  { slug: 'ai-case-manager', title: 'AI Case Manager spisu', description: 'Organizátor spisu, chronologie událostí a důkazních materiálů.', category: 'AI nástroje' },
  { slug: 'plan-pece', title: 'Simulátor a kalkulačka péče', description: 'Kalkulačka výživného a rozvržení střídavé péče.', category: 'AI nástroje' },
  { slug: 'centrum-formularu', title: 'Generátor právních formulářů', description: 'Automatické generování návrhů na předběžná opatření a střídavou péči.', category: 'AI nástroje' },

  // 7. 🛠️ Systém
  { slug: 'news', title: 'Novinky a aktualizace', description: 'Aktuální zprávy o změnách v legislativě a provozu portálu.', category: 'Systém' },
  { slug: 'synthesis-hub', title: 'Systémový Synthesis Hub', description: 'Centrální přehled systémového stavu a analytických modulů.', category: 'Systém' },
  { slug: 'ai-admin', title: 'AI Administrace a modely', description: 'Správa AI modelů, promptů a systémového nastavení asistenta.', category: 'Systém' },
  { slug: 'admin', title: 'Správa systému a administrace', description: 'Administrační rozhraní pro správu uživatelů, obsahu a nastavení.', category: 'Systém' },
  { slug: 'ai-context', title: 'AI Context & Prompt Manager', description: 'Konfigurace kontextu a znalostní báze pro AI asistenty.', category: 'Systém' },
  { slug: 'user-manual', title: 'Uživatelská příručka a nápověda', description: 'Návod k použití portálu a jeho pokročilých funkcí.', category: 'Systém' },
  { slug: 'sitemap', title: 'Mapa stránek a architektura', description: 'Přehledná struktura všech sekcí a modulů portálu Táta má právo.', category: 'Systém' },
  { slug: 'partneri', title: 'Partneři a sponzoři', description: 'Technologičtí a odborní partneři, kteří podporují infrastrukturu a provoz portálu Táta má právo.', category: 'Systém' },
  { slug: 'sponzori', title: 'Partneři a sponzoři', description: 'Představujeme partnery a sponzory, díky kterým můžeme udržovat portál Táta má právo v chodu.', category: 'Systém' },
  { slug: 'kodex-dobrovolnika', title: 'Dobrovolnický kodex', description: 'Etická pravidla, zásady komunikace a odpovědného jednání dobrovolníků projektu Táta má právo / Synthesis OS.', category: 'Systém' },
  { slug: 'zasady-ochrany-osobnich-udaju', title: 'Zásady ochrany osobních údajů (GDPR)', description: 'Zásady zpracování a ochrany osobních údajů, správa souhlasů a práva subjektů údajů podle Nařízení (EU) 2016/679.', category: 'Systém' },
  { slug: 'home', title: 'Táta má právo • Hlavní strana', description: 'Hlavní veřejná stránka portálu Táta má právo.', category: 'Systém' },
];

export async function ensureAllModulePagesExist(): Promise<{ success: boolean; createdCount: number; totalModules: number; message: string }> {
  let createdCount = 0;
    const prismaClient = isPrismaAvailable() ? getPrismaClient() : null;

  for (const mod of MENU_MODULE_PAGES) {
    const defaultPuckData = (mod.slug === 'domu' || mod.slug === 'home') ? DEFAULT_HOMEPAGE_PUCK_DATA : LEGAL_PAGES_PUCK_DATA[mod.slug] ? LEGAL_PAGES_PUCK_DATA[mod.slug] : CRISIS_COMMUNITY_PAGES_PUCK_DATA[mod.slug] ? CRISIS_COMMUNITY_PAGES_PUCK_DATA[mod.slug] : mod.slug === 'zasady-ochrany-osobnich-udaju' ? {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-privacy-policy',
            badgeText: 'Synthesis OS • Security & Privacy Compliance',
            title: 'Zásady ochrany osobních údajů (GDPR)',
            description: 'Transparentní zpracování a ochrana osobních údajů podle Nařízení Evropského parlamentu a Rady (EU) 2016/679 (GDPR). Release 0.5.1 • Účinnost od 12. 8. 2026.',
            ctaText: 'Zpět na hlavní portál',
            ctaUrl: '/',
            secondaryCtaText: 'Kontaktní formulář',
            secondaryCtaUrl: '/kontakt',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-privacy-controller',
            text: '### 1. Identifikace správce\nSprávcem osobních údajů podle Nařízení Evropského parlamentu a Rady (EU) 2016/679 (GDPR) je:\n- **Jméno a příjmení:** Jiří Šár (fyzická osoba nepodnikající)\n- **Role:** Zakladatel a provozovatel projektu *Táta má právo / Synthesis OS*\n- **Webový portál:** www.tatovacesta.cz\n- **Kontaktní e-mail:** info@tatovacesta.cz | **Pověřený GDPR e-mail:** gdpr@tatamapravo.cz\n\n### 2. Kategorie a soubory zpracovávaných údajů\nZpracováváme osobní údaje nezbytné pro provoz portálu, komunitních funkcí a AI nástrojů:\n- **Identifikační a kontaktní údaje:** E-mailová adresa, uživatelské jméno, unikátní ID účtu.\n- **Technické údaje:** IP adresa, soubory cookies, logy přihlášení, typ prohlížeče.\n- **Autentizační údaje (Passkeys):** Systém **neukládá biometrické údaje**. Biometrická autentizace probíhá výhradně na zařízení uživatele (FIDO2/WebAuthn). Na server se přenáší pouze kryptografický veřejný klíč.',
            align: 'left',
            maxWidth: 'xl',
            color: 'default',
          },
        },
        {
          type: 'ColumnsBlock',
          props: {
            id: 'columns-privacy-sensitive',
            columnsCount: '2',
            ratio: 'equal',
            gap: 'lg',
            col1Title: '2.4 Citlivé osobní údaje (Čl. 9)',
            col1Text: 'Při vkládání podkladů do poradny systém zpracovává informace z rodinných vztahů a soudních spisů. Tyto údaje nejsou vyžadovány pro běžné použití a doporučuje se jejich důsledná anonymizace.',
            col2Title: '3. Zpracování pomocí AI',
            col2Text: 'AI nástroje uplatňují princip minimalizace dat. Výstupy slouží jako orientační podklad a nepředstavují automatizované rozhodování podle Čl. 22 GDPR.',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-privacy-rights',
            text: '### 5. Ochrana osobních údajů nezletilých dětí\nPortál **není určen k veřejnému zveřejňování identifikačních údajů o dětech**. V komunitních sekcích je zakázáno uvádět celá jména dětí, fotografie, rodná čísla nebo adresy škol a bydliště. Veškeré příběhy musí být důsledně anonymizovány.\n\n### 6. Uchování dat a zálohování\nOsobní údaje aktivních účtů uchováváme po dobu trvání registrace. Po žádosti o zrušení účtu dojde k výmazu údajů z aktivních systémů do 30 dnů. Technické zálohy jsou přemazávány v automatických cyklech (max. 90 dnů).\n\n### 7. Práva uživatelů podle GDPR\nMáte právo na přístup (Čl. 15), opravu (Čl. 16), výmaz / právo být zapomenut (Čl. 17), omezení zpracování (Čl. 18), přenositelnost údajů (Čl. 20) a vznesení námitky (Čl. 21). Svá práva můžete uplatnit na e-mailu gdpr@tatamapravo.cz.',
            align: 'left',
            maxWidth: 'xl',
            color: 'default',
          },
        },
        {
          type: 'CallToAction',
          props: {
            id: 'cta-privacy-contact',
            title: 'Máte dotaz k ochraně osobních údajů nebo chcete uplatnit svá práva?',
            description: 'Náš pověřený tým pro ochranu osobních údajů vám rád odpoví a pomůže s uplatněním práv subjektu údajů podle GDPR.',
            buttonText: 'Kontaktovat GDPR podporu',
            buttonUrl: '/kontakt',
            variant: 'primary',
          },
        },
      ],
      root: {
        props: {
          title: 'Zásady ochrany osobních údajů (GDPR)',
        },
      },
    } : mod.slug === 'sitemap' ? {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-sitemap',
            badgeText: 'Mapa webu',
            title: 'Architektura & Vývoj Synthesis OS (Sitemap)',
            description: 'Přehledná struktura všech sekcí a modulů portálu Táta má právo.',
            ctaText: 'Zpět na domovskou stránku',
            ctaUrl: '/',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-sitemap-1',
            text: '### 📥 Sekce se aktuálně připravuje\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu.',
            align: 'center',
            maxWidth: 'xl',
            color: 'default',
          },
        }
      ],
      root: {
        props: {
          title: 'Mapa stránek a architektura',
        },
      },
    } : mod.slug === 'user-manual' ? {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-user-manual',
            badgeText: 'Nápověda k platformě',
            title: 'Uživatelský manuál & Nápověda',
            description: 'Kompletní průvodce platformou Táta má právo a systémem Synthesis OS. Od prvního přihlášení až po pokročilou správu opatrovnického spisu.',
            ctaText: 'Začít s průvodcem',
            ctaUrl: '/o-projektu',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-user-manual-1',
            text: '### 📥 Sekce se aktuálně připravuje\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu. Brzy zde najdete detailní návody na použití AI asistentů, správu případů a práci se zabezpečeným úložištěm.',
            align: 'center',
            maxWidth: 'xl',
            color: 'default',
          },
        }
      ],
      root: {
        props: {
          title: 'Uživatelská příručka a nápověda',
        },
      },
    } : mod.slug === 'cesta-zakladatele' ? {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-cesta-zakladatele',
            badgeText: 'Synthesis OS • Osobní příběh & mise',
            title: 'Cesta zakladatele projektu',
            description: 'Proč vznikla platforma Táta má právo? Osobní zkušenost s opatrovnickým systémem, hledání spravedlnosti a vize digitální infrastruktury pro rodiny v krizi.',
            ctaText: 'O projektu',
            ctaUrl: '/o-projektu',
            secondaryCtaText: 'Kontaktní formulář',
            secondaryCtaUrl: '/kontakt',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-founder-story-1',
            text: '### 1. Když se zhroutí jistoty\nKaždý velký projekt obvykle začíná hlubokou osobní krizí nebo silným impulzem. Platforma **Táta má právo** (součást ekosystému Synthesis OS) nevznikla u rýsovacího prkna marketingové agentury, ale z reálné potřeby v situaci, kdy se rodinný svět rozpadl a otcové se ocitli v labyrintu institucí, o kterých dříve nic nevěděli.\n\nV okamžiku, kdy dojde k rozchodu nebo rozvodu, se rodičovská role často zužuje na boj o termíny, peníze a paragrafy. Právní systém může působit chladně, nepřehledně a vyčerpávajícím dojmem.',
            align: 'left',
            maxWidth: 'xl',
            color: 'default',
          },
        },
        {
          type: 'ColumnsBlock',
          props: {
            id: 'columns-founder-pillars',
            columnsCount: '2',
            ratio: 'equal',
            gap: 'lg',
            col1Title: 'Právní jistota & fakta',
            col1Text: 'Všechny výstupy vycházejí z platné legislativy ČR, judikatury Ústavního a Nejvyššího soudu a ověřených odborných studií.',
            col2Title: 'Dítě v centru zájmu',
            col2Text: 'Hlavním motorem projektu je ochrana nejlepšího zájmu dítěte. Cílem není eskalace konfliktů, ale kultivace komunikace.',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-founder-story-2',
            text: '### 2. Od poznání k systémovému řešení\nPozorování praxe v opatrovnických řízeních ukázalo, že největším nepřítelem otců není zlá vůle jednotlivců, ale neinformovanost, roztříštěnost dat a absence metodiky. Otcové často přicházejí k soudu nepřipraveni, bez znalosti svých procesních práv a s emocemi, které jim v konfrontaci s institucemi nepomáhají.\n\n### 3. Vize Synthesis OS & budoucnost\nProjekt se postupně vyvinul v robustní ekosystém pod hlavičkou **Synthesis OS**. Spojuje moderní webové technologie, krizové akční plány SOS, analyzátory spisů, kalkulačky výživného a bezpečné úložiště.',
            align: 'left',
            maxWidth: 'xl',
            color: 'default',
          },
        },
        {
          type: 'CallToAction',
          props: {
            id: 'cta-founder-support',
            title: 'Chcete podpořit naši misi?',
            description: 'Připojte se k naší komunitě dobrovolníků nebo podpořte provoz portálu Táta má právo.',
            buttonText: 'Podpořit projekt',
            buttonUrl: '/podporte-nas',
            variant: 'primary',
          },
        },
      ],
      root: {
        props: {
          title: 'Cesta zakladatele projektu',
        },
      },
    } : mod.slug === 'kodex-dobrovolnika' ? {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: 'hero-kodex-dobrovolnika',
            badgeText: 'Synthesis OS • Samostatný modul compliance',
            title: 'DOBROVOLNICKÝ KODEX',
            description: 'Táta má právo / Synthesis OS • Etická pravidla, zásady komunikace a odpovědného jednání dobrovolníků. Verze dokumentu: 1.0 • ID: SYNTH-CODEX-VOL-2026-V1 • Účinnost od: 12. 8. 2026',
            ctaText: 'Zpět na hlavní portál',
            ctaUrl: '/',
            secondaryCtaText: 'Podpořit projekt',
            secondaryCtaUrl: '/podporte-nas',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-kodex-purpose',
            text: '### I. ÚČEL KODEXU\n1. Tento kodex stanovuje základní pravidla chování všech dobrovolníků, spolupracovníků a osob s přístupem k projektu **Táta má právo / Synthesis OS**.\n2. Účelem kodexu je zajistit, aby projekt zůstal bezpečným, důvěryhodným a respektujícím prostředím pro rodiče, děti i všechny členy komunity.\n3. Dobrovolník přijímá skutečnost, že práce v projektu může mít přímý dopad na životní situace lidí, kteří se nacházejí v náročných rodinných, právních nebo psychických okolnostech.\n\n### II. POSLÁNÍ PROJEKTU\nDobrovolník při své činnosti podporuje zejména nejlepší zájem dítěte, zdravý vztah dítěte k oběma rodičům, respekt mezi rodiči, odpovědné rodičovství, dostupnost ověřených informací a lidský přístup k lidem v obtížné situaci.\n\n*Projekt není založen na boji proti jednotlivým osobám, ale na podpoře řešení, informovanosti a odpovědnosti.*',
            align: 'left',
            maxWidth: 'xl',
            color: 'default',
          },
        },
        {
          type: 'ColumnsBlock',
          props: {
            id: 'columns-kodex-values',
            columnsCount: '2',
            ratio: 'equal',
            gap: 'lg',
            col1Title: 'III. ZÁKLADNÍ HODNOTY',
            col1Text: '1. Respekt ke každému člověku bez ohledu na pohlaví, věk či situaci.\n2. Ochrana dítěte – dítě není nástroj konfliktu.\n3. Pravdivost a odpovědnost – ověřování informací a uvádění zdrojů.',
            col2Title: 'IV. KOMUNIKACE A PRAVIDLA',
            col2Text: 'Slušná, klidná a věcná komunikace bez odsuzování, urážení či vyvolávání konfliktů. Zásada neútočení na druhého rodiče a důsledná ochrana soukromí.',
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: 'text-kodex-standards',
            text: '### VII. OCHRANA SOUKROMÍ A ODBORNOST\nDobrovolník chrání identitu uživatelů, nesdílí screenshoty komunikace ani detaily případů. Nepředstírá kvalifikaci, kterou nemá, a jasně rozlišuje osobní názor od stanoviska projektu.\n\n### X. TECHNOLOGICKÁ ETIKA A AI\nBezpečnost systému znamená ochranu lidí. Při využití AI dobrovolník kontroluje výstupy a nevkládá citlivé osobní údaje do externích služeb.\n\n### XIV. SLIB DOBROVOLNÍKA\n> *„Přijímám odpovědnost za své jednání v projektu Táta má právo. Budu chránit soukromí lidí, respektovat důstojnost rodičů i dětí a využívat své schopnosti k pomoci, nikoliv k prohlubování konfliktů.“*',
            align: 'left',
            maxWidth: 'xl',
            color: 'default',
          },
        },
        {
          type: 'CallToAction',
          props: {
            id: 'cta-kodex-volunteer',
            title: 'Chcete se zapojit do dobrovolnického týmu?',
            description: 'Pomozte nám rozvíjet nezávislé právní a psychologické nástroje a komunitní podporu pro rodiny v opatrovnických řízeních.',
            buttonText: 'Kontaktovat koordinátora',
            buttonUrl: '/kontakt',
            variant: 'primary',
          },
        },
      ],
      root: {
        props: {
          title: 'Dobrovolnický kodex',
        },
      },
    } : (mod.slug === 'partneri' || mod.slug === 'sponzori') ? {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: `hero-${mod.slug}`,
            badgeText: 'Naši partneři a sponzoři',
            title: 'Podporují nás',
            description: 'Zajištění dostupnosti poradenských materiálů, článků a vzorů právních podání 24 hodin denně, 7 dní v týdnu je pro otce v krizových situacích klíčové. Děkujeme těmto technologickým partnerům za jejich podporu, bez kterých by tento portál nemohl existovat.',
            ctaText: 'Stát se partnerem',
            ctaUrl: '/kontakt',
            secondaryCtaText: 'Podpořit spolek',
            secondaryCtaUrl: '/podporte-nas',
          },
        },
        {
          type: 'ArticlesFeedBlock',
          props: {
            id: `feed-${mod.slug}`,
            title: 'Technologičtí a odborní partneři',
            subtitle: 'Děkujeme za podporu infrastruktury a provozu portálu.',
            categoryFilter: 'Partneři a sponzoři',
            limit: 6,
          },
        },
        {
          type: 'CallToAction',
          props: {
            id: `cta-${mod.slug}`,
            title: 'Chcete se stát partnerem projektu Táta má právo?',
            description: 'Pomozte nám rozvíjet nezávislé právní a psychologické nástroje pro rodiny v opatrovnických řízeních.',
            buttonText: 'Kontaktovat koordinátora',
            buttonUrl: '/kontakt',
            variant: 'primary',
          },
        },
      ],
      root: {
        props: {
          title: 'Partneři a sponzoři',
        },
      },
    } : {
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: `hero-${mod.slug}`,
            title: mod.title,
            description: mod.description,
            buttonText: 'Otevřít modul',
            buttonUrl: `/${mod.slug}`,
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: `text-${mod.slug}`,
            text: `Vítejte v modulu **${mod.title}** platformy Táta má právo.\n\n${mod.description}\n\nTuto stránku můžete plně upravovat a vizuálně přizpůsobit pomocí editoru Puck Builder.`,
            align: 'left',
          },
        },
        {
          type: 'CallToAction',
          props: {
            id: `cta-${mod.slug}`,
            title: `Potřebujete poradit v sekci ${mod.title}?`,
            description: 'Využijte naši právní poradnu nebo AI Opatrovnického asistenta.',
            buttonText: 'Přejít do poradny',
            buttonUrl: '/advice',
            variant: 'primary',
          },
        },
      ],
      root: {
        props: {
          title: mod.title,
        },
      },
    };

    if (prismaClient) {
      try {
        const existingBefore = await prismaClient.page.findUnique({
          where: { slug: mod.slug },
        });

        if (!existingBefore) {
          await prismaClient.page.create({
            data: {
              title: mod.title,
              slug: mod.slug,
              content: defaultPuckData,
              sections: {
                create: [
                  {
                    sectionKey: 'hero',
                    title: mod.title,
                    content: mod.description,
                    order: 1,
                    config: JSON.stringify({ buttonText: 'Otevřít', buttonUrl: `/${mod.slug}` }),
                  },
                  {
                    sectionKey: 'text',
                    title: 'Popis modulu',
                    content: mod.description,
                    order: 2,
                    config: JSON.stringify({ align: 'left' }),
                  },
                ],
              },
            },
          });
          createdCount++;
        } else {
          if (mod.slug === 'home' || mod.slug === 'domu') {
            await prismaClient.page.update({
              where: { slug: mod.slug },
              data: {
                title: mod.title,
                content: DEFAULT_HOMEPAGE_PUCK_DATA,
              },
            });
          } else {
            await prismaClient.page.update({
              where: { slug: mod.slug },
              data: {
                title: mod.title,
              },
            });
          }
        }
      } catch (err) {
        console.warn(`[Ensure Module Pages] Prisma sync error pro ${mod.slug}:`, err);
      }
    }

    // Always maintain dbStore in sync as fallback
    const existingInStore = dbStore.pages.find((p) => p.slug === mod.slug);
    if (!existingInStore) {
      dbStore.pages.push({
        id: `pg-mod-${mod.slug}`,
        slug: mod.slug,
        title: mod.title,
        content: defaultPuckData as any,
        published: true,
        updatedAt: new Date().toISOString(),
      });
      if (!prismaClient) {
        createdCount++;
      }
    } else if (mod.slug === 'home' || mod.slug === 'domu') {
      existingInStore.content = DEFAULT_HOMEPAGE_PUCK_DATA as any;
    }
  }

  const message = `Synchronizace dokončena. Všech ${MENU_MODULE_PAGES.length} modulů z hlavního menu je v databázi. Vytvořeno ${createdCount} nových stránek v Puck Builderu.`;
  console.log(`[Ensure Module Pages] ${message}`);
  return {
    success: true,
    createdCount,
    totalModules: MENU_MODULE_PAGES.length,
    message,
  };
}

export async function convertAllPagesToPuck(): Promise<{ success: boolean; convertedCount: number; totalPages: number; message: string }> {
  // First ensure all module pages exist
  await ensureAllModulePagesExist();

  let convertedCount = 0;
  const prismaClient = isPrismaAvailable() ? getPrismaClient() : null;

  // Helper to convert plain string/HTML/legacy content into Puck Data
  const convertToPuckFormat = (title: string, slug: string, rawContent: any) => {
    if (slug === 'home' || slug === 'domu') {
      return DEFAULT_HOMEPAGE_PUCK_DATA;
    }

    let text = typeof rawContent === 'string' ? rawContent : '';
    if (typeof rawContent === 'object' && rawContent !== null) {
      if (Array.isArray(rawContent.content)) {
        return rawContent;
      }
      text = JSON.stringify(rawContent);
    }

    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Obsah stránky ${title}. Tuto stránku můžete upravit v Puck editoru.`;

    const blocks: any[] = [
      {
        type: 'HeroBlock',
        props: {
          id: `hero-${slug}`,
          title: title || 'Název stránky',
          description: cleanText.length > 200 ? cleanText.substring(0, 200) + '...' : cleanText,
          buttonText: 'Zobrazit více',
          buttonUrl: `#${slug}`,
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: `text-${slug}`,
          text: cleanText,
          align: 'left',
        },
      },
    ];

    if (slug === 'kontakt' || slug === 'advice' || slug === 'poradna') {
      blocks.push({
        type: 'FormBlock',
        props: {
          id: `form-${slug}`,
          formId: `contact-form-${slug}`,
          formName: `Formulář na stránce ${title}`,
          title: 'Kontaktní formulář',
          description: 'Vyplňte váš dotaz a náš tým se vám ozve zpět.',
          fieldsText: 'Jméno a příjmení | text | true\nE-mailová adresa | email | true\nTelefonní číslo | tel | false\nZpráva | textarea | true',
          submitButtonText: 'Odeslat dotaz',
          successMessage: 'Děkujeme za odeslání. Ozveme se vám zpět.',
        },
      });
    } else {
      blocks.push({
        type: 'CallToAction',
        props: {
          id: `cta-${slug}`,
          title: `Potřebujete poradit v oblasti ${title}?`,
          description: 'Navštivte naši bezplatnou poradnu nebo využijte AI Opatrovnického asistenta.',
          buttonText: 'Přejít do poradny',
          buttonUrl: '/advice',
          variant: 'primary',
        },
      });
    }

    return {
      content: blocks,
      root: { props: { title: title || 'Stránka' } },
    };
  };

  // 1. Process Prisma pages
  if (prismaClient) {
    try {
      const dbPages = await prismaClient.page.findMany();
      for (const page of dbPages) {
        let isPuck = false;
        if (page.content && typeof page.content === 'object') {
          const obj = page.content as any;
          if (Array.isArray(obj.content)) {
            isPuck = true;
          }
        } else if (typeof page.content === 'string') {
          try {
            const parsed = JSON.parse(page.content);
            if (parsed && Array.isArray(parsed.content)) {
              isPuck = true;
            }
          } catch (e) {
            isPuck = false;
          }
        }

        if (!isPuck) {
          const puckData = convertToPuckFormat(page.title, page.slug, page.content);
          await prismaClient.page.update({
            where: { id: page.id },
            data: { content: puckData },
          });
          convertedCount++;
        }
      }
    } catch (err) {
      console.warn('[convertAllPagesToPuck] Prisma error:', err);
    }
  }

  // 2. Process dbStore pages
  for (let i = 0; i < dbStore.pages.length; i++) {
    const page = dbStore.pages[i];
    let isPuck = false;
    if (page.content && typeof page.content === 'object' && Array.isArray((page.content as any).content)) {
      isPuck = true;
    } else if (typeof page.content === 'string') {
      try {
        const parsed = JSON.parse(page.content);
        if (parsed && Array.isArray(parsed.content)) {
          isPuck = true;
        }
      } catch (e) {
        isPuck = false;
      }
    }

    if (!isPuck) {
      const puckData = convertToPuckFormat(page.title, page.slug, page.content);
      dbStore.pages[i] = {
        ...page,
        content: puckData as any,
        updatedAt: new Date().toISOString(),
      };
      if (!prismaClient) {
        convertedCount++;
      }
    }
  }

  const totalPages = dbStore.pages.length;
  const message = `Převod stránek dokončen. Celkem ${totalPages} stránek v Puck editoru (převedeno ${convertedCount} nových).`;
  console.log(`[convertAllPagesToPuck] ${message}`);

  return {
    success: true,
    convertedCount,
    totalPages,
    message,
  };
}
