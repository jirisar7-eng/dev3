import React, { useState } from 'react';
import {
  X,
  Eye,
  Sparkles,
  Building2,
  Calendar,
  FileText,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Bot,
  Users,
  DollarSign,
  Activity,
  ChevronRight,
  Scale,
  FileCheck,
  Globe,
  Check,
  Printer,
  Copy,
  Info
} from 'lucide-react';

interface AssociationDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinClick?: () => void;
}

export const AssociationDemoModal: React.FC<AssociationDemoModalProps> = ({
  isOpen,
  onClose,
  onJoinClick
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stanovy' | 'zapis' | 'prohlaseni' | 'tiskova_zprava'>('overview');
  
  // Interactive demo state for CoParent / AI inside Dashboard tab
  const [coparentTab, setCoparentTab] = useState<'calendar' | 'expenses' | 'messages'>('calendar');
  const [simulatedAiAnswer, setSimulatedAiAnswer] = useState<string | null>(null);
  const [isSimulatingAi, setIsSimulatingAi] = useState(false);

  const [copiedDocument, setCopiedDocument] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyText = (docName: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDocument(docName);
    setTimeout(() => setCopiedDocument(null), 2000);
  };

  const handlePrintDocument = (title: string, text: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title} (Ukázkový text)</title>
            <style>
              body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; line-height: 1.6; color: #0f172a; max-width: 800px; margin: 0 auto; }
              h1 { font-size: 20px; text-align: center; margin-bottom: 20px; border-bottom: 2px solid #334155; padding-bottom: 12px; }
              pre { font-family: inherit; white-space: pre-wrap; font-size: 13px; }
              .badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: bold; margin-bottom: 16px; }
            </style>
          </head>
          <body>
            <div className="badge">TÁTA MÁ PRÁVO • OFICIÁLNÍ DOKUMENT (UKÁZKOVÝ TEXT)</div>
            <h1>${title} (Ukázkový text)</h1>
            <pre>${text}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const runAiDemo = (question: string) => {
    setIsSimulatingAi(true);
    setSimulatedAiAnswer(null);
    setTimeout(() => {
      setIsSimulatingAi(false);
      if (question.includes('OSPOD')) {
        setSimulatedAiAnswer('Podle platné metodiky doporučujeme komunikovat výhradně písemně (věcně, stručně, neemočně - pravidlo BIFF). Na schůzce trvejte na vyhotovení písemného zápisu a doložte výpis z CoParenting kalendáře o řádném předávání dítěte.');
      } else {
        setSimulatedAiAnswer('Střídavá péče je dle judikatury Ústavního soudu (II. ÚS 169/16) prioritním modelem. Rozhodující je zájem dítěte a schopnost obou rodičů spolupracovat, nikoliv nesouhlas jednoho z rodičů.');
      }
    }, 800);
  };

  // Text content for document tabs
  const stanovyText = `TÁTA MÁ PRÁVO
Fathers Have Rights • Zapsaný spolek
OFICIÁLNÍ DOKUMENT (UKÁZKOVÝ TEXT) | Projekt na podporu rovnoprávného rodičovství | Web: www.tatamapravo.cz

STANOVY ZAPSANÉHO SPOLKU (UKÁZKOVÝ TEXT)

ČLÁNEK I. ZÁKLADNÍ USTANOVENÍ
1. Název spolku zní: Táta má právo, z. s. (dále jen „spolek“).
2. Název spolku v anglickém jazyce: Fathers Have Rights.
3. Sídlo spolku se nachází v obci: Pardubice
4. Spolek je samosprávný, dobrovolný, nepolitický a neziskový svazek členů, založený za účelem naplňování společného zájmu v souladu s ust. § 214 a násl. zákona č. 89/2012 Sb., občanský zákoník.
5. Spolek je právnickou osobou s samostatnou právní osobností.

ČLÁNEK II. ÚČEL A ČINNOST SPOLKU
1. Hlavním účelem spolku je:
   a) Podpora a rozvoj rovnoprávného rodičovství a rovnocenného zapojení obou rodičů do péče o děti.
   b) Osvěta a zvyšování právního povědomí v oblasti rodinného práva, opatrovnických řízení a práv dětí i rodičů.
   c) Pomoc a podpora rodičům (zejména otcům) v náročných životních a opatrovnických situacích.
   d) Odstraňování společenských a systémových stereotypů v oblasti péče o děti.

2. Předmětem hlavní činnosti spolku k naplňování jeho účelu je zejména:
   a) Vývoj, provoz, údržba a bezplatné zpřístupňování digitálních nástrojů, softwarových aplikací, kalkulaček péče, simulátorů výživného a generátorů právních podání (projekt Táta má právo / Tátova cesta).
   b) Analýza, zpracování a přehledné publikování právních informací, judikatury Ústavního a Nejvyššího soudu a legislativních předpisů.
   c) Publikační, osvětová, vzdělávací a poradenská činnost.
   d) Pořádání odborných i laických seminářů, workshopů, přednášek a diskusních fór.
   e) Zastupování zájmů členů spolku a otců při jednání s orgány veřejné moci a dalšími subjekty.

3. Doplňková (hospodářská) činnost:
   Spolek může vykonávat vedlejší hospodářskou činnost spočívající v podnikání nebo jiné výdělečné činnosti (např. reklamní činnost, propagační služby, prodej předmětů), je-li její účel v podpoře hlavní činnosti nebo v hospodárném využití spolkového majetku. Zisk z činnosti spolku lze použít výhradně pro spolkovou činnost včetně správy spolku.

ČLÁNEK III. ČLENSTVÍ VE SPOLKU
1. Členem spolku se může stát jakákoliv fyzická osoba starší 18 let nebo právnická osoba, která souhlasí se stanovami a účelem spolku.
2. Členství se dělí na:
   a) Řádné členství.
   b) Čestné členství (udělované za mimořádný přínos spolku, bez povinnosti platit členské příspěvky).
3. O přijetí za člena spolku rozhoduje Předseda na základě písemné nebo elektronické přihlášky.

ČLÁNEK IV. ORGÁNY SPOLKU
Orgány spolku jsou:
a) Členská schůze – nejvyšší orgán spolku.
b) Předseda – statutární orgán spolku.

ČLÁNEK VI. STATUTÁRNÍ ORGÁN – PŘEDSEDA
1. Statutárním orgánem spolku je Předseda.
2. Předseda je individuálním statutárním orgánem, který řídí činnost spolku, jednání spolku a zastupuje spolek navenek ve všech věcech samostatně.
3. Funkční období Předsedy je 5 (pět) let.
4. Prvním Předsedou spolku se dnem vzniku spolku stává:
   Jiří Šár, dat. nar. XX.XX.XXXX

V Pardubicích, dne 15.08.2026
Jiří Šár, Zakladatel a první Předseda spolku`;

  const zapisText = `TÁTA MÁ PRÁVO
Fathers Have Rights • Zapsaný spolek
OFICIÁLNÍ DOKUMENT (UKÁZKOVÝ TEXT) | Projekt na podporu rovnoprávného rodičovství | Web: www.tatamapravo.cz

ZÁPIS Z USTAVUJÍCÍ SCHŮZE SPOLKU „Táta má právo, z. s.“ (UKÁZKOVÝ TEXT)

Konané dne: 15. srpna 2026
Místo konání: Online / Pardubice

PŘÍTOMNI ZAKLADATELÉ
1. Jiří Šár, nar. XX.XX.XXXX
2. Zakladatel 2
3. Zakladatel 3

PROGRAM JEDNÁNÍ
1. Zahájení a schválení programu.
2. Schválení stanov spolku „Táta má právo, z. s.“.
3. Volba statutárního orgánu spolku (Předsedy).
4. Pověření k podání návrhu na zápis do spolkového rejstříku.

PRŮBĚH JEDNÁNÍ A USNESENÍ

K bodu 1: Zahájení a schválení programu
Účastníci zvolili předsedajícím ustavující schůze Jiřího Šára.
Hlasování: Pro: 3 | Proti: 0 | Zdržel se: 0
Usnesení bylo přijato.

K bodu 2: Schválení stanov spolku
Předsedající předložil návrh stanov spolku. Zakladatelé si stanovy přečetli a projednali je. Zakladatelé jednomyseľně schvalují stanovy spolku „Táta má právo, z. s.“.
Hlasování: Pro: 3 | Proti: 0 | Zdržel se: 0
Usnesení bylo přijato.

K bodu 3: Volba statutárního orgánu spolku
Na funkci Předsedy (statutárního orgánu spolku) byl navržen Jiří Šár, nar. XX.XX.XXXX. Předsedou spolku na funkční období 5 let byl zvolen Jiří Šár, který volbu přijal.
Hlasování: Pro: 3 | Proti: 0 | Zdržel se: 0
Usnesení bylo přijato.

K bodu 4: Pověření k podání návrhu na zápis
Zakladatelé pověřují Jiřího Šára k podání návrhu na zápis spolku do spolkového rejstříku a ke všem úkonům s tím spojeným.
Hlasování: Pro: 3 | Proti: 0 | Zdržel se: 0
Usnesení bylo přijato.

Podpisy zakladatelů:
Jiří Šár (Zakladatel a zvolený Předseda)`;

  const prohlaseniText = `TÁTA MÁ PRÁVO
Fathers Have Rights • Zapsaný spolek
OFICIÁLNÍ DOKUMENT (UKÁZKOVÝ TEXT) | Projekt na podporu rovnoprávného rodičovství | Web: www.tatamapravo.cz

ČESTNÉ PROHLÁŠENÍ A SOUHLAS SE ZÁPISEM DO VEŘEJNÉHO REJSTŘÍKU (UKÁZKOVÝ TEXT)

Já, níže podepsaný:
Jméno a příjmení: Jiří Šár
Datum narození: XX.XX.XXXX
Trvalé bydliště: [Pardubice]

tímto v souladu s příslušnými ustanoveními zákona č. 89/2012 Sb., občanský zákoník, a zákona č. 304/2013 Sb., o veřejných rejstřících, čestně prohlašuji, že:

✓ Uděluji svůj výslovný souhlas se zvolením a zapsáním své osoby do spolkového rejstříku jako statutární orgán – Předseda spolku „Táta má právo, z. s.“.
✓ Jsem plně svéprávný a dosáhl jsem věku 18 let.
✓ Splňuji všechny zákonné podmínky pro výkon funkce statutárního orgánu podle právního řádu České republiky.
✓ U mé osoby nenastala žádná skutečnost, která by tvořila překážku výkonu funkce statutárního orgánu podle § 46 a násl. zákona č. 90/2012 Sb.
✓ Nebyl mi uložen zákaz činnosti odpovídající funkci statutárního orgánu ani mi nebyl uložen trest nebo kárné opatření.

V Pardubicích, dne 15.08.2026
Jiří Šár
Předseda spolku Táta má právo, z. s.

* Podepisujte až před pracovníkem Czech POINTu pro úřední ověření podpisu.

CO UDĚLAT PO VYTIŠTĚNÍ:
1. Dopište do textu svou přesnou adresu trvalého bydliště.
2. Zajděte na nejbližší Czech POINT (pošta, úřad) pro úřední ověření podpisu (poplatek cca 50 Kč).
3. Na místě před pracovníkem dokument podepíšete a doplňte aktuální datum a místo.
4. Na téže přepážce požádejte o autorizovanou konverzi tohoto listu do elektronického PDF (zašlou do Úschovny nebo nahrají na flash disk) – toto PDF pak přiložíte k online podání na rejstříkový soud.`;

  const tiskovaZpravaText = `TÁTA MÁ PRÁVO
Fathers Have Rights • Zapsaný spolek
TISKOVÁ ZPRÁVA (UKÁZKOVÝ TEXT) | Projekt na podporu rovnoprávného rodičovství | Web: www.tatamapravo.cz

TISKOVÁ ZPRÁVA (UKÁZKOVÝ TEXT)
Táta má právo představuje nový digitální portál pro otce a rodiny
Pardubice, 15. srpna 2026

Projekt Táta má právo představuje svůj nový digitální portál, jehož cílem je nabídnout otcům a rodinám přehledné místo pro informace, vzdělávání, práci s dokumenty a praktickou orientaci v náročných životních situacích spojených zejména s rodičovstvím, péčí o děti a rodinnými spory.

OD VEŘEJNÝCH INFORMACÍ AŽ PO OSOBNÍ PROSTOR
Portál je rozdělen na veřejnou a zabezpečenou část. Veřejnost může využívat informační a vzdělávací obsah, články, FAQ, studijní materiály, videotéku, wiki, právní a legislativní informace, statistiky či další materiály.
Registrovaní uživatelé získávají vlastní zabezpečený prostor pro spravování profilu, dokumentů a osobních informací.

OSOBNÍ SPIS OTCE („Můj případ“)
• Přehled případu
• Evidence dětí
• Kalendář péče
• Dokumenty
• Osobní deník
• Evidence komunikace a událostí
• Soud a OSPOD
• Úkoly
• Katalog důkazů
• Časová osa případu

VZDĚLÁVÁNÍ, ZNALOSTI A SPOLURODIČOVSTVÍ
Projekt buduje vzdělávací část portálu (knihovna studií, články, wiki, videotéka). Součástí je také modul CoParent pro organizaci komunikace a praktických záležitostí s důrazem na strukturovanost, dohledatelnost a ochranu soukromí.

BEZPEČNOST A OCHRANA OSOBNÍCH ÚDAJŮ
Řízení přístupů podle rolí a oprávnění, auditní záznamy, 2FA, podpora passkeys a mechanismy pro ochranu osobních údajů.

Kontakt pro média:
Táta má právo • Web: tatovacesta.cz • E-mail: jirisar@tatovacesta.cz`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white flex items-start justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 space-y-1.5 pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
              <Eye className="w-3.5 h-3.5 text-indigo-300" />
              <span>Interaktivní ukázkový režim spolku & portálu</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              Táta má právo, z.s. <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">ŽIVÉ DEMO</span>
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100/80 max-w-2xl leading-relaxed">
              Prohlédněte si přehledný Dashboard spolku i oficiální zakladatelské dokumenty a tiskovou zprávu připravené k registrace z.s.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors shrink-0 relative z-10 cursor-pointer"
            aria-label="Zavřít"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs Bar - Explicitly styled as requested */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-sm border border-indigo-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Dashboard spolku</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stanovy')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'stanovy'
                ? 'bg-indigo-600 text-white shadow-sm border border-indigo-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Stanovy spolku</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('zapis')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'zapis'
                ? 'bg-indigo-600 text-white shadow-sm border border-indigo-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Zápis z ustavující schůze</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prohlaseni')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'prohlaseni'
                ? 'bg-indigo-600 text-white shadow-sm border border-indigo-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Čestné prohlášení & Souhlas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tiskova_zprava')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'tiskova_zprava'
                ? 'bg-indigo-600 text-white shadow-sm border border-indigo-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Tisková zpráva</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="bg-slate-50 flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          
          {/* TAB 1: DASHBOARD / OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Transparentní účet</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono">284 500 Kč</div>
                  <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    <span>+15.2% tento měsíc (dary)</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Aktivní tátové & rodiny</span>
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono">1 420+</div>
                  <div className="text-[11px] text-indigo-600 font-medium">Registrovaných v portálu</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Vyřešené AI dotazy</span>
                    <Bot className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono">18 940</div>
                  <div className="text-[11px] text-purple-600 font-medium">Analýz & BIFF zpráv</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Zakládající členové</span>
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono">12 / 20</div>
                  <div className="text-[11px] text-amber-600 font-medium">Volná zakladatelská místa</div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: STANOVY SPOLKU */}
          {activeTab === 'stanovy' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Stanovy zapsaného spolku</h3>
                    <p className="text-xs text-slate-500">Táta má právo, z. s. • Podle § 214 a násl. občanského zákoníku</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyText('stanovy', stanovyText)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                  >
                    {copiedDocument === 'stanovy' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDocument === 'stanovy' ? 'Zkopírováno' : 'Kopírovat'}</span>
                  </button>

                  <button
                    onClick={() => handlePrintDocument('Stanovy spolku Táta má právo, z. s.', stanovyText)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Tisknout / PDF</span>
                  </button>
                </div>
              </div>

              {/* Formatted View of Stanovy */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                <div className="border-b border-slate-200 pb-4 text-center">
                  <span className="text-xs uppercase tracking-widest text-indigo-600 font-bold block mb-1">Oficiální dokument spolku • UKÁZKOVÝ TEXT</span>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">STANOVY ZAPSANÉHO SPOLKU <span className="text-sm text-amber-600 font-semibold font-mono block sm:inline mt-1 sm:mt-0">(Ukázkový text)</span></h1>
                  <h2 className="text-lg font-bold text-indigo-700 mt-1">„Táta má právo, z. s.“</h2>
                  <p className="text-xs text-slate-500 mt-2">Fathers Have Rights • Sídlo: Pardubice</p>
                </div>

                <div className="space-y-5">
                  <section className="space-y-2">
                    <h3 className="text-base font-bold text-slate-900 text-indigo-900 border-l-4 border-indigo-600 pl-3">ČLÁNEK I. ZÁKLADNÍ USTANOVENÍ</h3>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1">
                      <li><strong>Název spolku zní:</strong> Táta má právo, z. s. (dále jen „spolek“).</li>
                      <li><strong>Název spolku v anglickém jazyce:</strong> Fathers Have Rights.</li>
                      <li><strong>Sídlo spolku se nachází v obci:</strong> Pardubice</li>
                      <li>Spolek je samosprávný, dobrovolný, nepolitický a neziskový svazek členů, založený za účelem naplňování společného zájmu v souladu s ust. § 214 a násl. zákona č. 89/2012 Sb., občanský zákoník.</li>
                      <li>Spolek je právnickou osobou s samostatnou právní osobností.</li>
                    </ol>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-slate-100">
                    <h3 className="text-base font-bold text-slate-900 text-indigo-900 border-l-4 border-indigo-600 pl-3">ČLÁNEK II. ÚČEL A ČINNOST SPOLKU</h3>
                    <div className="space-y-2">
                      <p><strong>1. Hlavním účelem spolku je:</strong></p>
                      <ul className="list-disc list-inside space-y-1 pl-4 text-slate-700">
                        <li>Podpora a rozvoj rovnoprávného rodičovství a rovnocenného zapojení obou rodičů do péče o děti.</li>
                        <li>Osvěta a zvyšování právního povědomí v oblasti rodinného práva, opatrovnických řízení a práv dětí i rodičů.</li>
                        <li>Pomoc a podpora rodičům (zejména otcům) v náročných životních a opatrovnických situacích.</li>
                        <li>Odstraňování společenských a systémových stereotypů v oblasti péče o děti.</li>
                      </ul>
                      <p className="pt-2"><strong>2. Předmětem hlavní činnosti spolku je zejména:</strong></p>
                      <ul className="list-disc list-inside space-y-1 pl-4 text-slate-700">
                        <li>Vývoj, provoz, údržba a bezplatné zpřístupňování digitálních nástrojů, softwarových aplikací, kalkulaček péče, simulátorů výživného a generátorů právních podání (projekt Táta má právo / Tátova cesta).</li>
                        <li>Analýza, zpracování a přehledné publikování právních informací, judikatury Ústavního a Nejvyššího soudu.</li>
                        <li>Publikační, osvětová, vzdělávací a poradenská činnost.</li>
                      </ul>
                    </div>
                  </section>

                  <section className="space-y-2 pt-3 border-t border-slate-100">
                    <h3 className="text-base font-bold text-slate-900 text-indigo-900 border-l-4 border-indigo-600 pl-3">ČLÁNEK VI. STATUTÁRNÍ ORGÁN – PŘEDSEDA</h3>
                    <p>Statutárním orgánem spolku je Předseda. Prvním Předsedou spolku se dnem vzniku spolku stává:</p>
                    <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl font-medium text-indigo-950">
                      Jiří Šár, dat. nar. XX.XX.XXXX
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ZÁPIS Z USTAVUJÍCÍ SCHŮZE */}
          {activeTab === 'zapis' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Zápis z ustavující schůze spolku</h3>
                    <p className="text-xs text-slate-500">Založení spolku, schválení stanov a volba statutárního orgánu</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyText('zapis', zapisText)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                  >
                    {copiedDocument === 'zapis' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDocument === 'zapis' ? 'Zkopírováno' : 'Kopírovat'}</span>
                  </button>

                  <button
                    onClick={() => handlePrintDocument('Zápis z ustavující schůze spolku Táta má právo, z. s.', zapisText)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Tisknout / PDF</span>
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <div className="border-b border-slate-200 pb-4 text-center">
                  <span className="text-xs uppercase tracking-widest text-purple-600 font-bold block mb-1">Zápis ustavujícího orgánu • UKÁZKOVÝ TEXT</span>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">ZÁPIS Z USTAVUJÍCÍ SCHŮZE SPOLKU <span className="text-sm text-amber-600 font-semibold font-mono block sm:inline mt-1 sm:mt-0">(Ukázkový text)</span></h1>
                  <h2 className="text-base font-bold text-indigo-700 mt-1">„Táta má právo, z. s.“</h2>
                  <p className="text-xs text-slate-500 mt-1">Konané dne: 15. srpna 2026 • Místo: Online / Pardubice</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-purple-700">PŘÍTOMNI ZAKLADATELÉ</h4>
                    <p className="text-slate-800 font-medium">Jiří Šár, nar. XX.XX.XXXX (Předseda ustavující schůze)</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm border-l-4 border-purple-600 pl-3">PRŮBĚH JEDNÁNÍ A HODNOCENÍ USNESENÍ</h4>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block text-xs">K bodu 1: Zahájení a schválení programu</span>
                      <p className="text-xs text-slate-600">Účastníci zvolili předsedajícím ustavující schůze Jiřího Šára.</p>
                      <div className="text-[11px] font-mono text-emerald-700 font-bold pt-1">Hlasování: Pro: 3 | Proti: 0 | Zdržel se: 0 • USNESENÍ PŘIJATO</div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block text-xs">K bodu 2: Schválení stanov spolku „Táta má právo, z. s.“</span>
                      <p className="text-xs text-slate-600">Zakladatelé jednomyseľně schvalují navržené stanovy spolku.</p>
                      <div className="text-[11px] font-mono text-emerald-700 font-bold pt-1">Hlasování: Pro: 3 | Proti: 0 | Zdržel se: 0 • USNESENÍ PŘIJATO</div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block text-xs">K bodu 3: Volba statutárního orgánu spolku</span>
                      <p className="text-xs text-slate-600">Předsedou spolku na funkční období 5 let byl zvolen <strong>Jiří Šár, nar. XX.XX.XXXX</strong>, který volbu přijal.</p>
                      <div className="text-[11px] font-mono text-emerald-700 font-bold pt-1">Hlasování: Pro: 3 | Proti: 0 | Zdržel se: 0 • USNESENÍ PŘIJATO</div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block text-xs">K bodu 4: Pověření k podání návrhu na zápis</span>
                      <p className="text-xs text-slate-600">Zakladatelé pověřují Jiřího Šára k podání návrhu na zápis spolku do spolkového rejstříku.</p>
                      <div className="text-[11px] font-mono text-emerald-700 font-bold pt-1">Hlasování: Pro: 3 | Proti: 0 | Zdržel se: 0 • USNESENÍ PŘIJATO</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ČESTNÉ PROHLÁŠENÍ & SOUHLAS */}
          {activeTab === 'prohlaseni' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Čestné prohlášení & Souhlas se zápisem</h3>
                    <p className="text-xs text-slate-500">Úřední doklad pro Městský soud v Praze / Czech POINT</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyText('prohlaseni', prohlaseniText)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                  >
                    {copiedDocument === 'prohlaseni' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDocument === 'prohlaseni' ? 'Zkopírováno' : 'Kopírovat'}</span>
                  </button>

                  <button
                    onClick={() => handlePrintDocument('Čestné prohlášení statutárního orgánu spolku', prohlaseniText)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Tisknout / PDF</span>
                  </button>
                </div>
              </div>

              {/* Guide box for Czech POINT */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs text-amber-950">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Info className="w-4 h-4 text-amber-700" />
                  <span>CO UDĚLAT PO VYTIŠTĚNÍ DOKUMENTU:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-amber-900 pl-1">
                  <li>Dopište do textu svou přesnou adresu trvalého bydliště.</li>
                  <li>Zajděte na nejbližší <strong>Czech POINT</strong> (pošta, úřad) pro úřední ověření podpisu (poplatek cca 50 Kč).</li>
                  <li>Na místě před pracovníkem dokument podepíšete a doplňte aktuální datum a místo.</li>
                  <li>Na téže přepážce požádejte o <strong>autorizovanou konverzi</strong> tohoto listu do elektronického PDF (zašlou do Úschovny nebo nahrají na flash disk) – toto PDF pak přiložíte k online podání na rejstříkový soud.</li>
                </ol>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <div className="border-b border-slate-200 pb-4 text-center">
                  <span className="text-xs uppercase tracking-widest text-amber-600 font-bold block mb-1">Úřední doklad • UKÁZKOVÝ TEXT</span>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">ČESTNÉ PROHLÁŠENÍ A SOUHLAS SE ZÁPISEM DO VEŘEJNÉHO REJSTŘÍKU <span className="text-sm text-amber-600 font-semibold font-mono block sm:inline mt-1 sm:mt-0">(Ukázkový text)</span></h1>
                </div>

                <div className="space-y-3">
                  <p><strong>Já, níže podepsaný:</strong></p>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 font-mono text-xs text-slate-900">
                    <div><strong>Jméno a příjmení:</strong> Jiří Šár</div>
                    <div><strong>Datum narození:</strong> XX.XX.XXXX</div>
                    <div><strong>Trvalé bydliště:</strong> [Pardubice]</div>
                  </div>

                  <p className="pt-2">tímto v souladu s § 89/2012 Sb., občanský zákoník, a § 304/2013 Sb., o veřejných rejstřících, <strong>čestně prohlašuji, že:</strong></p>

                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-950">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Uděluji svůj výslovný souhlas</strong> se zvolením a zapsáním své osoby do spolkového rejstříku jako statutární orgán – Předseda spolku „Táta má právo, z. s.“.</span>
                    </li>
                    <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Jsem plně svéprávný a dosáhl jsem věku 18 let.</span>
                    </li>
                    <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Splňuji všechny zákonné podmínky pro výkon funkce statutárního orgánu podle právního řádu ČR.</span>
                    </li>
                    <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>U mé osoby nenastala žádná skutečnost, která by tvořila překážku výkonu funkce statutárního orgánu podle § 46 a násl. zákona č. 90/2012 Sb. ani mi nebyl uložen zákaz činnosti.</span>
                    </li>
                  </ul>

                  <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-4 text-xs font-mono">
                    <div>
                      <p>V Pardubicích, dne 15.08.2026</p>
                    </div>
                    <div className="border-t border-dashed border-slate-400 pt-2 text-center w-full sm:w-64">
                      <p className="text-slate-900 font-bold font-sans">Jiří Šár</p>
                      <p className="text-[10px] text-slate-500 font-sans">Předseda spolku Táta má právo, z. s.</p>
                      <p className="text-[9px] text-amber-700 italic font-sans pt-1">* Podepisujte až před pracovníkem Czech POINTu.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TISKOVÁ ZPRÁVA */}
          {activeTab === 'tiskova_zprava' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Tisková zpráva projektu</h3>
                    <p className="text-xs text-slate-500">Představení digitálního portálu pro otce a rodiny (15. srpna 2026)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyText('tiskovka', tiskovaZpravaText)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                  >
                    {copiedDocument === 'tiskovka' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDocument === 'tiskovka' ? 'Zkopírováno' : 'Kopírovat'}</span>
                  </button>

                  <button
                    onClick={() => handlePrintDocument('Tisková zpráva - Táta má právo', tiskovaZpravaText)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Tisknout / PDF</span>
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <div className="border-b border-slate-200 pb-4">
                  <span className="text-xs uppercase tracking-widest text-blue-600 font-bold block mb-1">TISKOVÁ ZPRÁVA • UKÁZKOVÝ TEXT</span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Táta má právo představuje nový digitální portál pro otce a rodiny <span className="text-sm text-amber-600 font-semibold font-mono block sm:inline mt-1 sm:mt-0">(Ukázkový text)</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-2 font-mono">Pardubice, 15. srpna 2026</p>
                </div>

                <div className="space-y-4">
                  <p className="text-slate-800 font-medium leading-relaxed">
                    Projekt Táta má právo představuje svůj nový digitální portál, jehož cílem je nabídnout otcům a rodinám přehledné místo pro informace, vzdělávání, práci s dokumenty a praktickou orientaci v náročných životních situacích spojených zejména s rodičovstvím, péčí o děti a rodinnými spory.
                  </p>

                  <section className="space-y-2 pt-2 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm border-l-4 border-blue-600 pl-3">OD VEŘEJNÝCH INFORMACÍ AŽ PO OSOBNÍ PROSTOR</h3>
                    <p className="text-xs text-slate-600">
                      Portál je rozdělen na veřejnou a zabezpečenou část. Veřejnost může využívat informační a vzdělávací obsah, články, FAQ, studijní materiály, videotéku, wiki a právní informace.
                    </p>
                  </section>

                  <section className="space-y-2 pt-2 border-t border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm border-l-4 border-blue-600 pl-3">OSOBNÍ SPIS OTCE („Můj případ“)</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs font-semibold">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">• Přehled případu</div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">• Evidence dětí</div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">• Kalendář péče</div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">• Dokumenty</div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">• Osobní deník</div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">• Evidence komunikace</div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">• Soud a OSPOD</div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">• Katalog důkazů</div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">• Časová osa případu</div>
                    </div>
                  </section>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-950 italic">
                    „Chceme, aby člověk v těžké životní situaci nemusel mít deset různých složek, aplikací a webů, aby si dokázal dát dohromady vlastní informace. Naším cílem je vytvořit jedno místo, kde bude mít své informace, dokumenty a vzdělávání přehledně pohromadě.“
                    <span className="block font-bold not-italic text-blue-900 mt-2">— Táta má právo</span>
                  </div>

                  <div className="pt-4 border-t border-slate-200 text-xs text-slate-600">
                    <p><strong>Kontakt pro média:</strong> Táta má právo • Web: tatovacesta.cz • E-mail: jirisar@tatovacesta.cz</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Portál a spolek fungují v transparentním neziskovém režimu pro podporu rodičů a dětí.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer w-full sm:w-auto text-center"
            >
              Zavřít ukázkový režim
            </button>

            {onJoinClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onJoinClick();
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer w-full sm:w-auto"
              >
                <span>Chci se stát zakládajícím členem</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
