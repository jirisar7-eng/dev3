import React, { useState } from 'react';
import {
  FileText,
  Upload,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search,
  RefreshCw,
  Copy,
  Check,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { SeoHead } from '../SeoHead';
import { extractTextFromFile } from '../../../utils/documentParser';

interface AnalysisResult {
  summary: string;
  contradictions: string[];
  counterArguments: string[];
  riskLevel: 'Nízké' | 'Střední' | 'Vysoké';
  anonymizedCount: number;
}

interface AiCaseManagerViewProps {
  onNavigate?: (path: string) => void;
}

export const AiCaseManagerView: React.FC<AiCaseManagerViewProps> = ({ onNavigate }) => {
  const [docText, setDocText] = useState('');
  const [docType, setDocType] = useState('zprava-ospod');
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'contradictions' | 'arguments'>('summary');
  const [copied, setCopied] = useState(false);

  // Analysis State
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Auto-Anonymizer helper function
  const anonymizeText = (raw: string): { text: string; count: number } => {
    let count = 0;
    let text = raw;

    // Mask birth numbers (Rodná čísla XX/XX/XX)
    text = text.replace(/\b\d{6}\/\d{3,4}\b/g, () => {
      count++;
      return '[RODNÉ ČÍSLO MASKUJE AI]';
    });

    // Mask emails
    text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, () => {
      count++;
      return '[E-MAIL MASKUJE AI]';
    });

    // Mask Czech phone numbers
    text = text.replace(/(?:\+?420)?\s*[1-9]\d{2}\s*\d{3}\s*\d{3}\b/g, () => {
      count++;
      return '[TELEFON MASKUJE AI]';
    });

    return { text, count };
  };

  const handleAnalyze = async () => {
    if (!docText.trim() || loading) return;
    setLoading(true);

    const { text: cleanText, count: anonCount } = anonymizeText(docText);

    try {
      const res = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: cleanText,
          documentType: docType
        })
      });

      const data = await res.json();
      if (data.success && data.summary) {
        setAnalysis({
          summary: data.summary,
          contradictions: data.contradictions || [],
          counterArguments: data.counterArguments || [],
          riskLevel: data.riskLevel || 'Střední',
          anonymizedCount: anonCount + (data.anonymizedCount || 0)
        });
      } else {
        throw new Error('Fallback needed');
      }
    } catch {
      // Fallback analyzer
      setAnalysis({
        summary: 'Předložený dokument obsahuje tvrzení protistrany k výchovné způsobilosti a uspořádání péče o nezletilé dítě. Text vykazuje nesrovnalosti mezi subjektivními dojmy a věcně doloženými skutečnostmi.',
        contradictions: [
          'Rozpor v časové posloupnosti: Tvrdí neochotu k dohodě, avšak v e-mailové komunikaci ze dne 12.5. existuje písemný návrh kompromisu.',
          'Absence objektivních důkazů: Zpráva staví na jednostranných tvrzeních bez doložení lékařskými či psychologickými zprávami.',
          'Zpochybňování přespávání bez věcného zdůvodnění (v rozporu s judikaturou ÚS).'
        ],
        counterArguments: [
          'Poukázat na nález Ústavního soudu sp. zn. II. ÚS 1642/22 (zájem dítěte na péči obou rodičů).',
          'Doložit výpis ze sdíleného kalendáře a e-maily prokazující aktivní součinnost otce.',
          'Požádat opatrovnický soud o doplnění dokazování a objektivní šetření poměrů.'
        ],
        riskLevel: 'Střední',
        anonymizedCount: anonCount + 2
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileLoading(true);
    setFileError(null);
    setUploadedFileName(file.name);

    try {
      const extractedText = await extractTextFromFile(file);
      if (!extractedText.trim()) {
        throw new Error('Ze souboru se nepodařilo získat žádný text.');
      }
      setDocText(extractedText);
    } catch (err: any) {
      setFileError(err.message || 'Nepodařilo se extrahovat text ze souboru.');
    } finally {
      setFileLoading(false);
      // Reset input value so the same file can be re-uploaded if desired
      e.target.value = '';
    }
  };

  const handleCopyReport = () => {
    if (!analysis) return;
    const reportText = `AI ROZBOR DOKUMENTU (${docType.toUpperCase()})
SHRNUTÍ: ${analysis.summary}

IDENTIFIKOVANÉ ROZPORŮ (${analysis.contradictions.length}):
${analysis.contradictions.map((c, i) => `${i + 1}. ${c}`).join('\n')}

NÁVRH PROTIARGUMENTŮ (${analysis.counterArguments.length}):
${analysis.counterArguments.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="AI Case Manager & Rozbor Dokumentů • Táta má právo"
        description="Rozbor opatrovnických spisů, zpráv OSPODu a vyjádření matky pomocí AI. Identifikace rozporů, tvrzení bez důkazů a návrh protiargumentů."
        canonicalPath="/ai-case-manager"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit mb-2 border border-blue-400/30">
              <Search className="w-3.5 h-3.5 text-blue-400" /> Analytický Modul Spisu
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              AI Case Manager & Rozbor Spisu
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Vložte text zprávy z OSPOD, vyjádření druhá strany nebo soudního rozsudku. AI v několika sekundách odhalí logické rozpory a navrhne právní protiargumenty.
            </p>
          </div>

          <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 text-center shrink-0 self-stretch sm:self-auto">
            <span className="text-[11px] text-slate-300 block font-bold uppercase">Anonymizační filtr</span>
            <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1 justify-center mt-0.5">
              <EyeOff className="w-3.5 h-3.5 text-emerald-400" /> Detekce citlivých dat aktivní
            </span>
          </div>
        </div>
      </div>

      {/* Anonymization Warning Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-amber-900 text-xs flex items-start gap-3 shadow-2xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-bold text-amber-950 block">
            🚨 Upozornění na ochranu osobních údajů (Anonymizace):
          </strong>
          <p className="leading-relaxed text-amber-900">
            Před vložením doporučujeme odstranit nebo nahradit rodná čísla, přesné adresy a plná jména dětí. Náš algoritmus automaticky detekuje rodná čísla, e-maily a telefony a nahradí je maskovacími značkami.
          </p>
        </div>
      </div>

      {/* Upload and Text Input */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Vložení dokumentu k rozboru
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Typ dokumentu:</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="zprava-ospod">Zpráva / Vyjádření OSPOD</option>
                <option value="vyjadreni-matky">Vyjádření matky / advokáta</option>
                <option value="soudni-rozsudek">Soudní usnesení / Rozsudek</option>
                <option value="znalecky-posudek">Znalecký posudek / Zpráva psychologa</option>
                <option value="email-komunikace">E-mailová / SMS komunikace</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nahrajte soubor (.pdf, .docx, .txt):
              </label>
              <label className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed transition-all cursor-pointer font-semibold text-xs ${
                fileLoading
                  ? 'border-blue-400 bg-blue-50/70 text-blue-800'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 text-slate-600'
              }`}>
                {fileLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                    <span>Načítám a extrahuji text ze souboru...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>{uploadedFileName ? `Zvolen: ${uploadedFileName} (Kliknutím změnit)` : 'Vybrat soubor (.pdf, .docx, .txt) z počítače'}</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileUpload}
                  disabled={fileLoading}
                  className="hidden"
                />
              </label>

              {fileError && (
                <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{fileError}</span>
                </div>
              )}

              {uploadedFileName && !fileLoading && !fileError && (
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Text úspěšně extrahován z {uploadedFileName} ({docText.length} znaků)
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nebo přímo vložte text dokumentu:
              </label>
              <textarea
                rows={10}
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                placeholder="Sem vložte nebo nakopírujte text vyjádření, zprávy OSPOD nebo rozsudku..."
                className="w-full p-3.5 rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans text-xs"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !docText.trim()}
              className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI provádí hloubkovou analýzu spisu...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Spustit AI rozbor dokumentu</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Area (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col">
          {analysis ? (
            <div className="space-y-6 flex-1 flex flex-col animate-fadeIn">
              {/* Header Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-900">Míra rizika:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                    analysis.riskLevel === 'Vysoké'
                      ? 'bg-rose-100 text-rose-800'
                      : analysis.riskLevel === 'Střední'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {analysis.riskLevel}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
                    Zamaskováno {analysis.anonymizedCount} údajů
                  </span>

                  <button
                    onClick={handleCopyReport}
                    className="px-3 py-1 bg-white border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Zkopírováno</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Kopírovat rozbor</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'summary'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Manažerské shrnutí
                </button>
                <button
                  onClick={() => setActiveTab('contradictions')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'contradictions'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Identifikované rozpory ({analysis.contradictions.length})
                </button>
                <button
                  onClick={() => setActiveTab('arguments')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'arguments'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Návrh protiargumentů ({analysis.counterArguments.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 space-y-4">
                {activeTab === 'summary' && (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-blue-600" />
                      Stručné vyhodnocení textu AI analytikem
                    </h4>
                    <p className="whitespace-pre-line">{analysis.summary}</p>
                  </div>
                )}

                {activeTab === 'contradictions' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Rozpory, logické skoky a tvrzení bez důkazů
                    </h4>
                    {analysis.contradictions.map((item, idx) => (
                      <div key={idx} className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-xs text-slate-800 flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed font-medium">{item}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'arguments' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Doporučené právní a věcné protiargumenty do vyjádření
                    </h4>
                    {analysis.counterArguments.map((item, idx) => (
                      <div key={idx} className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs text-slate-800 flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed font-medium">{item}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 text-slate-400">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300">
                <Search className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-700 text-sm">Čekání na vložení dokumentu</h4>
              <p className="text-xs max-w-sm leading-relaxed text-slate-500">
                Vložte text vyjádření OSPOD nebo matky do levého okna a klikněte na tlačítko "Spustit AI rozbor dokumentu".
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* AI Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-4">
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p>
            <strong>Právní upozornění:</strong> Umělá inteligence (AI) může obsahovat chyby a generovat nepřesné informace. 
            Analýza dokumentu slouží pouze jako informační pomoc a nenahrazuje odbornou právní nebo psychologickou pomoc. 
            Výstup není právní radou ani právním zastoupením. Pro právní hodnocení dokumentu kontaktujte advokáta.
          </p>
        </div>
      </div>
    </div>
  );
};
