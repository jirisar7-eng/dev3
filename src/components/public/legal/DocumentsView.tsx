import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  School,
  Building2,
  FileCode,
  ArrowRight,
  Eye
} from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface DocumentsViewProps {
  onNavigate?: (path: string) => void;
}

interface DocTemplate {
  id: string;
  title: string;
  category: string;
  lawsCited: string;
  description: string;
  contentPreview: string;
  aiFormId?: string;
}

const DOCUMENT_TEMPLATES: DocTemplate[] = [
  {
    id: 'doc-stridava-pece',
    title: '1. Návrh na zahájení řízení o úpravě péče (Střídavá péče)',
    category: 'Péče & Výživné',
    lawsCited: '§ 855–§ 927 o.z. • § 466–§ 507 z.ř.s.',
    description: 'Oficiální podání opatrovnickému soudu na svěření nezletilého dítěte do střídavé péče obou rodičů s úpravou výživného.',
    contentPreview: `Okresní soud v [Město]
Navrhovatel (otec): [Jméno, příjmení, nar., bytem]
Odpůrkyně (matka): [Jméno, příjmení, bytem]
Nezletilé dítě: [Jméno, příjmení, nar.]

NÁVRH NA ÚPRAVU PÉČE A VÝŽIVNÉHO NEZLETILÉHO DÍTĚTE

I. Poměry nezletilého a rodičů...
II. Právní odůvodnění podle § 855 o.z. a judikatury Ústavního soudu (I. ÚS 2482/13)...
III. Petitum: Dítě se svěřuje do střídavé péče v cyklu jednoho týdne.`,
    aiFormId: 'stridava-pece'
  },
  {
    id: 'doc-predbezne-opatreni',
    title: '2. Návrh na vydání předběžného opatření při odepření styku',
    category: 'Urgentní podání',
    lawsCited: '§ 452 z.ř.s. • § 74 a násl. o.s.ř.',
    description: 'Naléhavý návrh soudu při akutním maření kontaktu s dítětem ze strany druhého rodiče se žádostí o okamžité rozhodnutí.',
    contentPreview: `Okresní soud v [Město]
NÁVRH NA VYDÁNÍ PŘEDBĚŽNÉHO OPATŘENÍ PODLE § 452 Z.Ř.S.

I. Naléhavost situace: Od [Datum] matka bezdůvodně odepřela kontakt otce s dítětem.
II. Důkazy o maření styku: Písemná komunikace, zprávy OSPOD.
III. Návrh usnesení: Matka je povinna předat dítě otci každý sudý týden v ptek v 16:00.`,
    aiFormId: 'predbezne-opatreni'
  },
  {
    id: 'doc-vyjadreni-ospod',
    title: '3. Vyjádření rodiče k podnětu OSPOD a návrhu matky',
    category: 'Stanoviska',
    lawsCited: 'Zákon č. 359/1999 Sb. (zOSPOD) • § 888 o.z.',
    description: 'Věcné stanovisko pro opatrovnický soud a OSPOD vyvracející nepravdivá tvrzení druhého rodiče.',
    contentPreview: `Okresní soud v [Město] / OSPOD [Město]
Spisová značka: [Spisová značka]

VYJÁDŘENÍ OTCE K PODNĚTU OSPOD A NÁVRHU MATKY

I. Uvedení skutečností na pravou míru ohledně bytového zázemí a časové flexibility otce.
II. Deklarace připravenosti k dohodě a rovnocenné péči.`,
    aiFormId: 'vyjadreni-ospod'
  },
  {
    id: 'doc-nahlednuti-spis',
    title: '4. Žádost o nahlédnutí do opatrovnického spisu a pořízení kopií',
    category: 'Soudní úkony',
    lawsCited: '§ 44 o.s.ř.',
    description: 'Žádost účastníka řízení o nahlédnutí do soudního spisu a pořízení fotokopií nově doručených zpráv OSPOD a znaleckých posudků.',
    contentPreview: `Okresní soud v [Město]
Spisová značka: [Spisová značka]

ŽÁDOST O NAHLÉDNUTÍ DO SPISU PODLE § 44 O.S.Ř.

Jako účastník řízení žádám o umožnění nahlédnutí do spisu sp. zn. [Spisová značka] a pořízení fotokopií všech listin.`,
    aiFormId: 'nahlednuti-spis'
  },
  {
    id: 'doc-zadost-skola',
    title: '5. Žádost pro mateřskou / základní školu o informace o dítěti',
    category: 'Informace & Školy',
    lawsCited: '§ 885 o.z. • § 21 školského zákona č. 561/2004 Sb.',
    description: 'Oficiální výzva řediteli školy k zpřístupnění školního informačního systému (Bakaláři/EduPage) a zasílání zpráv o prospěchu.',
    contentPreview: `Ředitelství školy: [Název školy]
Rodič: [Jméno otce, nar., bytem]
Nezletilé dítě: [Jméno dítěte, třída]

ŽÁDOST O POSKYTOVÁNÍ INFORMACÍ O VZDĚLÁVÁNÍ DÍTĚTE PODLE § 885 O.Z.

Jako rodič se plnou rodičovskou odpovědností žádám podle § 885 o.z. a § 21 školského zákona o zřízení přístupu do školního portálu a poskytování informací.`,
    aiFormId: 'zadost-skola'
  },
  {
    id: 'doc-zadost-lekar',
    title: '6. Žádost pro pediatra o poskytování zdravotnických informací',
    category: 'Lékaři & Zdraví',
    lawsCited: '§ 885 o.z. • Zákon o zdravotních službách č. 372/2011 Sb.',
    description: 'Žádost ošetřujícímu lékaři/pediatrovi o nahlížení do zdravotnické dokumentace dítěte a zasílání informací o očkování a zdravotním stavu.',
    contentPreview: `Ordinace praktického lékaře pro děti a dorost: [Jméno lékaře]
Nezletilé dítě: [Jméno dítěte, nar.]

ŽÁDOST O POSKYTOVÁNÍ ZDRAVOTNÍCH INFORMACÍ A NAHLÍŽENÍ DO DOKUMENTACE

Žádám o zpřístupnění zdravotní dokumentace nezletilého dítěte podle § 885 o.z. a zákona o zdravotních službách.`,
    aiFormId: 'zadost-lekar'
  },
  {
    id: 'doc-exekuce-styku',
    title: '7. Návrh na výkon rozhodnutí (uložení pokuty za maření styku)',
    category: 'Výkon rozhodnutí',
    description: 'Soudní návrh podle § 500 z.ř.s. na uložení pokuty až 50.000 Kč druhému rodiči za opakované nepředání dítěte.',
    lawsCited: '§ 500–§ 510 z.ř.s. • § 272 o.s.ř.',
    contentPreview: `Okresní soud v [Město]
Spisová značka: [Spisová značka]

NÁVRH NA VÝKON ROZHODNUTÍ ULOŽENÍM POKUTY PODLE § 500 Z.Ř.S.

I. Povinná matka opakovaně zmařila předání dítěte ve dnech [Data nepředání].
II. Návrh na uložení pokuty ve výši 10.000 Kč povinné.`,
    aiFormId: 'exekuce-styku'
  }
];

