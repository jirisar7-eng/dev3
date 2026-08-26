import { apiFetch } from '../utils/apiClient';
import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Scale, 
  FileCheck, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  BookOpen, 
  Fingerprint, 
  FileText, 
  AlertTriangle,
  BrainCircuit,
  PenTool,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { legalDocumentsContent } from '../data/legalDocuments';
import { ComplianceDoc } from '../types';
import { SeoHead } from '../components/public/SeoHead';

interface LegalDocsPageProps {
  onNavigate: (path: string) => void;
  initialDocKey?: string;
}

export const LegalDocsPage: React.FC<LegalDocsPageProps> = ({ onNavigate, initialDocKey }) => {
  const { currentUser } = useAuth();
  const [docs, setDocs] = useState<ComplianceDoc[]>([]);
  const [activeKey, setActiveKey] = useState<string>('terms');
  const [consentLoading, setConsentLoading] = useState<boolean>(false);
  const [consentedKeys, setConsentedKeys] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);

  // Fetch registered compliance documents from backend
  useEffect(() => {
    apiFetch('/api/compliance/docs')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Chyba při načítání dokumentů');
      })
      .then((data) => {
        setDocs(data);
      })
      .catch((err) => {
        console.warn('[LegalDocsPage] Nepodařilo se načíst dynamické dokumenty z DB, používám in-memory fallback:', err);
      });
  }, []);

  // Fetch current user consents
  useEffect(() => {
    if (currentUser) {
      apiFetch(`/api/compliance/consent/${currentUser.id}`)
        .then((res) => {
          if (res.ok) return res.json();
          return [];
        })
        .then((consents: any[]) => {
          const map: Record<string, boolean> = {};
          consents.forEach((c) => {
            if (c.status === 'ACCEPTED') {
              map[c.docKey] = true;
            }
          });
          setConsentedKeys(map);
        })
        .catch((err) => {
          console.warn('[LegalDocsPage] Nepodařilo se načíst souhlasy uživatele:', err);
        });
    }
  }, [currentUser]);

  // Handle document selection via props or URL params
  useEffect(() => {
    // Check search params or pathname on mount/change
    const params = new URLSearchParams(window.location.search);
    const docParam = params.get('doc');
    const path = window.location.pathname;

    if (path === '/smlouva-dobrovolnik') {
      setActiveKey('dohoda-o-spolupraci');
    } else if (docParam) {
      setActiveKey(resolveAlias(docParam));
    } else if (initialDocKey) {
      setActiveKey(resolveAlias(initialDocKey));
    }
  }, [initialDocKey]);

  const resolveAlias = (key: string): string => {
    const map: Record<string, string> = {
      'terms': 'terms',
      'podminky-uzivani': 'terms',
      'gdpr': 'gdpr',
      'privacy': 'gdpr',
      'cookies': 'cookies',
      'moje-pravni-dokumenty': 'legal',
      'legal': 'legal',
      'dobrovolnicky-kodex': 'volunteer_code',
      'volunteer_code': 'volunteer_code',
      'dohoda-o-spolupraci': 'dohoda-o-spolupraci',
      'volunteer-agreement': 'dohoda-o-spolupraci',
      'volunteer_agreement': 'dohoda-o-spolupraci',
      'smlouva': 'dohoda-o-spolupraci',
      'dobrovolnik': 'dohoda-o-spolupraci',
      'ai-prohlaseni': 'ai_statement',
      'ai_statement': 'ai_statement',
    };
    return map[key] || key;
  };

  const menuItems = [
    { 
      key: 'terms', 
      title: 'Podmínky užívání portálu', 
      fallbackKey: 'terms',
      icon: Scale,
      colorClass: 'text-blue-600 bg-blue-50' 
    },
    { 
      key: 'gdpr', 
      title: 'Ochrana osobních údajů (GDPR)', 
      fallbackKey: 'gdpr',
      icon: ShieldCheck,
      colorClass: 'text-emerald-600 bg-emerald-50' 
    },
    { 
      key: 'cookies', 
      title: 'Zásady používání souborů cookie', 
      fallbackKey: 'cookies',
      icon: BookOpen, // Represents documentation
      colorClass: 'text-amber-600 bg-amber-50' 
    },
    { 
      key: 'legal', 
      title: 'Moje právní dokumenty & Právní výhrada', 
      fallbackKey: 'legal',
      icon: FileText,
      colorClass: 'text-purple-600 bg-purple-50' 
    },
    { 
      key: 'volunteer_code', 
      title: 'DOBROVOLNICKÝ KODEX • Táta má právo / Synthesis OS', 
      fallbackKey: 'volunteer_code',
      icon: Fingerprint,
      colorClass: 'text-rose-600 bg-rose-50' 
    },
    { 
      key: 'ai_statement', 
      title: 'Prohlášení o využití umělé inteligence (AI)', 
      fallbackKey: 'ai_statement',
      icon: BrainCircuit,
      colorClass: 'text-indigo-600 bg-indigo-50' 
    },
    { 
      key: 'dohoda-o-spolupraci', 
      title: 'Dohoda o dobrovolné spolupráci (e-Smlouva)', 
      fallbackKey: 'volunteer_agreement',
      icon: PenTool,
      colorClass: 'text-sky-600 bg-sky-50' 
    },
  ];

  const activeItem = menuItems.find((item) => item.key === activeKey) || menuItems[0];
  const backendDoc = docs.find((d) => d.key === activeItem.key);

  // Fallback to static legal content
  const staticContent = (legalDocumentsContent as any)[activeItem.fallbackKey] || '';
  const displayContent = backendDoc?.content || staticContent;
  const displayVersion = backendDoc?.version || '1.0.0';
  const displayEffectiveDate = backendDoc?.effectiveDate 
    ? new Date(backendDoc.effectiveDate).toLocaleDateString('cs-CZ') 
    : '14. 8. 2026';

  const handleSelectDoc = (key: string) => {
    setActiveKey(key);
    setMessage(null);
    // Sync state to search parameters for easy bookmarking and refresh persistence
    const formattedPath = `/pravni-dokumenty?doc=${key}`;
    window.history.pushState({}, '', formattedPath);
  };

  const handleRecordConsent = async () => {
    if (!activeItem) return;
    try {
      setConsentLoading(true);
      setMessage(null);
      const res = await apiFetch('/api/compliance/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'guest-user',
          docKey: activeItem.key,
          docVersion: displayVersion,
          status: 'ACCEPTED',
        }),
      });

      if (res.ok) {
        setConsentedKeys((prev) => ({ ...prev, [activeItem.key]: true }));
        setMessage('Váš souhlas s touto verzí dokumentu byl bezpečně zaznamenán.');
      } else {
        throw new Error('Chyba při ukládání souhlasu');
      }
    } catch (err) {
      console.error('Consent error:', err);
      setMessage('Došlo k chybě při zápisu souhlasu do databáze.');
    } finally {
      setConsentLoading(false);
    }
  };

  const isAlreadyConsented = consentedKeys[activeItem.key] || false;

  return (
    <div className="py-12 bg-slate-50 min-h-screen font-sans">
      <SeoHead
        title="Právní dokumenty & Compliance centrum"
        description="Oficiální podmínky užívání, zásady ochrany osobních údajů (GDPR), dobrovolnický kodex a právní výhrady projektu Táta má právo."
        canonicalPath="/pravni-dokumenty"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <button
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-900 mb-2 transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Zpět na portál</span>
            </button>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Právní & Compliance Centrum</h1>
            <p className="text-sm text-slate-600 mt-1">Ucelená správa právních dokumentů, etického kodexu a dohod.</p>
          </div>
          
          <div className="flex items-center gap-2 self-start md:self-center">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold font-mono text-xs">
              v{displayVersion}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              OFICIÁLNÍ ZNĚNÍ
            </span>
          </div>
        </div>

        {/* Two-Column Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: Sidebar Menu (1/4 width) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Dokumentace</h3>
            <div className="space-y-1 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeKey === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleSelectDoc(item.key)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                      isActive
                        ? 'bg-blue-900 text-white font-bold shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-blue-850 text-white' : item.colorClass
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold leading-tight">{item.title}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:translate-x-0.5'
                    }`} />
                  </button>
                );
              })}
            </div>
            
            {/* Context/Disclaimer Box in Sidebar */}
            <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl text-[11px] text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-700 block mb-1">Bezpečnost a audit</span>
              Veškeré udělené souhlasy jsou kryptograficky auditovány. Vaše osobní data podléhají nejpřísnějším standardům ochrany.
            </div>
          </div>

          {/* Right Column: Main Content Area (3/4 width) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Meta Info banner */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 text-xs font-mono text-slate-500">
                <span className="flex items-center gap-1.5 font-bold text-blue-900">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  Verze: v{displayVersion}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Platnost od: {displayEffectiveDate}
                </span>
              </div>

              {/* Document Markdown Content with proper formatting */}
              <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                {displayContent}
              </div>

              {/* Consent Box / Action Panel */}
              <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Vyberte akci pro tento dokument</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {currentUser 
                      ? `Zaznamená se pod e-mailem: ${currentUser.email}`
                      : 'Pro zápis souhlasu do databáze je nutné se přihlásit.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {currentUser ? (
                    isAlreadyConsented ? (
                      <span className="px-4 py-2 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Souhlas udělen
                      </span>
                    ) : (
                      <button
                        onClick={handleRecordConsent}
                        disabled={consentLoading}
                        className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        {consentLoading ? 'Ukládám...' : 'Potvrdit souhlas s touto verzí'}
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => onNavigate('/login')}
                      className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Přihlásit se k odsouhlasení
                    </button>
                  )}
                </div>
              </div>

              {message && (
                <div className={`text-xs font-semibold p-4 rounded-xl border ${
                  message.includes('chybě')
                    ? 'text-rose-800 bg-rose-50 border-rose-200'
                    : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                }`}>
                  {message}
                </div>
              )}
            </div>

          </div>
          
        </div>
        
      </div>
    </div>
  );
};
