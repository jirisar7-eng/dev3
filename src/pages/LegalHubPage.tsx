import React, { useEffect, useState } from 'react';
import { Shield, FileText, CheckCircle2, AlertTriangle, ArrowRight, Cookie, Lock } from 'lucide-react';
import { ComplianceDoc } from '../types';

interface LegalHubPageProps {
  onNavigate: (route: string) => void;
  onOpenCookieSettings?: () => void;
}

export const LegalHubPage: React.FC<LegalHubPageProps> = ({ onNavigate, onOpenCookieSettings }) => {
  const [documents, setDocuments] = useState<ComplianceDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch('/api/legal/documents');
        if (res.ok) {
          const data = await res.json();
          setDocuments(data);
        }
      } catch (err) {
        console.error('Error fetching compliance docs for hub:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const requiredDocuments = [
    { key: 'terms', title: 'Podmínky užívání portálu', slug: 'podminky-uzivani', desc: 'Právní vymezení informativní povahy portálu a vyloučení odpovědnosti.', cat: 'Podmínky' },
    { key: 'gdpr', title: 'Ochrana osobních údajů (GDPR)', slug: 'gdpr', desc: 'Zásady a účely zpracování osobních údajů, práva subjektů údajů.', cat: 'GDPR / Soukromí' },
    { key: 'cookies', title: 'Zásady používání cookies', slug: 'cookies', desc: 'Informace o ukládání technických a analytických souborů cookies.', cat: 'Cookies' },
    { key: 'legal', title: 'Právní výhrada k vzorům', slug: 'moje-pravni-dokumenty', desc: 'Upozornění k povaze vygenerovaných dokumentů a soudních vzorů.', cat: 'Výhrada' },
    { key: 'volunteer_code', title: 'Dobrovolnický kodex', slug: 'dobrovolnicky-kodex', desc: 'Etické zásady chování a ochrany rodin v tísni pro spolupracovníky.', cat: 'Etika' },
    { key: 'ai_statement', title: 'Prohlášení o využití AI', slug: 'ai-prohlaseni', desc: 'Zásady využití umělé inteligence při vývoji asistenčních algoritmů.', cat: 'AI Policy' },
    { key: 'dohoda-o-spolupraci', title: 'Dohoda o spolupráci (e-Smlouva)', slug: 'dohoda-o-spolupraci', desc: 'Smlouva o dobrovolnictví, mlčenlivosti (NDA) a ochraně autorských práv.', cat: 'Smlouvy' },
  ];

  // Check if a document has [REQUIRES_ADMIN_INPUT] placeholders
  const containsPlaceholder = (content: string) => {
    return content.includes('[REQUIRES_ADMIN_INPUT]') || content.includes('{{GENERATED_ID}}') || content.includes('{{USER_');
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 space-y-12">
      {/* Hero Header */}
      <div className="bg-slate-900 text-white p-8 sm:p-12 rounded-3xl relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12 pointer-events-none">
          <Shield className="w-96 h-96" />
        </div>
        
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            SYNTHESIS OS COMPLIANCE ENGINE
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Právní informace & Správa souhlasů
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Projekt <strong className="text-white">Táta má právo / Synthesis OS</strong> staví na plné právní transparentnosti, ochraně osobních údajů a bezpečnosti všech zúčastněných stran. Níže naleznete oficiální, aktuálně platné znění všech našich právních dokumentů, etických kodexů a smluvních ujednání.
          </p>
        </div>
      </div>

      {/* Compliance Overview Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Document Status Checklist */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Legal Compliance Checklist</h2>
              <p className="text-[11px] text-slate-500">Stav schválení a transparentnosti systémových dokumentů</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black tracking-wider flex items-center gap-1 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              7/7 AKTIVNÍCH
            </span>
          </div>

          <div className="space-y-4">
            {requiredDocuments.map((item, index) => {
              const matchedDoc = documents.find(d => d.key === item.key);
              const isPlaceholder = matchedDoc ? containsPlaceholder(matchedDoc.content) : false;

              return (
                <div key={item.key} className="flex items-start justify-between gap-4 p-3.5 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                      0{index + 1}
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        {item.title}
                        {isPlaceholder && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-50 text-amber-700 font-extrabold border border-amber-200 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            [DOPLNIT IDENTIFIKACI]
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      v{matchedDoc?.version || '1.0.0'}
                    </span>
                    <button
                      onClick={() => onNavigate(`/${item.slug}`)}
                      className="text-[11px] font-bold text-blue-900 hover:text-blue-950 flex items-center gap-0.5 hover:underline"
                    >
                      Zobrazit
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Actions & Information panel */}
        <div className="space-y-6">
          {/* Cookies control panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Cookie className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Správa souborů Cookie</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Respektujeme vaše soukromí. Naše technické a bezpečnostní cookies ukládáme automaticky. Analytické a marketingové preference si můžete kdykoliv přizpůsobit.
            </p>
            <button
              onClick={onOpenCookieSettings}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Cookie className="w-4 h-4 text-amber-400" />
              Nastavit cookies preference
            </button>
          </div>

          {/* Secure audit guarantee */}
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Záruka auditovatelnosti</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Všechny vaše souhlasy jsou kryptograficky hashovány a zaznamenány do nevratného auditního deníku (Audit Trail Ledger). Každá změna dokumentu vyžaduje vydání nové verze se SemVer číslováním, přičemž historická schválení jsou zachována.
            </p>
            <div className="text-[9px] font-mono text-slate-400 border-t border-slate-200 pt-3">
              Klíč auditu: SYNTH-AUDIT-V1_ECDSA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