export const DocumentsView: React.FC<DocumentsViewProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocTemplate | null>(null);

  const filteredDocs = DOCUMENT_TEMPLATES.filter((doc) => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.lawsCited.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopyText = (doc: DocTemplate) => {
    navigator.clipboard.writeText(doc.contentPreview);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Knihovna Vzorů Právních Dokumentů & Žádostí • Táta má právo"
        description="Kompletní vzory právních подání k opatrovnickému soudu, OSPOD, školám a lékařům. Propojeno s AI Generátorem pro okamžité automatické předvyplnění."
        canonicalPath="/dokumenty"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-400/30 mb-3">
              <FileText className="w-3.5 h-3.5 text-indigo-400" /> Oficiální Vzory & Žádosti MS ČR
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Knihovna Vzorů Právních Podání
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Vyberte si prověřený vzor návrhu na střídavou péči, předběžného opatření nebo žádosti pro školu a generujte jej automaticky s vašimi daty.
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('/ai-formulare')}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Otevřít AI Generátor Podání</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat vzor, školu, pokutu..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Všechny vzory
            </button>
            <button
              onClick={() => setSelectedCategory('Péče & Výživné')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'Péče & Výživné' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Péče & Výživné
            </button>
            <button
              onClick={() => setSelectedCategory('Informace & Školy')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'Informace & Školy' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Školy & Lékaři
            </button>
            <button
              onClick={() => setSelectedCategory('Urgentní podání')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedCategory === 'Urgentní podání' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Předběžná opatření
            </button>
          </div>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDocs.map((doc) => {
          const isCopied = copiedId === doc.id;

          return (
            <div
              key={doc.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-extrabold border border-indigo-200">
                    {doc.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    {doc.lawsCited}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 leading-snug">
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {doc.description}
                </p>

                {/* Content Preview Box */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 font-serif text-[11px] text-slate-700 line-clamp-3 leading-relaxed">
                  {doc.contentPreview}
                </div>
              </div>

              {/* Card Bottom Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleCopyText(doc)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Zkopírováno</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Kopírovat text</span>
                    </>
                  )}
                </button>

                {onNavigate && (
                  <button
                    onClick={() => onNavigate('/ai-formulare')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Vygenerovat v AI</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
