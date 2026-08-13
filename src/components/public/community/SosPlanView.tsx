import React, { useState } from 'react';
import { SeoHead } from '../SeoHead';
import {
  PhoneCall,
  ShieldAlert,
  ArrowLeft,
  CheckSquare,
  Square,
  Printer,
  Download,
  Clock,
  FileText,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Info,
  ChevronRight
} from 'lucide-react';

interface SosPlanViewProps {
  onNavigate: (path: string) => void;
}

export const SosPlanView: React.FC<SosPlanViewProps> = ({ onNavigate }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('sos_checklist_state');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleCheck = (id: string) => {
    const updated = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(updated);
    try {
      localStorage.setItem('sos_checklist_state', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const checklistItems = [
    { id: 'item-1', label: 'Proveden emoční STOP – žádné noční vyčítavé SMS ani telefonáty v afektu.' },
    { id: 'item-2', label: 'Zapnuto Pravidlo 24h – na provokativní zprávu odpovídám až druhý den po zklidnění.' },
    { id: 'item-3', label: 'Komunikace převedena výhradně na písemnou formu (e-mail, SMS, WhatsApp) v BIFF tónu.' },
    { id: 'item-4', label: 'Zálohovány všechny stávající konverzace, fotky s dítětem a doklady o péči na cloud.' },
    { id: 'item-5', label: 'Při bránění ve styku vyhotoven věcný záznam o neuskutečněném předání (datum, čas, svědci, PČR/OSPOD).' },
    { id: 'item-6', label: 'Předán věcný podnět na OSPOD bez emocí a osočování matky, zaměřený na zájem dítěte.' },
    { id: 'item-7', label: 'Konzultován právní postup – vyhodnoceno, zda je nutné předběžné opatření (§ 452 z.ř.s. / § 74 o.s.ř.).' },
    { id: 'item-8', label: 'Založen osobní Opatrovnický spis v portálu Táta má právo.' },
  ];

  return (
    <div className="space-y-8 pb-16">
      <SeoHead
        title="SOS Plán (72h Krizový Algoritmus) • Táta má právo"
        description="4-kroký krizový algoritmus prvních 72 hodin opatrovnického konfliktu: Emoční STOP, BIFF komunikace, evidence a právní obrana."
        canonicalPath="/sos-plan"
      />

      {/* Akutní Krizová Lišta */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg border-b border-red-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 animate-pulse">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wide uppercase">
                  Akutní psychická krizová linka
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white text-red-700 text-[10px] font-black tracking-wider uppercase">
                  116 123 ZDARMA
                </span>
              </div>
              <p className="text-xs text-red-100 font-medium">
                Před jakýmkoliv ukvapeným krokem se nejprve uklidněte a poraďte s odborníkem na lince.
              </p>
            </div>
          </div>
          <a
            href="tel:116123"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-red-700 hover:bg-red-50 font-black text-xs transition-all shadow-md shrink-0 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Volat 116 123</span>
          </a>
        </div>
      </div>

      {/* Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <button
          onClick={() => onNavigate('/krizova-pomoc')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na rozcestník Krizové pomoci</span>
        </button>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-rose-600 font-extrabold text-xs uppercase tracking-wider mb-2">
            <ShieldAlert className="w-5 h-5" />
            <span>Krizový protokol • Algoritmus prvních 72 hodin</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
            SOS Plán: Prvních 72 hodin opatrovnického konfliktu
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            Prvních 3 dnů po vzniku akutního rozchodu, odepření kontaktu s dítětem nebo podání prvních návrhů určuje celou budoucí procesní pozici. Postupujte přesně podle tohoto 4-krokého algoritmu.
          </p>
        </div>
      </div>

      {/* 4 Kroký Algoritmus */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* KROK 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-rose-500" />
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xl shrink-0">
              1
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-rose-600 tracking-widest block">Krok 1</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Emoční STOP & Pravidlo 24h (BIFF Komunikace)
              </h2>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              Při vzniku rozpadu vztahu nebo odepření styku probíhá obrovská emoční bouře. Nejdůležitější zásada zní: <strong>NIKDY NEREAGUJTE V AFEKTU</strong>. Jakákoliv výčitka, vulgární zpráva či vyhrožování bude v budoucnu předloženo u soudu jako důkaz vaší "nestability".
            </p>

            <div className="bg-rose-50/80 rounded-xl p-4 border border-rose-200">
              <h4 className="font-bold text-rose-900 text-xs sm:text-sm mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-600" />
                <span>Pravidlo odložení odpovědi o 24 hodin</span>
              </h4>
              <p className="text-xs text-rose-800">
                Dostanete-li útočnou či provokativní SMS/e-mail, neodpovídejte okamžitě. Dýchejte, odložte telefon a odpovězte až po 24 hodinách, až opadne nejhorší emoce.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm mb-3">
                Metodika BIFF Komunikace (Podle Billa Eddyho):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <strong className="text-indigo-600 block mb-1">B – Brief (Stručně)</strong>
                  <span className="text-xs text-slate-600">Max. 2–4 věty. Žádné dlouhé slohové práce, výčitky z minulosti ani vysvětlování.</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <strong className="text-indigo-600 block mb-1">I – Informative (Informativně)</strong>
                  <span className="text-xs text-slate-600">Pouze fakta o dítěti (čas, kroužky, zdraví), nikoliv dojmy, emoce či hodnocení druhého.</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <strong className="text-indigo-600 block mb-1">F – Friendly (Slušně)</strong>
                  <span className="text-xs text-slate-600">Zdvořilý a klidný tón. "Dobrý den", "Děkuji za zprávu", "Přeji pěkný den". Žádná ironie.</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <strong className="text-indigo-600 block mb-1">F – Firm (Rázně)</strong>
                  <span className="text-xs text-slate-600">Jasná stanoviska, stanovené termíny pro vyjádření a konstruktivní návrhy.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KROK 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xl shrink-0">
              2
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block">Krok 2</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Okamžitá evidence & Postupy při odepření styku
              </h2>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              V opatrovnickém řízení nerozhodují pocity, ale <strong>prokazatelná fakta a časová posloupnost</strong>. Od prvního dně vytvářejte svůj osobní opatrovnický spis.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-extrabold text-slate-900 text-xs mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>1. Záloha komunikace & Fotodokumentace</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                  <li>Pravidelně zálohujte snímky obrazovek (screenshoty) SMS, WhatsApp a e-mailů.</li>
                  <li>Ukládejte fotky a videa z aktivně stráveného času s dítětem (výlety, lékař, škola).</li>
                  <li>Uchovávejte doklady o úhradách nákupů, kroužků a oblečení pro dítě.</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-extrabold text-slate-900 text-xs mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>2. Postup při nepředání dítěte</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                  <li><strong>Nikdy nevyvolávejte scénu</strong> před dítětem. Když matka nepředá dítě, zůstaňte v klidu.</li>
                  <li>Pořiďte písemný záznam (čas, místo, přítomní svědci).</li>
                  <li>Zašlete slušnou SMS: <i>"Jsem na místě předání, dítě nebylo předáno. Prosím o náhradní termín."</i></li>
                  <li>Při opakovaném zamezení vyrozumějte OSPOD nebo Policii ČR ke sepsání úředního záznamu bez konfliktů.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* KROK 3 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xl shrink-0">
              3
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-700 tracking-widest block">Krok 3</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Kontaktování OSPOD (Věcný podnět bez očerňování)
              </h2>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              Orgán sociálně-právní ochrany dětí (OSPOD) je u soudu jmenován opatrovníkem dítěte. Váš první podnět určuje, jak vás klíčová pracovnice vnímá.
            </p>

            <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
              <h4 className="font-extrabold text-amber-950 text-xs sm:text-sm mb-2">
                Zlatá pravidla jednání s OSPOD:
              </h4>
              <ul className="space-y-2 text-xs text-amber-900">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Konstruktivní tón:</strong> Nezahajujte konverzaci útoky na matku. Prezentujte se jako odpovědný, milující otec.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Důraz na zájem dítěte:</strong> Mluvte o potřebě dítěte mít oba rodiče, o jeho denním režimu, škole a zájmech.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Písemný podnět:</strong> Veškerá podání a žádosti na OSPOD podávejte písemně a vyžádejte si potvrzení o doručení.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* KROK 4 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xl shrink-0">
              4
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-700 tracking-widest block">Krok 4</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Právní obrana: Předběžné opatření vs. Standardní návrh
              </h2>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              Správná volba právního nástroje je zásadní. Volte podle toho, zda dochází k akutnímu ohrožení, nebo zakládáte standardní opatrovnické řízení.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-extrabold text-[10px] uppercase block mb-2 w-max">
                  Akutní stav
                </span>
                <strong className="text-slate-900 text-sm block mb-1">Předběžné opatření (§ 452 z.ř.s. / § 74 o.s.ř.)</strong>
                <p className="text-xs text-slate-600 leading-normal">
                  Podává se při zcela akutním zamezení styku, únosu dítěte či riziku ohrožení zdraví. Soud o něm rozhoduje velmi rychle (do 7 dnů resp. 24 hodin), vyžaduje však silné osvědčení naléhavé potřeby.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-extrabold text-[10px] uppercase block mb-2 w-max">
                  Standardní stav
                </span>
                <strong className="text-slate-900 text-sm block mb-1">Standardní návrh na úpravu péče a výživného</strong>
                <p className="text-xs text-slate-600 leading-normal">
                  Klíčové podání zahajující řádné řízení u opatrovnického soudu (§ 906 o.z.). Zde se navrhuje rovnocenná střídavá péče či široký styk s přesnou úpravou svátků a prázdnin.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Checklist tisk / stažení */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Interaktivní kontrolní seznam</span>
              </div>
              <h3 className="text-2xl font-black text-white">
                Checklist "Prvních 72 hodin opatrovnického konfliktu"
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Zaškrtněte splněné body. Stav se automaticky ukládá v prohlížeči.
              </p>
            </div>

            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Vytisknout / Uložit do PDF</span>
            </button>
          </div>

          <div className="space-y-3">
            {checklistItems.map((item) => {
              const isDone = !!checkedItems[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isDone
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <button className="mt-0.5 text-indigo-400 shrink-0 cursor-pointer">
                    {isDone ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <span className={`text-xs sm:text-sm font-medium ${isDone ? 'line-through opacity-80' : ''}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
